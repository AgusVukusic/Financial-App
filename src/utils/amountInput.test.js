import { describe, it, expect } from 'vitest';
import { parseAmountInput, formatAmountInput } from './amountInput';

describe('parseAmountInput', () => {
  it.each([
    ['3500', 3500],
    ['3,5', 3.5],
    ['0,75', 0.75],
    ['1.500', 1500],
    ['1.500.000', 1500000],
    ['2.500,50', 2500.5],
    ['12.5', 12.5],
    ['0.75', 0.75],
    ['$ 1.200', 1200],
    ['  42  ', 42],
    ['1,', 1],
    ['-1.000', -1000],
  ])('%s -> %s', (text, expected) => {
    expect(parseAmountInput(text)).toBe(expected);
  });

  it('un punto que agrupa de a tres siempre es miles (1.500 nunca es 1,5)', () => {
    expect(parseAmountInput('1.500')).toBe(1500);
    expect(parseAmountInput('999.999')).toBe(999999);
  });

  it.each(['', '   ', 'abc', '1.2.3', '1,2,3', '1..5', ',5x', '$', '-', '1.50.0', '12e3', '1.500,5.0'])('rechaza %j', (text) => {
    expect(parseAmountInput(text)).toBeNull();
  });

  it('tolera null y undefined', () => {
    expect(parseAmountInput(null)).toBeNull();
    expect(parseAmountInput(undefined)).toBeNull();
  });
});

describe('formatAmountInput', () => {
  it('muestra coma decimal y sin separador de miles', () => {
    expect(formatAmountInput(1200)).toBe('1200');
    expect(formatAmountInput(12.5)).toBe('12,5');
    expect(formatAmountInput(1234567.89)).toBe('1234567,89');
  });

  it('ida y vuelta: lo que se muestra se vuelve a leer igual', () => {
    [1, 0.05, 12.5, 1500, 1234567.89].forEach((n) => expect(parseAmountInput(formatAmountInput(n))).toBe(n));
  });

  it('vacío o inválido da cadena vacía', () => {
    expect(formatAmountInput(undefined)).toBe('');
    expect(formatAmountInput('')).toBe('');
    expect(formatAmountInput(NaN)).toBe('');
  });
});
