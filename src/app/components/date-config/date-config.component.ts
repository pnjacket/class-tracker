import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassStoreService } from '../../services/class-store.service';
import { EditModeService } from '../../services/drag-toggle.service';

@Component({
  selector: 'app-date-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './date-config.component.html',
  styleUrls: ['./date-config.component.scss']
})
export class DateConfigComponent implements OnInit {
  constructor(public store: ClassStoreService, public editMode: EditModeService) {}

  get activeClass() { return this.store.activeClass; }
  get activeView() { return this.store.activeView; }

  get sortedViews() {
    if (!this.activeClass) return [];
    // Clone and sort descending by date (ISO strings)
    return [...this.activeClass.views].sort((a, b) => b.date.localeCompare(a.date));
  }
  ngOnInit(): void {
    if (this.activeClass && this.sortedViews.length) {
      const latest = this.sortedViews[0];
      if (!this.activeView || this.activeView.date !== latest.date) {
        this.store.onViewChange(latest.date);
      }
    }
  }

  /** Helper to get index of current active view in sorted list */
  private get _viewIndex(): number {
    if (!this.activeView) return -1;
    const idx = this.sortedViews.findIndex(v => v.date === this.activeView?.date);
    return idx;
  }

  hasPrevDate(): boolean { return this._viewIndex > 0; }
  hasNextDate(): boolean { return this._viewIndex >= 0 && this._viewIndex < this.sortedViews.length - 1; }

  prevDate(): void {
    if (this.hasPrevDate()) {
      const prev = this.sortedViews[this._viewIndex - 1];
      this.store.onViewChange(prev.date);
    }
  }

  nextDate(): void {
    if (this.hasNextDate()) {
      const nxt = this.sortedViews[this._viewIndex + 1];
      this.store.onViewChange(nxt.date);
    }
  }



  addView(): void {
    const dateInput = window.prompt('Enter view date (YYYY-MM-DD):', new Date().toISOString().slice(0,10));
    if (!dateInput) return;
    this.store.addView(dateInput);
  }

  removeView(date?: string): void {
    if (!date) return;
    const confirmed = window.confirm(`Are you sure you want to delete the view for ${date}? This cannot be undone.`);
    if (confirmed) {
      this.store.removeView(date);
    }
  }

  onViewChange(date: string): void { this.store.onViewChange(date); }
}
