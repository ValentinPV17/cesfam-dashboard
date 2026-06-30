'use client';

import { useState } from 'react';

interface ActividadResult {
  nombre: string;
  horasSemana: number;
  horasProgramadasPeriodo: number;
  horasReales: number;
  viajes: number;
  cumplimiento: number | null;
  motivos: string[];
}

interface NoProgramada {
  motivo: string;
  horasReales: number;
  viajes: number;
}

interface VehiculoResult {
  vehiculo: string;
  horasContratadas: number;
  horasProgramadasTotal: number;
  horasRealesTotal: number;
  cumplimientoGlobal: number | null;
  semanas: number;
  totalViajes: number;
  actividades: ActividadResult[];
  noProgramadas: NoProgramada[];
}

interface ComparacionResult {
  semanas: number;
  desde: string;
  hasta: string;
  vehiculos: VehiculoResult[];
}

const VEHICLE_COLORS: Record<string, string> = {
  'FURGON INSTITUCIONAL': 'bg-green-100 text-green-800 border-green-200',
  'CAMIONETA': 'bg-orange-100 text-orange-800 border-orange-200',
  'MINI VAN': 'bg-blue-100 text-blue-800 border-blue-200',
  'AUTO': 'bg-purple-100 text-purple-800 border-purple-200',
};

const VEHICLE_DOT: Record<string, string> = {
  'FURGON INSTITUCIONAL': 'bg-green-500',
  'CAMIONETA': 'bg-orange-500',
  'MINI VAN': 'bg-blue-500',
  'AUTO': 'bg-purple-500',
};

function complianceBadge(pct: number | null) {
  if (pct === null) return <span className="text-slate-400 text-xs">—</span>;
  const color = pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{pct}%</span>;
}

function complianceBar(pct: number | null) {
  if (pct === null) return null;
  const clampedPct = Math.min(pct, 100);
  const color = pct >= 80 ? 'bg-green-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="w-16 bg-slate-100 rounded-full h-1.5 inline-block ml-2 align-middle">
      <div className={`${color} h-1.5 rounded-full`} style={{ width: `${clampedPct}%` }} />
    </div>
  );
}

export default function ComparacionPage() {
  const today = new Date().toISOString().split('T')[0];
  const firstOfYear = `${new Date().getFullYear()}-01-01`;

  const [desde, setDesde] = useState(firstOfYear);
  const [hasta, setHasta] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ComparacionResult | null>(null);
  const [activeVehicle, setActiveVehicle] = useState<string | null>(null);

  async function comparar() {
    if (!desde || !hasta) { setError('Selecciona el rango de fechas.'); return; }
    setError('');
    setLoading(true);
    setData(null);
    try {
      const res = await fetch('/api/comparacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ desde, hasta }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Error al comparar'); return; }
      setData(json);
      setActiveVehicle(json.vehiculos[0]?.vehiculo ?? null);
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  const activeData = data?.vehiculos.find(v => v.vehiculo === activeVehicle) ?? null;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Comparación Programado vs Real</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Compara lo que cada vehículo tenía que hacer según el horario maestro con lo que realmente registró.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap gap-4 items-end mb-6">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={comparar} disabled={loading}
          className="bg-[#1e3a5f] hover:bg-blue-800 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Comparando...</>
            : '▶ Comparar'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {data && (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {data.vehiculos.map(v => (
              <button key={v.vehiculo} onClick={() => setActiveVehicle(v.vehiculo)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${activeVehicle === v.vehiculo
                  ? 'border-[#1e3a5f] bg-slate-50'
                  : 'border-transparent bg-white hover:border-slate-300'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${VEHICLE_DOT[v.vehiculo] ?? 'bg-slate-400'}`} />
                  <span className="text-xs font-medium text-slate-700 truncate">{v.vehiculo}</span>
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {v.cumplimientoGlobal !== null ? `${v.cumplimientoGlobal}%` : '—'}
                </div>
                <div className="text-xs text-slate-500">{v.totalViajes} viajes · {v.horasRealesTotal}h reales</div>
              </button>
            ))}
          </div>

          {/* Period info */}
          <p className="text-xs text-slate-500 mb-4">
            Período: {new Date(desde + 'T12:00:00').toLocaleDateString('es-CL')} – {new Date(hasta + 'T12:00:00').toLocaleDateString('es-CL')} · {data.semanas} semanas hábiles
          </p>

          {activeData && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {/* Vehicle header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${VEHICLE_COLORS[activeData.vehiculo] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {activeData.vehiculo}
                  </span>
                  <span className="text-sm text-slate-600">
                    {activeData.totalViajes} viajes · {activeData.horasRealesTotal}h reales / {activeData.horasProgramadasTotal}h programadas
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  Cumplimiento global: {complianceBadge(activeData.cumplimientoGlobal)}
                </div>
              </div>

              {/* Scheduled activities table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                      <th className="text-left px-5 py-3 font-medium">Actividad programada</th>
                      <th className="text-center px-3 py-3 font-medium">H/semana</th>
                      <th className="text-center px-3 py-3 font-medium">H esperadas</th>
                      <th className="text-center px-3 py-3 font-medium">H reales</th>
                      <th className="text-center px-3 py-3 font-medium">Viajes</th>
                      <th className="text-center px-4 py-3 font-medium">Cumplimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeData.actividades.map(act => (
                      <tr key={act.nombre}
                        className={act.cumplimiento !== null && act.cumplimiento < 50 && act.horasSemana > 0
                          ? 'bg-red-50/40' : act.cumplimiento !== null && act.cumplimiento >= 80
                          ? 'bg-green-50/30' : ''}>
                        <td className="px-5 py-3 text-slate-800">
                          <div>{act.nombre}</div>
                          {act.motivos.length > 0 && (
                            <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{act.motivos.join(', ')}</div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600">{act.horasSemana}h</td>
                        <td className="px-3 py-3 text-center text-slate-600">{act.horasProgramadasPeriodo}h</td>
                        <td className="px-3 py-3 text-center font-medium text-slate-800">{act.horasReales}h</td>
                        <td className="px-3 py-3 text-center text-slate-600">{act.viajes}</td>
                        <td className="px-4 py-3 text-center">
                          {complianceBadge(act.cumplimiento)}
                          {complianceBar(act.cumplimiento)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Unscheduled activities */}
              {activeData.noProgramadas.length > 0 && (
                <div className="border-t border-slate-200 px-5 py-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Actividades no programadas ({activeData.noProgramadas.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeData.noProgramadas.map(np => (
                      <span key={np.motivo}
                        className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full">
                        <span className="font-medium">{np.motivo}</span>
                        <span className="text-slate-400">·</span>
                        <span>{np.horasReales}h</span>
                        <span className="text-slate-400">·</span>
                        <span>{np.viajes} viajes</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> ≥ 80% cumplido</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> 50–79% moderado</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> &lt; 50% bajo</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
