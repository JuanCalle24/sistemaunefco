import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { ProgramacionResultado, CursoProgramado } from '../types';

const SCHEDULES_COLLECTION = 'schedules';

// Helper to safely serialize schedule for storage
function serializeSchedule(schedule: ProgramacionResultado): Record<string, any> {
  const docId = schedule.idTransaccion || `TRANS-${Date.now()}`;
  
  const serializedAsignaciones = (schedule.asignaciones || []).map((asig: CursoProgramado) => ({
    ...asig,
    inicio: asig.inicio instanceof Date ? asig.inicio.toISOString() : asig.inicio,
    fin: asig.fin instanceof Date ? asig.fin.toISOString() : asig.fin,
    planificacion: asig.planificacion instanceof Date ? asig.planificacion.toISOString() : asig.planificacion,
    informeFinal: asig.informeFinal instanceof Date ? asig.informeFinal.toISOString() : asig.informeFinal,
    sesion2: asig.sesion2 instanceof Date ? asig.sesion2.toISOString() : asig.sesion2,
    sesion3: asig.sesion3 instanceof Date ? asig.sesion3.toISOString() : asig.sesion3,
  }));

  return {
    id: docId,
    id_transaccion: docId,
    tecnico: schedule.tecnico || '',
    rol_operador: schedule.rolOperador || 'tecnico',
    facilitador: schedule.facilitador || '',
    ci: schedule.ci || '',
    ci_complemento: schedule.ciComplemento || '',
    fecha_inicio_contrato: schedule.fechaInicioContrato instanceof Date 
      ? schedule.fechaInicioContrato.toISOString().split('T')[0]
      : schedule.fechaInicioContrato,
    limite_contrato: schedule.limiteContrato instanceof Date 
      ? schedule.limiteContrato.toISOString().split('T')[0]
      : schedule.limiteContrato,
    days_used: schedule.daysUsed || 0,
    modo: schedule.modo || 'automatico',
    hash_seguridad: schedule.hashSeguridad || '',
    estado: schedule.estado || 'ACTIVO',
    motivo_anulacion: schedule.motivoAnulacion || null,
    fecha_anulacion: schedule.fechaAnulacion || null,
    usuario_registro: schedule.usuarioRegistro || schedule.tecnico,
    usuario_anulador: schedule.usuarioAnulador || null,
    slots: schedule.slots || [],
    asignaciones: serializedAsignaciones,
    updated_at: new Date().toISOString()
  };
}

// Helper to convert DB JSON to ProgramacionResultado with Date objects
export function deserializeSchedule(data: any): ProgramacionResultado {
  const parseDate = (val: any): Date => {
    if (!val) return new Date();
    if (val.toDate && typeof val.toDate === 'function') return val.toDate();
    if (val instanceof Date) return val;
    return new Date(val);
  };

  const rawAsignaciones = data.asignaciones || [];
  const asignaciones = (Array.isArray(rawAsignaciones) ? rawAsignaciones : []).map((asig: any) => ({
    ...asig,
    inicio: parseDate(asig.inicio),
    fin: parseDate(asig.fin),
    planificacion: parseDate(asig.planificacion),
    informeFinal: parseDate(asig.informeFinal),
    sesion2: parseDate(asig.sesion2),
    sesion3: parseDate(asig.sesion3),
  }));

  return {
    idTransaccion: data.id_transaccion || data.idTransaccion || data.id,
    tecnico: data.tecnico || '',
    rolOperador: data.rol_operador || data.rolOperador || 'tecnico',
    facilitador: data.facilitador || '',
    ci: data.ci || '',
    ciComplemento: data.ci_complemento || data.ciComplemento || '',
    fechaInicioContrato: parseDate(data.fecha_inicio_contrato || data.fechaInicioContrato),
    limiteContrato: parseDate(data.limite_contrato || data.limiteContrato),
    daysUsed: data.days_used || data.daysUsed || 0,
    modo: data.modo || 'automatico',
    hashSeguridad: data.hash_seguridad || data.hashSeguridad || '',
    slots: data.slots || [],
    asignaciones,
    estado: data.estado || 'ACTIVO',
    motivoAnulacion: data.motivo_anulacion || data.motivoAnulacion,
    fechaAnulacion: data.fecha_anulacion || data.fechaAnulacion,
    usuarioRegistro: data.usuario_registro || data.usuarioRegistro,
    usuarioAnulador: data.usuario_anulador || data.usuarioAnulador
  };
}

