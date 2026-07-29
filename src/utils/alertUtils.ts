import { CursoProgramado } from '../types';
import { formatDateVisual } from './textUtils';

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'completed';

export interface CourseAlert {
  id: string;
  severity: AlertSeverity;
  type: 'informe_urgente' | 'informe_advertencia' | 'inicio_inminente' | 'en_curso' | 'proximo' | 'completado';
  title: string;
  message: string;
  badgeLabel: string;
  curso: CursoProgramado;
  diasRestantes?: number;
}

export function getAlertSeverity(curso: CursoProgramado, refDate: Date = new Date()): {
  severity: AlertSeverity;
  badgeText: string;
  badgeClass: string;
  countdownText: string;
  diasParaInicio: number;
  diasParaFin: number;
  diasParaInforme: number;
} {
  const hoy = new Date(refDate);
  hoy.setHours(0, 0, 0, 0);

  const inicio = new Date(curso.inicio);
  inicio.setHours(0, 0, 0, 0);

  const fin = new Date(curso.fin);
  fin.setHours(0, 0, 0, 0);

  const informe = new Date(curso.informeFinal);
  informe.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const diasParaInicio = Math.round((inicio.getTime() - hoy.getTime()) / msPerDay);
  const diasParaFin = Math.round((fin.getTime() - hoy.getTime()) / msPerDay);
  const diasParaInforme = Math.round((informe.getTime() - hoy.getTime()) / msPerDay);

  // Completed
  if (hoy > informe) {
    return {
      severity: 'completed',
      badgeText: 'Finalizado',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      countdownText: 'Completado',
      diasParaInicio,
      diasParaFin,
      diasParaInforme
    };
  }

  // Informe vencimiento crítico (0 a 3 días o ya en fecha de informe)
  if (hoy >= fin && diasParaInforme >= 0 && diasParaInforme <= 3) {
    const txt = diasParaInforme === 0 ? '¡Informe vence HOY!' : `Informe vence en ${diasParaInforme}d`;
    return {
      severity: 'critical',
      badgeText: 'Informe Urgencia',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse',
      countdownText: txt,
      diasParaInicio,
      diasParaFin,
      diasParaInforme
    };
  }

  // Inicio inminente (inicia hoy o mañana)
  if (diasParaInicio >= 0 && diasParaInicio <= 1) {
    const txt = diasParaInicio === 0 ? '¡Inicia HOY!' : 'Inicia Mañana';
    return {
      severity: 'critical',
      badgeText: 'Inicio Inminente',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      countdownText: txt,
      diasParaInicio,
      diasParaFin,
      diasParaInforme
    };
  }

  // Warning (informe en 4-7d o inicio en 2-5d)
  if (hoy >= fin && diasParaInforme > 3 && diasParaInforme <= 7) {
    return {
      severity: 'warning',
      badgeText: 'Informe Pendiente',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800',
      countdownText: `Informe en ${diasParaInforme} días`,
      diasParaInicio,
      diasParaFin,
      diasParaInforme
    };
  }

  if (diasParaInicio >= 2 && diasParaInicio <= 5) {
    return {
      severity: 'warning',
      badgeText: 'Inicio Próximo',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800',
      countdownText: `Inicia en ${diasParaInicio} días`,
      diasParaInicio,
      diasParaFin,
      diasParaInforme
    };
  }

  // En curso
  if (hoy >= inicio && hoy <= fin) {
    return {
      severity: 'info',
      badgeText: 'En Curso',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      countdownText: `Finaliza en ${diasParaFin}d`,
      diasParaInicio,
      diasParaFin,
      diasParaInforme
    };
  }

  // Próximo
  return {
    severity: 'info',
    badgeText: 'Programado',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    countdownText: `En ${diasParaInicio} días`,
    diasParaInicio,
    diasParaFin,
    diasParaInforme
  };
}

export function generateCourseAlerts(asignaciones: CursoProgramado[], refDate: Date = new Date()): CourseAlert[] {
  const alerts: CourseAlert[] = [];

  asignaciones.forEach((curso, idx) => {
    const status = getAlertSeverity(curso, refDate);

    if (status.severity === 'critical') {
      if (status.diasParaInforme >= 0 && status.diasParaInforme <= 3) {
        alerts.push({
          id: `alert-inf-${idx}`,
          severity: 'critical',
          type: 'informe_urgente',
          title: 'ENTREGA DE INFORME URGENTE',
          message: `El informe final de "${curso.cursoNombre}" (${curso.cicloId}) debe entregarse el ${formatDateVisual(curso.informeFinal, true)}.`,
          badgeLabel: status.countdownText,
          curso,
          diasRestantes: status.diasParaInforme
        });
      } else if (status.diasParaInicio >= 0 && status.diasParaInicio <= 1) {
        alerts.push({
          id: `alert-ini-${idx}`,
          severity: 'critical',
          type: 'inicio_inminente',
          title: 'INICIO DE MÓDULO INMINENTE',
          message: `El curso "${curso.cursoNombre}" en ${curso.lugar} inicia el ${formatDateVisual(curso.inicio, true)}.`,
          badgeLabel: status.countdownText,
          curso,
          diasRestantes: status.diasParaInicio
        });
      }
    } else if (status.severity === 'warning') {
      if (status.diasParaInforme > 3 && status.diasParaInforme <= 7) {
        alerts.push({
          id: `alert-warn-inf-${idx}`,
          severity: 'warning',
          type: 'informe_advertencia',
          title: 'Informe Final Pendiente Próximo',
          message: `Recuerde preparar el informe de "${curso.cursoNombre}" (${formatDateVisual(curso.informeFinal, true)}).`,
          badgeLabel: status.countdownText,
          curso,
          diasRestantes: status.diasParaInforme
        });
      } else if (status.diasParaInicio >= 2 && status.diasParaInicio <= 5) {
        alerts.push({
          id: `alert-warn-ini-${idx}`,
          severity: 'warning',
          type: 'inicio_inminente',
          title: 'Próximo Inicio de Clases',
          message: `El curso "${curso.cursoNombre}" (${curso.cicloId}) iniciará en ${status.diasParaInicio} días.`,
          badgeLabel: status.countdownText,
          curso,
          diasRestantes: status.diasParaInicio
        });
      }
    }
  });

  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'critical' ? -1 : 1;
    }
    return (a.diasRestantes ?? 999) - (b.diasRestantes ?? 999);
  });
}
