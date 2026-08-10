import { supabase } from '../lib/supabase';
import { ProgramacionResultado, CursoProgramado, SlotAsignacion } from '../types';

const TABLE = 'schedules';

// ---------------------------------------------------------------------------
// Helpers de conversión
// ---------------------------------------------------------------------------

function toISO(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val;
  return new Date(val).toISOString();
}

function parseDate(val: any): Date {
  if (!val) return new Date();
  return val instanceof Date ? val : new Date(val);
}

// Convierte un ProgramacionResultado completo en N filas (una por curso) listas para Supabase
function serializeScheduleToRows(schedule: ProgramacionResultado): Record<string, any>[] {
  const idTransaccion = schedule.idTransaccion || `TRANS-${Date.now()}`;

  const rows = (schedule.asignaciones || []).map((asig: CursoProgramado) => {
    const slot = (schedule.slots || []).find(s => s.id === asig.slotId);

    return {
      id_transaccion: idTransaccion,
      slot_id: asig.slotId,
      cat: asig.cat ?? slot?.cat ?? null,
      ciclo_id: asig.cicloId ?? slot?.cicloId ?? null,
      ciclo_nombre: asig.cicloNombre ?? slot?.cicloNombre ?? null,
      lugar: asig.lugar ?? slot?.lugar ?? null,
      modalidad: asig.modalidad ?? slot?.modalidad ?? null,
      ciclo_numero: asig.cicloNumero ?? null,
      curso_index: asig.cursoIndex ?? null,
      curso_nombre: asig.cursoNombre ?? null,
      inicio: toISO(asig.inicio),
      fin: toISO(asig.fin),
      planificacion: toISO(asig.planificacion),
      informe_final: toISO(asig.informeFinal),
      sesion2: toISO(asig.sesion2),
      sesion3: toISO(asig.sesion3),
      es_manual: schedule.modo === 'manual',
      facilitador: schedule.facilitador ?? null,
      ci: schedule.ci ?? null,
      tecnico: schedule.tecnico ?? null,
      usuario_registro: schedule.usuarioRegistro ?? null,
      estado: schedule.estado ?? 'ACTIVO',
      motivo_anulacion: schedule.motivoAnulacion ?? null,
      fecha_inicio_contrato: toISO(schedule.fechaInicioContrato),
      limite_contrato: toISO(schedule.limiteContrato),
      rol_operador: schedule.rolOperador ?? null,
      fecha_anulacion: toISO(schedule.fechaAnulacion),
      usuario_anulador: schedule.usuarioAnulador ?? null,
      slot_lugar: slot?.lugar ?? null,
      slot_modalidad: slot?.modalidad ?? null,
      days_used: schedule.daysUsed ?? null
    };
  });

  // Si no hay asignaciones (caso raro), igual guardamos una fila "cabecera" para no perder el registro
  if (rows.length === 0) {
    rows.push({
      id_transaccion: idTransaccion,
      slot_id: null,
      facilitador: schedule.facilitador ?? null,
      ci: schedule.ci ?? null,
      tecnico: schedule.tecnico ?? null,
      usuario_registro: schedule.usuarioRegistro ?? null,
      estado: schedule.estado ?? 'ACTIVO',
      motivo_anulacion: schedule.motivoAnulacion ?? null,
      fecha_inicio_contrato: toISO(schedule.fechaInicioContrato),
      limite_contrato: toISO(schedule.limiteContrato),
      rol_operador: schedule.rolOperador ?? null,
      fecha_anulacion: toISO(schedule.fechaAnulacion),
      usuario_anulador: schedule.usuarioAnulador ?? null,
      days_used: schedule.daysUsed ?? null
    });
  }

  return rows;
}

