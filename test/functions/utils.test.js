const { normalizeEmail } = require('../../functions/utils/normalize');

describe('normalizeEmail', () => {
  it('should trim and lowercase emails', () => {
    expect(normalizeEmail(' TEST@example.com ')).toBe('test@example.com');
  });

  it('should return empty string for invalid inputs', () => {
    expect(normalizeEmail(null)).toBe('');
    expect(normalizeEmail(undefined)).toBe('');
    expect(normalizeEmail(123)).toBe('');
    expect(normalizeEmail('')).toBe('');
  });
});
