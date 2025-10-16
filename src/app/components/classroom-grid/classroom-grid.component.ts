import { Component, AfterViewInit, QueryList, ViewChildren, ElementRef } from '@angular/core';
import { EditModeService } from '../../services/drag-toggle.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassStoreService } from '../../services/class-store.service';

@Component({
  selector: 'app-classroom-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './classroom-grid.component.html',
  styleUrls: ['./classroom-grid.component.scss']
})
export class ClassroomGridComponent implements AfterViewInit {
  constructor(public store: ClassStoreService, public editMode: EditModeService, private host: ElementRef) {}

  @ViewChildren('cellDiv') cells!: QueryList<ElementRef<HTMLElement>>;

  ngAfterViewInit(): void {
    const updateHeight = () => {
      let max = 0;
      this.cells.forEach(c => {
        const h = c.nativeElement.offsetHeight;
        if (h > max) max = h;
      });
      // Apply CSS variable on the host element (:host)
      this.host.nativeElement.style.setProperty('--cell-height', `${max}px`);
    };

    updateHeight();
    this.cells.changes.subscribe(() => setTimeout(updateHeight, 0));
  }

  // getters for template access
  get activeClass() { return this.store.activeClass; }
  get activeView() { return this.store.activeView; }

  getCriterion(name: string) { return this.store.getCriterion(name); }

  /** Add a student to an empty cell only when edit mode is enabled */
  onCellClick(cell: any): void {
    // If the cell already contains a student, we don't interfere here.
    if (cell.student) return;

    // Guard: only allow adding students while edit mode is active
    if (!this.editMode.isEnabled) return;

    const name = window.prompt('Student name:');
    if (name) this.store.addStudent(cell, name);
  }

  confirmDeleteStudent(cell: any): void {
    if (!cell.student) return;
    const name = cell.student.name || 'this student';
    if (confirm(`Delete ${name}?`)) {
      this.store.deleteStudent(cell);
    }
  }

  incrementKey(cell: any, key: string): void { this.store.incrementKey(cell, key); }
  decrementKey(cell: any, key: string): void { this.store.decrementKey(cell, key); }

  onDragStart(event: DragEvent, cell: any): void {
    if (cell.student) {
      this.store.startDrag(cell);
      event.dataTransfer?.setData('text/plain', cell.student.id);
    }
  }

  onDrop(targetCell: any): void { this.store.drop(targetCell); }

  setPredefined(cell: any, key: string, value: string): void { this.store.setPredefined(cell, key, value); }

  getStudentCounterKeys(student?: any): string[] {
    return student ? Object.keys(student.counters) : [];
  }

  /** Returns true if the given student has non‑empty notes */
  hasNotes(student: any): boolean {
    // Treat undefined, null, empty string as no notes
    return !!student && typeof student.notes === 'string' && student.notes.trim().length > 0;
  }

  /** ---------- Notes handling (double‑click) ---------- */
  editingNotesCell?: any; // The cell currently being edited
  notesEditValue: string = '';

  /** Open the notes dialog for a student cell – only in edit mode */
  openNotesDialog(cell: any): void {
    if (!cell.student) return;
    this.editingNotesCell = cell;
    this.notesEditValue = cell.student.notes ?? '';
  }

  /** Close the notes dialog without saving */
  cancelNotes(): void {
    this.editingNotesCell = undefined;
    this.notesEditValue = '';
  }

  /** Save notes and close the dialog */
  saveNotes(): void {
    if (this.editingNotesCell && this.editingNotesCell.student) {
      this.store.setStudentNotes(this.editingNotesCell, this.notesEditValue);
    }
    this.cancelNotes();
  }
}
