import { migrateCriteria, Criterion } from './models';

describe('migrateCriteria', () => {
  it('should return empty array for null/undefined', () => {
    expect(migrateCriteria(null as any)).toEqual([]);
    expect(migrateCriteria(undefined as any)).toEqual([]);
  });

  it('should pass through already migrated criteria', () => {
    const input: Criterion[] = [{ name: 'A', type: 'counter' }];
    // Should return same reference when already in new shape
    expect(migrateCriteria(input as any)).toBe(input);
  });

  it('should convert legacy string array to counter criteria', () => {
    const old = ['Attendance', 'Homework'];
    const result = migrateCriteria(old as any);
    expect(result).toEqual([
      { name: 'Attendance', type: 'counter' },
      { name: 'Homework', type: 'counter' }
    ]);
  });
});
