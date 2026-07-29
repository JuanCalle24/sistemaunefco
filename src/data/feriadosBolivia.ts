import { FeriadoInfo } from '../types';

export const FERIADOS_BOLIVIA_2026: FeriadoInfo[] = [
  { fecha: '2026-01-01', descripcion: 'Año Nuevo', esFijo: true },
  { fecha: '2026-01-22', descripcion: 'Día del Estado Plurinacional de Bolivia', esFijo: true },
  { fecha: '2026-02-16', descripcion: 'Lunes de Carnaval', esFijo: false },
  { fecha: '2026-02-17', descripcion: 'Martes de Carnaval', esFijo: false },
  { fecha: '2026-04-03', descripcion: 'Viernes Santo', esFijo: false },
  { fecha: '2026-05-01', descripcion: 'Día del Trabajo', esFijo: true },
  { fecha: '2026-06-04', descripcion: 'Corpus Christi', esFijo: false },
  { fecha: '2026-06-21', descripcion: 'Año Nuevo Andino Amazónico y del Chaco', esFijo: true },
  { fecha: '2026-07-16', descripcion: 'Aniversario Departamental de La Paz', esFijo: true },
  { fecha: '2026-08-06', descripcion: 'Día de la Independencia de Bolivia', esFijo: true },
  { fecha: '2026-11-02', descripcion: 'Día de Todos los Santos', esFijo: true },
  { fecha: '2026-12-25', descripcion: 'Navidad', esFijo: true }
];

export function isHoliday(dateISO: string, feriadosCustom: string[]): boolean {
  const baseHolidayList = FERIADOS_BOLIVIA_2026.map(f => f.fecha);
  return baseHolidayList.includes(dateISO) || feriadosCustom.includes(dateISO);
}

export function isWorkDay(date: Date, feriadosCustom: string[]): boolean {
  const day = date.getDay(); // 0 = Sunday
  if (day === 0) return false; // Sundays excluded
  const iso = date.toISOString().split('T')[0];
  return !isHoliday(iso, feriadosCustom);
}
