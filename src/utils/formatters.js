import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) amount = 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

/** Rótulo del tipo de movimiento para las exportaciones. */
export const typeLabel = (t) => {
  if (t?.type === 'income') return 'Ingreso';
  if (t?.type === 'transfer') return 'Transferencia';
  return 'Gasto';
};

const isoDay = () => new Date().toISOString().split('T')[0];

// Texto de CSV: entre comillas, con " duplicadas; si arranca con = + - @ se antepone ' para que la planilla no lo ejecute.
const csvText = (value) => {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const csvDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-AR');
};

/** Arma el contenido del CSV (con BOM para que Excel lea los acentos). */
export const buildCSV = (transactions) => {
  const headers = ['Fecha', 'Tipo', 'Categoria', 'Monto', 'Descripcion'];
  const rows = (transactions || []).map((t) => [
    csvText(csvDate(t.date)),
    csvText(typeLabel(t)),
    csvText(t.category),
    t.amount,
    csvText(t.description),
  ]);
  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
};

/** Descarga el CSV y devuelve el nombre del archivo. */
export const exportToCSV = (transactions) => {
  const fileName = `mis_finanzas_${isoDay()}.csv`;
  const blob = new Blob([buildCSV(transactions)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  return fileName;
};

/**
 * jsPDF escribe con Helvetica (WinAnsi): lo que esa fuente no tiene (emoji, flechas, ✓, ≥) sale como basura ("Ø>Ý") y se
 * sale de la celda. En el PDF se dejan solo los caracteres que sí tiene (letras con tilde y eñe, ¿ ¡, comillas y rayas
 * tipográficas del teclado del iPhone, €, ©, ®, ™, …); el CSV es UTF-8 y conserva todo.
 */
const PDF_SAFE = /[\u0020-\u007e\u00a0-\u00ff\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc\u2013\u2014\u2018-\u201a\u201c-\u201e\u2020-\u2022\u2026\u2030\u2039\u203a\u20ac\u2122]/;
export const pdfText = (value) =>
  Array.from(String(value ?? ''))
    .filter((ch) => PDF_SAFE.test(ch))
    .join('')
    .replace(/\s{2,}/g, ' ')
    .trim();

/** Genera y descarga el PDF; devuelve el nombre del archivo. */
export const exportToPDF = (transactions) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Movimientos · Finanzas Personales', 14, 22);

  const tableColumn = ['Fecha', 'Tipo', 'Categoría', 'Monto', 'Descripción'];
  const tableRows = (transactions || []).map((t) => [
    formatDate(t.date),
    typeLabel(t),
    pdfText(t.category),
    formatCurrency(t.amount),
    pdfText(t.description),
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    theme: 'grid',
    styles: { fontSize: 10 },
    // Anchos fijos para lo que no debe partirse (fecha, tipo, categoría, monto); la descripción toma el resto y baja de renglón.
    // Sin esto, una descripción muy larga le saca ancho a las demás y los montos se cortan ("$ 1.250." / "001").
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: 27 },
      2: { cellWidth: 28 },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 'auto' },
    },
    // jsPDF necesita RGB numérico: tinta neutra del sistema con texto claro.
    headStyles: { fillColor: [19, 19, 17], textColor: [255, 255, 255] },
  });

  const fileName = `mis_finanzas_${isoDay()}.pdf`;
  doc.save(fileName);
  return fileName;
};
