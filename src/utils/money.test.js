import { describe, it, expect } from 'vitest';
import { toMinor, fromMinor } from './money';

describe('money', () => {
  it('convierte pesos a centavos enteros', () => {
    expect(toMinor(1500.5)).toBe(150050);
    expect(toMinor('1500.50')).toBe(150050);
    expect(toMinor(0)).toBe(0);
    expect(toMinor(1)).toBe(100);
  });

  it('evita el error binario de coma flotante', () => {
    expect(toMinor(0.1 + 0.2)).toBe(30);
    expect(toMinor(1.005)).toBe(101);
    expect(toMinor(19.99)).toBe(1999);
    expect(toMinor(4.35)).toBe(435);
  });

  it('redondea al centavo más cercano y soporta negativos', () => {
    expect(toMinor('10.004')).toBe(1000);
    expect(toMinor('10.006')).toBe(1001);
    expect(toMinor(-5.5)).toBe(-550);
  });

  it('rechaza valores no numéricos', () => {
    for (const bad of ['', null, undefined, 'abc', NaN, Infinity]) {
      expect(() => toMinor(bad)).toThrow();
    }
  });

  it('fromMinor vuelve a pesos', () => {
    expect(fromMinor(150050)).toBe(1500.5);
    expect(fromMinor(0)).toBe(0);
    expect(fromMinor(undefined)).toBe(0);
  });
});

describe('toPositiveMinor', () => {
  it('acepta montos positivos y rechaza los que dan 0 o negativos', async () => {
    const { toPositiveMinor } = await import('./money');
    expect(toPositiveMinor('12.34')).toBe(1234);
    for (const bad of [0, '0.001', -5, '-0.01']) {
      expect(() => toPositiveMinor(bad)).toThrow('El monto debe ser mayor a 0.');
    }
  });
});
