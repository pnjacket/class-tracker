import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Student } from '../models';

@Component({
  selector: 'app-counter-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay" (click)="close.emit()">
      <div class="dialog"
           [ngStyle]="{'top.px': position?.y, 'left.px': position?.x}"
           (click)="$event.stopPropagation()">
        <h2>{{ student.name }}</h2>
        <div class="counter-row" *ngFor="let key of counterKeys">
          <span class="label">{{ key }}:</span>
          <button (click)="decrement(key)">-</button>
          <input type="number" [(ngModel)]="student.counters[key]" />
          <button (click)="increment(key)">+</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.5);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .dialog {background:#fff; padding:1rem; border-radius:.5rem; min-width:200px; position: fixed;}
    .counter-row {display:flex; align-items:center; gap:.5rem; margin:0.5rem 0;}
    .label{width:1.5rem;}
    input{width:3rem; text-align:center;}
    button{padding:0.2rem .5rem;}
  `]
})
export class CounterDialogComponent {
  @Input() student!: Student;
  @Input() position?: { x: number; y: number };
  @Output() close = new EventEmitter<void>();

  get counterKeys(): string[] {
    return Object.keys(this.student.counters);
  }

  increment(key: string): void {
    const current = this.student.counters[key];
    if (typeof current === 'number') {
      this.student.counters[key] = current + 1;
    }
    this.close.emit();
  }
  decrement(key: string): void {
    const current = this.student.counters[key];
    if (typeof current === 'number' && current > 0) {
      this.student.counters[key] = current - 1;
    }
    this.close.emit();
  }
}
