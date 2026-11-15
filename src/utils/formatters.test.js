import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatCurrency, formatDate, typeLabel, buildCSV, exportToCSV, exportToPDF, pdfText } from './formatters';

// jsPDF no corre en jsdom: se reemplaza por un doble que registra las llamadas.
const pdf = vi.hoisted(() => ({ save: vi.fn(), text: vi.fn(), setFontSize: vi.fn(), table: vi.fn() }));
vi.mock('jspdf', () => ({
  default: class {
    save = pdf.save;
    text = pdf.text;
    setFontSize = pdf.setFontSize;
  },
}));
vi.mock('jspdf-autotable', () => ({ default: pdf.table }));

const T = (over) => ({ date: '2026-07-08T12:00:00Z', type: 'expense', category: 'Comida', amount: 1500, description: 'Super', ...over });
const lines = (csv) => csv.replace('﻿', '').split('\r\n');

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

  describe('typeLabel', () => {
    it('rotula ingreso, gasto y transferencia', () => {
      expect(typeLabel({ type: 'income' })).toBe('Ingreso');
      expect(typeLabel({ type: 'expense' })).toBe('Gasto');
      expect(typeLabel({ type: 'transfer' })).toBe('Transferencia');
    });
  });

  describe('buildCSV', () => {
    it('empieza con BOM y tiene las 5 columnas', () => {
      const csv = buildCSV([T()]);
      expect(csv.charCodeAt(0)).toBe(0xfeff);
      expect(lines(csv)[0]).toBe('Fecha;Tipo;Categoría;Monto;Descripción');
      expect(lines(csv)[1]).toMatch(/^".+";"Gasto";"Comida";1500;"Super"$/);
    });

    it('rotula las transferencias', () => {
      expect(lines(buildCSV([T({ type: 'transfer' })]))[1]).toContain('"Transferencia"');
    });

    it('no se trunca con # en la descripción', () => {
      expect(buildCSV([T({ description: 'Cuota #3' })])).toContain('"Cuota #3"');
    });

    it('escapa comillas, comas y saltos de línea dentro de comillas', () => {
      const csv = buildCSV([T({ description: 'Dijo "hola", chau\nfin' })]);
      expect(csv).toContain('"Dijo ""hola"", chau\nfin"');
    });

    it('neutraliza textos que empiezan con = + - @', () => {
      for (const bad of ['=SUMA(A1)', '+1', '-2', '@x']) {
        expect(buildCSV([T({ description: bad })])).toContain(`"'${bad}"`);
      }
      expect(buildCSV([T({ category: '=1+1' })])).toContain(`"'=1+1"`);
    });

    it('no antepone apóstrofo a texto común', () => {
      expect(buildCSV([T({ description: 'Café' })])).toContain('"Café"');
    });

    it('para Excel en español: columnas con ";", monto con coma decimal y renglones con CRLF', () => {
      const csv = buildCSV([T({ amount: 1250000.75 }), T({ amount: 0.5 }), T({ amount: 300 })]);
      const rows = lines(csv);
      expect(rows).toHaveLength(4);
      expect(rows[1]).toContain(';1250000,75;');
      expect(rows[2]).toContain(';0,5;');
      expect(rows[3]).toContain(';300;');
      expect(csv).not.toMatch(/\d\.\d/); // ningún monto con punto decimal
    });

    it('un ";" dentro de la descripción no parte la columna (va entre comillas)', () => {
      const row = lines(buildCSV([T({ description: 'Pan; leche' })]))[1];
      expect(row.endsWith('"Pan; leche"')).toBe(true);
      expect(row.split(';').length).toBeGreaterThan(5); // el ";" interno se ve al contar sin respetar comillas
    });

    it('lista vacía: solo el encabezado', () => {
      expect(lines(buildCSV([]))).toEqual(['Fecha;Tipo;Categoría;Monto;Descripción']);
    });

    it('fecha inválida o ausente da celda vacía', () => {
      expect(lines(buildCSV([T({ date: 'nope' })]))[1]).toMatch(/^"";"Gasto"/);
      expect(lines(buildCSV([T({ date: undefined })]))[1]).toMatch(/^"";"Gasto"/);
      expect(buildCSV([T({ date: 'nope' })])).not.toContain('Invalid');
    });
  });

  describe('exportToCSV', () => {
    afterEach(() => vi.restoreAllMocks());

    it('descarga un Blob con nombre con fecha y libera la URL', () => {
      URL.createObjectURL = vi.fn(() => 'blob:x');
      URL.revokeObjectURL = vi.fn();
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      const name = exportToCSV([T()]);
      expect(name).toMatch(/^mis_finanzas_\d{4}-\d{2}-\d{2}\.csv$/);
      expect(URL.createObjectURL.mock.calls[0][0].type).toBe('text/csv;charset=utf-8');
      expect(click).toHaveBeenCalledTimes(1);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
    });
  });

  describe('exportToPDF', () => {
    it('usa el título nuevo, el rótulo de tipo, encabezado neutro y devuelve el nombre', () => {
      const name = exportToPDF([T({ type: 'transfer' })]);
      expect(name).toMatch(/^mis_finanzas_\d{4}-\d{2}-\d{2}\.pdf$/);
      expect(pdf.save).toHaveBeenCalledWith(name);
      expect(pdf.text).toHaveBeenCalledWith('Movimientos · Finanzas Personales', 14, 22);
      const opts = pdf.table.mock.calls[0][1];
      expect(opts.body[0][1]).toBe('Transferencia');
      expect(opts.headStyles.fillColor).toEqual([19, 19, 17]);
    });

    it('quita los emoji de la descripción (el PDF no los puede escribir) y conserva tildes y eñes', () => {
      expect(pdfText('Empanadas 🥟🥟 para la cena')).toBe('Empanadas para la cena');
      expect(pdfText('Café con leche · año 2026')).toBe('Café con leche · año 2026');
      expect(pdfText('Efectivo 👍🏽')).toBe('Efectivo');
      expect(pdfText('María’s “cena” — 3 pizzas… € ¿Qué? © ® ™ «ok»')).toBe('María’s “cena” — 3 pizzas… € ¿Qué? © ® ™ «ok»'); // teclado del iPhone
      expect(pdfText('50% ≥ 2 → 3 ✓')).toBe('50% 2 3');
      expect(pdfText(undefined)).toBe('');
      exportToPDF([T({ description: 'Pizza 🍕 del viernes' })]);
      const opts = pdf.table.mock.calls.at(-1)[1];
      expect(opts.body[0][4]).toBe('Pizza del viernes');
    });

    it('fija el ancho de fecha, tipo, categoría y monto para que no se partan', () => {
      exportToPDF([T()]);
      const { columnStyles } = pdf.table.mock.calls.at(-1)[1];
      expect(columnStyles[3]).toMatchObject({ halign: 'right' });
      expect(columnStyles[0].cellWidth).toBeGreaterThanOrEqual(34);
    });
  });
});
