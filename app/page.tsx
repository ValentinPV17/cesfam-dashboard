'use client';

import useSWR from 'swr';
import { Registro, RegistroParsed } from '@/types';
import {
  parseRegistros,
  isToday,
  formatTime,
  formatDate,
  formatDuracion,
  getDriverName,
  VEHICLE_COLORS,
  VEHICLE_DOT,
} from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

export default function Dashboard() {
  const { data: raw, error, isLoading } = useSWR<Registro[]>('/api/registros', fetcher, {
    refreshInterval: 30000,
  });

  if (isLoading) return <LoadingState />;
  if (error || !Array.isArray(raw)) return <ErrorState error={error} />;

  const registros: RegistroParsed[] = parseRegistros(raw);
  const hoy = registros.filter(r => isToday(r.horaSalidaDate));
  const enRuta = registros.filter(r => r.enRuta);
  const horasHoy = hoy.reduce((acc, r) => acc + r.duracionMinutos, 0);
  const motivosHoy = Array.from(new Set(hoy.map(r => r.motivo).filter(Boolean))).length;

  const motivoCounts: Record<string, number> = {};
  registros.forEach(r => {
    if (r.motivo) motivoCounts[r.motivo] = (motivoCounts[r.motivo] ?? 0) + 1;
  });
  const chartData = Object.entries(motivoCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const flotaVehiculos = ['MINI VAN', 'FURGON INSTITUCIONAL', 'CAMIONETA', 'AUTO'].map(v => ({
    nombre: v,
    enRuta: enRuta.some(r => r.nombre === v),
    ultimo: registros.filter(r => r.nombre === v).at(-1),
  }));

  const now = new Date();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full border border-green-200">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          En vivo · actualiza cada 30s
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="En ruta ahora"
          value={enRuta.length}
          sub={enRuta.map(r => r.nombre).join(', ') || 'Ninguno'}
          accent="blue"
        />
        <StatCard
          label="Movimientos hoy"
          value={hoy.length}
          sub={`${hoy.filter(r => !r.enRuta).length} completados`}
          accent="green"
        />
        <StatCard
          label="Horas de uso hoy"
          value={`${Math.floor(horasHoy / 60)}h ${horasHoy % 60}m`}
          sub="en movimientos del día"
          accent="amber"
        />
        <StatCard
          label="Actividades hoy"
          value={motivosHoy}
          sub="tipos de motivo distintos"
          accent="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Today's movements */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-medium text-slate-900">Movimientos de hoy</h2>
          </div>
          {hoy.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">Sin movimientos registrados hoy</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide">
                    <th className="text-left px-4 py-2.5">Vehículo</th>
                    <th className="text-left px-4 py-2.5">Conductor</th>
                    <th className="text-left px-4 py-2.5">Motivo</th>
                    <th className="text-left px-4 py-2.5">Salida</th>
                    <th className="text-left px-4 py-2.5">Regreso</th>
                    <th className="text-left px-4 py-2.5">Duración</th>
                    <th className="text-left px-4 py-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {hoy.map(r => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${VEHICLE_COLORS[r.nombre] ?? 'bg-slate-100 text-slate-700'}`}>
                          {r.nombre}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{getDriverName(r.emailUsuario)}</td>
                      <td className="px-4 py-2.5 text-slate-700 max-w-[160px]">
                        <span title={r.especificarMotivo || r.motivo}>{r.motivo}</span>
                        {r.especificarMotivo && (
                          <span className="block text-slate-400 text-[10px] truncate">{r.especificarMotivo}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700 tabular-nums">{formatTime(r.horaSalidaDate)}</td>
                      <td className="px-4 py-2.5 text-slate-700 tabular-nums">{formatTime(r.horaLlegadaDate)}</td>
                      <td className="px-4 py-2.5 text-slate-700 tabular-nums">{formatDuracion(r.duracionViaje)}</td>
                      <td className="px-4 py-2.5">
                        {r.enRuta ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                            En ruta
                          </span>
                        ) : (
                          <span className="bg-green-50 text-green-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                            Regresó
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: flota + chart */}
        <div className="flex flex-col gap-6">
          {/* Flota status */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-medium text-slate-900 mb-4">Estado de la flota</h2>
            <div className="space-y-3">
              {flotaVehiculos.map(v => (
                <div key={v.nombre} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${v.enRuta ? VEHICLE_DOT[v.nombre] ?? 'bg-slate-400' : 'bg-slate-300'}`} />
                    <span className="text-xs font-medium text-slate-700">{v.nombre}</span>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${v.enRuta ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {v.enRuta ? 'En ruta' : 'Disponible'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex-1">
            <h2 className="text-sm font-medium text-slate-900 mb-4">Actividades más frecuentes</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 8 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip
                  formatter={(value) => [`${value} viajes`, 'Total']}
                  contentStyle={{ fontSize: 11, borderRadius: 6 }}
                />
                <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: {
  label: string;
  value: string | number;
  sub: string;
  accent: 'blue' | 'green' | 'amber' | 'purple';
}) {
  const border = { blue: 'border-l-blue-500', green: 'border-l-green-500', amber: 'border-l-amber-500', purple: 'border-l-purple-500' }[accent];
  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${border} p-4`}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
      <p className="text-xs text-slate-400 mt-1 truncate">{sub}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />)}
      </div>
      <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-medium">Error al cargar datos</p>
        <p className="text-red-500 text-sm mt-1">{error?.message ?? 'Verifica que APPS_SCRIPT_URL esté configurado en .env.local (o en Vercel → Environment Variables)'}</p>
      </div>
    </div>
  );
}
