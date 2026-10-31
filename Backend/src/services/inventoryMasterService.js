const QRCode = require('qrcode');
const Item = require('../models/Item');
const ItemCategory = require('../models/ItemCategory');
const Warehouse = require('../models/Warehouse');
const WarehouseBin = require('../models/WarehouseBin');
const Supplier = require('../models/Supplier');
const counterService = require('./counterService');

/**
 * Inventory Master Data Service
 * Provides QR/barcode rendering, CSV bulk import validation/execution,
 * and standard CSV exports.
 */
class InventoryMasterService {
  /**
   * Generate QR Code as Data URL (base64 PNG)
   * @param {Object} payload - Object or string to encode
   */
  async generateQrCodeDataUrl(payload) {
    try {
      const dataString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const dataUrl = await QRCode.toDataURL(dataString, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 300,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      return dataUrl;
    } catch (err) {
      console.error('Failed to generate QR code:', err);
      throw new Error(`Failed to generate QR code: ${err.message}`);
    }
  }

  /**
   * Parse CSV string into array of object rows
   */
  parseCsv(csvContent) {
    if (!csvContent || typeof csvContent !== 'string') return [];
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    // Parse header
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV field parser handling quoted fields with commas
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const values = matches.map((v) => v.trim().replace(/^"|"$/g, '').trim());

      const rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] !== undefined ? values[idx] : '';
      });
      rows.push(rowObj);
    }
    return rows;
  }

  /**
   * Validate Items CSV before committing to database
   * Expected columns: sku (optional), name, category, brand, baseUom, standardCost, minStockLevel, reorderPoint, trackingType
   */
  async validateItemsCsv(organizationId, csvContent) {
    const rawRows = this.parseCsv(csvContent);
    if (rawRows.length === 0) {
      return {
        success: false,
        error: 'CSV file is empty or missing headers.',
        totalRows: 0,
        validCount: 0,
        errorCount: 0,
        errors: [],
        previewRows: [],
      };
    }

    const errors = [];
    const previewRows = [];
    const existingSkus = new Set(
      (await Item.find({ organizationId }).select('sku').lean()).map((i) => i.sku.toUpperCase())
    );
    const existingCategories = await ItemCategory.find({ organizationId }).lean();
    const catMap = new Map();
    existingCategories.forEach((c) => catMap.set(c.name.toLowerCase(), c._id));

    const pendingSkusInFile = new Set();

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 2; // 1-indexed, accounting for header
      const rowErrors = [];

      let sku = (row.sku || row.SKU || '').trim().toUpperCase();
      const name = (row.name || row.Name || '').trim();
      const categoryName = (row.category || row.Category || '').trim();
      const brand = (row.brand || row.Brand || '').trim();
      const baseUom = (row.baseUom || row.BaseUom || row.uom || 'PCS').trim().toUpperCase();
      const standardCost = parseFloat(row.standardCost || row.StandardCost || row.cost || '0');
      const minStockLevel = parseFloat(row.minStockLevel || row.MinStock || '0');
      const maxStockLevel = parseFloat(row.maxStockLevel || row.MaxStock || '0');
      const reorderPoint = parseFloat(row.reorderPoint || row.ReorderPoint || '0');
      const reorderQuantity = parseFloat(row.reorderQuantity || row.ReorderQty || '1');
      const trackingType = (row.trackingType || 'none').toLowerCase().trim();
      const description = (row.description || '').trim();

      if (!name) {
        rowErrors.push('Item name is required');
      }

      if (sku) {
        if (existingSkus.has(sku) || pendingSkusInFile.has(sku)) {
          rowErrors.push(`Duplicate SKU "${sku}" already exists or repeated in file`);
        } else {
          pendingSkusInFile.add(sku);
        }
      }

      if (isNaN(standardCost) || standardCost < 0) {
        rowErrors.push('Standard cost must be a non-negative number');
      }

      if (!['none', 'batch', 'serial'].includes(trackingType)) {
        rowErrors.push('Tracking type must be "none", "batch", or "serial"');
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNum,
          errors: rowErrors,
          data: row,
        });
      } else {
        previewRows.push({
          sku,
          name,
          categoryName,
          brand,
          baseUom: baseUom || 'PCS',
          standardCost: standardCost || 0,
          minStockLevel: minStockLevel || 0,
          maxStockLevel: maxStockLevel || 0,
          reorderPoint: reorderPoint || 0,
          reorderQuantity: reorderQuantity || 1,
          trackingType,
          description,
        });
      }
    }

    return {
      success: errors.length === 0,
      totalRows: rawRows.length,
      validCount: previewRows.length,
      errorCount: errors.length,
      errors,
      previewRows: previewRows.slice(0, 50), // Show up to 50 preview rows in UI
      canCommit: errors.length === 0 && previewRows.length > 0,
    };
  }

  /**
   * Commit verified CSV items to DB
   */
  async commitItemsImport(organizationId, items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('No items provided for import.');
    }

    const createdItems = [];
    const catMap = new Map();
    const categories = await ItemCategory.find({ organizationId }).lean();
    categories.forEach((c) => catMap.set(c.name.toLowerCase(), c._id));

    for (const itemData of items) {
      // Find or create category if specified
      let categoryId = null;
      if (itemData.categoryName) {
        const lowerCat = itemData.categoryName.toLowerCase();
        if (catMap.has(lowerCat)) {
          categoryId = catMap.get(lowerCat);
        } else {
          // Auto create category
          const code = itemData.categoryName.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6) || 'CAT';
          const newCat = await ItemCategory.create({
            organizationId,
            name: itemData.categoryName,
            code: `${code}-${Date.now().toString().slice(-4)}`,
          });
          catMap.set(lowerCat, newCat._id);
          categoryId = newCat._id;
        }
      }

      // Generate SKU if blank
      let sku = itemData.sku;
      if (!sku) {
        sku = await counterService.generateItemSku(organizationId);
      }

      const item = await Item.create({
        organizationId,
        sku,
        name: itemData.name,
        description: itemData.description || '',
        categoryId,
        brand: itemData.brand || '',
        baseUom: itemData.baseUom || 'PCS',
        standardCost: itemData.standardCost || 0,
        minStockLevel: itemData.minStockLevel || 0,
        maxStockLevel: itemData.maxStockLevel || 0,
        reorderPoint: itemData.reorderPoint || 0,
        reorderQuantity: itemData.reorderQuantity || 1,
        trackingType: itemData.trackingType || 'none',
      });
      createdItems.push(item);
    }

    return {
      success: true,
      importedCount: createdItems.length,
    };
  }

  /**
   * Export items as CSV string
   */
  async exportItemsCsv(organizationId, filter = {}) {
    const items = await Item.find({ organizationId, ...filter })
      .populate('categoryId', 'name code')
      .sort({ sku: 1 })
      .lean();

    const headers = [
      'SKU',
      'Name',
      'Category',
      'Brand',
      'Base UoM',
      'Standard Cost',
      'Min Stock Level',
      'Max Stock Level',
      'Reorder Point',
      'Reorder Qty',
      'Tracking Type',
      'Has Expiry',
      'Status',
    ];

    const rows = items.map((item) => [
      `"${item.sku}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.categoryId ? item.categoryId.name : ''}"`,
      `"${(item.brand || '').replace(/"/g, '""')}"`,
      `"${item.baseUom}"`,
      item.standardCost || 0,
      item.minStockLevel || 0,
      item.maxStockLevel || 0,
      item.reorderPoint || 0,
      item.reorderQuantity || 1,
      `"${item.trackingType}"`,
      item.hasExpiry ? 'Yes' : 'No',
      item.active ? 'Active' : 'Inactive',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Export Suppliers as CSV string
   */
  async exportSuppliersCsv(organizationId) {
    const suppliers = await Supplier.find({ organizationId }).sort({ supplierCode: 1 }).lean();

    const headers = [
      'Supplier Code',
      'Name',
      'Contact Person',
      'Email',
      'Phone',
      'Tax ID / GSTIN',
      'Payment Method',
      'Payment Term Days',
      'Lead Time Days',
      'Currency',
      'Rating',
      'Status',
    ];

    const rows = suppliers.map((s) => [
      `"${s.supplierCode}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.contactPerson?.name || ''}"`,
      `"${s.contactPerson?.email || ''}"`,
      `"${s.contactPerson?.phone || ''}"`,
      `"${s.taxDetails?.taxId || ''}"`,
      `"${s.paymentTerms?.paymentMethod || 'net_30'}"`,
      s.paymentTerms?.paymentTermDays || 30,
      s.leadTimeDays || 7,
      `"${s.currency || 'USD'}"`,
      s.rating?.score || 5.0,
      s.active ? 'Active' : 'Inactive',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

module.exports = new InventoryMasterService();
