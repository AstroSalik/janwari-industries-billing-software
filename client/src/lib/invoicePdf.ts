import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Company Details ────────────────────────────────

const COMPANY = {
  name: 'JANWARI INDUSTRIES',
  address: 'Industrial Estate, Sopore',
  district: 'District: Baramulla',
  state: 'State: J&K',
  pincode: 'Pincode: 193201',
  phone: 'Phone: 7006083933',
  gstin: 'GSTIN: [To be added]',
  stateCode: '01',
  upiId: '7006083933@upi', // Default UPI ID
};

// ─── Types ──────────────────────────────────────────

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  documentTitle?: string;
  updateNote?: string;
  customer?: {
    name: string;
    phone: string;
    address?: string;
    gstin?: string;
    stateCode?: string;
  };
  items: {
    name: string;
    hsnCode: string;
    quantity: number;
    rate: number;
    discount: number;
    gstRate: number;
    cgst: number;
    sgst: number;
    igst: number;
    lineTotal: number;
  }[];
  subtotal: number;
  totalDiscount: number;
  totalTaxable: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  isInterState: boolean;
  payments: { mode: string; amount: number; date?: string; reference?: string }[];
  notes?: string;
}

// ─── Helpers ────────────────────────────────────────

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = 'Rupees ' + convert(rupees);
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  return result + ' Only';
}

