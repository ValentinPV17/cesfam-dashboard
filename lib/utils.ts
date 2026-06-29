import { Registro, RegistroParsed } from '@/types';

// Parses "dd/mm/yyyy H:mm:ss" → Date
export function parseDate(str: string): Date | null {
  if (!str) return null;
  const parts = str.trim().split(' ');
  if (parts.length < 1) return null;
  const [day, month, year] = parts[0].split('/');
  const [hh, mm, ss] = (parts[1] || '0:0:0').split(':');
  if (!day || !month || !year) return null;
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hh || '0'),
    parseInt(mm || '0'),
    parseInt(ss || '0')
  );
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

// Parses "H:mm:ss" duration → minutes, filters out obvious errors (>20h)
export function parseDuracionMinutos(str: string): number {
  if (!str) return 0;
  const [hh, mm] = str.split(':').map(Number);
  if (isNaN(hh) || hh > 20) return 0; // data entry error
  return hh * 60 + (mm || 0);
}

export function formatDuracion(str: string): string {
  if (!str) return '—';
  const [hh, mm] = str.split(':').map(Number);
  if (isNaN(hh) || hh > 20) return 'Error';
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
