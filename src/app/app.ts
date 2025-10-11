import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CounterDialogComponent } from './counter-dialog/counter-dialog.component';
import { StorageService } from './services/storage.service';
import { ClassRoom, Cell, Student } from './models';
import { uuid } from './utils';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, CounterDialogComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  // UI state
  classes: ClassRoom[] = [];
  activeClassId: string | null = null;
  activeClass!: ClassRoom; // currently selected class reference
  showDialog = false;
  activeStudent?: Cell; // cell whose counters are being edited
  dialogPosition = { x: 0, y: 0 };

  constructor(private storage: StorageService) {}

  ngOnInit(): void {
    this.classes = this.storage.loadAll();
    if (this.classes.length === 0) {
      // create a default class to avoid empty UI
      this.createClass('Default Class', 5, 5);
    }
    this.activeClassId = this.classes[0].classId;
    this.setActiveClass(this.activeClassId);
  }

  /** ---------- CLASS HELPERS ---------- */
  private setActiveClass(id: string): void {
    const found = this.classes.find(c => c.classId === id);
    if (found) {
      this.activeClass = found;
      this.activeClassId = id;
    }
  }

  onClassChange(): void {
    if (this.activeClassId) this.setActiveClass(this.activeClassId);
  }

  private createClass(title: string, rows: number, cols: number): void {
    const newClass: ClassRoom = {
      classId: uuid(),
      title,
      rows,
      cols,
      grid: this.buildEmptyGrid(rows, cols),
      criteria: []
    };
    this.classes.push(newClass);
    this.storage.saveAll(this.classes);
    this.setActiveClass(newClass.classId);
  }

  openCreateClassDialog(): void {
    const title = window.prompt('Enter class name:', `Class ${this.classes.length + 1}`);
    if (!title) return;
    const rowsStr = window.prompt('Rows (default 5):', '5');
    const colsStr = window.prompt('Cols (default 5):', '5');
    const rows = Math.max(1, Number(rowsStr));
    const cols = Math.max(1, Number(colsStr));
    this.createClass(title, rows, cols);
  }

  renameActiveClass(): void {
    const newName = window.prompt('New class name:', this.activeClass.title);
    if (newName) {
      this.activeClass.title = newName;
      this.storage.saveAll(this.classes);
    }
  }

  deleteActiveClass(): void {
    if (!confirm(`Delete class "${this.activeClass.title}"?`)) return;
    this.classes = this.classes.filter(c => c.classId !== this.activeClass.classId);
    this.storage.saveAll(this.classes);
    if (this.classes.length) {
      this.setActiveClass(this.classes[0].classId);
    } else {
      this.createClass('Default Class', 5, 5);
    }
  }

  /** Edit criteria for the active class */
  editCriteria(): void {
    const current = (this.activeClass.criteria || []).join(', ');
    const input = window.prompt('Enter criteria names (comma‑separated):', current);
    if (input === null) return; // cancelled
    const list = input.split(',').map(s => s.trim()).filter(s => s.length > 0);
    this.activeClass.criteria = list;
    this.syncStudentCounters();
  }

  /** ---------- GRID HELPERS ---------- */
  private buildEmptyGrid(rows: number, cols: number): Cell[][] {
    const grid: Cell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({ row: r, col: c });
      }
      grid.push(row);
    }
    return grid;
  }

  /** Ensure each student has counters matching the class criteria */
  private syncStudentCounters(): void {
    const criteriaSet = new Set(this.activeClass.criteria || []);
    this.activeClass.grid.forEach(row => {
      row.forEach(cell => {
        if (cell.student) {
          // add missing criteria with 0
          criteriaSet.forEach(key => {
            if (!(key in cell.student!.counters)) {
              cell.student!.counters[key] = 0;
            }
          });
          // remove counters not present in criteria
          Object.keys(cell.student.counters).forEach(k => {
            if (!criteriaSet.has(k)) {
              delete cell.student!.counters[k];
            }
          });
        }
      });
    });
    this.storage.saveAll(this.classes);
  }

  rebuildGrid(): void {
    const newGrid = this.buildEmptyGrid(this.activeClass.rows, this.activeClass.cols);
    // copy over students that still fit
    for (let r = 0; r < Math.min(newGrid.length, this.activeClass.grid?.length ?? 0); r++) {
      for (let c = 0; c < Math.min(newGrid[0].length, this.activeClass.grid[0]?.length ?? 0); c++) {
        const oldCell = this.activeClass.grid[r][c];
        if (oldCell.student) newGrid[r][c].student = oldCell.student;
      }
    }
    this.activeClass.grid = newGrid;
    this.storage.saveAll(this.classes);
  }

  /** ---------- USER INTERACTIONS ---------- */
  onCellClick(cell: Cell): void {
    if (cell.student) return; // already occupied
    const name = window.prompt('Student name:');
    if (!name) return;
    const counters: { [key: string]: number } = {};
    this.activeClass.criteria?.forEach(k => (counters[k] = 0));
    cell.student = { id: uuid(), name, counters };
    // reassign grid to trigger change detection
    this.activeClass.grid = [...this.activeClass.grid];
    this.storage.saveAll(this.classes);
  }

  deleteStudent(cell: Cell): void {
    if (cell.student) {
      cell.student = undefined;
      this.storage.saveAll(this.classes);
    }
  }

  openCountersDialog(cell: Cell, ev?: MouseEvent): void {
    if (!cell.student) return;
    this.activeStudent = cell;
    // store mouse coordinates (offset a bit)
    if (ev) {
      this.dialogPosition = { x: ev.clientX + 5, y: ev.clientY + 5 };
    }
    this.showDialog = true;
  }

  closeCounterDialog(): void {
    this.showDialog = false;
    this.activeStudent = undefined;
    this.storage.saveAll(this.classes);
  }

  /** Helper for template to list a student's counter keys */
  getStudentCounterKeys(student?: Student): string[] {
    return student ? Object.keys(student.counters) : [];
  }
}
