import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from './formatters';

describe('Formatters Utils', () => {
  describe('formatCurrency', () => {
    it('debe formatear números como moneda', () => {
      expect(formatCurrency(1000).replace(/\s/g, '')).toMatch(/\$1[.,]000/);
      expect(formatCurrency(0).replace(/\s/g, '')).toMatch(/\$0/);
      expect(formatCurrency(-500).replace(/\s/g, '')).toMatch(/-\$500/);
    });

    it('debe manejar valores no numéricos de forma segura', () => {
      expect(formatCurrency(null).replace(/\s/g, '')).toMatch(/\$0/);
      expect(formatCurrency(undefined).replace(/\s/g, '')).toMatch(/\$0/);
    });
  });

  describe('formatDate', () => {
    it('debe formatear fechas ISO conteniendo día, mes y año', () => {
      const isoDate = '2026-07-08T12:00:00Z';
      const formatted = formatDate(isoDate);
      // Solo verificamos que contenga los elementos clave, ya que el formato exacto varía en CI (Node Linux)
      expect(formatted).toMatch(/0?8/);
      expect(formatted).toMatch(/jul/i);
      expect(formatted).toMatch(/2026/);
    });

    it('debe manejar fechas inválidas', () => {
      expect(formatDate(null)).toBe('');
    });
  });
});
