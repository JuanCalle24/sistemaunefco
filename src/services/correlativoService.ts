import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

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

const CORRELATIVOS_COLLECTION = 'correlativos';
const COUNTERS_DOC = 'correlativo_counters_2026';

export const DEFAULT_COUNTERS: CorrelativoCounters = {
  cp: 0,
  inf: 0,
  ini: 0
};

// Clear all correlativo records and reset counters
export async function clearAllCorrelativosFromFirestore(): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('correlativos').delete().neq('id', '___none___');
      await supabase.from('correlativo_contadores').upsert({
        id: COUNTERS_DOC,
        cp: 0,
        inf: 0,
        ini: 0,
        updated_at: new Date().toISOString()
      });
      console.log('[Supabase] Todos los correlativos eliminados y contadores reiniciados.');
      return;
    } catch (err) {
      console.warn('[Supabase] Error limpiando correlativos:', err);
    }
  }

  try {
    const colRef = collection(db, CORRELATIVOS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);

    const counterRef = doc(db, CORRELATIVOS_COLLECTION, COUNTERS_DOC);
    await setDoc(counterRef, DEFAULT_COUNTERS);
    console.log('[CorrelativoService] Todos los correlativos eliminados y contadores reiniciados.');
  } catch (error) {
    console.error('[CorrelativoService] Error al limpiar correlativos en Firestore:', error);
  }
}

// Reset counters to 0
export async function resetCorrelativoCountersInFirestore(): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('correlativo_contadores').upsert({
        id: COUNTERS_DOC,
        cp: 0,
        inf: 0,
        ini: 0,
        updated_at: new Date().toISOString()
      });
      console.log('[Supabase] Contadores reiniciados a cero.');
      return;
    } catch (err) {
      console.warn('[Supabase] Error al reiniciar contadores:', err);
    }
  }

  try {
    const counterRef = doc(db, CORRELATIVOS_COLLECTION, COUNTERS_DOC);
    await setDoc(counterRef, DEFAULT_COUNTERS);
    console.log('[CorrelativoService] Contadores reiniciados a cero.');
  } catch (error) {
    console.error('[CorrelativoService] Error al reiniciar contadores:', error);
  }
}

// Save record and update counter
export async function saveCorrelativoRecord(
  record: CorrelativoRecord, 
  newCounters: CorrelativoCounters
): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('correlativos').upsert({
        id: record.id,
        tipo: record.tipo,
        prefijo: record.prefijo,
        numero: record.numero,
        codigo_completo: record.codigoCompleto,
        ci_num: record.ciNum,
        ci_comp: record.ciComp || null,
        ci_completa: record.ciCompleta,
        nombre_facilitador: record.nombreFacilitador,
        motivo: record.motivo,
        anio: record.anio || 2026,
        fecha_generacion: record.fechaGeneracion,
        usuario_generador: record.usuarioGenerador,
        estado: record.estado,
        motivo_anulacion: record.motivoAnulacion || null,
        fecha_anulacion: record.fechaAnulacion || null,
        usuario_anulador: record.usuarioAnulador || null,
        fecha_inicio_contrato: record.fechaInicioContrato || null,
        limite_contrato: record.limiteContrato || null,
        updated_at: new Date().toISOString()
      });

      await supabase.from('correlativo_contadores').upsert({
        id: COUNTERS_DOC,
        cp: newCounters.cp,
        inf: newCounters.inf,
        ini: newCounters.ini,
        updated_at: new Date().toISOString()
      });

      console.log(`[Supabase] Correlativo ${record.codigoCompleto} guardado.`);
      return;
    } catch (err) {
      console.warn('[Supabase] Error al guardar correlativo en Supabase:', err);
    }
  }

  try {
    const docRef = doc(db, CORRELATIVOS_COLLECTION, record.id);
    await setDoc(docRef, record, { merge: true });

    const counterRef = doc(db, CORRELATIVOS_COLLECTION, COUNTERS_DOC);
    await setDoc(counterRef, newCounters, { merge: true });
    
    console.log(`[CorrelativoService] Correlativo ${record.codigoCompleto} guardado en Firestore.`);
  } catch (error) {
    console.error('[CorrelativoService] Error al guardar correlativo:', error);
  }
}

