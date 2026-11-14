import { constantTimeEquals } from './PasswordHasher';

describe('constantTimeEquals', () => {
  it('is true for identical strings', () => {
    expect(constantTimeEquals('a1b2c3', 'a1b2c3')).toBe(true);
  });

  it('is false when any character differs, first or last', () => {
    expect(constantTimeEquals('a1b2c3', 'x1b2c3')).toBe(false);
    expect(constantTimeEquals('a1b2c3', 'a1b2cX')).toBe(false);
  });

  it('is false for different lengths', () => {
    expect(constantTimeEquals('abc', 'abcd')).toBe(false);
  });

  it('is true for two empty strings', () => {
    expect(constantTimeEquals('', '')).toBe(true);
  });
});
