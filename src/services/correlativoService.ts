import { db } from '../lib/firebase';
import { collection, doc, setDoc, onSnapshot, query, orderBy, limit, getDoc } from 'firebase/firestore';

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

// Default initial counters
export const DEFAULT_COUNTERS: CorrelativoCounters = {
  cp: 0,
  inf: 0,
  ini: 0
};

// Save record and update counter atomically/incrementally
export async function saveCorrelativoRecord(
  record: CorrelativoRecord, 
  newCounters: CorrelativoCounters
): Promise<void> {
  try {
    // Save document
    const docRef = doc(db, CORRELATIVOS_COLLECTION, record.id);
    await setDoc(docRef, record, { merge: true });

    // Save updated counters
    const counterRef = doc(db, CORRELATIVOS_COLLECTION, COUNTERS_DOC);
    await setDoc(counterRef, newCounters, { merge: true });
    
    console.log(`[CorrelativoService] Correlativo ${record.codigoCompleto} guardado en Firestore.`);
  } catch (error) {
    console.error('[CorrelativoService] Error al guardar correlativo:', error);
  }
}

// Subscribe to real-time correlativos list
export function subscribeToCorrelativos(
  onUpdate: (records: CorrelativoRecord[]) => void
): () => void {
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
  } catch (err) {
    console.error('[CorrelativoService] Error listener contadores:', err);
    return () => {};
  }
}
