/**
 * generateInvoicePDF
 * Generates an A4 PDF invoice using jsPDF + jspdf-autotable.
 * Mirrors the exact print-sheet layout used in the app.
 *
 * @param {object} bill   — bill object from the API
 * @param {string} businessDisplay — result of getBusinessNameDisplay(bill)
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateInvoicePDF(bill, businessDisplay) {
  // ── Page setup ──────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210;          // A4 width mm
  const PH = 297;          // A4 height mm
  const ML = 18;           // left margin
  const MR = PW - 18;      // right edge
  const CW = MR - ML;      // content width

  let y = 16; // current Y cursor

  // ── Business name (red, bold, centred) ──────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(225, 29, 72);
  doc.text(businessDisplay, PW / 2, y, { align: 'center' });
  y += 7;

  // ── Subtitle ────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(
    'Electrical Wiring, Fitting Works, Supply of All Kind of Electricals Goods',
    PW / 2, y, { align: 'center' }
  );
  y += 5;
  doc.text('Nashik Maharashtra-422010  Mob.: +91 94227 61843', PW / 2, y, { align: 'center' });
  y += 5;

  // ── Thick divider ───────────────────────────────────────────────
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(ML, y, MR, y);
  y += 7;

  // ── To / Address (left) and Date / Bill No (right) ──────────────
  const metaY = y;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  // Left side
  doc.text('To,', ML, metaY);
  doc.setFont('helvetica', 'bold');
  doc.text(bill.customerName || '', ML + 9, metaY);

  if (bill.customerAddress) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(bill.customerAddress, ML + 9, metaY + 6);
  }

  // Right side
  const dateStr = new Date(bill.createdAt).toLocaleDateString('en-GB');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Date :', MR - 50, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, MR - 28, metaY);

  if (bill.billType !== 'SHOP_QUOTATION') {
    doc.setFont('helvetica', 'bold');
    doc.text('Bill no :', MR - 50, metaY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(String(bill.id ?? ''), MR - 28, metaY + 6);
  }

  y = metaY + 16;

  // ── "QUOTATION" centred title ────────────────────────────────────
  if (bill.billType === 'SHOP_QUOTATION') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('QUOTATION', PW / 2, y, { align: 'center' });
    // underline
    const tw = doc.getTextWidth('QUOTATION');
    doc.setLineWidth(0.4);
    doc.line(PW / 2 - tw / 2, y + 0.8, PW / 2 + tw / 2, y + 0.8);
    y += 8;
  }

  // ── Items table ─────────────────────────────────────────────────
  const tableBody = (bill.items || []).map((item, idx) => [
    idx + 1,
    item.itemName,
    item.quantity,
    Number(item.unitPrice).toFixed(2),
    Number(item.totalPrice).toFixed(2)
  ]);

  if (bill.labourCharge > 0) {
    tableBody.push([
      (bill.items?.length ?? 0) + 1,
      'Labour & Service Charges',
      '1',
      Number(bill.labourCharge).toFixed(2),
      Number(bill.labourCharge).toFixed(2)
    ]);
  }

  // Total row
  tableBody.push([
    { content: '', colSpan: 3, styles: { fillColor: [255, 255, 255] } },
    { content: 'TOTAL', styles: { fontStyle: 'bold', halign: 'right' } },
    { content: Number(bill.totalAmount).toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } }
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: 18 },
    head: [[
      { content: 'Sr.No.', styles: { halign: 'center' } },
      { content: 'Particular', styles: { halign: 'left' } },
      { content: 'Qty.', styles: { halign: 'center' } },
      { content: 'Rate', styles: { halign: 'right' } },
      { content: 'Amount', styles: { halign: 'right' } }
    ]],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 9.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [249, 248, 243],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.4
    },
    bodyStyles: {
      fillColor: [255, 255, 255]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      1: { halign: 'left' },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 30 }
    },
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.5
  });

  y = doc.lastAutoTable.finalY + 12;

  // ── Bank details (left) + Proprietor block (right) ──────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Bank Details :', ML, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const bankLines = [
    ['Bank Name', 'Panjab National Bank'],
    ['A/C No.', '0849050012971'],
    ['Branch-IFS Code', 'PUNB0084920']
  ];
  bankLines.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, ML, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${val}`, ML + 30, y);
    y += 5;
  });

  // Proprietor block (right side, vertically centred)
  const propX = MR - 48;
  const propStartY = doc.lastAutoTable.finalY + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text(businessDisplay, propX + 24, propStartY + 4, { align: 'center' });

  // Signature line
  const sigY = propStartY + 22;
  doc.setLineWidth(0.4);
  doc.line(propX, sigY, propX + 48, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Proprietor', propX + 24, sigY + 5, { align: 'center' });

  // ── Save / download ─────────────────────────────────────────────
  const filename = `${businessDisplay.replace(/ /g, '_')}_${bill.billNumber || bill.id}.pdf`;
  doc.save(filename);
}
