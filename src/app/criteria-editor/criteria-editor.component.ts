import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Criterion } from '../models';

/** Simple modal component to create / edit / delete criteria */
@Component({
  selector: 'criteria-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './criteria-editor.component.html',
  styleUrls: ['./criteria-editor.component.scss']
})
export class CriteriaEditorComponent {
  @Input() criteria: Criterion[] = [];
  @Output() save = new EventEmitter<Criterion[]>();
  @Output() cancel = new EventEmitter<void>();

  // UI state for editing/adding a single criterion
  editingIndex: number | null = null; // null -> adding new
  name = '';
  type: 'counter' | 'predefined' = 'counter';
  optionsText = '';

  get isPredefined() { return this.type === 'predefined'; }

  startAdd(): void {
    this.editingIndex = null;
    this.name = '';
    this.type = 'counter';
    this.optionsText = '';
  }

  edit(i: number): void {
    const c = this.criteria[i];
    this.editingIndex = i;
    this.name = c.name;
    this.type = c.type;
    this.optionsText = (c.options || []).join(', ');
  }

  delete(i: number): void {
    if (confirm(`Delete criterion "${this.criteria[i].name}"?`)) {
      this.criteria.splice(i, 1);
    }
  }

  confirm(): void {
    const trimmed = this.name.trim();
    if (!trimmed) { alert('Name required'); return; }
    const newCrit: Criterion = {
      name: trimmed,
      type: this.type,
      options: this.isPredefined ? this.optionsText.split(',').map(o => o.trim()).filter(Boolean) : undefined
    };
    if (this.editingIndex === null) {
      this.criteria.push(newCrit);
    } else {
      this.criteria[this.editingIndex] = newCrit;
    }
    this.startAdd();
  }

  close(): void { this.cancel.emit(); }

  saveAll(): void { this.save.emit(this.criteria); }
}