async function loadImageDataUrl(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load image: ${path}`);
  }

  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image data'));
    reader.readAsDataURL(blob);
  });
}

// ─── PDF Generator ──────────────────────────────────

export async function generateInvoicePDF(data: InvoiceData): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  let y = margin;
  const resolvedLogoPath = new URL('ji-logo.jpg', document.baseURI).toString();

  // ── Try to load logo ──
  let logoLoaded = false;
  try {
    const logoDataUrl = await loadImageDataUrl(resolvedLogoPath);
    doc.addImage(logoDataUrl, 'JPEG', margin, y, 22, 22);
    logoLoaded = true;
  } catch {
    // Logo not available, skip
  }

  // ── Company Header ──
  const headerX = logoLoaded ? margin + 26 : margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(COMPANY.name, headerX, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(COMPANY.address, headerX, y + 12);
  doc.text(`${COMPANY.district} | ${COMPANY.state} | ${COMPANY.pincode}`, headerX, y + 16);
  doc.text(COMPANY.phone, headerX, y + 20);

  // ── Invoice Title (right-aligned) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(217, 119, 6); // Theme Amber
  doc.text(data.documentTitle || 'TAX INVOICE', pageWidth - margin, y + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Invoice #: ${data.invoiceNumber}`, pageWidth - margin, y + 13, { align: 'right' });
  doc.text(`Date: ${data.date}`, pageWidth - margin, y + 18, { align: 'right' });

  y += 28;

  // ── Divider ──
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ── Bill To / Ship To ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('BILL TO:', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  if (data.customer) {
    doc.text(data.customer.name, margin, y + 5);
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`Phone: ${data.customer.phone}`, margin, y + 10);
    if (data.customer.address) doc.text(data.customer.address, margin, y + 14);
    if (data.customer.gstin) doc.text(`GSTIN: ${data.customer.gstin}`, margin, y + 18);
  } else {
    doc.text('Walk-in Customer', margin, y + 5);
  }

  // State code on right
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Place of Supply:', pageWidth - margin - 40, y);
  doc.setTextColor(30, 30, 30);
  doc.text(data.isInterState ? `State Code: ${data.customer?.stateCode || '—'}` : 'J&K (01)', pageWidth - margin - 40, y + 5);

  y += 24;

  if (data.updateNote) {
    doc.setFillColor(255, 247, 237);
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 9, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14);
    doc.text(data.updateNote, margin + 3, y + 5.8);
    y += 14;
  }

  // ── Items Table ──
  const tableColumns = [
    { header: '#', dataKey: 'sno' },
    { header: 'Item', dataKey: 'name' },
    { header: 'HSN', dataKey: 'hsn' },
    { header: 'Qty', dataKey: 'qty' },
    { header: 'Rate (₹)', dataKey: 'rate' },
    { header: 'Disc (₹)', dataKey: 'disc' },
    { header: 'GST %', dataKey: 'gst' },
    { header: 'Amount (₹)', dataKey: 'amount' },
  ];

  const tableRows = data.items.map((item, i) => ({
    sno: String(i + 1),
    name: item.name,
    hsn: item.hsnCode || '—',
    qty: String(item.quantity),
    rate: item.rate.toFixed(2),
    disc: item.discount > 0 ? (item.discount * item.quantity).toFixed(2) : '—',
    gst: `${item.gstRate}%`,
    amount: item.lineTotal.toFixed(2),
  }));

  autoTable(doc, {
    startY: y,
    columns: tableColumns,
    body: tableRows,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 30, 30],
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [217, 119, 6], // Theme Amber
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: [248, 248, 252] },
    columnStyles: {
      sno: { cellWidth: 8, halign: 'center' },
      name: { cellWidth: 'auto' },
      hsn: { cellWidth: 18, halign: 'center' },
      qty: { cellWidth: 12, halign: 'center' },
      rate: { cellWidth: 22, halign: 'right' },
      disc: { cellWidth: 18, halign: 'right' },
      gst: { cellWidth: 14, halign: 'center' },
      amount: { cellWidth: 26, halign: 'right' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Totals Box (right side) ──
  const totalsX = pageWidth - margin - 75;
  const totalsW = 75;

  const drawTotalRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 10 : 8.5);
    doc.setTextColor(bold ? 30 : 80, bold ? 30 : 80, bold ? 30 : 80);
    doc.text(label, totalsX, y);
    doc.text(value, totalsX + totalsW, y, { align: 'right' });
    y += bold ? 6 : 5;
  };

  drawTotalRow('Subtotal:', data.subtotal.toFixed(2));
  if (data.totalDiscount > 0) drawTotalRow('Discount:', `-${data.totalDiscount.toFixed(2)}`);
  drawTotalRow('Taxable:', data.totalTaxable.toFixed(2));

  if (data.isInterState) {
    drawTotalRow('IGST:', data.totalIGST.toFixed(2));
  } else {
    drawTotalRow('CGST:', data.totalCGST.toFixed(2));
    drawTotalRow('SGST:', data.totalSGST.toFixed(2));
  }

  // Divider before grand total
  doc.setDrawColor(217, 119, 6); // Theme Amber
  doc.setLineWidth(0.8);
  doc.line(totalsX, y, totalsX + totalsW, y);
  y += 4;

  drawTotalRow('GRAND TOTAL:', `₹ ${data.grandTotal.toFixed(2)}`, true);
  y += 2;

  // ── Amount in words ──
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`Amount in words: ${numberToWords(data.grandTotal)}`, margin, y);
  y += 8;

  // ── Payment Details ──
  if (data.payments.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text('PAYMENT DETAILS:', margin, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    data.payments.forEach((p) => {
      const paymentLine = [p.mode, formatINR(p.amount), p.date, p.reference ? `Ref: ${p.reference}` : '']
        .filter(Boolean)
        .join(' | ');
      doc.text(paymentLine, margin + 4, y);
      y += 4;
    });

    if (data.balanceAmount > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 50, 50);
      doc.text(`Balance Due: ${formatINR(data.balanceAmount)}`, margin + 4, y);
      y += 4;
    }
    y += 4;
  }

  // ── Notes ──
  if (data.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Notes: ${data.notes}`, margin, y);
    y += 8;
  }

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text('Thank you for your business!', pageWidth / 2, footerY + 5, { align: 'center' });
  doc.text(`${COMPANY.name} | ${COMPANY.address} | ${COMPANY.phone}`, pageWidth / 2, footerY + 9, { align: 'center' });

  doc.line(pageWidth - margin - 40, footerY + 1, pageWidth - margin, footerY + 1);

  // ── UPI QR Code ──
  const upiUrl = `upi://pay?pa=${COMPANY.upiId}&pn=${encodeURIComponent(COMPANY.name)}&am=${data.grandTotal.toFixed(2)}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUrl)}`;
  
  try {
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = () => reject();
      qrImg.src = qrUrl;
    });
    // Place QR code on the bottom left above the footer
    doc.addImage(qrImg, 'PNG', margin, footerY - 32, 28, 28);
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text('Scan to Pay via UPI', margin, footerY - 2);
  } catch {
    // QR failed to load, skip
  }

  // Signature area
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('Authorized Signatory', pageWidth - margin, footerY + 5, { align: 'right' });

  // ── Save ──
  doc.save(`Invoice-${data.invoiceNumber.replace(/\//g, '-')}.pdf`);
}

export type { InvoiceData };
