// src/app/utils.spec.ts
import { uuid } from './utils';

describe('uuid', () => {
  it('should generate a string of length 36 in UUID format', () => {
    const id = uuid();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(id.length).toBe(36);
  });
});
