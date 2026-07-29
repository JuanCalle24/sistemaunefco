/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Modalidad = 'Presencial' | 'Semipresencial' | 'Virtual';

export type CategoriaCiclo = 
  | 'SEP'
  | 'INICIAL'
  | 'PRIMARIA'
  | 'SECUNDARIA'
  | 'ALTERNATIVA'
  | 'ESPECIAL'
  | 'TECNICO'
  | 'TACFI';

export interface OfertaCiclo {
  id: string; // e.g. "CICLO-01", "TACFI-01"
  cat: CategoriaCiclo;
  nombre: string;
  modulo: string;
  duracionDiasCurso: number; // 15 for teachers, 30 for TACFI students
  cursos: string[];
}

export interface SlotAsignacion {
  id: string; // unique slot id e.g. "TACFI-01-1"
  cicloId: string;
  cicloNombre: string;
  cat: CategoriaCiclo;
  duracionCurso: number;
  cursos: string[];
  lugar: string;
  modalidad: Modalidad;
}

export interface CursoProgramado {
  slotId: string;
  cat: CategoriaCiclo;
  cicloId: string;
  cicloNombre: string;
  lugar: string;
  modalidad: Modalidad;
  cicloNumero: number;
  cursoIndex: number;
  cursoNombre: string;
  inicio: Date;
  fin: Date;
  planificacion: Date;
  informeFinal: Date;
  sesion2: Date;
  sesion3: Date;
  esManual?: boolean;
}

export interface ProgramacionResultado {
  asignaciones: CursoProgramado[];
  slots: SlotAsignacion[];
  facilitador: string;
  tecnico: string;
  fechaInicioContrato: Date;
  limiteContrato: Date;
  daysUsed: number;
  modo: 'automatico' | 'manual';
  hashSeguridad?: string;
  idTransaccion?: string;
}

export interface ManualCourseInput {
  slotId: string;
  cursoIndex: number;
  inicioStr: string; // YYYY-MM-DD
}

export interface FeriadoInfo {
  fecha: string; // YYYY-MM-DD
  descripcion: string;
  esFijo: boolean;
}
