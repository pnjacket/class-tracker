import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassStoreService } from '../../services/class-store.service';

@Component({
  selector: 'app-grid-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grid-config.component.html',
  styleUrls: ['./grid-config.component.scss']
})
export class GridConfigComponent {
  constructor(public store: ClassStoreService) {}

  get activeClass() { return this.store.activeClass; }

  // called from (change) events in template
  rebuildAllViews(): void {
    this.store.rebuildAllViews();
  }
}
