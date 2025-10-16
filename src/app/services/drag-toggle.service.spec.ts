// src/app/services/drag-toggle.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { EditModeService } from './drag-toggle.service';

describe('EditModeService', () => {
  let service: EditModeService;
  const COOKIE_NAME = 'dragToggleEnabled';

  beforeEach(() => {
    // reset cookies for each test
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
    TestBed.configureTestingModule({ providers: [EditModeService] });
    service = TestBed.inject(EditModeService);
  });

  it('should default to enabled when no cookie is present', () => {
    expect(service.isEnabled).toBeTrue();
  });

  it('should read false from cookie if set to "false"', () => {
    document.cookie = `${COOKIE_NAME}=false`;
    // recreate service to re-read the cookie
    service = new EditModeService();
    expect(service.isEnabled).toBeFalse();
  });

  it('should toggle the state and update the cookie', () => {
    const initial = service.isEnabled;
    service.toggle();
    expect(service.isEnabled).toBe(!initial);
    // verify cookie contains updated value
    expect(document.cookie).toContain(`${COOKIE_NAME}=${!initial}`);
  });
});
