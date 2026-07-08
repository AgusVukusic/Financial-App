import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from './formatters';

describe('Formatters Utils', () => {
  describe('formatCurrency', () => {
    it('debe formatear números como moneda en pesos argentinos', () => {
      expect(formatCurrency(1000).replace(/\s/g, '')).toBe('$1.000');
      expect(formatCurrency(0).replace(/\s/g, '')).toBe('$0');
      expect(formatCurrency(-500).replace(/\s/g, '')).toBe('-$500');
    });

    it('debe manejar valores no numéricos de forma segura', () => {
      expect(formatCurrency(null).replace(/\s/g, '')).toBe('$0');
      expect(formatCurrency(undefined).replace(/\s/g, '')).toBe('$0');
    });
  });

  describe('formatDate', () => {
    it('debe formatear fechas ISO en formato DD de MMM de AAAA', () => {
      const isoDate = '2026-07-08T12:00:00Z';
      const formatted = formatDate(isoDate);
      expect(formatted).toMatch(/08 de jul(.*)2026/);
    });

    it('debe manejar fechas inválidas', () => {
      expect(formatDate(null)).toBe('');
    });
  });
});
