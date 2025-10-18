import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassStoreService } from '../../services/class-store.service';
import { CriteriaEditorComponent } from '../../criteria-editor/criteria-editor.component';
import { EditModeService } from '../../services/drag-toggle.service';
import { Criterion } from '../../models';

@Component({
  selector: 'app-class-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, CriteriaEditorComponent],
  templateUrl: './class-panel.component.html',
  styleUrls: ['./class-panel.component.scss']
})
export class ClassPanelComponent {
  showCriteriaEditor = false;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  constructor(public store: ClassStoreService, public editMode: EditModeService) {}

  showDataMenu = false;

  toggleDataMenu(): void { this.showDataMenu = !this.showDataMenu; }

  closeDataMenu(): void { this.showDataMenu = false; }
  // ----- Getters -----
  get classes() { return this.store.classes; }
  get activeClassId() { return this.store.activeClassId; }

  set activeClassId(value: string | null) {
    if (value !== null && value !== undefined) {
      this.store.setActiveClassById(value);
    } else {
      // clear selection – optional, you may set to empty string or handle as needed
      this.store.setActiveClassById('');
    }
  }
  get activeClass() { return this.store.activeClass; }
  get activeView() { return this.store.activeView; }

  /** Criteria for the current view, falling back to class‑level */
  get displayedCriteria(): Criterion[] { return this.activeView?.criteria ?? (this.activeClass?.criteria || []); }

  // ----- UI Actions -----
  onClassChange(): void {
    if (this.activeClassId) this.store.setActiveClassById(this.activeClassId);
  }

  openCreateClassDialog(): void {
    const title = window.prompt('Enter class name:', `Class ${this.classes.length + 1}`);
    if (!title) return;
    const rows = Math.max(1, Number(window.prompt('Rows (default 5):', '5')));
    const cols = Math.max(1, Number(window.prompt('Cols (default 5):', '5')));
    const newClass = this.store.createClass(title, rows, cols);
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

  onCriteriaSaved(updated: any): void {
    if (this.activeView) {
      // Update criteria for the specific date/view
      this.store.updateViewCriteria(this.activeView.date, updated);
    } else {
      // Update class‑level criteria
      this.store.updateClassCriteria(updated);
    }
    this.showCriteriaEditor = false;
  }

  onCriteriaCancel(): void { this.showCriteriaEditor = false; }

  exportCsv(): void {
    const blob = this.store.exportCsvBlob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.activeClass.title || 'class'}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

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
}
