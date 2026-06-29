import { Registro, RegistroParsed } from '@/types';

// Parses date strings in multiple formats from Apps Script / Google Sheets
export function parseDate(str: string): Date | null {
  if (!str) return null;
  str = str.trim();

  // Format 1: "dd/mm/yyyy H:mm:ss"
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (m) {
    return new Date(
      parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]),
      parseInt(m[4]), parseInt(m[5]), parseInt(m[6])
    );
  }

  // Format 2: Apps Script full date string "Fri Jan 16 2026 08:45:31 GMT-0300 ..."
  const d = new Date(str);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1900) return d;

  return null;
}

export function isToday(d: Date | null): boolean {
  if (!d) return false;
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export function isSameDay(d: Date | null, ref: Date): boolean {
  if (!d) return false;
  return (
    d.getDate() === ref.getDate() &&
    d.getMonth() === ref.getMonth() &&
    d.getFullYear() === ref.getFullYear()
  );
}

export function formatTime(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Extracts H:mm:ss from either "H:mm:ss" or Apps Script date string
function extractHMS(str: string): [number, number, number] | null {
  if (!str) return null;
  // Format 1: "H:mm:ss"
  const m1 = str.match(/^(\d+):(\d{2}):(\d{2})/);
  if (m1) return [parseInt(m1[1]), parseInt(m1[2]), parseInt(m1[3])];
  // Format 2: Apps Script "... HH:MM:SS GMT..." → extract time from string
  const m2 = str.match(/\s(\d{1,2}):(\d{2}):(\d{2})\s/);
  if (m2) return [parseInt(m2[1]), parseInt(m2[2]), parseInt(m2[3])];
  return null;
}

export function parseDuracionMinutos(str: string): number {
  const hms = extractHMS(str);
  if (!hms) return 0;
  const [hh, mm] = hms;
  if (hh > 20) return 0; // data entry error
  return hh * 60 + mm;
}

export function formatDuracion(str: string): string {
  if (!str) return '—';
  const hms = extractHMS(str);
  if (!hms) return '—';
  const [hh, mm] = hms;
  if (hh > 20) return 'Error';
  if (hh > 0) return `${hh}h ${mm}m`;
  return `${mm}m`;
}

export function getDriverName(email: string): string {
  if (!email) return '—';
  const local = email.split('@')[0];
  return local
    .replace(/[._\-]/g, ' ')
    .replace(/\d+/g, '')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || email;
}

export function parseRegistros(raw: Registro[]): RegistroParsed[] {
  return raw.map(r => {
    const horaSalidaDate = parseDate(r.horaSalida);
    const horaLlegadaDate = parseDate(r.horaLlegada);
    const duracionMinutos = parseDuracionMinutos(r.duracionViaje);
    return {
      ...r,
      horaSalidaDate,
      horaLlegadaDate,
      enRuta: !!horaSalidaDate && !horaLlegadaDate,
      duracionMinutos,
    };
  });
}

export const VEHICLE_COLORS: Record<string, string> = {
  'MINI VAN': 'bg-blue-100 text-blue-800',
  'FURGON INSTITUCIONAL': 'bg-green-100 text-green-800',
  'CAMIONETA': 'bg-orange-100 text-orange-800',
  'AUTO': 'bg-purple-100 text-purple-800',
};

export const VEHICLE_DOT: Record<string, string> = {
  'MINI VAN': 'bg-blue-500',
  'FURGON INSTITUCIONAL': 'bg-green-500',
  'CAMIONETA': 'bg-orange-500',
  'AUTO': 'bg-purple-500',
};
