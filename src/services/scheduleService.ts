import { db } from '../lib/firebase';
import { collection, doc, setDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { ProgramacionResultado, CursoProgramado } from '../types';

const SCHEDULES_COLLECTION = 'schedules';

// Helper to safely convert Date objects to ISO strings for Firestore storage
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
    ...schedule,
    idTransaccion: docId,
    fechaInicioContrato: schedule.fechaInicioContrato instanceof Date 
      ? schedule.fechaInicioContrato.toISOString() 
      : schedule.fechaInicioContrato,
    limiteContrato: schedule.limiteContrato instanceof Date 
      ? schedule.limiteContrato.toISOString() 
      : schedule.limiteContrato,
    asignaciones: serializedAsignaciones,
    updatedAt: new Date().toISOString()
  };
}

// Helper to convert Firestore JSON back to ProgramacionResultado with JS Date objects
export function deserializeSchedule(data: any): ProgramacionResultado {
  const parseDate = (val: any): Date => {
    if (!val) return new Date();
    if (val.toDate && typeof val.toDate === 'function') return val.toDate();
    if (val instanceof Date) return val;
    return new Date(val);
  };

  const asignaciones = (data.asignaciones || []).map((asig: any) => ({
    ...asig,
    inicio: parseDate(asig.inicio),
    fin: parseDate(asig.fin),
    planificacion: parseDate(asig.planificacion),
    informeFinal: parseDate(asig.informeFinal),
    sesion2: parseDate(asig.sesion2),
    sesion3: parseDate(asig.sesion3),
  }));

  return {
    ...data,
    fechaInicioContrato: parseDate(data.fechaInicioContrato),
    limiteContrato: parseDate(data.limiteContrato),
    asignaciones
  };
}

// Save or update a schedule in Firestore
export async function saveScheduleToFirestore(schedule: ProgramacionResultado): Promise<void> {
  try {
    const docId = schedule.idTransaccion || `TRANS-${Date.now()}`;
    const payload = serializeSchedule(schedule);
    const docRef = doc(db, SCHEDULES_COLLECTION, docId);
    await setDoc(docRef, payload, { merge: true });
    console.log(`[Firestore] Cronograma ${docId} guardado exitosamente.`);
  } catch (error) {
    console.error('[Firestore] Error al guardar cronograma:', error);
    // Keep working even if offline
  }
}

// Subscribe to real-time updates for all schedules (syncs across devices and sessions)
export function subscribeToSchedules(onUpdate: (schedules: ProgramacionResultado[]) => void): () => void {
  try {
    const schedulesRef = collection(db, SCHEDULES_COLLECTION);
    const q = query(schedulesRef, orderBy('updatedAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: ProgramacionResultado[] = [];
        snapshot.forEach((docSnap) => {
          try {
            const data = docSnap.data();
            items.push(deserializeSchedule(data));
          } catch (err) {
            console.error('[Firestore] Error deserializando documento:', err);
          }
        });
        if (items.length > 0) {
          onUpdate(items);
        }
      },
      (error) => {
        console.error('[Firestore] Error en listener de cronogramas:', error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('[Firestore] No se pudo iniciar suscripción:', err);
    return () => {};
  }
}
