/**
 * Seed realistic Inventory Master Data for Nebula Hub ERP.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Organization = require('./models/Organization');
const User = require('./models/User');
const ItemCategory = require('./models/ItemCategory');
const Warehouse = require('./models/Warehouse');
const WarehouseZone = require('./models/WarehouseZone');
const WarehouseBin = require('./models/WarehouseBin');
const Supplier = require('./models/Supplier');
const Item = require('./models/Item');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nebula';

async function seedInventory() {
  console.log('Connecting to MongoDB at:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  const org = (await Organization.findOne({ isActive: true })) || (await Organization.findOne());
  if (!org) {
    console.error('No organization found to seed inventory data.');
    process.exit(1);
  }

  const orgId = org._id;
  console.log(`Target Organization: ${org.name} (${orgId})`);

  // 1. Categories (Hierarchical)
  console.log('Seeding Categories...');
  await ItemCategory.deleteMany({ organizationId: orgId });

  const parentHardware = await ItemCategory.create({
    organizationId: orgId,
    name: 'IT Hardware & Compute',
    code: 'CAT-HW',
    description: 'Core computational infrastructure, servers, and components',
  });

  const catServers = await ItemCategory.create({
    organizationId: orgId,
    name: 'Enterprise Servers',
    code: 'CAT-SRV',
    parentId: parentHardware._id,
    description: '1U/2U/4U Rackmount and blade servers',
  });

  const catStorage = await ItemCategory.create({
    organizationId: orgId,
    name: 'Storage & SSDs',
    code: 'CAT-STR',
    parentId: parentHardware._id,
    description: 'NVMe, SAS, and SATA enterprise storage media',
  });

  const catNetworking = await ItemCategory.create({
    organizationId: orgId,
    name: 'Networking Equipment',
    code: 'CAT-NET',
    parentId: parentHardware._id,
    description: 'Managed switches, routers, and fiber transceivers',
  });

  const parentOffice = await ItemCategory.create({
    organizationId: orgId,
    name: 'Office & Facilities',
    code: 'CAT-FAC',
    description: 'Workplace equipment, peripherals, and ergonomics',
  });

  const catPeripherals = await ItemCategory.create({
    organizationId: orgId,
    name: 'Employee Workstation Gear',
    code: 'CAT-PER',
    parentId: parentOffice._id,
    description: 'Laptops, monitors, docking stations, and peripherals',
  });

  // 2. Warehouses, Zones & Bins
  console.log('Seeding Warehouses, Zones & Bins...');
  await Warehouse.deleteMany({ organizationId: orgId });
  await WarehouseZone.deleteMany({ organizationId: orgId });
  await WarehouseBin.deleteMany({ organizationId: orgId });

  const whMain = await Warehouse.create({
    organizationId: orgId,
    code: 'WH-MDC-01',
    name: 'Primary Hub & Logistics Depot',
    isDefault: true,
    address: { street: '100 Silicon Way', city: 'San Jose', state: 'CA', postalCode: '95134', country: 'US' },
    contactPerson: { name: 'Alex Vance', email: 'avance@nebulahub.internal', phone: '+1-408-555-0144' },
  });

  const whEast = await Warehouse.create({
    organizationId: orgId,
    code: 'WH-EDC-02',
    name: 'East Coast Distribution Center',
    isDefault: false,
    address: { street: '450 Innovation Parkway', city: 'Boston', state: 'MA', postalCode: '02110', country: 'US' },
    contactPerson: { name: 'Elena Rostova', email: 'erostova@nebulahub.internal', phone: '+1-617-555-0182' },
  });

  // Zones for WH-MDC-01
  const zoneStorage = await WarehouseZone.create({
    organizationId: orgId,
    warehouseId: whMain._id,
    code: 'ZONE-STR-A',
    name: 'Main High-Bay Racks',
    zoneType: 'storage',
  });

  const zoneVault = await WarehouseZone.create({
    organizationId: orgId,
    warehouseId: whMain._id,
    code: 'ZONE-VAULT',
    name: 'Secure Vault (High Value Assets)',
    zoneType: 'storage',
  });

  const zoneReceiving = await WarehouseZone.create({
    organizationId: orgId,
    warehouseId: whMain._id,
    code: 'ZONE-RCV-DOCK',
    name: 'Inbound Staging & Inspection Dock',
    zoneType: 'receiving',
  });

  // Bins
  const binA1 = await WarehouseBin.create({
    organizationId: orgId,
    warehouseId: whMain._id,
    zoneId: zoneStorage._id,
    binCode: 'MDC-A1-01',
    barcode: 'BAR-MDC-A1-01',
    capacity: { maxWeightKg: 1000, maxVolumeCubicM: 15 },
  });

  const binA2 = await WarehouseBin.create({
    organizationId: orgId,
    warehouseId: whMain._id,
    zoneId: zoneStorage._id,
    binCode: 'MDC-A1-02',
    barcode: 'BAR-MDC-A1-02',
    capacity: { maxWeightKg: 1000, maxVolumeCubicM: 15 },
  });

  const binVault1 = await WarehouseBin.create({
    organizationId: orgId,
    warehouseId: whMain._id,
    zoneId: zoneVault._id,
    binCode: 'MDC-VLT-01',
    barcode: 'BAR-MDC-VLT-01',
    capacity: { maxWeightKg: 300, maxVolumeCubicM: 5 },
  });

  // 3. Suppliers
  console.log('Seeding Suppliers...');
  await Supplier.deleteMany({ organizationId: orgId });

  const supCisco = await Supplier.create({
    organizationId: orgId,
    supplierCode: 'SUP-NET-001',
    name: 'Quantum Networks Global',
    contactPerson: { name: 'Marcus Sterling', email: 'm.sterling@quantumnet.com', phone: '+1-415-555-8821' },
    taxDetails: { taxId: 'TAX-US-8829101', panNumber: 'QNTM8829N' },
    paymentTerms: { paymentTermDays: 30, paymentMethod: 'net_30' },
    leadTimeDays: 7,
    currency: 'USD',
    address: { street: '200 Fiber Optic Blvd', city: 'San Jose', state: 'CA', country: 'US' },
    rating: { score: 4.8, totalOrders: 24, onTimeDeliveryRate: 98, rejectionRate: 0.5 },
  });

  const supDell = await Supplier.create({
    organizationId: orgId,
    supplierCode: 'SUP-SRV-002',
    name: 'Apex Compute & Cloud Systems',
    contactPerson: { name: 'Rachel Davies', email: 'rdavies@apexcompute.io', phone: '+1-512-555-3392' },
    taxDetails: { taxId: 'TAX-US-7718290', panNumber: 'APEX7718C' },
    paymentTerms: { paymentTermDays: 45, paymentMethod: 'net_30' },
    leadTimeDays: 14,
    currency: 'USD',
    address: { street: '1 Dell Way', city: 'Round Rock', state: 'TX', country: 'US' },
    rating: { score: 4.9, totalOrders: 42, onTimeDeliveryRate: 96, rejectionRate: 0.8 },
  });

  const supCrucial = await Supplier.create({
    organizationId: orgId,
    supplierCode: 'SUP-MEM-003',
    name: 'Precision Memory & Storage Labs',
    contactPerson: { name: 'Kevin Tanaka', email: 'ktanaka@precisionmem.com', phone: '+1-208-555-9912' },
    taxDetails: { taxId: 'TAX-US-6619023', panNumber: 'PRCS6619M' },
    paymentTerms: { paymentTermDays: 15, paymentMethod: 'net_15' },
    leadTimeDays: 5,
    currency: 'USD',
    address: { street: '8000 S Federal Way', city: 'Boise', state: 'ID', country: 'US' },
    rating: { score: 4.7, totalOrders: 35, onTimeDeliveryRate: 99, rejectionRate: 0.2 },
  });

  // 4. Items / Catalog
  console.log('Seeding Items...');
  await Item.deleteMany({ organizationId: orgId });

  const item1 = await Item.create({
    organizationId: orgId,
    sku: 'SKU-SRV-R750',
    barcode: '8901234567801',
    name: 'Dell PowerEdge R750 2U Server',
    description: 'Dual Intel Xeon Gold 6330, 24x NVMe bays, redundant 1400W Titanium PSUs',
    categoryId: catServers._id,
    brand: 'Dell Technologies',
    baseUom: 'PCS',
    uomConversions: [
      { uom: 'BOX', conversionFactor: 1 },
      { uom: 'PALLET', conversionFactor: 6 },
    ],
    trackingType: 'serial',
    hasExpiry: false,
    minStockLevel: 2,
    maxStockLevel: 15,
    reorderPoint: 4,
    reorderQuantity: 6,
    standardCost: 4850.0,
    currency: 'USD',
    valuationMethod: 'fifo',
    defaultWarehouseId: whMain._id,
    defaultBinId: binA1._id,
    preferredSupplierId: supDell._id,
    variants: [{ name: 'Chassis Form Factor', options: ['2U Rackmount'] }],
    active: true,
  });

  const item2 = await Item.create({
    organizationId: orgId,
    sku: 'SKU-SSD-384TB',
    barcode: '8901234567802',
    name: 'Samsung PM9A3 3.84TB U.2 Enterprise NVMe SSD',
    description: 'PCIe 4.0 x4 U.2 Enterprise SSD, 6900 MB/s Read, 1.3 DWPD',
    categoryId: catStorage._id,
    brand: 'Samsung Electronics',
    baseUom: 'PCS',
    uomConversions: [
      { uom: 'PACK10', conversionFactor: 10 },
      { uom: 'CARTON', conversionFactor: 50 },
    ],
    trackingType: 'batch',
    hasExpiry: true,
    shelfLifeDays: 1825,
    minStockLevel: 10,
    maxStockLevel: 80,
    reorderPoint: 20,
    reorderQuantity: 30,
    standardCost: 380.0,
    currency: 'USD',
    valuationMethod: 'fifo',
    defaultWarehouseId: whMain._id,
    defaultBinId: binVault1._id,
    preferredSupplierId: supCrucial._id,
    active: true,
  });

  const item3 = await Item.create({
    organizationId: orgId,
    sku: 'SKU-RAM-64GB',
    barcode: '8901234567803',
    name: 'Micron 64GB DDR4-3200 ECC RDIMM',
    description: 'Server RAM module 2Rx4 CL22 1.2V registered ECC memory',
    categoryId: catStorage._id,
    brand: 'Micron',
    baseUom: 'PCS',
    uomConversions: [{ uom: 'TRAY', conversionFactor: 25 }],
    trackingType: 'batch',
    hasExpiry: false,
    minStockLevel: 16,
    maxStockLevel: 128,
    reorderPoint: 32,
    reorderQuantity: 64,
    standardCost: 145.0,
    currency: 'USD',
    valuationMethod: 'weighted_average',
    defaultWarehouseId: whMain._id,
    defaultBinId: binVault1._id,
    preferredSupplierId: supCrucial._id,
    active: true,
  });

  const item4 = await Item.create({
    organizationId: orgId,
    sku: 'SKU-SW-48P-10G',
    barcode: '8901234567804',
    name: 'Cisco Catalyst 9300 48-Port Multi-Gigabit Switch',
    description: 'Layer 3 Enterprise managed switch with 48x 10G ports and redundant uplinks',
    categoryId: catNetworking._id,
    brand: 'Cisco',
    baseUom: 'PCS',
    trackingType: 'serial',
    hasExpiry: false,
    minStockLevel: 1,
    maxStockLevel: 8,
    reorderPoint: 2,
    reorderQuantity: 4,
    standardCost: 3200.0,
    currency: 'USD',
    valuationMethod: 'fifo',
    defaultWarehouseId: whMain._id,
    defaultBinId: binA2._id,
    preferredSupplierId: supCisco._id,
    active: true,
  });

  const item5 = await Item.create({
    organizationId: orgId,
    sku: 'SKU-LAP-MBP16',
    barcode: '8901234567805',
    name: 'Apple MacBook Pro 16" (M3 Max, 64GB, 1TB)',
    description: 'Engineering Standard Laptop Kit for high-performance software developers',
    categoryId: catPeripherals._id,
    brand: 'Apple',
    baseUom: 'PCS',
    trackingType: 'serial',
    hasExpiry: false,
    minStockLevel: 5,
    maxStockLevel: 30,
    reorderPoint: 8,
    reorderQuantity: 10,
    standardCost: 3499.0,
    currency: 'USD',
    valuationMethod: 'fifo',
    defaultWarehouseId: whMain._id,
    defaultBinId: binVault1._id,
    active: true,
  });

  // Attach items to supplier price list
  supDell.itemPriceList = [
    { itemId: item1._id, supplierPartNumber: 'DELL-R750-X', unitPrice: 4650.0, minOrderQty: 1, leadTimeDays: 14 },
  ];
  await supDell.save();

  supCrucial.itemPriceList = [
    { itemId: item2._id, supplierPartNumber: 'SAM-384-U2', unitPrice: 360.0, minOrderQty: 5, leadTimeDays: 5 },
    { itemId: item3._id, supplierPartNumber: 'MIC-64G-RDIMM', unitPrice: 138.0, minOrderQty: 10, leadTimeDays: 5 },
  ];
  await supCrucial.save();

  supCisco.itemPriceList = [
    { itemId: item4._id, supplierPartNumber: 'CISCO-C9300-48', unitPrice: 3050.0, minOrderQty: 1, leadTimeDays: 7 },
  ];
  await supCisco.save();

  // 5. Stock Movements & Ledger Transactions
  console.log('Seeding Stock Ledger, Batches, and Serials...');
  const StockLedger = require('./models/StockLedger');
  const StockBatch = require('./models/StockBatch');
  const StockSerial = require('./models/StockSerial');
  const StockMovement = require('./models/StockMovement');
  const stockLedgerService = require('./services/stockLedgerService');

  await StockLedger.deleteMany({ organizationId: orgId });
  await StockBatch.deleteMany({ organizationId: orgId });
  await StockSerial.deleteMany({ organizationId: orgId });
  await StockMovement.deleteMany({ organizationId: orgId });

  // Receipt 1: Dell Servers
  await stockLedgerService.postReceipt({
    organizationId: orgId,
    documentNumber: 'GRN-2026-0001',
    itemId: item1._id,
    warehouseId: whMain._id,
    binId: binA1._id,
    quantity: 5,
    unitCost: 4650.0,
    serialNumbers: ['SN-R750-001', 'SN-R750-002', 'SN-R750-003', 'SN-R750-004', 'SN-R750-005'],
    notes: 'Initial enterprise rack shipment receipt',
  });

  // Receipt 2: Samsung SSDs
  await stockLedgerService.postReceipt({
    organizationId: orgId,
    documentNumber: 'GRN-2026-0002',
    itemId: item2._id,
    warehouseId: whMain._id,
    binId: binVault1._id,
    quantity: 50,
    unitCost: 360.0,
    batchNumber: 'LOT-2026-SAM01',
    manufactureDate: new Date('2026-01-15'),
    expiryDate: new Date('2031-01-15'),
    notes: 'Bulk NVMe storage replenishment',
  });

  // Receipt 3: Micron RAM
  await stockLedgerService.postReceipt({
    organizationId: orgId,
    documentNumber: 'GRN-2026-0003',
    itemId: item3._id,
    warehouseId: whMain._id,
    binId: binVault1._id,
    quantity: 100,
    unitCost: 138.0,
    batchNumber: 'LOT-2026-MIC02',
    manufactureDate: new Date('2026-02-10'),
    notes: 'High-speed DDR4 RDIMM tray modules',
  });

  // Receipt 4: Cisco Switches
  await stockLedgerService.postReceipt({
    organizationId: orgId,
    documentNumber: 'GRN-2026-0004',
    itemId: item4._id,
    warehouseId: whMain._id,
    binId: binA2._id,
    quantity: 4,
    unitCost: 3050.0,
    serialNumbers: ['SN-CS-9300-A1', 'SN-CS-9300-A2', 'SN-CS-9300-A3', 'SN-CS-9300-A4'],
    notes: 'Network core upgrade switches',
  });

  // Receipt 5: MacBook Pros
  await stockLedgerService.postReceipt({
    organizationId: orgId,
    documentNumber: 'GRN-2026-0005',
    itemId: item5._id,
    warehouseId: whMain._id,
    binId: binVault1._id,
    quantity: 10,
    unitCost: 3499.0,
    serialNumbers: [
      'SN-MBP16-001',
      'SN-MBP16-002',
      'SN-MBP16-003',
      'SN-MBP16-004',
      'SN-MBP16-005',
      'SN-MBP16-006',
      'SN-MBP16-007',
      'SN-MBP16-008',
      'SN-MBP16-009',
      'SN-MBP16-010',
    ],
    notes: 'Developer workstation fleet batch',
  });

  // Issue 1: Developer Laptop Issue
  await stockLedgerService.postIssue({
    organizationId: orgId,
    documentNumber: 'ISS-2026-0001',
    itemId: item5._id,
    warehouseId: whMain._id,
    binId: binVault1._id,
    quantity: 1,
    reasonCode: 'equipment_assignment',
    serialNumbers: ['SN-MBP16-001'],
    notes: 'Issued to Principal Engineer for onboarding kit',
  });

  // Transfer 1: Inter-warehouse dispatch to East Coast DC (2 laptops)
  await stockLedgerService.postTransferDispatch({
    organizationId: orgId,
    sourceWarehouseId: whMain._id,
    destinationWarehouseId: whEast._id,
    lines: [
      {
        itemId: item5._id,
        actualQty: 2,
        unitCost: 3499.0,
        sourceBinId: binVault1._id,
        serialNumbers: ['SN-MBP16-002', 'SN-MBP16-003'],
      },
    ],
    notes: 'Regional fulfillment transfer to Boston DC',
  });

  console.log(`✅ Seeded Categories, Warehouses, Suppliers, Items, and 5 GRN Receipts + 1 Issue + 1 Transfer for ${org.name}!`);
  await mongoose.disconnect();
}

seedInventory().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
