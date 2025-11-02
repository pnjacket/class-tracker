// Service to hold all business logic for classroom app
import { Injectable } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { ClassRoom, Cell, Student, ClassView, Criterion } from '../models';
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
    // Load raw data and handle versioning
    const raw = this.storage.getRaw();
    if (raw && typeof raw === 'object' && 'version' in raw && raw.version !== StorageService.APP_VERSION) {
      // Backup old data under a timestamped key
      const backupKey = `backup-${new Date().toISOString()}`;
      localStorage.setItem(backupKey, JSON.stringify(raw));
      // Re‑wrap data with current version (preserve classes)
      this.storage.saveAll(this.storage.loadAll());
    }
    this.classes = this.storage.loadAll();
    // Ensure required arrays and migrate legacy criteria
    this.classes.forEach(c => {
      if (!c.views) c.views = [];
    });
    // Create a default class when none exist
    if (this.classes.length === 0) {
      const def = this.createClass('Default Class', 5, 5);
      const today = new Date().toISOString().slice(0, 10) || '2020-01-01';
      this.addViewForClass(def, today);
    }
    // Set active class & view – pick most recent view
    this.activeClassId = this.classes[0].classId;
    this.setActiveClassById(this.activeClassId);
    if (this.activeClass?.views?.length) {
      const latest = this.activeClass.views.reduce((a, b) => (a.date > b.date ? a : b));
      this.activeView = latest;
    } else {
      this.activeView = undefined;
    }
  }

  // ----- Private helpers -----
  /** Ensure a class has the required array structures. */
  private ensureClassData(cls: ClassRoom): void {
    if (!cls.views) cls.views = [];
    // No class‑level criteria any more.
  }

  /** Create a new class and persist it */
  createClass(title: string, rows: number, cols: number): ClassRoom {
    // New classes start with no criteria – they will be added per view.
    const newClass: ClassRoom = { classId: uuid(), title, rows, cols, views: [] };
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
      // Choose the most recent view (by ISO date string) as active
      if (this.activeClass.views?.length) {
        const latest = this.activeClass.views.reduce((a, b) => (a.date > b.date ? a : b));
        this.activeView = latest;
      } else {
        this.activeView = undefined;
      }
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
        if (cell.student) {
          // reset notes
          if (cell.student.notes) cell.student.notes = '';
          // reset counters according to criteria (default to 0 for numeric counters)
          if (this.activeView?.criteria) {
            const critList = this.activeView.criteria;
            Object.keys(cell.student.counters).forEach(key => {
              const critDef = critList.find(c => c.name === key);
              if (critDef && critDef.type === 'counter') {
                cell.student!.counters[key] = 0;
              } else {
                cell.student!.counters[key] = '';
              }
            });
          }
        }
      }
    }

    // Copy criteria from the active view (if any). Use a deep copy to avoid reference sharing.
    const copiedCriteria: Criterion[] = this.activeView?.criteria ? JSON.parse(JSON.stringify(this.activeView.criteria)) : [];

    const newView: ClassView = { date, grid: sourceGrid, criteria: copiedCriteria };
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
          // Use view‑specific criteria (class‑level no longer exists)
          const criteria = this.getEffectiveCriteria(undefined);
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
  /** Retrieve a criterion definition from the active view (if any). */
  getCriterion(name: string): Criterion | undefined {
    return this.activeView?.criteria?.find(c => c.name === name);
  }

  // ----- Student actions -----
  addStudent(cell: Cell, name: string): void {
    if (!this.activeClass) return;
    const effectiveCriteria = this.getEffectiveCriteria(this.activeView);
    const counters: { [key: string]: any } = {};
    effectiveCriteria.forEach(crit => {
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
    if (typeof cur === 'number') cell.student.counters[key] = cur - 1;
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

  // ----- Helper for criteria -----
  /** Return the effective list of criteria for a view (view‑specific overrides class) */
  /** Return the effective list of criteria for a view (view‑specific only). */
  private getEffectiveCriteria(view?: ClassView): Criterion[] {
    return view?.criteria ?? [];
  }

  // ----- Criteria handling -----
  /** Update class‑level criteria (applies to all views that don’t override) */
  /** Class‑level criteria are no longer used. This method forwards to the active view
   * (if one exists) for backward compatibility. */
  updateClassCriteria(updated: Criterion[]): void {
    if (!this.activeView) return;
    this.updateViewCriteria(this.activeView.date, updated);
  }

  /** Update criteria for a specific view/date (overrides class defaults) */
  updateViewCriteria(date: string, updated: Criterion[]): void {
    if (!this.activeClass) return;
    const view = this.activeClass.views.find(v => v.date === date);
    if (!view) return;
    const prev = view.criteria || [];
    // Reset values if type changed
    updated.forEach(newC => {
      const oldC = prev.find(o => o.name === newC.name);
      if (oldC && oldC.type !== newC.type) {
        view.grid.forEach(row => row.forEach(cell => {
          if (!cell.student) return;
          const stu = cell.student;
          if (newC.type === 'counter') stu.counters[newC.name] = 0;
          else stu.counters[newC.name] = '';
        }));
      }
    });

    const names = updated.map(c => c.name);
    view.grid.forEach(row => row.forEach(cell => {
      if (!cell.student) return;
      const counters = cell.student.counters;
      // add missing
      updated.forEach(c => {
        if (!(c.name in counters))
          counters[c.name] = c.type === 'counter' ? 0 : (c.options && c.options.length ? c.options[0] : '');
      });
      // remove extra
      Object.keys(counters).forEach(k => { if (!names.includes(k)) delete counters[k]; });
    }));
    view.criteria = updated;
    this.persist();
  }

  /** Reset the entire database to a clean state (keeps any backup entries) */
  resetDatabase(): void {
    if (!window.confirm('Reset all application data? This will clear current data but keep any backups.')) return;
    // Clear main storage key
    this.storage.setRaw({ version: StorageService.APP_VERSION, classes: [] });
    // Re‑initialize with default class and view
    this.classes = [];
    const def = this.createClass('Default Class', 5, 5);
    const today = new Date().toISOString().slice(0, 10) || '2020-01-01';
    this.addViewForClass(def, today);
    this.activeClassId = def.classId;
    this.setActiveClassById(this.activeClassId);
    this.activeView = this.activeClass.views[0];
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
    // Aggregate criteria from all views for CSV export
    const criteria: Criterion[] = this.getAllCriteria();
    const headers = ['Student Name', ...criteria.map((c: Criterion) => c.name), 'Date'];
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

  /** Export CSV collated by student (no date). Counter values are summed, predefined values concatenated with '|'. */
  exportStudentCollatedCsvBlob(): Blob {
    if (!this.activeClass) return new Blob([''], { type: 'text/csv;charset=utf-8;' });
    // Aggregate criteria from all views for collated CSV
    const criteria: Criterion[] = this.getAllCriteria();
    const headers = ['Student Name', ...criteria.map((c: Criterion) => c.name)];
    const rows: string[] = [headers.join(',')];

    // Aggregate per student ID across all views
    const agg: { [id: string]: { name: string; counters: { [key: string]: any } } } = {};
    this.activeClass.views.forEach(view => {
      view.grid.forEach(row => {
        row.forEach(cell => {
          if (!cell.student) return;
          const stu = cell.student;
          // initialise entry if missing
          if (!agg[stu.id]) {
            const initCounters: { [key: string]: any } = {};
            criteria.forEach(c => {
              initCounters[c.name] = c.type === 'counter' ? 0 : '';
            });
            agg[stu.id] = { name: stu.name, counters: initCounters };
          }
          const target = agg[stu.id];
          // merge counters
          Object.entries(stu.counters).forEach(([key, value]) => {
            const crit = criteria.find(c => c.name === key);
            if (!crit) return; // unknown criterion
            if (crit.type === 'counter') {
              target.counters[key] = (target.counters[key] || 0) + (typeof value === 'number' ? value : 0);
            } else { // predefined string
              const cur = target.counters[key] as string;
              const valStr = String(value);
              if (!cur) {
                target.counters[key] = valStr;
              } else if (valStr && !cur.split('|').includes(valStr)) {
                target.counters[key] = cur + '|' + valStr;
              }
            }
          });
        });
      });
    });

    // Build rows
    Object.values(agg).forEach(entry => {
      const vals: string[] = [];
      vals.push(`"${entry.name.replace(/"/g, '""')}"`);
      criteria.forEach(c => {
        let v = entry.counters[c.name];
        if (c.type === 'counter') {
          v = v ?? 0;
        } else {
          v = v ?? '';
        }
        if (typeof v === 'string') {
          vals.push(`"${v.replace(/"/g, '""')}"`);
        } else {
          vals.push(`${v}`);
        }
      });
      rows.push(vals.join(','));
    });

    const csv = rows.join('\r\n');
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  /** Import a class from raw JSON string */
  importData(jsonStr: string): void {
    try {
      const imported: ClassRoom = JSON.parse(jsonStr);
      // Legacy class‑level criteria are ignored – remove if present.
      if ((imported as any).criteria) delete (imported as any).criteria;
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

  /** Aggregate all unique criteria used across the active class's views. */
  public getAllCriteria(): Criterion[] {
    if (!this.activeClass) return [];
    const map = new Map<string, Criterion>();
    this.activeClass.views.forEach(v => {
      (v.criteria ?? []).forEach(c => {
        if (!map.has(c.name)) map.set(c.name, c);
      });
    });
    return Array.from(map.values());
  }
}