// Save or update schedule in Supabase (with Firestore fallback)
export async function saveScheduleToFirestore(schedule: ProgramacionResultado): Promise<void> {
  const docId = schedule.idTransaccion || `TRANS-${Date.now()}`;
  const payload = serializeSchedule(schedule);

  // 1. Supabase save
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('cronogramas')
        .upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      console.log(`[Supabase] Cronograma ${docId} guardado exitosamente.`);
      return;
    } catch (err) {
      console.warn('[Supabase] Error al guardar cronograma en Supabase:', err);
    }
  }

  // 2. Firestore fallback
  try {
    const docRef = doc(db, SCHEDULES_COLLECTION, docId);
    await setDoc(docRef, { ...schedule, updatedAt: new Date().toISOString() }, { merge: true });
    console.log(`[Firestore] Cronograma ${docId} guardado exitosamente.`);
  } catch (error) {
    console.error('[Firestore] Error al guardar cronograma:', error);
  }
}

// Delete a single schedule
export async function deleteScheduleFromFirestore(docId: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('cronogramas').delete().eq('id', docId);
      if (!error) {
        console.log(`[Supabase] Cronograma ${docId} eliminado exitosamente.`);
        return;
      }
    } catch (err) {
      console.warn('[Supabase] Error eliminando cronograma:', err);
    }
  }

  try {
    const docRef = doc(db, SCHEDULES_COLLECTION, docId);
    await deleteDoc(docRef);
    console.log(`[Firestore] Cronograma ${docId} eliminado exitosamente.`);
  } catch (error) {
    console.error('[Firestore] Error al eliminar cronograma:', error);
  }
}

// Clear all schedules
export async function clearAllSchedulesFromFirestore(): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('cronogramas').delete().neq('id', '___none___');
      if (!error) {
        console.log('[Supabase] Todo el historial de cronogramas ha sido eliminado.');
        return;
      }
    } catch (err) {
      console.warn('[Supabase] Error limpiando cronogramas:', err);
    }
  }

  try {
    const schedulesRef = collection(db, SCHEDULES_COLLECTION);
    const snapshot = await getDocs(schedulesRef);
    const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
    console.log('[Firestore] Todo el historial de cronogramas ha sido eliminado.');
  } catch (error) {
    console.error('[Firestore] Error al limpiar todo el historial:', error);
  }
}

// Subscribe to real-time updates for schedules
export function subscribeToSchedules(onUpdate: (schedules: ProgramacionResultado[]) => void): () => void {
  if (isSupabaseConfigured) {
    const fetchSupabaseData = async () => {
      try {
        const { data, error } = await supabase
          .from('cronogramas')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(100);
        if (!error && data) {
          onUpdate(data.map(deserializeSchedule));
        }
      } catch (e) {
        console.warn('[Supabase] Fetch cronogramas failed:', e);
      }
    };

    fetchSupabaseData();

    const channel = supabase
      .channel('public:cronogramas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cronogramas' }, () => {
        fetchSupabaseData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  try {
    const schedulesRef = collection(db, SCHEDULES_COLLECTION);
    const q = query(schedulesRef, orderBy('updatedAt', 'desc'), limit(50));

    return onSnapshot(
      q,
      (snapshot) => {
        const items: ProgramacionResultado[] = [];
        snapshot.forEach((docSnap) => {
          try {
            items.push(deserializeSchedule(docSnap.data()));
          } catch (err) {
            console.error('[Firestore] Error deserializando documento:', err);
          }
        });
        onUpdate(items);
      },
      (error) => {
        console.error('[Firestore] Error en listener de cronogramas:', error);
      }
    );
  } catch (err) {
    console.error('[Firestore] No se pudo iniciar suscripción:', err);
    return () => {};
  }
}
