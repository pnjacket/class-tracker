import { Injectable } from '@angular/core';
import { ClassRoom } from '../models';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly KEY = 'classroom-app-data';

  loadAll(): ClassRoom[] {
    const raw = localStorage.getItem(this.KEY);
    return raw ? JSON.parse(raw) : [];
  }

  saveAll(classes: ClassRoom[]): void {
    localStorage.setItem(this.KEY, JSON.stringify(classes));
  }
}
