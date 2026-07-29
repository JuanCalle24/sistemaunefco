/**
 * Formats name strings so that the first letter of each word is capitalized.
 * Example: "juan carlos calle" -> "Juan Carlos Calle"
 */
export function capitalizeName(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export const DIAS_SEMANA_COMPLETOS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

export const DIAS_SEMANA_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Formats a Date object into a detailed string:
 * Example: "20/08/2026 (Jueves)" or "20/08/2026 (Jue)"
 */
export function formatDateVisual(d: Date | null, showFullDay: boolean = true): string {
  if (!d || isNaN(d.getTime())) return '';
  const dayNum = String(d.getDate()).padStart(2, '0');
  const monthNum = String(d.getMonth() + 1).padStart(2, '0');
  const yearNum = d.getFullYear();
  const dayName = showFullDay
    ? DIAS_SEMANA_COMPLETOS[d.getDay()]
    : DIAS_SEMANA_CORTOS[d.getDay()];
  return `${dayNum}/${monthNum}/${yearNum} (${dayName})`;
}

export function formatDateISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function parseISODate(isoStr: string): Date {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}
