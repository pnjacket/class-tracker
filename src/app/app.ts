import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from './services/storage.service';
import { ClassRoom, Cell, Student, ClassView, Criterion, migrateCriteria } from './models';
import { CriteriaEditorComponent } from './criteria-editor/criteria-editor.component';
import { uuid } from './utils';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, CriteriaEditorComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  // UI state
  classes: ClassRoom[] = [];
  activeClassId: string | null = null;
  activeClass!: ClassRoom; // currently selected class reference
  activeView?: ClassView; // view for selected date

  showCriteriaEditor = false;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private draggedFromCell?: Cell; // source cell during drag‑and‑drop
  private ensureClassData(cls: ClassRoom): void {
    if (!cls.views) cls.views = [];
    if (!cls.criteria) cls.criteria = [];
  }

  constructor(private storage: StorageService) {}

  ngOnInit(): void {
    this.classes = this.storage.loadAll();
    // Ensure legacy data has required arrays
    this.classes.forEach(c => {
      if (!c.views) c.views = [];
      if (!c.criteria) c.criteria = [];
      // Migrate legacy string[] criteria to new model
      if (Array.isArray((c as any).criteria) && typeof (c as any).criteria[0] === 'string') {
        c.criteria = migrateCriteria((c as any).criteria);
      }
    });
    if (this.classes.length === 0) {
      const defaultClass = this.createClass('Default Class', 5, 5);
      // create initial view for today (or fallback to 2020-01-01)
      const today = new Date().toISOString().slice(0, 10) || '2020-01-01';
      this.addViewForClass(defaultClass, today);
    }
    this.activeClassId = this.classes[0].classId;
    this.setActiveClass(this.activeClassId);
    // set first view as active if exists
    if (this.activeClass && this.activeClass.views.length) {
      this.activeView = this.activeClass.views[0];
    }
  }

  /** ---------- CLASS HELPERS ---------- */
  private createClass(title: string, rows: number, cols: number): ClassRoom {
    const newClass: ClassRoom = {
      classId: uuid(),
      title,
      rows,
      cols,
      criteria: [],
      views: []
    };
    this.classes.push(newClass);
    this.storage.saveAll(this.classes);
    return newClass;
  }

  private setActiveClass(id: string): void {
    const found = this.classes.find(c => c.classId === id);
    if (found) {
      // Ensure legacy data structures are present
      if (!found.views) found.views = [];
      if (!found.criteria) found.criteria = [];
      this.activeClass = found;
      this.activeClassId = id;
      // default to first view if any
      this.activeView = this.activeClass.views[0];
    }
  }

  onClassChange(): void {
    if (this.activeClassId) this.setActiveClass(this.activeClassId);
  }

  openCreateClassDialog(): void {
    const title = window.prompt('Enter class name:', `Class ${this.classes.length + 1}`);
    if (!title) return;
    const rows = Math.max(1, Number(window.prompt('Rows (default 5):', '5')));
    const cols = Math.max(1, Number(window.prompt('Cols (default 5):', '5')));
    const newClass = this.createClass(title, rows, cols);
    // default date for a new class: today or fallback
    const today = new Date().toISOString().slice(0, 10) || '2020-01-01';
    this.addViewForClass(newClass, today);
    this.setActiveClass(newClass.classId);
  }

  renameActiveClass(): void {
    const newName = window.prompt('New class name:', this.activeClass.title);
    if (newName) { this.activeClass.title = newName; this.storage.saveAll(this.classes); }
  }

  deleteActiveClass(): void {
    if (!confirm(`Delete class "${this.activeClass.title}"?`)) return;
    this.classes = this.classes.filter(c => c.classId !== this.activeClass.classId);
    this.storage.saveAll(this.classes);
    if (this.classes.length) { this.setActiveClass(this.classes[0].classId); }
    else {
      const def = this.createClass('Default Class', 5, 5);
      this.addViewForClass(def, new Date().toISOString().slice(0,10));
    }
  }

  /** Open the criteria editor modal */
  openCriteriaEditor(): void {
    this.showCriteriaEditor = true;
  }

  /** Handle saved criteria from modal */
  onCriteriaSaved(updated: Criterion[]): void {
    const prev = this.activeClass.criteria || [];
    // Reset values if type changed
    updated.forEach(newC => {
      const oldC = prev.find(o => o.name === newC.name);
      if (oldC && oldC.type !== newC.type) {
        // Update all students' counters for this criterion
        this.activeClass.views.forEach(view => {
          view.grid.forEach(row => row.forEach(cell => {
            if (!cell.student) return;
            const stu = cell.student;
            if (newC.type === 'counter') {
              stu.counters[newC.name] = 0;
            } else {
              stu.counters[newC.name] = newC.options && newC.options.length ? newC.options[0] : '';
            }
          }));
        });
      }
    });

    // Ensure all students have counters for all criteria and remove extras
    const names = updated.map(c => c.name);
    this.activeClass.views.forEach(view => {
      view.grid.forEach(row => row.forEach(cell => {
        if (!cell.student) return;
        const counters = cell.student.counters;
        // Add missing criteria
        updated.forEach(c => {
          if (!(c.name in counters)) {
            counters[c.name] = c.type === 'counter' ? 0 : (c.options && c.options.length ? c.options[0] : '');
          }
        });
        // Remove old criteria not present
        Object.keys(counters).forEach(k => { if (!names.includes(k)) delete counters[k]; });
      }));
    });

    this.activeClass.criteria = updated;
    this.storage.saveAll(this.classes);
    this.showCriteriaEditor = false;
  }

  /** Cancel criteria editing */
  onCriteriaCancel(): void {
    this.showCriteriaEditor = false;
  }

  /** ---------- VIEW HELPERS ---------- */
  private addViewForClass(cls: ClassRoom, dateStr: string): void {
    const view: ClassView = { date: dateStr, grid: this.buildEmptyGrid(cls.rows, cls.cols) };
    cls.views.push(view);
    this.storage.saveAll(this.classes);
  }

  addView(): void {
    if (!this.activeClass) return;
    const dateInput = window.prompt('Enter view date (YYYY-MM-DD):', new Date().toISOString().slice(0,10));
    if (!dateInput) return;
    // if view exists, just activate it
    let existing = this.activeClass.views.find(v => v.date === dateInput);
    if (existing) { this.activeView = existing; return; }
    // copy from current view if any, else empty grid
    const sourceGrid = this.activeView ? this.cloneGrid(this.activeView.grid) : this.buildEmptyGrid(this.activeClass.rows, this.activeClass.cols);
    const newView: ClassView = { date: dateInput, grid: sourceGrid };
    this.activeClass.views.push(newView);
    this.storage.saveAll(this.classes);
    this.activeView = newView;
  }

  removeView(date?: string): void {
    if (!date) return;
    const idx = this.activeClass.views.findIndex(v => v.date === date);
    if (idx !== -1) {
      this.activeClass.views.splice(idx, 1);
      // reset active view to first available
      this.activeView = this.activeClass.views[0] || undefined;
      this.storage.saveAll(this.classes);
    }
  }

  onViewChange(date: string): void {
    const v = this.activeClass.views.find(v => v.date === date);
    if (v) this.activeView = v;
  }

  /** Rebuild all views when dimensions change */
  rebuildAllViews(): void {
    if (!this.activeClass) return;
    for (const view of this.activeClass.views) {
      const newGrid = this.buildEmptyGrid(this.activeClass.rows, this.activeClass.cols);
      // copy over existing students that still fit
      for (let r = 0; r < Math.min(newGrid.length, view.grid?.length ?? 0); r++) {
        for (let c = 0; c < Math.min(newGrid[0].length, view.grid[0]?.length ?? 0); c++) {
          const oldCell = view.grid[r][c];
          if (oldCell && oldCell.student) newGrid[r][c].student = { ...oldCell.student, counters: { ...oldCell.student.counters } };
        }
      }
      view.grid = newGrid;
    }
    this.storage.saveAll(this.classes);
  }

  /** ---------- GRID HELPERS ---------- */
  private buildEmptyGrid(rows: number, cols: number): Cell[][] {
    const grid: Cell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) { row.push({ row: r, col: c }); }
      grid.push(row);
    }
    return grid;
  }

  private cloneGrid(src: Cell[][]): Cell[][] {
    const rows = src.length;
    const cols = src[0]?.length || 0;
    const newGrid = this.buildEmptyGrid(rows, cols);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = src[r][c];
        if (cell.student) {
          newGrid[r][c].student = { ...cell.student, counters: { ...cell.student.counters } };
        }
      }
    }
    return newGrid;
  }

  /** Get criterion definition by name */
  getCriterion(name: string): Criterion | undefined {
    return this.activeClass?.criteria?.find(c => c.name === name);
  }

  /** Export the selected class as CSV (one row per student per view) */
  exportCsv(): void {
    if (!this.activeClass) return;
    const criteria = this.activeClass.criteria || [];
    // header: Student Name, each criterion name, Date
    const headers = ['Student Name', ...criteria.map(c => c.name), 'Date'];
    const rows: string[] = [headers.join(',')];
    for (const view of this.activeClass.views) {
      const date = view.date;
      for (const row of view.grid) {
        for (const cell of row) {
          if (cell.student) {
            const values: string[] = [];
            // name
            values.push(`"${cell.student.name.replace(/"/g, '""')}"`);
            // criteria counters in order
            for (const crit of criteria) {
              const val = cell.student.counters[crit.name] ?? '';
              values.push(`${val}`);
            }
            // date
            values.push(date);
            rows.push(values.join(','));
          }
        }
      }
    }
    const csvContent = rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const filename = `${this.activeClass.title || 'class'}_${new Date().toISOString().slice(0,10)}.csv`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /** ---------- USER INTERACTIONS ---------- */
  onCellClick(cell: Cell): void {
    if (!this.activeView) return;
    if (cell.student) return; // occupied
    const name = window.prompt('Student name:');
    if (!name) return;
    const counters: { [key: string]: any } = {};
    this.activeClass.criteria?.forEach(crit => {
      if (crit.type === 'counter') {
        counters[crit.name] = 0;
      } else {
        // predefined - default to first option or empty string
        counters[crit.name] = crit.options && crit.options.length ? crit.options[0] : '';
      }
    });
    cell.student = { id: uuid(), name, counters };
    // trigger change detection
    this.activeView.grid = [...this.activeView.grid];
    this.storage.saveAll(this.classes);
  }

  deleteStudent(cell: Cell): void {
    if (!cell.student) return;
    cell.student = undefined;
    this.storage.saveAll(this.classes);
    if (this.activeView) this.activeView.grid = [...this.activeView.grid];
  }

  incrementKey(cell: Cell, key: string): void {
    if (!cell.student) return;
    const current = cell.student.counters[key];
    if (typeof current === 'number') {
      cell.student.counters[key] = current + 1;
    }
    this.storage.saveAll(this.classes);
    if (this.activeView) this.activeView.grid = [...this.activeView.grid];
  }

  decrementKey(cell: Cell, key: string): void {
    if (!cell.student) return;
    const current = cell.student.counters[key];
    if (typeof current === 'number' && current > 0) {
      cell.student.counters[key] = current - 1;
    }
    this.storage.saveAll(this.classes);
    if (this.activeView) this.activeView.grid = [...this.activeView.grid];
  }

  /** ---------- DRAG & DROP ---------- */
  onDragStart(event: DragEvent, cell: Cell): void {
    if (!cell.student) return;
    this.draggedFromCell = cell;
    event.dataTransfer?.setData('text/plain', cell.student.id);
  }

  onDrop(targetCell: Cell): void {
    if (!this.draggedFromCell?.student) return;
    if (targetCell.student) return; // cannot overwrite existing student
    targetCell.student = this.draggedFromCell.student;
    this.draggedFromCell.student = undefined;
    this.storage.saveAll(this.classes);
    if (this.activeView) this.activeView.grid=[...this.activeView.grid];
    this.draggedFromCell = undefined;
  }


  setPredefined(cell: Cell, key: string, value: string): void {
    if (!cell.student) return;
    cell.student.counters[key] = value;
    this.storage.saveAll(this.classes);
    if (this.activeView) this.activeView.grid = [...this.activeView.grid];
  }

  /** ---------- IMPORT / EXPORT ---------- */
  exportClass(): void {
    const dataStr = JSON.stringify(this.activeClass, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.activeClass.title || 'class'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  triggerImport(): void {
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }

  importClasses(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported: ClassRoom = JSON.parse(reader.result as string);
        const existingIdx = this.classes.findIndex(c => c.title === imported.title);
        if (existingIdx !== -1) {
          const overwrite = window.confirm(`Class "${imported.title}" exists. Overwrite?`);
          if (!overwrite) return;
          this.classes[existingIdx] = imported;
        } else {
          this.classes.push(imported);
        }
        this.storage.saveAll(this.classes);
        this.setActiveClass(imported.classId);
      } catch (e) { console.error(e); window.alert('Invalid file'); }
    };
    reader.readAsText(file);
  }

  /** Helper for template to list a student's counter keys */
  getStudentCounterKeys(student?: Student): string[] {
    return student ? Object.keys(student.counters) : [];
  }
}
