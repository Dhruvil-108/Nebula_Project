const Item = require('../models/Item');
const StockBatch = require('../models/StockBatch');
const PurchaseRequisition = require('../models/PurchaseRequisition');
const stockLedgerService = require('./stockLedgerService');
const emailService = require('./emailService');
const queueService = require('./queueService');

class InventoryNotificationService {
  constructor() {
    this.notifications = [];
    this.webhookSubscriptions = new Map(); // tenantId -> Array of { url, secret, events }
  }

  /**
   * Post an in-app notification and trigger background email/webhook dispatch
   */
  async notify({
    organizationId,
    eventType,
    title,
    message,
    severity = 'info', // 'info', 'warning', 'critical'
    metadata = {},
  }) {
    const notifRecord = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      organizationId: organizationId.toString(),
      eventType,
      title,
      message,
      severity,
      metadata,
      timestamp: new Date(),
      read: false,
    };

    this.notifications.unshift(notifRecord);
    if (this.notifications.length > 500) {
      this.notifications.pop();
    }

    // Trigger webhook dispatch if any subscriptions exist
    this.dispatchWebhooks(organizationId, eventType, notifRecord);

    return notifRecord;
  }

  /**
   * Scan items for low stock / reorder breaches
   */
  async checkLowStockAlerts(organizationId, itemId, warehouseId = null) {
    const item = await Item.findOne({ _id: itemId, organizationId });
    if (!item) return null;

    const balance = await stockLedgerService.getStockBalance(organizationId, itemId, warehouseId);
    const reorderLevel = item.reorderLevel || 10;
    const minLevel = item.minStockLevel || 5;

    if (balance.available <= minLevel) {
      return this.notify({
        organizationId,
        eventType: 'stock.critical_low',
        title: `Critical Low Stock: ${item.name}`,
        message: `SKU "${item.sku}" has dropped to ${balance.available} ${item.baseUom} (Min threshold: ${minLevel}). Immediate reorder required.`,
        severity: 'critical',
        metadata: { itemId, sku: item.sku, available: balance.available, minLevel },
      });
    }

    if (balance.available <= reorderLevel) {
      return this.notify({
        organizationId,
        eventType: 'stock.reorder_level',
        title: `Reorder Level Reached: ${item.name}`,
        message: `SKU "${item.sku}" is at ${balance.available} ${item.baseUom} (Reorder point: ${reorderLevel}).`,
        severity: 'warning',
        metadata: { itemId, sku: item.sku, available: balance.available, reorderLevel },
      });
    }

    return null;
  }

  /**
   * Scan batches expiring within specified days (default 30 days)
   */
  async scanExpiringBatches(organizationId, daysAhead = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const expiringBatches = await StockBatch.find({
      organizationId,
      status: 'active',
      remainingQuantity: { $gt: 0 },
      expiryDate: { $lte: futureDate, $gte: new Date() },
    })
      .populate('itemId', 'sku name baseUom')
      .populate('warehouseId', 'name')
      .lean();

    const alerts = [];
    for (const batch of expiringBatches) {
      const daysLeft = Math.ceil(
        (new Date(batch.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const alert = await this.notify({
        organizationId,
        eventType: 'batch.expiring_soon',
        title: `Batch Expiring in ${daysLeft} Days: ${batch.itemId?.name}`,
        message: `Batch "${batch.batchNumber}" with ${batch.remainingQuantity} units expires on ${new Date(batch.expiryDate).toLocaleDateString()}. Location: ${batch.warehouseId?.name}.`,
        severity: daysLeft <= 7 ? 'critical' : 'warning',
        metadata: {
          batchId: batch._id,
          batchNumber: batch.batchNumber,
          remainingQuantity: batch.remainingQuantity,
          expiryDate: batch.expiryDate,
        },
      });
      alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Register a webhook endpoint for a tenant
   */
  registerWebhook(organizationId, { url, secret = '', events = ['*'] }) {
    const tenantIdStr = organizationId.toString();
    const subs = this.webhookSubscriptions.get(tenantIdStr) || [];
    const newSub = {
      id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      url,
      secret,
      events,
      active: true,
      registeredAt: new Date(),
    };
    subs.push(newSub);
    this.webhookSubscriptions.set(tenantIdStr, subs);
    return newSub;
  }

  getWebhooks(organizationId) {
    return this.webhookSubscriptions.get(organizationId.toString()) || [];
  }

  /**
   * Dispatches webhooks to subscribed endpoints
   */
  async dispatchWebhooks(organizationId, eventType, payload) {
    const tenantIdStr = organizationId.toString();
    const subs = this.webhookSubscriptions.get(tenantIdStr) || [];

    for (const sub of subs) {
      if (!sub.active) continue;
      if (sub.events.includes('*') || sub.events.includes(eventType)) {
        // Enqueue webhook dispatch in background queue
        queueService.addJob(
          'webhook_dispatch',
          {
            subscriptionId: sub.id,
            targetUrl: sub.url,
            eventType,
            payload,
          },
          { maxRetries: 2 }
        );
      }
    }
  }

  getNotifications(organizationId) {
    const orgIdStr = organizationId.toString();
    return this.notifications.filter((n) => n.organizationId === orgIdStr);
  }
}

module.exports = new InventoryNotificationService();
