'use client';

import { useState } from 'react';

const VEHICULOS = ['MINI VAN', 'FURGON INSTITUCIONAL', 'CAMIONETA', 'AUTO'];

export default function InformePage() {
  const [form, setForm] = useState({
    vehiculo: 'MINI VAN',
    desde: '',
    hasta: '',
    periodoNombre: '',
    horarioAM: 'lunes a jueves de 09:00 a 13:00',
    horarioPM: 'lunes a jueves de 14:00 a 17:00',
    horasSemanalesAM: '16',
    horasSemanalesPM: '12',
    incluirAM: true,
    incluirPM: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(key: string, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function generar() {
    if (!form.desde || !form.hasta || !form.periodoNombre) {
      setError('Completa el período evaluado, las fechas y el nombre del período.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/informe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al generar el informe');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe_${form.vehiculo.replace(/ /g, '_')}_${form.periodoNombre.replace(/ /g, '_')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Error de conexión al generar el informe.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Generar Informe Técnico</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Genera un informe DOCX de utilización de horas programadas, idéntico al formato oficial.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">

        {/* Vehículo */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Vehículo</label>
          <select
            value={form.vehiculo}
            onChange={e => set('vehiculo', e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {VEHICULOS.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        {/* Período */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Nombre del período evaluado</label>
          <input
            type="text"
            placeholder="ej: junio a octubre 2025"
            value={form.periodoNombre}
            onChange={e => set('periodoNombre', e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Fecha desde</label>
            <input
              type="date"
              value={form.desde}
              onChange={e => set('desde', e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Fecha hasta</label>
            <input
              type="date"
              value={form.hasta}
              onChange={e => set('hasta', e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Horarios programados */}
        <div className="border-t border-slate-100 pt-5">
          <p className="text-xs font-medium text-slate-600 mb-3">Horarios programados</p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.incluirAM}
                onChange={e => set('incluirAM', e.target.checked)}
                className="mt-2 accent-blue-600"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={form.horarioAM}
                  onChange={e => set('horarioAM', e.target.value)}
                  disabled={!form.incluirAM}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:bg-slate-50"
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Horas semanales AM:</label>
                  <input
                    type="number"
                    value={form.horasSemanalesAM}
                    onChange={e => set('horasSemanalesAM', e.target.value)}
                    disabled={!form.incluirAM}
                    className="w-20 text-sm border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.incluirPM}
                onChange={e => set('incluirPM', e.target.checked)}
                className="mt-2 accent-blue-600"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={form.horarioPM}
                  onChange={e => set('horarioPM', e.target.value)}
                  disabled={!form.incluirPM}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:bg-slate-50"
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Horas semanales PM:</label>
                  <input
                    type="number"
                    value={form.horasSemanalesPM}
                    onChange={e => set('horasSemanalesPM', e.target.value)}
                    disabled={!form.incluirPM}
                    className="w-20 text-sm border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={generar}
          disabled={loading}
          className="w-full bg-[#1e3a5f] hover:bg-blue-800 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generando informe...
            </>
          ) : (
            '⎙ Descargar Informe DOCX'
          )}
        </button>
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs font-medium text-blue-800 mb-1">¿Qué incluye el informe?</p>
        <ul className="text-xs text-blue-700 space-y-0.5">
          <li>• Encabezado oficial con período y fuente de datos</li>
          <li>• Resumen de uso AM/PM con porcentajes</li>
          <li>• Tabla de uso por actividad con horas y porcentaje</li>
          <li>• Análisis técnico automático por actividad</li>
          <li>• Conclusiones y recomendaciones</li>
        </ul>
      </div>
    </div>
  );
}
