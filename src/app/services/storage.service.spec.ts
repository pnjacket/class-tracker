// src/app/services/storage.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { ClassRoom } from '../models';

describe('StorageService', () => {
  let service: StorageService;
  const KEY = 'classroom-app-data';

  beforeEach(() => {
    // clear any existing data
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [StorageService] });
    service = TestBed.inject(StorageService);
  });

  it('should return empty array when no data stored', () => {
    expect(service.loadAll()).toEqual([]);
  });

  it('should save and load classes correctly', () => {
    const dummy: ClassRoom = {
      classId: '123',
      title: 'TestClass',
      rows: 2,
      cols: 3,
      criteria: [],
      views: []
    } as any;
    service.saveAll([dummy]);
    const stored = localStorage.getItem(KEY);
    expect(stored).toBeTruthy();
    const loaded = service.loadAll();
    expect(loaded.length).toBe(1);
    expect(loaded[0].classId).toBe('123');
    expect(loaded[0].title).toBe('TestClass');
  });
});
