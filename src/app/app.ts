import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CriteriaEditorComponent } from './criteria-editor/criteria-editor.component';
import { ClassStoreService } from './services/class-store.service';
import { ClassRoom, Cell, Student, ClassView, Criterion } from './models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, CriteriaEditorComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  // UI‑only state
  showCriteriaEditor = false;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(private store: ClassStoreService) {}

  ngOnInit(): void {
    this.store.initialize();
  }

  // ----- Getters to expose service state to template -----
  get classes(): ClassRoom[] { return this.store.classes; }
  get activeClassId(): string | null { return this.store.activeClassId; }
  get activeClass(): ClassRoom { return this.store.activeClass; }
  get activeView(): ClassView | undefined { return this.store.activeView; }

  // ----- UI interactions delegating to service -----
  openCreateClassDialog(): void {
    const title = window.prompt('Enter class name:', `Class ${this.classes.length + 1}`);
    if (!title) return;
    const rows = Math.max(1, Number(window.prompt('Rows (default 5):', '5')));
    const cols = Math.max(1, Number(window.prompt('Cols (default 5):', '5')));
    const newClass = this.store.createClass(title, rows, cols);
    // Activate the newly created class and add a view for today
    this.store.setActiveClassById(newClass.classId);
    const today = new Date().toISOString().slice(0, 10) || '2020-01-01';
    this.store.addView(today);
  }

  renameActiveClass(): void {
    const newName = window.prompt('New class name:', this.activeClass.title);
    if (newName) { this.activeClass.title = newName; this.store.persist(); }
  }

  deleteActiveClass(): void {
    if (!confirm(`Delete class "${this.activeClass.title}"?`)) return;
    this.store.deleteActiveClass();
  }

  openCriteriaEditor(): void { this.showCriteriaEditor = true; }

  onCriteriaSaved(updated: Criterion[]): void {
    this.store.updateCriteria(updated);
    this.showCriteriaEditor = false;
  }

  onCriteriaCancel(): void { this.showCriteriaEditor = false; }

  addView(): void {
    const dateInput = window.prompt('Enter view date (YYYY-MM-DD):', new Date().toISOString().slice(0,10));
    if (!dateInput) return;
    this.store.addView(dateInput);
  }

  onClassChange(): void {
    if (this.activeClassId) this.store.setActiveClassById(this.activeClassId);
  }

  removeView(date?: string): void { if (date) this.store.removeView(date); }

  onViewChange(date: string): void { this.store.onViewChange(date); }

  rebuildAllViews(): void { this.store.rebuildAllViews(); }

  // ----- Grid helpers remain for template usage (delegated) -----
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

  getCriterion(name: string): Criterion | undefined { return this.store.getCriterion(name); }

  exportCsv(): void {
    const blob = this.store.exportCsvBlob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.activeClass.title || 'class'}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  onCellClick(cell: Cell): void {
    if (!cell.student) {
      const name = window.prompt('Student name:');
      if (name) this.store.addStudent(cell, name);
    }
  }

  deleteStudent(cell: Cell): void { this.store.deleteStudent(cell); }

  incrementKey(cell: Cell, key: string): void { this.store.incrementKey(cell, key); }

  decrementKey(cell: Cell, key: string): void { this.store.decrementKey(cell, key); }

  onDragStart(event: DragEvent, cell: Cell): void {
    if (cell.student) { this.store.startDrag(cell); event.dataTransfer?.setData('text/plain', cell.student.id); }
  }

  onDrop(targetCell: Cell): void { this.store.drop(targetCell); }

  setPredefined(cell: Cell, key: string, value: string): void { this.store.setPredefined(cell, key, value); }

  exportClass(): void {
    const blob = this.store.exportClassBlob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.activeClass.title || 'class'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  triggerImport(): void { this.fileInput.nativeElement.value = ''; this.fileInput.nativeElement.click(); }

  importClasses(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try { this.store.importData(reader.result as string); }
      catch (e) { console.error(e); window.alert('Invalid file'); }
    };
    reader.readAsText(file);
  }

  getStudentCounterKeys(student?: Student): string[] { return student ? Object.keys(student.counters) : []; }
}
