// src/app/models.ts

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

/** The whole classroom (a "Class") */
export interface ClassRoom {
  classId: string; // uuid – unique per class
  title: string;   // e.g. “Math‑101”
  rows: number;
  cols: number;
  grid: Cell[][]; // 2‑D array of cells
  criteria: string[]; // list of criterion names for this class
}
