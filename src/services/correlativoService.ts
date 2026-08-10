import { supabase } from '../lib/supabase';

export interface CorrelativoRecord {
  id: string; // e.g. "CP-001-2026"
  tipo: 'cp' | 'inf' | 'ini';
  prefijo: string;
  numero: number;
  codigoCompleto: string; // e.g. "UNEFCO-CP-LP Nº001/2026"
  ciNum: string;
  ciComp: string;
  ciCompleta: string; // "3436443-1" or "3436443"
  nombreFacilitador: string;
  motivo: string; // "CONTRATO FACILITADOR"
  anio: number; // 2026
  fechaGeneracion: string; // ISO string
  usuarioGenerador: string;
  estado: 'Activo' | 'Anulado';
  motivoAnulacion?: string;
  fechaAnulacion?: string;
  usuarioAnulador?: string;
  fechaInicioContrato?: string; // linked contract start date
  limiteContrato?: string; // contract end date (+100 days)
  updatedAt: string;
}

export interface CorrelativoCounters {
  cp: number;
  inf: number;
  ini: number;
}

const TABLE = 'correlativos';
const COUNTERS_ID = 'correlativo_counters_2026';

// Default initial counters
export const DEFAULT_COUNTERS: CorrelativoCounters = {
  cp: 0,
  inf: 0,
  ini: 0
};

// ---------------------------------------------------------------------------
// Helpers de conversión (camelCase <-> snake_case)
// ---------------------------------------------------------------------------

function toISO(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  return val;
}

function recordToRow(record: CorrelativoRecord): Record<string, any> {
  return {
    id: record.id,
    tipo: record.tipo,
    prefijo: record.prefijo,
    numero: record.numero,
    codigo_completo: record.codigoCompleto,
    ci_num: record.ciNum,
    ci_comp: record.ciComp,
    ci_completa: record.ciCompleta,
    nombre_facilitador: record.nombreFacilitador,
    motivo: record.motivo,
    anio: record.anio,
    fecha_generacion: toISO(record.fechaGeneracion),
    usuario_generador: record.usuarioGenerador,
    estado: record.estado,
    motivo_anulacion: record.motivoAnulacion ?? null,
    fecha_anulacion: toISO(record.fechaAnulacion) ?? null,
    usuario_anulador: record.usuarioAnulador ?? null,
    fecha_inicio_contrato: toISO(record.fechaInicioContrato) ?? null,
    limite_contrato: toISO(record.limiteContrato) ?? null,
    updated_at: toISO(record.updatedAt) || new Date().toISOString()
  };
}

function rowToRecord(row: any): CorrelativoRecord {
  return {
    id: row.id,
    tipo: row.tipo,
    prefijo: row.prefijo,
    numero: row.numero,
    codigoCompleto: row.codigo_completo,
    ciNum: row.ci_num,
    ciComp: row.ci_comp,
    ciCompleta: row.ci_completa,
    nombreFacilitador: row.nombre_facilitador,
    motivo: row.motivo,
    anio: row.anio,
    fechaGeneracion: row.fecha_generacion,
    usuarioGenerador: row.usuario_generador,
    estado: row.estado,
    motivoAnulacion: row.motivo_anulacion ?? undefined,
    fechaAnulacion: row.fecha_anulacion ?? undefined,
    usuarioAnulador: row.usuario_anulador ?? undefined,
    fechaInicioContrato: row.fecha_inicio_contrato ?? undefined,
    limiteContrato: row.limite_contrato ?? undefined,
    updatedAt: row.updated_at
  };
}

