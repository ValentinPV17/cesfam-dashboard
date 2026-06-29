'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { Registro, RegistroParsed } from '@/types';
import {
  parseRegistros,
  formatTime,
  formatDate,
  formatDuracion,
  getDriverName,
  VEHICLE_COLORS,
} from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const VEHICULOS = ['Todos', 'MINI VAN', 'FURGON INSTITUCIONAL', 'CAMIONETA', 'AUTO'];
const PAGE_SIZE = 50;

export default function MovimientosPage() {
  const { data: raw, error, isLoading } = useSWR<Registro[]>('/api/registros', fetcher, {
    refreshInterval: 30000,
  });

  const [vehiculoFiltro, setVehiculoFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [pagina, setPagina] = useState(1);

  const registros: RegistroParsed[] = useMemo(
    () => (Array.isArray(raw) ? parseRegistros(raw) : []).reverse(),
    [raw]
  );

  const filtrados = useMemo(() => {
    return registros.filter(r => {
      if (vehiculoFiltro !== 'Todos' && r.nombre !== vehiculoFiltro) return false;
      if (busqueda) {
        const q = busqueda.toLowerCase();
        if (
          !r.motivo.toLowerCase().includes(q) &&
          !r.especificarMotivo.toLowerCase().includes(q) &&
          !getDriverName(r.emailUsuario).toLowerCase().includes(q)
        )
          return false;
      }
      if (fechaDesde && r.horaSalidaDate) {
        const desde = new Date(fechaDesde + 'T00:00:00');
        if (r.horaSalidaDate < desde) return false;
      }
      if (fechaHasta && r.horaSalidaDate) {
        const hasta = new Date(fechaHasta + 'T23:59:59');
        if (r.horaSalidaDate > hasta) return false;
      }
      return true;
    });
  }, [registros, vehiculoFiltro, busqueda, fechaDesde, fechaHasta]);

  const totalPaginas = Math.ceil(filtrados.length / PAGE_SIZE);
  const pagFiltrados = filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  function resetFiltros() {
    setVehiculoFiltro('Todos');
    setBusqueda('');
    setFechaDesde('');
    setFechaHasta('');
    setPagina(1);
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Historial de movimientos</h1>
        <p className="text-sm text-slate-500 mt-0.5">{filtrados.length} registros encontrados</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Vehículo</label>
          <select
            value={vehiculoFiltro}
            onChange={e => { setVehiculoFiltro(e.target.value); setPagina(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {VEHICULOS.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Desde</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={e => { setFechaDesde(e.target.value); setPagina(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Hasta</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={e => { setFechaHasta(e.target.value); setPagina(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-slate-500">Buscar</label>
          <input
            type="text"
            placeholder="Motivo, conductor..."
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={resetFiltros}
          className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-400">Cargando datos...</div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-red-500">Error al cargar los datos</div>
        ) : pagFiltrados.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No hay registros con los filtros aplicados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide border-b border-slate-200">
                  <th className="text-left px-4 py-3">Fecha</th>
                  <th className="text-left px-4 py-3">Vehículo</th>
                  <th className="text-left px-4 py-3">Conductor</th>
                  <th className="text-left px-4 py-3">Motivo</th>
                  <th className="text-left px-4 py-3">Detalle</th>
                  <th className="text-left px-4 py-3">Salida</th>
                  <th className="text-left px-4 py-3">Regreso</th>
                  <th className="text-left px-4 py-3">Duración</th>
                  <th className="text-left px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagFiltrados.map(r => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-slate-600 tabular-nums whitespace-nowrap">
                      {formatDate(r.horaSalidaDate)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${VEHICLE_COLORS[r.nombre] ?? 'bg-slate-100 text-slate-700'}`}>
                        {r.nombre}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{getDriverName(r.emailUsuario)}</td>
                    <td className="px-4 py-2.5 text-slate-700">{r.motivo}</td>
                    <td className="px-4 py-2.5 text-slate-400 max-w-[160px] truncate" title={r.especificarMotivo}>
                      {r.especificarMotivo || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 tabular-nums whitespace-nowrap">{formatTime(r.horaSalidaDate)}</td>
                    <td className="px-4 py-2.5 text-slate-700 tabular-nums whitespace-nowrap">{formatTime(r.horaLlegadaDate)}</td>
                    <td className="px-4 py-2.5 text-slate-700 tabular-nums whitespace-nowrap">{formatDuracion(r.duracionViaje)}</td>
                    <td className="px-4 py-2.5">
                      {r.enRuta ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                          En ruta
                        </span>
                      ) : (
                        <span className="bg-green-50 text-green-700 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                          Completado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Página {pagina} de {totalPaginas} · {filtrados.length} registros
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
