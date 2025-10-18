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
  @Input() set criteria(value: Criterion[]) {
    // Make a shallow copy to avoid mutating the parent array directly
    this.localCriteria = value ? [...value] : [];
  }
  get criteria(): Criterion[] { return this.localCriteria; }

  @Output() save = new EventEmitter<Criterion[]>();
  @Output() cancel = new EventEmitter<void>();

  // Internal mutable copy used for editing
  private localCriteria: Criterion[] = [];

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
    const c = this.localCriteria[i];
    this.editingIndex = i;
    this.name = c.name;
    this.type = c.type;
    this.optionsText = (c.options || []).join(', ');
  }

  delete(i: number): void {
    if (confirm(`Delete criterion "${this.localCriteria[i].name}"?`)) {
      this.localCriteria.splice(i, 1);
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
      // push a new element and create a fresh reference so Angular detects the change
      this.localCriteria = [...this.localCriteria, newCrit];
    } else {
      const copy = [...this.localCriteria];
      copy[this.editingIndex] = newCrit;
      this.localCriteria = copy;
    }
    this.startAdd();
  }

  close(): void { this.cancel.emit(); }

  saveAll(): void { this.save.emit(this.localCriteria); }
}
