// src/app/services/class-store.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { ClassStoreService } from './class-store.service';
import { StorageService } from './storage.service';
import { uuid } from '../utils';

/** Simple mock storage that records saved data */
class MockStorage {
  private data: any[] = [];
  loadAll() { return this.data; }
  saveAll(classes: any[]) { this.data = classes; }
}

describe('ClassStoreService', () => {
  let service: ClassStoreService;
  let storage: MockStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ClassStoreService,
        { provide: StorageService, useClass: MockStorage }
      ]
    });
    service = TestBed.inject(ClassStoreService);
    storage = TestBed.inject(StorageService) as any;
    // Initialize the store to set up default class and active view
    service.initialize();
  });

  it('should initialize with a default class when none exist', () => {
    expect(service.classes.length).toBe(1);
    const def = service.classes[0];
    expect(def.title).toContain('Default');
    expect(def.views.length).toBe(1);
    expect(service.activeClassId).toBe(def.classId);
  });

  it('should create a new class and persist it', () => {
    const before = service.classes.length;
    const cls = service.createClass('New Class', 3, 4);
    expect(cls.title).toBe('New Class');
    expect(service.classes.length).toBe(before + 1);
    // persisted data should contain the new class
    expect(storage['data']).toContain(jasmine.objectContaining({ title: 'New Class' }));
  });

  it('should add a view for active class without duplicating dates', () => {
    const date = '2025-10-20';
    service.addView(date);
    expect(service.activeClass.views.find(v => v.date === date)).toBeTruthy();
    // adding same date should just switch active view, not create duplicate
    const countBefore = service.activeClass.views.length;
    service.addView(date);
    expect(service.activeClass.views.length).toBe(countBefore);
  });

  it('should add a student with counters based on criteria', () => {
    // set up a criterion
    service.updateClassCriteria([
      { name: 'Attendance', type: 'counter' },
      { name: 'Mood', type: 'predefined', options: ['Happy', 'Sad'] }
    ]);
    const cell = service.activeView!.grid[0][0];
    service.addStudent(cell, 'John Doe');
    expect(cell.student).toBeTruthy();
    expect(cell.student?.counters['Attendance']).toBe(0);
    expect(cell.student?.counters['Mood']).toBe('Happy');
  });

  it('should increment and decrement numeric counters', () => {
    service.updateClassCriteria([{ name: 'Points', type: 'counter' }]);
    const cell = service.activeView!.grid[0][0];
    service.addStudent(cell, 'Alice');
    service.incrementKey(cell, 'Points');
    expect(cell.student?.counters['Points']).toBe(1);
    service.decrementKey(cell, 'Points');
    expect(cell.student?.counters['Points']).toBe(0);
    // counters can go negative (new feature)
    service.decrementKey(cell, 'Points');
    expect(cell.student?.counters['Points']).toBe(-1);
  });
});
