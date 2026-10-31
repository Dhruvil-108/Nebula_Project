const PDFDocument = require('pdfkit');

/**
 * Enterprise PDF Generator for Procurement Documents:
 * - Purchase Order (PO)
 * - Goods Receipt Note (GRN)
 * - Debit Note (RTV)
 */
class ProcurementPdfService {
  /**
   * Generates a branded Purchase Order PDF Buffer
   */
  async generatePurchaseOrderPdf({ po, organization = {}, supplier = {}, warehouse = {} }) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `Purchase Order - ${po.poNumber || 'PO'}`,
            Author: organization.name || 'Nebula HUB',
            Subject: `PO #${po.poNumber}`,
            Creator: 'Nebula HUB Enterprise ERP',
          },
        });

        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const orgName = organization.name || 'Nebula Enterprise Operations';
        const supName = supplier.name || 'Authorized Supplier';
        const supEmail = supplier.contactEmail || supplier.email || 'supplier@partner.com';
        const supPhone = supplier.contactPhone || supplier.phone || 'N/A';
        const whName = warehouse.name || 'Central Facility';
        const whCode = warehouse.code || 'WH-MAIN';
        const currency = po.currency || 'USD';

        // 1. Accent Bars
        doc.rect(0, 0, 595.28, 6).fill('#F97316'); // Nebula Orange
        doc.rect(0, 6, 180, 3).fill('#6366F1'); // Indigo

        // 2. Header
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#0F172A').text(orgName, 40, 25);
        doc.fontSize(9).font('Helvetica').fillColor('#64748B').text('ENTERPRISE RESOURCE PLANNING HUB', 40, 48);

        // Document Badge
        doc.rect(420, 25, 135, 45).fill('#F8FAFC');
        doc.rect(420, 25, 135, 45).lineWidth(1).stroke('#E2E8F0');
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#EA580C').text('PURCHASE ORDER', 430, 32);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E293B').text(po.poNumber, 430, 48);

        // 3. Metadata Grid
        const yStart = 85;
        doc.rect(40, yStart, 515, 65).fill('#F8FAFC');
        doc.rect(40, yStart, 515, 65).lineWidth(0.5).stroke('#CBD5E1');

        // Column 1: Vendor Details
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569').text('VENDOR / SUPPLIER:', 50, yStart + 8);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A').text(supName, 50, yStart + 20);
        doc.fontSize(8).font('Helvetica').fillColor('#64748B').text(`${supEmail} | ${supPhone}`, 50, yStart + 35);
        if (supplier.taxId) {
          doc.text(`Tax / GST: ${supplier.taxId}`, 50, yStart + 48);
        }

        // Column 2: Delivery & Terms
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569').text('SHIP TO / WAREHOUSE:', 300, yStart + 8);
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#0F172A').text(`${whName} (${whCode})`, 300, yStart + 20);
        doc.fontSize(8).font('Helvetica').fillColor('#64748B').text(`Payment Terms: ${po.paymentTerms || 'Net 30'}`, 300, yStart + 35);
        doc.text(`Order Date: ${new Date(po.orderDate || Date.now()).toLocaleDateString()}`, 300, yStart + 48);

        // 4. Items Table Header
        const tableY = yStart + 80;
        doc.rect(40, tableY, 515, 22).fill('#0F172A');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF');
        doc.text('#', 48, tableY + 6);
        doc.text('ITEM / DESCRIPTION', 70, tableY + 6);
        doc.text('QTY', 310, tableY + 6);
        doc.text('UOM', 355, tableY + 6);
        doc.text('UNIT PRICE', 400, tableY + 6);
        doc.text('TAX', 465, tableY + 6);
        doc.text('TOTAL', 505, tableY + 6);

        // 5. Items Rows
        let currentY = tableY + 22;
        po.items.forEach((item, index) => {
          const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
          doc.rect(40, currentY, 515, 22).fill(rowBg);
          doc.rect(40, currentY, 515, 22).lineWidth(0.5).stroke('#E2E8F0');

          const itemName = item.itemId?.name || item.description || `Item #${index + 1}`;
          const itemSku = item.itemId?.sku ? `[${item.itemId.sku}] ` : '';

          doc.fontSize(8).font('Helvetica').fillColor('#334155');
          doc.text(String(index + 1), 48, currentY + 6);
          doc.text(`${itemSku}${itemName}`.slice(0, 45), 70, currentY + 6);
          doc.text(String(item.orderedQuantity), 310, currentY + 6);
          doc.text(item.uom || 'PCS', 355, currentY + 6);
          doc.text(`${currency} ${Number(item.unitPrice).toFixed(2)}`, 400, currentY + 6);
          doc.text(`${item.taxRate}%`, 465, currentY + 6);
          doc.text(`${currency} ${Number(item.lineTotal).toFixed(2)}`, 505, currentY + 6);

          currentY += 22;
        });

        // 6. Summary Totals Box
        currentY += 10;
        doc.rect(340, currentY, 215, 70).fill('#F8FAFC');
        doc.rect(340, currentY, 215, 70).lineWidth(0.5).stroke('#CBD5E1');

        doc.fontSize(9).font('Helvetica').fillColor('#475569');
        doc.text('Subtotal:', 355, currentY + 10);
        doc.text(`${currency} ${Number(po.subtotal || 0).toFixed(2)}`, 450, currentY + 10, { align: 'right', width: 90 });

        doc.text('Tax Total:', 355, currentY + 26);
        doc.text(`${currency} ${Number(po.taxTotal || 0).toFixed(2)}`, 450, currentY + 26, { align: 'right', width: 90 });

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A');
        doc.text('Grand Total:', 355, currentY + 45);
        doc.fillColor('#EA580C').text(`${currency} ${Number(po.grandTotal || 0).toFixed(2)}`, 450, currentY + 45, { align: 'right', width: 90 });

        // 7. Terms & Instructions
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#334155').text('TERMS & CONDITIONS:', 40, currentY + 10);
        doc.fontSize(7).font('Helvetica').fillColor('#64748B').text(
          po.termsAndConditions || 'Standard delivery terms apply. Please reference the PO Number on all shipments and invoices.',
          40,
          currentY + 25,
          { width: 280 }
        );

        // 8. Signatures & Approvals Box
        const sigY = currentY + 95;
        doc.rect(40, sigY, 240, 50).fill('#FFFFFF');
        doc.rect(40, sigY, 240, 50).lineWidth(0.5).stroke('#CBD5E1');
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#475569').text('AUTHORIZED PROCUREMENT OFFICER', 50, sigY + 8);
        doc.fontSize(8).font('Helvetica').fillColor('#0F172A').text(
          po.procurementApproval?.status === 'approved' ? 'Digitally Verified & Approved' : 'Draft / Pending',
          50,
          sigY + 28
        );

        doc.rect(315, sigY, 240, 50).fill('#FFFFFF');
        doc.rect(315, sigY, 240, 50).lineWidth(0.5).stroke('#CBD5E1');
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#475569').text('SUPPLIER ACKNOWLEDGMENT', 325, sigY + 8);
        doc.fontSize(8).font('Helvetica').fillColor('#94A3B8').text('Signature / Stamp & Date', 325, sigY + 30);

        // Footer
        doc.fontSize(7).font('Helvetica').fillColor('#94A3B8').text(
          `Generated automatically by Nebula HUB ERP • Version ${po.version || 1} • Immutable Ledger Backed`,
          40,
          780,
          { align: 'center', width: 515 }
        );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Generates a branded Goods Receipt Note (GRN) PDF Buffer
   */
  async generateGrnPdf({ grn, po = {}, organization = {}, supplier = {}, warehouse = {} }) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `Goods Receipt Note - ${grn.grnNumber}`,
            Author: organization.name || 'Nebula HUB',
            Subject: `GRN #${grn.grnNumber}`,
            Creator: 'Nebula HUB Enterprise ERP',
          },
        });

        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const orgName = organization.name || 'Nebula Enterprise Operations';
        const supName = supplier.name || 'Vendor Partner';
        const whName = warehouse.name || 'Receiving Dock';

        // 1. Accent Bars
        doc.rect(0, 0, 595.28, 6).fill('#10B981'); // Emerald Green for GRN Receipt
        doc.rect(0, 6, 180, 3).fill('#0EA5E9'); // Sky Blue

        // 2. Header
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#0F172A').text(orgName, 40, 25);
        doc.fontSize(9).font('Helvetica').fillColor('#64748B').text('INVENTORY QUALITY INSPECTION & RECEIPT', 40, 48);

        // Badge
        doc.rect(400, 25, 155, 45).fill('#F0FDF4');
        doc.rect(400, 25, 155, 45).lineWidth(1).stroke('#BBF7D0');
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#16A34A').text('GOODS RECEIPT NOTE', 410, 32);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E293B').text(grn.grnNumber, 410, 48);

        // 3. Metadata
        const yStart = 85;
        doc.rect(40, yStart, 515, 60).fill('#F8FAFC');
        doc.rect(40, yStart, 515, 60).lineWidth(0.5).stroke('#CBD5E1');

        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569').text('SUPPLIER:', 50, yStart + 8);
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#0F172A').text(supName, 50, yStart + 20);
        doc.fontSize(8).font('Helvetica').fillColor('#64748B').text(`PO Reference: ${po.poNumber || 'N/A'}`, 50, yStart + 35);

        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569').text('RECEIVING DETAILS:', 300, yStart + 8);
        doc.fontSize(9).font('Helvetica').fillColor('#0F172A').text(`Dock: ${whName}`, 300, yStart + 20);
        doc.fontSize(8).font('Helvetica').fillColor('#64748B').text(
          `Date: ${new Date(grn.receivedDate || Date.now()).toLocaleDateString()} | Challan: ${grn.deliveryChallanNumber || 'N/A'}`,
          300,
          yStart + 35
        );

        // 4. Inspection Table
        const tableY = yStart + 75;
        doc.rect(40, tableY, 515, 22).fill('#0F172A');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF');
        doc.text('#', 48, tableY + 6);
        doc.text('ITEM / SKU', 70, tableY + 6);
        doc.text('ORDERED', 250, tableY + 6);
        doc.text('RECEIVED', 310, tableY + 6);
        doc.text('ACCEPTED', 370, tableY + 6);
        doc.text('REJECTED', 430, tableY + 6);
        doc.text('BATCH / SERIAL', 485, tableY + 6);

        let currentY = tableY + 22;
        grn.items.forEach((item, index) => {
          const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
          doc.rect(40, currentY, 515, 24).fill(rowBg);
          doc.rect(40, currentY, 515, 24).lineWidth(0.5).stroke('#E2E8F0');

          const itemSku = item.itemId?.sku || item.itemId?.name || `Item #${index + 1}`;
          const batchInfo = item.batchNumber || (item.serialNumbers?.length ? `${item.serialNumbers.length} Serials` : '-');

          doc.fontSize(8).font('Helvetica').fillColor('#334155');
          doc.text(String(index + 1), 48, currentY + 7);
          doc.text(itemSku.slice(0, 30), 70, currentY + 7);
          doc.text(String(item.orderedQuantity), 250, currentY + 7);
          doc.text(String(item.receivedQuantity), 310, currentY + 7);
          doc.font('Helvetica-Bold').fillColor('#16A34A').text(String(item.acceptedQuantity), 370, currentY + 7);

          if (item.rejectedQuantity > 0) {
            doc.fillColor('#DC2626').text(String(item.rejectedQuantity), 430, currentY + 7);
          } else {
            doc.fillColor('#94A3B8').text('0', 430, currentY + 7);
          }

          doc.font('Helvetica').fillColor('#475569').text(batchInfo, 485, currentY + 7);
          currentY += 24;
        });

        // 5. Stock Ledger Status & Signatures
        currentY += 20;
        doc.rect(40, currentY, 515, 45).fill('#F0FDF4');
        doc.rect(40, currentY, 515, 45).lineWidth(0.5).stroke('#BBF7D0');

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#15803D');
        doc.text('STOCK LEDGER POSTING STATUS:', 50, currentY + 10);
        doc.fontSize(8).font('Helvetica').fillColor('#166534');
        doc.text(
          grn.stockLedgerPosted
            ? '✅ Successfully posted to immutable Stock Ledger. Inventory balances have been incremented.'
            : '⏳ Pending final physical inspection & ledger posting.',
          50,
          currentY + 25
        );

        // Signatures
        const sigY = currentY + 65;
        doc.rect(40, sigY, 240, 50).fill('#FFFFFF');
        doc.rect(40, sigY, 240, 50).lineWidth(0.5).stroke('#CBD5E1');
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#475569').text('STOREKEEPER / RECEIVER SIGNATURE', 50, sigY + 8);
        doc.fontSize(8).font('Helvetica').fillColor('#0F172A').text('Verified & Quantity Checked', 50, sigY + 28);

        doc.rect(315, sigY, 240, 50).fill('#FFFFFF');
        doc.rect(315, sigY, 240, 50).lineWidth(0.5).stroke('#CBD5E1');
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#475569').text('CARRIER / TRANSPORTER ACKNOWLEDGMENT', 325, sigY + 8);
        doc.fontSize(8).font('Helvetica').fillColor('#94A3B8').text(grn.carrier || 'Delivered by Driver', 325, sigY + 28);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = new ProcurementPdfService();
