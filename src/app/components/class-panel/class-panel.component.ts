import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
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
export class ClassPanelComponent implements OnInit {
  numericCriteria: Criterion[] = [];

  selectedCriterion: string | null = null;

  ngOnInit(): void {
    // Register all Chart.js components
    Chart.register(...registerables);
  }

  openChart(): void {
    // Populate numeric criteria for the current class and open selection UI
    this.numericCriteria = this.store.getAllCriteria().filter(c => c.type === 'counter');
    if (!this.numericCriteria.length) {
      window.alert('No numeric criteria available for chart.');
      return;
    }
    // Reset any previous selection and show the modal dialog
    this.selectedCriterion = null;
    this.showChart = true; // opens modal; UI will first ask for a criterion
  }

  closeChart(): void { 
    this.showChart = false; 
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    this.selectedCriterion = null;
  }


  /** Called when a criterion button is clicked */
  chooseCriterion(name: string): void {
    this.selectedCriterion = name;
    // Defer rendering until the canvas element exists in the view
    setTimeout(() => this.renderChart(), 0);
  }

  public renderChart(): void {
    if (!this.activeClass) return;
    const dates: string[] = [];
    // Use the selected numeric criterion for charting
    const allCriteria = this.store.getAllCriteria();
    const critName = this.selectedCriterion;
    if (!critName) {
      console.warn('No criterion selected for chart');
      return;
    }
    const counterCrit = allCriteria.find(c => c.name === critName && c.type === 'counter');
    if (!counterCrit) {
      console.warn(`Criterion "${critName}" is not a numeric counter`);
      return;
    }
    // Map studentId -> { name, cumulative: number[], total: number }
    const studentMap: Record<string, { name: string; cumulative: number[]; total: number }> = {};
    // Sort views by date
    const sortedViews = [...(this.activeClass.views || [])].sort((a, b) => a.date.localeCompare(b.date));
    for (const view of sortedViews) {
      dates.push(view.date);
      // Ensure all students appear in map
      for (const row of view.grid) {
        for (const cell of row) {
          if (!cell.student) continue;
          const stu = cell.student;
          if (!studentMap[stu.id]) {
            studentMap[stu.id] = { name: stu.name, cumulative: [], total: 0 };
          }
          const val = typeof stu.counters[counterCrit.name] === 'number' ? (stu.counters[counterCrit.name] as number) : 0;
          studentMap[stu.id].total = val;
        }
      }
      // After processing this date, push cumulative totals for each student
      for (const key of Object.keys(studentMap)) {
        studentMap[key].cumulative.push(studentMap[key].total);
      }
    }
    const datasets = Object.values(studentMap).map(stu => ({
      label: stu.name,
      data: stu.cumulative,
      fill: false,
      borderColor: this.randomColor(),
      tension: 0.1
    }));
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: { labels: dates, datasets },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private randomColor(): string {
    const r = Math.floor(Math.random() * 200) + 55;
    const g = Math.floor(Math.random() * 200) + 55;
    const b = Math.floor(Math.random() * 200) + 55;
    return `rgb(${r},${g},${b})`;
  }

  showChart = false;
  chartInstance: any = null;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
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
  /** Criteria for the current view – fall back to an empty array if none are defined. */
  get displayedCriteria(): Criterion[] { return this.activeView?.criteria ?? []; }

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

  /** Export collated student CSV (no date) */
  exportStudentCollatedCsv(): void {
    const blob = this.store.exportStudentCollatedCsvBlob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.activeClass.title || 'class'}_student_collated_${new Date().toISOString().slice(0,10)}.csv`;
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
