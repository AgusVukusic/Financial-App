import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

export const exportToCSV = (transactions) => {
  const headers = ['Fecha', 'Tipo', 'Categoria', 'Monto', 'Descripcion'];
  const rows = transactions.map(t => [
    new Date(t.date).toLocaleDateString('es-AR'),
    t.type === 'income' ? 'Ingreso' : 'Gasto',
    t.category,
    t.amount,
    `"${t.description || ''}"`
  ]);
  
  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n" 
    + rows.map(e => e.join(",")).join("\n");
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "mis_finanzas.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (transactions) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Reporte de Finanzas', 14, 22);
  
  const tableColumn = ["Fecha", "Tipo", "Categoría", "Monto", "Descripción"];
  const tableRows = [];

  transactions.forEach(t => {
    const transactionData = [
      formatDate(t.date),
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      t.category,
      formatCurrency(t.amount),
      t.description || ''
    ];
    tableRows.push(transactionData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`mis_finanzas_${new Date().toISOString().split('T')[0]}.pdf`);
};
