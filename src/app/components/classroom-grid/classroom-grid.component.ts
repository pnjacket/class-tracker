import { Component, AfterViewInit, QueryList, ViewChildren, ElementRef } from '@angular/core';
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
  constructor(public store: ClassStoreService, private host: ElementRef) {}

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

  onCellClick(cell: any): void {
    if (!cell.student) {
      const name = window.prompt('Student name:');
      if (name) this.store.addStudent(cell, name);
    }
  }

  deleteStudent(cell: any): void { this.store.deleteStudent(cell); }

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
}