// Map Supabase record to CorrelativoRecord
function mapSupabaseCorrelativo(d: any): CorrelativoRecord {
  return {
    id: d.id,
    tipo: d.tipo,
    prefijo: d.prefijo,
    numero: d.numero,
    codigoCompleto: d.codigo_completo || d.codigoCompleto,
    ciNum: d.ci_num || d.ciNum,
    ciComp: d.ci_comp || d.ciComp || '',
    ciCompleta: d.ci_completa || d.ciCompleta,
    nombreFacilitador: d.nombre_facilitador || d.nombreFacilitador,
    motivo: d.motivo,
    anio: d.anio,
    fechaGeneracion: d.fecha_generacion || d.fechaGeneracion,
    usuarioGenerador: d.usuario_generador || d.usuarioGenerador,
    estado: d.estado,
    motivoAnulacion: d.motivo_anulacion || d.motivoAnulacion,
    fechaAnulacion: d.fecha_anulacion || d.fechaAnulacion,
    usuarioAnulador: d.usuario_anulador || d.usuarioAnulador,
    fechaInicioContrato: d.fecha_inicio_contrato || d.fechaInicioContrato,
    limiteContrato: d.limite_contrato || d.limiteContrato,
    updatedAt: d.updated_at || d.updatedAt || new Date().toISOString()
  };
}

// Subscribe to real-time correlativos list
export function subscribeToCorrelativos(
  onUpdate: (records: CorrelativoRecord[]) => void
): () => void {
  if (isSupabaseConfigured) {
    const fetchSupabaseCorrelativos = async () => {
      try {
        const { data, error } = await supabase
          .from('correlativos')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(300);
        if (!error && data) {
          onUpdate(data.map(mapSupabaseCorrelativo));
        }
      } catch (err) {
        console.warn('[Supabase] Error fetch correlativos:', err);
      }
    };

    fetchSupabaseCorrelativos();

    const channel = supabase
      .channel('public:correlativos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'correlativos' }, () => {
        fetchSupabaseCorrelativos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  try {
    const colRef = collection(db, CORRELATIVOS_COLLECTION);
    const q = query(colRef, orderBy('updatedAt', 'desc'), limit(300));

    return onSnapshot(q, (snapshot) => {
      const items: CorrelativoRecord[] = [];
      snapshot.forEach((d) => {
        if (d.id !== COUNTERS_DOC) {
          items.push(d.data() as CorrelativoRecord);
        }
      });
      onUpdate(items);
    }, (error) => {
      console.error('[CorrelativoService] Error en listener de correlativos:', error);
    });
  } catch (err) {
    console.error('[CorrelativoService] Error al iniciar listener:', err);
    return () => {};
  }
}

// Subscribe to real-time counters
export function subscribeToCounters(
  onUpdate: (counters: CorrelativoCounters) => void
): () => void {
  if (isSupabaseConfigured) {
    const fetchCounters = async () => {
      try {
        const { data } = await supabase
          .from('correlativo_contadores')
          .select('*')
          .eq('id', COUNTERS_DOC)
          .single();
        if (data) {
          onUpdate({
            cp: data.cp || 0,
            inf: data.inf || 0,
            ini: data.ini || 0
          });
        }
      } catch (e) {
        console.warn('[Supabase] Fetch counters warning:', e);
      }
    };

    fetchCounters();

    const channel = supabase
      .channel('public:correlativo_contadores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'correlativo_contadores' }, () => {
        fetchCounters();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  try {
    const counterRef = doc(db, CORRELATIVOS_COLLECTION, COUNTERS_DOC);
    return onSnapshot(counterRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as CorrelativoCounters;
        onUpdate({
          cp: data.cp || 0,
          inf: data.inf || 0,
          ini: data.ini || 0
        });
      }
    });
  } catch (error) {
    console.error('[CorrelativoService] Error listener contadores:', error);
    return () => {};
  }
}
