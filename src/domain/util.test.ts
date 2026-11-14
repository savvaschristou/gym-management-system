import { ISO_DAY_LENGTH, isoDay, newId } from './util';

describe('newId', () => {
  it('returns a different id every call', () => {
    const ids = new Set(Array.from({ length: 500 }, () => newId()));
    expect(ids.size).toBe(500);
  });

  it('uses only lowercase letters and digits', () => {
    expect(newId()).toMatch(/^[0-9a-z]+$/);
  });
});

describe('isoDay', () => {
  it('takes the date part of a Date (UTC)', () => {
    expect(isoDay(new Date('2026-11-09T23:30:00Z'))).toBe('2026-11-09');
  });

  it('takes the date part of an ISO timestamp string', () => {
    expect(isoDay('2026-11-13T17:00:00.000Z')).toBe('2026-11-13');
    expect(isoDay('2026-11-13T17:00:00.000Z')).toHaveLength(ISO_DAY_LENGTH);
  });
});
