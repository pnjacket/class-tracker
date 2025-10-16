import { Component } from '@angular/core';
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
export class DateConfigComponent {
  constructor(public store: ClassStoreService, public editMode: EditModeService) {}

  get activeClass() { return this.store.activeClass; }
  get activeView() { return this.store.activeView; }

  addView(): void {
    const dateInput = window.prompt('Enter view date (YYYY-MM-DD):', new Date().toISOString().slice(0,10));
    if (!dateInput) return;
    this.store.addView(dateInput);
  }

  removeView(date?: string): void { if (date) this.store.removeView(date); }

  onViewChange(date: string): void { this.store.onViewChange(date); }
}
