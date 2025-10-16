import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassStoreService } from './services/class-store.service';
import { ClassPanelComponent } from './components/class-panel/class-panel.component';
import { DateConfigComponent } from './components/date-config/date-config.component';
import { GridConfigComponent } from './components/grid-config/grid-config.component';
import { ClassroomGridComponent } from './components/classroom-grid/classroom-grid.component';
import { EditModeService } from './services/drag-toggle.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ClassPanelComponent, DateConfigComponent, GridConfigComponent, ClassroomGridComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  constructor(private store: ClassStoreService, public editMode: EditModeService) {}

  ngOnInit(): void {
    this.store.initialize();
  }
}