// Genera un nombre de canal único para evitar colisiones de resuscripción en Supabase Realtime
function uniqueChannelName(base: string): string {
  return `${base}-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// API pública (mismos nombres que la versión Firestore)
// ---------------------------------------------------------------------------

// Elimina todos los registros de correlativos y reinicia los contadores
export async function clearAllCorrelativosFromFirestore(): Promise<void> {
  try {
    const { error: delError } = await supabase
      .from(TABLE)
      .delete()
      .neq('id', COUNTERS_ID);

    if (delError) {
      console.error('[CorrelativoService] Error al limpiar correlativos:', delError);
    }

    const { error: upsertError } = await supabase
      .from(TABLE)
      .upsert({ id: COUNTERS_ID, ...DEFAULT_COUNTERS, updated_at: new Date().toISOString() });

    if (upsertError) {
      console.error('[CorrelativoService] Error al reiniciar contadores:', upsertError);
    } else {
      console.log('[CorrelativoService] Todos los correlativos eliminados y contadores reiniciados.');
    }
  } catch (error) {
    console.error('[CorrelativoService] Error inesperado al limpiar correlativos:', error);
  }
}

// Reinicia los contadores a cero
export async function resetCorrelativoCountersInFirestore(): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert({ id: COUNTERS_ID, ...DEFAULT_COUNTERS, updated_at: new Date().toISOString() });

    if (error) {
      console.error('[CorrelativoService] Error al reiniciar contadores:', error);
    } else {
      console.log('[CorrelativoService] Contadores reiniciados a cero.');
    }
  } catch (error) {
    console.error('[CorrelativoService] Error inesperado al reiniciar contadores:', error);
  }
}

// Guarda un registro de correlativo y actualiza los contadores
export async function saveCorrelativoRecord(
  record: CorrelativoRecord,
  newCounters: CorrelativoCounters
): Promise<void> {
  try {
    const row = recordToRow(record);
    const { error: recError } = await supabase.from(TABLE).upsert(row);

    if (recError) {
      console.error('[CorrelativoService] Error al guardar correlativo:', recError);
      return;
    }

    const { error: counterError } = await supabase
      .from(TABLE)
      .upsert({ id: COUNTERS_ID, ...newCounters, updated_at: new Date().toISOString() });

    if (counterError) {
      console.error('[CorrelativoService] Error al actualizar contadores:', counterError);
    } else {
      console.log(`[CorrelativoService] Correlativo ${record.codigoCompleto} guardado en Supabase.`);
    }
  } catch (error) {
    console.error('[CorrelativoService] Error inesperado al guardar correlativo:', error);
  }
}

// Suscripción en tiempo real a la lista de correlativos (excluye la fila de contadores)
export function subscribeToCorrelativos(
  onUpdate: (records: CorrelativoRecord[]) => void
): () => void {
  let active = true;
  let channel: ReturnType<typeof supabase.channel> | null = null;

  const fetchAndEmit = async () => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .neq('id', COUNTERS_ID)
      .order('updated_at', { ascending: false })
      .limit(300);

    if (error) {
      console.error('[CorrelativoService] Error al cargar correlativos:', error);
      return;
    }
    if (active && data) {
      onUpdate(data.map(rowToRecord));
    }
  };

  fetchAndEmit();

  channel = supabase
    .channel(uniqueChannelName('correlativos-changes'))
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
      fetchAndEmit();
    })
    .subscribe();

  return () => {
    active = false;
    if (channel) supabase.removeChannel(channel);
  };
}

// Suscripción en tiempo real a los contadores (cp, inf, ini)
export function subscribeToCounters(
  onUpdate: (counters: CorrelativoCounters) => void
): () => void {
  let active = true;
  let channel: ReturnType<typeof supabase.channel> | null = null;

  const fetchAndEmit = async () => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('cp, inf, ini')
      .eq('id', COUNTERS_ID)
      .maybeSingle();

    if (error) {
      console.error('[CorrelativoService] Error al cargar contadores:', error);
      return;
    }
    if (active) {
      onUpdate({
        cp: data?.cp || 0,
        inf: data?.inf || 0,
        ini: data?.ini || 0
      });
    }
  };

  fetchAndEmit();

  channel = supabase
    .channel(uniqueChannelName('correlativo-counters-changes'))
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE, filter: `id=eq.${COUNTERS_ID}` },
      () => {
        fetchAndEmit();
      }
    )
    .subscribe();

  return () => {
    active = false;
    if (channel) supabase.removeChannel(channel);
  };
}
