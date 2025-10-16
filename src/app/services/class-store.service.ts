// Service to hold all business logic for classroom app
import { Injectable } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { ClassRoom, Cell, Student, ClassView, Criterion, migrateCriteria } from '../models';
import { uuid } from '../utils';

@Injectable({ providedIn: 'root' })
export class ClassStoreService {
  // ----- State -----
  public classes: ClassRoom[] = [];
  public activeClassId: string | null = null;
  public activeClass!: ClassRoom; // currently selected class reference
  public activeView?: ClassView; // view for selected date

  private draggedFromCell?: Cell; // source cell during drag‑and‑drop

  constructor(private storage: StorageService) {}

  /** Initialize store – load persisted data, ensure structures, set defaults */
  initialize(): void {
    this.classes = this.storage.loadAll();
    // Ensure required arrays and migrate legacy criteria
    this.classes.forEach(c => {
      if (!c.views) c.views = [];
      if (!c.criteria) c.criteria = [];
      // Migrate string[] criteria to new model (if needed)
      if (Array.isArray((c as any).criteria) && typeof (c as any).criteria[0] === 'string') {
        c.criteria = migrateCriteria((c as any).criteria);
      }
    });

    // Create a default class when none exist
    if (this.classes.length === 0) {
      const def = this.createClass('Default Class', 5, 5);
      const today = new Date().toISOString().slice(0, 10) || '2020-01-01';
      this.addViewForClass(def, today);
    }

    // Set active class & view
    this.activeClassId = this.classes[0].classId;
    this.setActiveClassById(this.activeClassId);
    if (this.activeClass && this.activeClass.views.length) {
      this.activeView = this.activeClass.views[0];
    }
  }

  // ----- Private helpers -----
  private ensureClassData(cls: ClassRoom): void {
    if (!cls.views) cls.views = [];
    if (!cls.criteria) cls.criteria = [];
  }

  /** Create a new class and persist it */
  createClass(title: string, rows: number, cols: number): ClassRoom {
    const newClass: ClassRoom = { classId: uuid(), title, rows, cols, criteria: [], views: [] };
    this.classes.push(newClass);
    this.persist();
    return newClass;
  }

  /** Set the currently active class by its id */
  setActiveClassById(id: string): void {
    const found = this.classes.find(c => c.classId === id);
    if (found) {
      this.ensureClassData(found);
      this.activeClass = found;
      this.activeClassId = id;
      // default view
      this.activeView = this.activeClass.views[0];
    }
  }

  /** Add a view for a class on a given date */
  private addViewForClass(cls: ClassRoom, dateStr: string): void {
    const view: ClassView = { date: dateStr, grid: this.buildEmptyGrid(cls.rows, cls.cols) };
    cls.views.push(view);
    this.persist();
  }

  /** Public method to add a new view for the active class */
  addView(date: string): void {
    if (!this.activeClass) return;
    const existing = this.activeClass.views.find(v => v.date === date);
    if (existing) {
      this.activeView = existing;
      return;
    }

    // Build the grid for the new view – copy existing layout but we will clear notes
    const sourceGrid = this.activeView ? this.cloneGrid(this.activeView.grid, false) : this.buildEmptyGrid(this.activeClass.rows, this.activeClass.cols);

    // Clear any existing notes in the newly created grid (so a fresh view starts with empty notes)
    for (let r = 0; r < sourceGrid.length; r++) {
      for (let c = 0; c < sourceGrid[r].length; c++) {
        const cell = sourceGrid[r][c];
        if (cell.student && cell.student.notes) {
          cell.student.notes = '';
        }
      }
    }

    const newView: ClassView = { date, grid: sourceGrid };
    this.activeClass.views.push(newView);
    this.persist();
    this.activeView = newView;
  }

  /** Remove a view by its date */
  removeView(date: string): void {
    if (!this.activeClass) return;
    const idx = this.activeClass.views.findIndex(v => v.date === date);
    if (idx !== -1) {
      this.activeClass.views.splice(idx, 1);
      this.activeView = this.activeClass.views[0] || undefined;
      this.persist();
    }
  }

  /** Switch active view */
  onViewChange(date: string): void {
    const v = this.activeClass?.views.find(v => v.date === date);
    if (v) this.activeView = v;
  }

