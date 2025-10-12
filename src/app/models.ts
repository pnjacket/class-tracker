/** A single student inside a cell */
export interface Student {
  id: string; // uuid
  name: string;
  counters: { [key: string]: number }; // e.g. { A:0, B:0, C:0 }
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
export interface ClassRoom {
  classId: string; // uuid – unique per class
  title: string;   // e.g. “Math‑101”
  rows: number;
  cols: number;
  criteria: string[]; // list of criterion names for this class
  // grid: Cell[][]; // deprecated – use views instead
  // kept optional for backward compatibility
  grid?: Cell[][];
  views: ClassView[]; // one view per date
}
