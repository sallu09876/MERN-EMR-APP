import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const dateStamp = () => new Date().toISOString().split("T")[0];

export const exportToPDF = ({ title, subtitle, columns, rows, filename }) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(10, 22, 40); // navy
  doc.text(title, 14, 20);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // muted
    doc.text(subtitle, 14, 28);
  }

  // Generated date
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    14,
    subtitle ? 34 : 28
  );

  // Table
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: subtitle ? 40 : 34,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: {
      fillColor: [14, 159, 160], // teal
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename}-${dateStamp()}.pdf`);
};

export const exportToExcel = ({ sheetName, columns, rows, filename }) => {
  const worksheetData = [columns, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}-${dateStamp()}.xlsx`);
};

