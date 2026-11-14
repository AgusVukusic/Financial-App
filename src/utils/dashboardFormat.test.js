import { describe, it, expect } from 'vitest';
import { splitBalance, pluralizeDays, dueText } from './dashboardFormat';

describe('splitBalance', () => {
  it('separa signo y dígitos con puntos de miles', () => {
    expect(splitBalance(15373721)).toEqual({ negative: false, digits: '15.373.721' });
    expect(splitBalance(-387499)).toEqual({ negative: true, digits: '387.499' });
    expect(splitBalance(0)).toEqual({ negative: false, digits: '0' });
  });

  it('redondea los centavos y tolera valores no numéricos', () => {
    expect(splitBalance(1234.6).digits).toBe('1.235');
    expect(splitBalance(NaN)).toEqual({ negative: false, digits: '0' });
    expect(splitBalance(undefined)).toEqual({ negative: false, digits: '0' });
  });

  it('maneja cifras enormes', () => {
    expect(splitBalance(1234567890123).digits).toBe('1.234.567.890.123');
  });
});

describe('pluralizeDays / dueText', () => {
  it('singular y plural', () => {
    expect(pluralizeDays(1)).toBe('1 día');
    expect(pluralizeDays(2)).toBe('2 días');
  });

  it('textos de vencimiento', () => {
    expect(dueText('overdue', 1)).toBe('Venció hace 1 día');
    expect(dueText('overdue', 3)).toBe('Venció hace 3 días');
    expect(dueText('due_soon', 0)).toBe('Vence hoy');
    expect(dueText('due_soon', 1)).toBe('Vence en 1 día');
    expect(dueText('due_soon', 5)).toBe('Vence en 5 días');
  });
});
