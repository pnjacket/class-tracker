// src/app/app.spec.ts
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { ClassStoreService } from './services/class-store.service';
import { EditModeService } from './services/drag-toggle.service';

class MockClassStore {
  initialize = jasmine.createSpy('initialize');
}

class MockEditMode {}

describe('App Component', () => {
  let fixture: any;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: ClassStoreService, useClass: MockClassStore },
        { provide: EditModeService, useClass: MockEditMode }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
  });

  it('should call store.initialize on ngOnInit', () => {
    const component = fixture.componentInstance;
    component.ngOnInit();
    const store = TestBed.inject(ClassStoreService) as any;
    expect(store.initialize).toHaveBeenCalled();
  });
});