// Reagrupa filas de Supabase (por id_transaccion) en objetos ProgramacionResultado
function deserializeRowsToSchedules(rows: any[]): ProgramacionResultado[] {
  const grouped = new Map<string, any[]>();

  rows.forEach(row => {
    const key = row.id_transaccion;
    if (!key) return;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  });

  const results: ProgramacionResultado[] = [];

  grouped.forEach((groupRows, idTransaccion) => {
    const first = groupRows[0];

    // Reconstruir asignaciones (cursos)
    const asignaciones: CursoProgramado[] = groupRows
      .filter(r => r.slot_id)
      .map(r => ({
        slotId: r.slot_id,
        cat: r.cat,
        cicloId: r.ciclo_id,
        cicloNombre: r.ciclo_nombre,
        lugar: r.lugar,
        modalidad: r.modalidad,
        cicloNumero: r.ciclo_numero,
        cursoIndex: r.curso_index,
        cursoNombre: r.curso_nombre,
        inicio: parseDate(r.inicio),
        fin: parseDate(r.fin),
        planificacion: parseDate(r.planificacion),
        informeFinal: parseDate(r.informe_final),
        sesion2: parseDate(r.sesion2),
        sesion3: parseDate(r.sesion3)
      } as CursoProgramado));

    // Reconstruir slots únicos (agrupando por slot_id)
    const slotsMap = new Map<string, SlotAsignacion>();
    groupRows.forEach(r => {
      if (!r.slot_id) return;
      if (!slotsMap.has(r.slot_id)) {
        slotsMap.set(r.slot_id, {
          id: r.slot_id,
          cicloId: r.ciclo_id,
          cicloNombre: r.ciclo_nombre,
          cat: r.cat,
          lugar: r.slot_lugar || r.lugar,
          modalidad: r.slot_modalidad || r.modalidad,
          cursos: []
        } as unknown as SlotAsignacion);
      }
      const slot = slotsMap.get(r.slot_id)!;
      if (r.curso_nombre && !(slot as any).cursos.includes(r.curso_nombre)) {
        (slot as any).cursos.push(r.curso_nombre);
      }
    });

    results.push({
      idTransaccion,
      facilitador: first.facilitador,
      ci: first.ci,
      tecnico: first.tecnico,
      usuarioRegistro: first.usuario_registro,
      estado: first.estado,
      motivoAnulacion: first.motivo_anulacion,
      fechaInicioContrato: parseDate(first.fecha_inicio_contrato),
      limiteContrato: parseDate(first.limite_contrato),
      rolOperador: first.rol_operador,
      fechaAnulacion: first.fecha_anulacion ? parseDate(first.fecha_anulacion) : undefined,
      usuarioAnulador: first.usuario_anulador,
      daysUsed: first.days_used,
      modo: first.es_manual ? 'manual' : 'automatico',
      asignaciones,
      slots: Array.from(slotsMap.values())
    } as unknown as ProgramacionResultado);
  });

  return results.sort((a, b) => {
    const da = a.fechaInicioContrato ? new Date(a.fechaInicioContrato).getTime() : 0;
    const db = b.fechaInicioContrato ? new Date(b.fechaInicioContrato).getTime() : 0;
    return db - da;
  });
}

// ---------------------------------------------------------------------------
// API pública (mismos nombres que la versión Firestore, para no tocar App.tsx)
// ---------------------------------------------------------------------------

// Guarda o actualiza un cronograma completo: borra las filas previas de esa
// transacción y vuelve a insertar el set actual (simple y evita filas huérfanas)
export async function saveScheduleToFirestore(schedule: ProgramacionResultado): Promise<void> {
  try {
    const idTransaccion = schedule.idTransaccion || `TRANS-${Date.now()}`;
    const rows = serializeScheduleToRows({ ...schedule, idTransaccion });

    const { error: delError } = await supabase
      .from(TABLE)
      .delete()
      .eq('id_transaccion', idTransaccion);

    if (delError) {
      console.error('[Supabase] Error al limpiar filas previas del cronograma:', delError);
    }

    const { error: insError } = await supabase.from(TABLE).insert(rows);

    if (insError) {
      console.error('[Supabase] Error al guardar cronograma:', insError);
    } else {
      console.log(`[Supabase] Cronograma ${idTransaccion} guardado exitosamente.`);
    }
  } catch (error) {
    console.error('[Supabase] Error inesperado al guardar cronograma:', error);
  }
}

// Elimina todas las filas de un cronograma (identificado por idTransaccion)
export async function deleteScheduleFromFirestore(idTransaccion: string): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id_transaccion', idTransaccion);

    if (error) {
      console.error('[Supabase] Error al eliminar cronograma:', error);
    } else {
      console.log(`[Supabase] Cronograma ${idTransaccion} eliminado exitosamente.`);
    }
  } catch (error) {
    console.error('[Supabase] Error inesperado al eliminar cronograma:', error);
  }
}

// Elimina TODAS las filas de la tabla schedules
export async function clearAllSchedulesFromFirestore(): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .not('id_transaccion', 'is', null);

    if (error) {
      console.error('[Supabase] Error al limpiar todo el historial:', error);
    } else {
      console.log('[Supabase] Todo el historial de cronogramas ha sido eliminado.');
    }
  } catch (error) {
    console.error('[Supabase] Error inesperado al limpiar historial:', error);
  }
}

// Suscripción en tiempo real (Supabase Realtime) + carga inicial
export function subscribeToSchedules(onUpdate: (schedules: ProgramacionResultado[]) => void): () => void {
  let active = true;

  const fetchAndEmit = async () => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('[Supabase] Error al cargar cronogramas:', error);
      return;
    }
    if (active && data) {
      onUpdate(deserializeRowsToSchedules(data));
    }
  };

  // Carga inicial
  fetchAndEmit();

  // Suscripción a cambios en tiempo real
  const channel = supabase
    .channel('schedules-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
      fetchAndEmit();
    })
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}
