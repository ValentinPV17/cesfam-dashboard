'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import { Registro, RegistroParsed } from '@/types';
import { parseRegistros } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

export default function EstadisticasPage() {
  const { data: raw, isLoading } = useSWR<Registro[]>('/api/registros', fetcher, {
    refreshInterval: 60000,
  });

  const registros: RegistroParsed[] = useMemo(
    () => (Array.isArray(raw) ? parseRegistros(raw) : []),
    [raw]
  );

  const byVehiculo = useMemo(() => {
    const counts: Record<string, number> = {};
    registros.forEach(r => { counts[r.nombre] = (counts[r.nombre] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [registros]);

  const byMotivo = useMemo(() => {
    const counts: Record<string, number> = {};
    registros.forEach(r => { if (r.motivo) counts[r.motivo] = (counts[r.motivo] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
  }, [registros]);

  const byDia = useMemo(() => {
    const counts: Record<string, number> = {};
    registros.forEach(r => {
      if (!r.horaSalidaDate) return;
      const key = r.horaSalidaDate.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts).slice(-30).map(([name, value]) => ({ name, value }));
  }, [registros]);

  const totalHoras = useMemo(
    () => registros.reduce((acc, r) => acc + r.duracionMinutos, 0),
    [registros]
  );

  if (isLoading) {
    return <div className="p-6 text-sm text-slate-400">Cargando estadísticas...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Estadísticas</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {registros.length} registros totales · {Math.floor(totalHoras / 60)}h {totalHoras % 60}m de uso acumulado
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Viajes por vehículo */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-medium text-slate-900 mb-4">Viajes por vehículo</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byVehiculo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {byVehiculo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} viajes`]} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Actividades más frecuentes */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-medium text-slate-900 mb-4">Top 10 actividades</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byMotivo} layout="vertical" margin={{ left: 0, right: 8 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={120} />
              <Tooltip formatter={(v) => [`${v} viajes`, 'Total']} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {byMotivo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Actividad diaria últimos 30 días */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
          <h2 className="text-sm font-medium text-slate-900 mb-4">Movimientos diarios (últimos 30 días)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={byDia} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} name="Viajes" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
