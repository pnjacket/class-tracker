import { Injectable } from '@angular/core';
import { ClassRoom } from '../models';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly KEY = 'classroom-app-data';

  /** Return the raw stored JSON (could be legacy array or versioned object) */
  getRaw(): any {
    const raw = localStorage.getItem(this.KEY);
    return raw ? JSON.parse(raw) : null;
  }

  /** Overwrite the storage with the provided data */
  setRaw(data: any): void {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  }

  loadAll(): ClassRoom[] {
    const obj = this.getRaw();
    if (obj && typeof obj === 'object' && Array.isArray(obj)) {
      return obj as ClassRoom[];
    }
    if (obj && typeof obj === 'object' && 'classes' in obj) {
      return (obj.classes as ClassRoom[]) || [];
    }
    return [];
  }

  saveAll(classes: ClassRoom[]): void {
    // This method will be used by older code paths; it stores versioned data.
    const data = { version: StorageService.APP_VERSION, classes };
    this.setRaw(data);
  }

  /** Current application version (must match package.json) */
  static readonly APP_VERSION = '0.0.2';
}
