import { 
  SlotAsignacion, 
  CursoProgramado, 
  ProgramacionResultado, 
  ManualCourseInput 
} from '../types';
import { isWorkDay } from '../data/feriadosBolivia';
import { formatDateISO } from './textUtils';

export function addDays(date: Date, days: number): Date {
  const res = new Date(date);
  res.setDate(res.getDate() + days);
  return res;
}

export function generateSecurityHash(data: {
  facilitador: string;
  asignaciones: CursoProgramado[];
  fechaInicioContrato: Date;
}): string {
  let rawStr = `UNEFCO-2026|VER-1.0|${data.facilitador}|${formatDateISO(data.fechaInicioContrato)}|`;
  data.asignaciones.forEach(a => {
    rawStr += `${a.slotId}-${a.cursoIndex}:${formatDateISO(a.inicio)}_${formatDateISO(a.fin)}|`;
  });
  
  let hash = 0;
  for (let i = 0; i < rawStr.length; i++) {
    const char = rawStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

export function calculateSchedulerAuto(
  slots: SlotAsignacion[],
  facilitador: string,
  tecnico: string,
  fechaInicioContrato: Date,
  feriadosCustom: string[] = [],
  ci?: string,
  ciComplemento?: string
): { resultado: ProgramacionResultado | null; errorMsg: string | null } {
  const inicioContrato = new Date(fechaInicioContrato);
  inicioContrato.setHours(0, 0, 0, 0);
  const limiteContrato = addDays(inicioContrato, 99); // 100 days inclusive

  const asignaciones: CursoProgramado[] = [];
  const iniciosUsados = new Set<string>();
  const iniciosPorMes: Record<string, number> = {};

  // Initialize month counter map
  let cursorMonth = new Date(inicioContrato);
  while (cursorMonth <= addDays(limiteContrato, 30)) {
    const key = `${cursorMonth.getFullYear()}-${String(cursorMonth.getMonth() + 1).padStart(2, '0')}`;
    if (!iniciosPorMes[key]) iniciosPorMes[key] = 0;
    cursorMonth.setMonth(cursorMonth.getMonth() + 1);
  }

  const maxWaves = Math.max(...slots.map(s => s.cursos.length), 0);

  for (let wave = 0; wave < maxWaves; wave++) {
    for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
      const slot = slots[slotIdx];
      if (wave >= slot.cursos.length) continue;

      let fechaMinima: Date;
      if (wave === 0) {
        // Objective start date logic: stagger by adding slotIdx days
        fechaMinima = addDays(inicioContrato, slotIdx);
      } else {
        const prevCourse = asignaciones.find(
          a => a.slotId === slot.id && a.cursoIndex === wave - 1
        );
        if (!prevCourse) continue;
        fechaMinima = addDays(prevCourse.fin, 1);
      }

      let inicioValido: Date | null = null;
      let fechaBusqueda = new Date(fechaMinima);

      while (!inicioValido && fechaBusqueda <= limiteContrato) {
        // duration in days inclusive -> fin = inicio + duration - 1
        const finPotencial = addDays(fechaBusqueda, slot.duracionCurso - 1);
        const mesKey = `${fechaBusqueda.getFullYear()}-${String(fechaBusqueda.getMonth() + 1).padStart(2, '0')}`;
        const isoInicio = formatDateISO(fechaBusqueda);

        const okInicio = isWorkDay(fechaBusqueda, feriadosCustom);
        const okFin = isWorkDay(finPotencial, feriadosCustom);
        const okUnicidad = !iniciosUsados.has(isoInicio);
        const okTopeMes = (iniciosPorMes[mesKey] || 0) < 5;
        const okVentana = fechaBusqueda <= limiteContrato && finPotencial <= limiteContrato;

        if (okInicio && okFin && okUnicidad && okTopeMes && okVentana) {
          inicioValido = new Date(fechaBusqueda);
          iniciosUsados.add(isoInicio);
          iniciosPorMes[mesKey] = (iniciosPorMes[mesKey] || 0) + 1;

          // Sesión 2: inicio + 5d, adjusted to next valid work day
          let sesion2 = addDays(inicioValido, 5);
          while (!isWorkDay(sesion2, feriadosCustom)) {
            sesion2 = addDays(sesion2, 1);
          }

          // Sesión 3: inicio + 10d, adjusted to next valid work day
          let sesion3 = addDays(inicioValido, 10);
          while (!isWorkDay(sesion3, feriadosCustom)) {
            sesion3 = addDays(sesion3, 1);
          }

          asignaciones.push({
            slotId: slot.id,
            cat: slot.cat,
            cicloId: slot.cicloId,
            cicloNombre: slot.cicloNombre,
            lugar: slot.lugar,
            modalidad: slot.modalidad,
            cicloNumero: slotIdx + 1,
            cursoIndex: wave,
            cursoNombre: slot.cursos[wave],
            inicio: inicioValido,
            fin: finPotencial,
            planificacion: inicioValido,
            informeFinal: addDays(finPotencial, 3),
            sesion2,
            sesion3,
            esManual: false
          });
        } else {
          fechaBusqueda = addDays(fechaBusqueda, 1);
        }
      }

      if (!inicioValido) {
        return {
          resultado: null,
          errorMsg: `No fue posible asignar el Curso ${wave + 1} del ciclo "${slot.cicloId}" dentro del margen de 100 días de contrato sin violar reglas. Intente ajustar el número de asignaciones o modificar las fechas.`
        };
      }
    }
  }

  // Calculate maximum end date to determine total contract days used
  let maxFinDate = inicioContrato;
  asignaciones.forEach(a => {
    if (a.fin > maxFinDate) maxFinDate = a.fin;
  });

  const daysUsed = Math.floor((maxFinDate.getTime() - inicioContrato.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const res: ProgramacionResultado = {
    asignaciones,
    slots,
    facilitador,
    ci,
    ciComplemento,
    tecnico,
    fechaInicioContrato: inicioContrato,
    limiteContrato,
    daysUsed,
    modo: 'automatico',
    idTransaccion: `CRG-${Date.now().toString(36).toUpperCase()}`
  };

  res.hashSeguridad = generateSecurityHash({
    facilitador,
    asignaciones,
    fechaInicioContrato: inicioContrato
  });

  return { resultado: res, errorMsg: null };
}

export function calculateSchedulerManual(
  slots: SlotAsignacion[],
  manualInputs: ManualCourseInput[],
  facilitador: string,
  tecnico: string,
  fechaInicioContrato: Date,
  feriadosCustom: string[] = [],
  ci?: string,
  ciComplemento?: string
): { resultado: ProgramacionResultado | null; warnings: string[] } {
  const inicioContrato = new Date(fechaInicioContrato);
  inicioContrato.setHours(0, 0, 0, 0);
  const limiteContrato = addDays(inicioContrato, 99);

  const asignaciones: CursoProgramado[] = [];
  const warnings: string[] = [];

  slots.forEach((slot, slotIdx) => {
    slot.cursos.forEach((cursoNombre, cIdx) => {
      const inp = manualInputs.find(
        m => m.slotId === slot.id && m.cursoIndex === cIdx
      );
      if (!inp || !inp.inicioStr) return;

      const [y, m, d] = inp.inicioStr.split('-').map(Number);
      const inicio = new Date(y, m - 1, d, 0, 0, 0, 0);
      const fin = addDays(inicio, slot.duracionCurso - 1);

      // Warning checks
      if (!isWorkDay(inicio, feriadosCustom)) {
        warnings.push(`[${slot.cicloId} C${cIdx + 1}] La fecha de inicio (${formatDateISO(inicio)}) cae en Domingo o Feriado.`);
      }
      if (!isWorkDay(fin, feriadosCustom)) {
        warnings.push(`[${slot.cicloId} C${cIdx + 1}] La fecha de fin (${formatDateISO(fin)}) cae en Domingo o Feriado.`);
      }
      if (inicio > limiteContrato || fin > limiteContrato) {
        warnings.push(`[${slot.cicloId} C${cIdx + 1}] Sobrepasa el límite de 100 días de contrato (${formatDateISO(limiteContrato)}).`);
      }

      let sesion2 = addDays(inicio, 5);
      while (!isWorkDay(sesion2, feriadosCustom)) {
        sesion2 = addDays(sesion2, 1);
      }

      let sesion3 = addDays(inicio, 10);
      while (!isWorkDay(sesion3, feriadosCustom)) {
        sesion3 = addDays(sesion3, 1);
      }

      asignaciones.push({
        slotId: slot.id,
        cat: slot.cat,
        cicloId: slot.cicloId,
        cicloNombre: slot.cicloNombre,
        lugar: slot.lugar,
        modalidad: slot.modalidad,
        cicloNumero: slotIdx + 1,
        cursoIndex: cIdx,
        cursoNombre,
        inicio,
        fin,
        planificacion: inicio,
        informeFinal: addDays(fin, 3),
        sesion2,
        sesion3,
        esManual: true
      });
    });
  });

  let maxFinDate = inicioContrato;
  asignaciones.forEach(a => {
    if (a.fin > maxFinDate) maxFinDate = a.fin;
  });

  const daysUsed = Math.floor((maxFinDate.getTime() - inicioContrato.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const res: ProgramacionResultado = {
    asignaciones,
    slots,
    facilitador,
    ci,
    ciComplemento,
    tecnico,
    fechaInicioContrato: inicioContrato,
    limiteContrato,
    daysUsed,
    modo: 'manual',
    idTransaccion: `CRG-${Date.now().toString(36).toUpperCase()}`
  };

  res.hashSeguridad = generateSecurityHash({
    facilitador,
    asignaciones,
    fechaInicioContrato: inicioContrato
  });

  return { resultado: res, warnings };
}