  /** Re‑build all views when class dimensions change */
  rebuildAllViews(): void {
    if (!this.activeClass) return;
    for (const view of this.activeClass.views) {
      const newGrid = this.buildEmptyGrid(this.activeClass.rows, this.activeClass.cols);
      // copy over students that still fit
      for (let r = 0; r < Math.min(newGrid.length, view.grid?.length ?? 0); r++) {
        for (let c = 0; c < Math.min(newGrid[0].length, view.grid[0]?.length ?? 0); c++) {
          const oldCell = view.grid[r][c];
          if (oldCell && oldCell.student) {
            newGrid[r][c].student = { ...oldCell.student, counters: { ...oldCell.student.counters } };
          }
        }
      }
      view.grid = newGrid;
    }
    this.persist();
  }

  // ----- Grid helpers (private) -----
  private buildEmptyGrid(rows: number, cols: number): Cell[][] {
    const grid: Cell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) { row.push({ row: r, col: c }); }
      grid.push(row);
    }
    return grid;
  }

  private cloneGrid(src: Cell[][], copyCounters = true): Cell[][] {
    const rows = src.length;
    const cols = src[0]?.length || 0;
    const newGrid = this.buildEmptyGrid(rows, cols);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = src[r][c];
        if (cell.student) {
          if (copyCounters) {
          newGrid[r][c].student = { ...cell.student, counters: { ...cell.student.counters } };
        } else {
          // Preserve student info but reset each counter based on its type
          const criteria = this.activeClass?.criteria ?? [];
          const resetCounters: { [key: string]: any } = {};
          for (const key of Object.keys(cell.student.counters)) {
            const crit = criteria.find(c => c.name === key);
            if (crit && crit.type === 'counter') {
              resetCounters[key] = 0; // counters default to 0
            } else {
              resetCounters[key] = '';
            }
          }
          const { counters, ...rest } = cell.student;
          newGrid[r][c].student = { ...rest, counters: resetCounters };
        }
        }
      }
    }
    return newGrid;
  }

  /** Get a criterion definition by name */
  getCriterion(name: string): Criterion | undefined {
    return this.activeClass?.criteria?.find(c => c.name === name);
  }

  // ----- Student actions -----
  addStudent(cell: Cell, name: string): void {
    if (!this.activeClass) return;
    const counters: { [key: string]: any } = {};
    this.activeClass.criteria?.forEach(crit => {
      if (crit.type === 'counter') {
        counters[crit.name] = 0;
      } else {
        counters[crit.name] = crit.options && crit.options.length ? crit.options[0] : '';
      }
    });
    cell.student = { id: uuid(), name, counters };
    // trigger Angular change detection for the grid
    if (this.activeView) this.activeView.grid = [...this.activeView.grid];
    this.persist();
  }

  deleteStudent(cell: Cell): void {
    cell.student = undefined;
    if (this.activeView) this.activeView.grid = [...this.activeView.grid];
    this.persist();
  }

  incrementKey(cell: Cell, key: string): void {
    if (!cell.student) return;
    const cur = cell.student.counters[key];
    if (typeof cur === 'number') cell.student.counters[key] = cur + 1;
    if (this.activeView) this.activeView.grid = [...this.activeView.grid];
    this.persist();
  }

  decrementKey(cell: Cell, key: string): void {
    if (!cell.student) return;
    const cur = cell.student.counters[key];
    if (typeof cur === 'number' && cur > 0) cell.student.counters[key] = cur - 1;
    if (this.activeView) this.activeView.grid = [...this.activeView.grid];
    this.persist();
  }

  setPredefined(cell: Cell, key: string, value: string): void {
    if (!cell.student) return;
    cell.student.counters[key] = value;
    if (this.activeView) this.activeView.grid = [...this.activeView.grid];
    this.persist();
  }

  /** Set free‑form notes for a student in the given cell */
  setStudentNotes(cell: Cell, notes: string): void {
    if (!cell.student) return;
    cell.student.notes = notes;
    // Trigger change detection on the view grid
    if (this.activeView) this.activeView.grid = [...this.activeView.grid];
    this.persist();
  }

  // ----- Drag & Drop -----
  startDrag(cell: Cell): void {
    if (!cell.student) return;
    this.draggedFromCell = cell;
  }

  drop(targetCell: Cell): void {
    if (!this.draggedFromCell?.student) return;
    if (targetCell.student) return; // cannot overwrite
    targetCell.student = this.draggedFromCell.student;
    this.draggedFromCell.student = undefined;
    if (this.activeView) this.activeView.grid = [...this.activeView.grid];
    this.persist();
    this.draggedFromCell = undefined;
  }

  // ----- Criteria handling -----
  updateCriteria(updated: Criterion[]): void {
    if (!this.activeClass) return;
    const prev = this.activeClass.criteria || [];
    // Reset values if type changed for existing criteria
    updated.forEach(newC => {
      const oldC = prev.find(o => o.name === newC.name);
      if (oldC && oldC.type !== newC.type) {
        this.activeClass.views.forEach(view => {
          view.grid.forEach(row => row.forEach(cell => {
            if (!cell.student) return;
            const stu = cell.student;
            if (newC.type === 'counter') stu.counters[newC.name] = 0;
            else stu.counters[newC.name] = '';
          }));
        });
      }
    });

    const names = updated.map(c => c.name);
    this.activeClass.views.forEach(view => {
      view.grid.forEach(row => row.forEach(cell => {
        if (!cell.student) return;
        const counters = cell.student.counters;
        // add missing
        updated.forEach(c => { if (!(c.name in counters)) counters[c.name] = c.type === 'counter' ? 0 : (c.options && c.options.length ? c.options[0] : ''); });
        // remove extra
        Object.keys(counters).forEach(k => { if (!names.includes(k)) delete counters[k]; });
      }));
    });
    this.activeClass.criteria = updated;
    this.persist();
  }

  /** Delete the currently active class */
  deleteActiveClass(): void {
    if (!this.activeClass) return;
    const idx = this.classes.findIndex(c => c.classId === this.activeClass.classId);
    if (idx !== -1) this.classes.splice(idx, 1);
    if (this.classes.length) {
      this.setActiveClassById(this.classes[0].classId);
    } else {
      const def = this.createClass('Default Class', 5, 5);
      const today = new Date().toISOString().slice(0, 10) || '2020-01-01';
      this.addViewForClass(def, today);
      this.setActiveClassById(def.classId);
    }
    this.persist();
  }

  // ----- Export helpers -----
  exportCsvBlob(): Blob {
    if (!this.activeClass) return new Blob([''], { type: 'text/csv;charset=utf-8;' });
    const criteria = this.activeClass.criteria || [];
    const headers = ['Student Name', ...criteria.map(c => c.name), 'Date'];
    const rows: string[] = [headers.join(',')];
    for (const view of this.activeClass.views) {
      const date = view.date;
      for (const row of view.grid) {
        for (const cell of row) {
          if (!cell.student) continue;
          const vals: string[] = [];
          vals.push(`"${cell.student.name.replace(/"/g, '""')}"`);
          for (const crit of criteria) { vals.push(`${cell.student.counters[crit.name] ?? ''}`); }
          vals.push(date);
          const notes: string = cell.student.notes ?? "";
          vals.push(notes);
          rows.push(vals.join(','));
        }
      }
    }
    const csv = rows.join('\r\n');
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  exportClassBlob(): Blob {
    if (!this.activeClass) return new Blob(['{}'], { type: 'application/json' });
    const dataStr = JSON.stringify(this.activeClass, null, 2);
    return new Blob([dataStr], { type: 'application/json' });
  }

  /** Import a class from raw JSON string */
  importData(jsonStr: string): void {
    try {
      const imported: ClassRoom = JSON.parse(jsonStr);
      // migrate legacy criteria if needed
      if (Array.isArray((imported as any).criteria) && typeof (imported as any).criteria[0] === 'string') {
        imported.criteria = migrateCriteria((imported as any).criteria);
      }
      const existingIdx = this.classes.findIndex(c => c.title === imported.title);
      if (existingIdx !== -1) {
        // overwrite
        this.classes[existingIdx] = imported;
      } else {
        this.classes.push(imported);
      }
      this.persist();
      this.setActiveClassById(imported.classId);
    } catch (e) { console.error('Import error', e); }
  }

  // ----- Utility -----
  public persist(): void {
    this.storage.saveAll(this.classes);
  }
}
