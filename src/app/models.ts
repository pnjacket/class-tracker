/** A single student inside a cell */
export interface Student {
  id: string; // uuid
  name: string;
  // Counter values are numbers for 'counter' criteria and strings for 'predefined' criteria
  counters: { [key: string]: number | string }; // e.g. { A:0, B:'', C:'Option1' }
}


/** One cell of the grid */
export interface Cell {
  row: number;
  col: number;
  student?: Student; // undefined → empty seat
}

/** View for a specific date */
export interface ClassView {
  date: string; // ISO date string e.g., "2025-10-11"
  grid: Cell[][]; // seating arrangement for this date
}

/** The whole classroom (a "Class") */
export type CriterionType = 'counter' | 'predefined';

export interface Criterion {
  name: string;
  type: CriterionType;
  /** Only for predefined – comma‑separated allowed values */
  options?: string[]; // e.g. ['A', 'B', 'C']
}

/** Convert legacy string array into new Criterion objects */
export function migrateCriteria(old: any): Criterion[] {
  if (!old) return [];
  // Already in new shape?
  if (Array.isArray(old) && old.length && typeof old[0] === 'object') return old as Criterion[];
  // Legacy string[] → array of counters
  return (old as string[]).map(name => ({ name, type: 'counter' as const }));
}

export interface ClassRoom {
  classId: string; // uuid – unique per class
  title: string;   // e.g. “Math‑101”
  rows: number;
  cols: number;
  criteria: Criterion[]; // list of criterion objects for this class
  // grid: Cell[][]; // deprecated – use views instead
  // kept optional for backward compatibility
  grid?: Cell[][];
  views: ClassView[]; // one view per date
}
