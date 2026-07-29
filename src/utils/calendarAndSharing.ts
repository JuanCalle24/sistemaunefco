import { ProgramacionResultado } from '../types';
import { formatDateISO, formatDateVisual } from './textUtils';

/**
 * Genera el archivo .ics (iCalendar) para importar a Google Calendar, Outlook o Apple Calendar
 */
export function downloadICSFile(resultado: ProgramacionResultado): void {
  const events: string[] = [];

  resultado.asignaciones.forEach((a) => {
    // Helper to format date to YYYYMMDD
    const toICSDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };

    const startDateStr = toICSDate(a.inicio);
    // End date for 1-day event in ICS is next day
    const nextDay = (d: Date) => {
      const copy = new Date(d);
      copy.setDate(copy.getDate() + 1);
      return toICSDate(copy);
    };

    const doc = resultado.facilitador || 'Docente';
    const tec = resultado.tecnico || 'Técnico';

    // Event 1: Sesión 1 (Inicio)
    events.push(`BEGIN:VEVENT
SUMMARY:C${a.cursoIndex + 1}: ${a.cursoNombre} - Sesión 1 (Inicio)
DESCRIPTION:UNEFCO La Paz\\nDocente: ${doc}\\nTécnico: ${tec}\\nLugar: ${a.lugar}\\nModalidad: ${a.modalidad}\\nCiclo: ${a.cicloId}
LOCATION:${a.lugar}
DTSTART;VALUE=DATE:${startDateStr}
DTEND;VALUE=DATE:${nextDay(a.inicio)}
STATUS:CONFIRMED
END:VEVENT`);

    // Event 2: Sesión 2
    events.push(`BEGIN:VEVENT
SUMMARY:C${a.cursoIndex + 1}: ${a.cursoNombre} - Sesión 2
DESCRIPTION:UNEFCO La Paz\\nDocente: ${doc}\\nTécnico: ${tec}\\nLugar: ${a.lugar}\\nModalidad: ${a.modalidad}\\nCiclo: ${a.cicloId}
LOCATION:${a.lugar}
DTSTART;VALUE=DATE:${toICSDate(a.sesion2)}
DTEND;VALUE=DATE:${nextDay(a.sesion2)}
STATUS:CONFIRMED
END:VEVENT`);

    // Event 3: Sesión 3
    events.push(`BEGIN:VEVENT
SUMMARY:C${a.cursoIndex + 1}: ${a.cursoNombre} - Sesión 3
DESCRIPTION:UNEFCO La Paz\\nDocente: ${doc}\\nTécnico: ${tec}\\nLugar: ${a.lugar}\\nModalidad: ${a.modalidad}\\nCiclo: ${a.cicloId}
LOCATION:${a.lugar}
DTSTART;VALUE=DATE:${toICSDate(a.sesion3)}
DTEND;VALUE=DATE:${nextDay(a.sesion3)}
STATUS:CONFIRMED
END:VEVENT`);

    // Event 4: Fin de Clase / Evaluación
    events.push(`BEGIN:VEVENT
SUMMARY:C${a.cursoIndex + 1}: ${a.cursoNombre} - Fin de Clase
DESCRIPTION:UNEFCO La Paz\\nFinalización de actividades de aula\\nDocente: ${doc}\\nCiclo: ${a.cicloId}
LOCATION:${a.lugar}
DTSTART;VALUE=DATE:${toICSDate(a.fin)}
DTEND;VALUE=DATE:${nextDay(a.fin)}
STATUS:CONFIRMED
END:VEVENT`);

    // Event 5: Límite Entrega Informe Final
    events.push(`BEGIN:VEVENT
SUMMARY:⚠️ Límite Informe Final - C${a.cursoIndex + 1}: ${a.cursoNombre}
DESCRIPTION:Plazo máximo para la entrega del informe final y actas en la Sede UNEFCO La Paz.\\nDocente: ${doc}
LOCATION:UNEFCO La Paz
DTSTART;VALUE=DATE:${toICSDate(a.informeFinal)}
DTEND;VALUE=DATE:${nextDay(a.informeFinal)}
STATUS:CONFIRMED
END:VEVENT`);
  });

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UNEFCO La Paz//Cronograma Academico 2026//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Calendario Académico UNEFCO La Paz',
    'X-WR-TIMEZONE:America/La_Paz',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const docenteSanitized = (resultado.facilitador || 'Docente').replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('download', `Calendario_UNEFCO_LP_${docenteSanitized}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera el enlace directo para enviar por WhatsApp Web o App
 */
export function getWhatsAppShareURL(resultado: ProgramacionResultado): string {
  let text = `*CRONOGRAMA ACADÉMICO UNEFCO - SEDE LA PAZ*\n`;
  text += `----------------------------------------\n`;
  text += `👤 *Facilitador/Docente:* ${resultado.facilitador || 'Por asignar'}\n`;
  if (resultado.tecnico) text += `🛠️ *Técnico Responsable:* ${resultado.tecnico}\n`;
  text += `📅 *Inicio de Contrato:* ${formatDateVisual(resultado.fechaInicioContrato, true)}\n`;
  text += `⏱️ *Duración Total:* ${resultado.daysUsed} / 100 Días\n\n`;

  text += `📌 *PROGRAMACIÓN DE CURSOS:*\n`;

  resultado.asignaciones.forEach((a) => {
    text += `\n*• ${a.cicloId} | C${a.cursoIndex + 1}: ${a.cursoNombre}*\n`;
    text += `  📍 *Lugar:* ${a.lugar} (${a.modalidad})\n`;
    text += `  🗓️ *Sesión 1 (Inicio):* ${formatDateVisual(a.inicio, false)}\n`;
    text += `  🗓️ *Sesión 2:* ${formatDateVisual(a.sesion2, false)}\n`;
    text += `  🗓️ *Sesión 3:* ${formatDateVisual(a.sesion3, false)}\n`;
    text += `  🏁 *Fin Clase:* ${formatDateVisual(a.fin, false)}\n`;
    text += `  📄 *Entrega Informe Final:* ${formatDateVisual(a.informeFinal, false)}\n`;
  });

  text += `\n----------------------------------------\n`;
  text += `_Notificación oficial emitida por la Coordinación Académica UNEFCO La Paz._`;

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

/**
 * Genera el enlace mailto para abrir el cliente de correo (Gmail, Outlook, etc.)
 */
export function getEmailShareData(resultado: ProgramacionResultado) {
  const subject = `Calendario Académico UNEFCO-LP - ${resultado.facilitador || 'Docente'}`;

  let body = `Estimado(a) ${resultado.facilitador || 'Docente'},\n\n`;
  body += `Se ha generado el Calendario Académico de Cursos para la Sede UNEFCO La Paz.\n\n`;
  body += `RESUMEN DE PROGRAMACIÓN ACADÉMICA:\n`;
  body += `========================================\n`;
  body += `Docente/Facilitador: ${resultado.facilitador || 'Por asignar'}\n`;
  if (resultado.tecnico) body += `Técnico de Acompañamiento: ${resultado.tecnico}\n`;
  body += `Fecha de Inicio de Contrato: ${formatDateVisual(resultado.fechaInicioContrato, true)}\n`;
  body += `Margen de Ejecución: ${resultado.daysUsed} días calendario\n\n`;

  body += `DETALLE DE SESIONES Y FECHAS:\n\n`;

  resultado.asignaciones.forEach((a) => {
    body += `[${a.cicloId}] C${a.cursoIndex + 1}: ${a.cursoNombre}\n`;
    body += `  - Lugar: ${a.lugar} | Modalidad: ${a.modalidad}\n`;
    body += `  - Sesión 1 (Inicio): ${formatDateVisual(a.inicio, true)}\n`;
    body += `  - Sesión 2: ${formatDateVisual(a.sesion2, false)}\n`;
    body += `  - Sesión 3: ${formatDateVisual(a.sesion3, false)}\n`;
    body += `  - Fin de Clases: ${formatDateVisual(a.fin, true)}\n`;
    body += `  - Límite Informe Final: ${formatDateVisual(a.informeFinal, true)}\n\n`;
  });

  body += `========================================\n`;
  body += `Atentamente,\n`;
  body += `Gestión Académica - UNEFCO Sede La Paz\n`;

  const mailtoURL = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, mailtoURL };
}
