import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export interface ReportConfig {
  title: string;
  dateRange: string;
  branchName: string;
  selectedItemId?: string;
  summary?: any;
}

const BRAND_COLOR: [number, number, number] = [234, 88, 12]; // #EA580C
const ACCENT_COLOR: [number, number, number] = [29, 41, 61]; // #1D293D

/**
 * Common header for all reports
 */
function addDocumentHeader(doc: jsPDF, config: ReportConfig) {
  const pageWidth = doc.internal.pageSize.width;
  
  // Brand Header
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageWidth, 15, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(config.title, 14, 25);
  
  // Metadata section
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 138);
  doc.setFontSize(10);
  
  doc.text("Report Name:", 14, 32);
  doc.text("Date Range:", 14, 37);
  doc.text("Outlet / Branch:", 14, 42);
  doc.text("Generated On:", 14, 47);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  
  doc.text(config.title, 45, 32);
  doc.text(config.dateRange, 45, 37);
  doc.text(config.branchName, 45, 42);
  doc.text(format(new Date(), "PPpp"), 45, 47);

  // Separation line
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 52, pageWidth - 14, 52);
}

/**
 * Generic Report Generator
 */
function generateGenericReport(data: any[], config: ReportConfig) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const isLandscape = headers.length > 6;
  const doc = new jsPDF({ orientation: isLandscape ? "landscape" : "portrait", unit: "mm", format: "a4" });
  
  addDocumentHeader(doc, config);

  const tableRows = data.map((row) => headers.map((key) => row[key]));

  autoTable(doc, {
    head: [headers],
    body: tableRows,
    startY: 56,
    theme: "striped",
    headStyles: {
      fillColor: ACCENT_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: isLandscape ? 8 : 9,
      cellPadding: 4,
    },
    didParseCell: (cellData) => {
      const headerText = String(headers[cellData.column.index] || '').toLowerCase();
      const isRightAligned = headerText.includes('price') || 
                             headerText.includes('amount') || 
                             headerText.includes('subtotal') || 
                             headerText.includes('discount') || 
                             headerText.includes('tax') ||
                             headerText.includes('(rs)');
      if (isRightAligned) {
        cellData.cell.styles.halign = 'right';
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  if (config.summary && Object.keys(config.summary).length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ACCENT_COLOR);
    doc.setFontSize(12);
    doc.text("Summary", 14, finalY);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    let currentY = finalY + 6;
    Object.entries(config.summary).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 14, currentY);
      currentY += 6;
    });
  }

  doc.save(`${config.title.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`);
}

export function generateProductWiseReport(data: any[], config: ReportConfig) {
  generateGenericReport(data, config);
}

export function generateOrdersReport(data: any[], config: ReportConfig) {
  generateGenericReport(data, config);
}

export function generatePaymentReport(data: any[], config: ReportConfig) {
  generateGenericReport(data, config);
}

export function generateSalesReport(data: any[], config: ReportConfig) {
  generateGenericReport(data, config);
}
