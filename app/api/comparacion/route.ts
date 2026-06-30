import { NextRequest, NextResponse } from 'next/server';
import { HORARIO_MAESTRO } from '@/lib/schedule';

interface Registro {
  nombre: string;
  motivo: string;
  horaSalida: string;
  horaLlegada: string;
  duracionViaje: string;
}

function parseDate(str: string): Date | null {
  if (!str) return null;
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], +m[6]);
  const d = new Date(str);
  return isNaN(d.getTime()) || d.getFullYear() < 1950 ? null : d;
}

function parseDurMin(str: string): number {
  if (!str) return 0;
  const m1 = str.match(/^(\d+):(\d{2})/);
  if (m1) { const h = +m1[1]; return h > 20 ? 0 : h * 60 + +m1[2]; }
  const m2 = str.match(/\s(\d{1,2}):(\d{2}):\d{2}\s/);
  if (m2) { const h = +m2[1]; return h > 20 ? 0 : h * 60 + +m2[2]; }
  return 0;
}

function norm(s: string): string {
  return s.toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function matchesActivity(motivo: string, keywords: string[]): boolean {
  const n = norm(motivo);
  return keywords.every(kw => n.includes(norm(kw)));
}

function countWeekdays(desde: Date, hasta: Date): number {
  let count = 0;
  const cur = new Date(desde);
  while (cur <= hasta) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export async function POST(req: NextRequest) {
  const { desde, hasta } = await req.json();
  const appsScriptUrl = process.env.APPS_SCRIPT_URL;
  if (!appsScriptUrl) return NextResponse.json({ error: 'APPS_SCRIPT_URL no configurado' }, { status: 500 });

  const sheetRes = await fetch(appsScriptUrl);
  if (!sheetRes.ok) return NextResponse.json({ error: 'No se pudo obtener datos' }, { status: 502 });
  const allRegistros: Registro[] = await sheetRes.json();

  const desdeDate = new Date(desde + 'T00:00:00');
  const hastaDate = new Date(hasta + 'T23:59:59');
  const weekdays = countWeekdays(desdeDate, hastaDate);
  const semanas = weekdays / 5;

  const resultado = HORARIO_MAESTRO.map(vehiculo => {
    const registros = allRegistros.filter(r => {
      if (r.nombre !== vehiculo.registroNombre) return false;
      const d = parseDate(r.horaSalida);
      return d !== null && d >= desdeDate && d <= hastaDate;
    });

    // Assign each registro to the first matching scheduled activity
    const actividadMatch: (number | null)[] = registros.map(r => {
      for (let i = 0; i < vehiculo.actividades.length; i++) {
        if (matchesActivity(r.motivo, vehiculo.actividades[i].keywords)) return i;
      }
      return null;
    });

    const actividades = vehiculo.actividades.map((act, i) => {
      const matching = registros.filter((_, ri) => actividadMatch[ri] === i);
      const horasRealesMin = matching.reduce((s, r) => s + parseDurMin(r.duracionViaje), 0);
      const horasProgramadasMin = act.horasSemana * semanas * 60;
      const cumplimiento = act.horasSemana > 0
        ? Math.round((horasRealesMin / horasProgramadasMin) * 100)
        : null;
      return {
        nombre: act.nombre,
        horasSemana: act.horasSemana,
        horasProgramadasPeriodo: Math.round(act.horasSemana * semanas * 10) / 10,
        horasReales: Math.round(horasRealesMin / 60 * 10) / 10,
        viajes: matching.length,
        cumplimiento,
        motivos: [...new Set(matching.map(r => r.motivo))],
      };
    });

    // Unscheduled entries
    const noProgramadas = registros
      .filter((_, ri) => actividadMatch[ri] === null)
      .reduce<Record<string, { minutos: number; viajes: number }>>((acc, r) => {
        const k = r.motivo || 'SIN MOTIVO';
        if (!acc[k]) acc[k] = { minutos: 0, viajes: 0 };
        acc[k].minutos += parseDurMin(r.duracionViaje);
        acc[k].viajes++;
        return acc;
      }, {});

    const horasRealesTotal = actividades.reduce((s, a) => s + a.horasReales, 0)
      + Object.values(noProgramadas).reduce((s, v) => s + v.minutos / 60, 0);
    const horasProgramadasTotal = actividades.reduce((s, a) => s + a.horasProgramadasPeriodo, 0);
    const cumplimientoGlobal = horasProgramadasTotal > 0
      ? Math.round((actividades.reduce((s, a) => s + a.horasReales, 0) / horasProgramadasTotal) * 100)
      : null;

    return {
      vehiculo: vehiculo.registroNombre,
      horasContratadas: vehiculo.horasContratadas,
      horasProgramadasTotal: Math.round(horasProgramadasTotal * 10) / 10,
      horasRealesTotal: Math.round(horasRealesTotal * 10) / 10,
      cumplimientoGlobal,
      semanas: Math.round(semanas * 10) / 10,
      totalViajes: registros.length,
      actividades,
      noProgramadas: Object.entries(noProgramadas)
        .map(([motivo, v]) => ({ motivo, horasReales: Math.round(v.minutos / 60 * 10) / 10, viajes: v.viajes }))
        .sort((a, b) => b.horasReales - a.horasReales),
    };
  });

  return NextResponse.json({ semanas: Math.round(semanas * 10) / 10, desde, hasta, vehiculos: resultado });
}
