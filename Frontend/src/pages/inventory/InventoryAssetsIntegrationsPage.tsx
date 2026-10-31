import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Laptop,
  Layers,
  FileSpreadsheet,
  Bell,
  Webhook,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Check,
  Building2,
  UserCheck,
  Package,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getAssetAssignments,
  getEquipmentKits,
  createEquipmentKit,
  issueAssets,
  initiateExitChecklist,
  processExitReturn,
  getAccountingEvents,
  getInventoryNotifications,
  scanExpiringBatches,
  registerWebhook,
  getWebhooks,
} from '../../lib/inventoryIntegrationsApi';
import { useWarehouses, useInventoryItems } from '../../hooks/useInventory';
import type {
  EmployeeAssetAssignment,
  EquipmentKit,
  AccountingEvent,
} from '../../types/inventoryIntegrations';

type IntegrationTab = 'assets' | 'kits' | 'accounting' | 'alerts';

export const InventoryAssetsIntegrationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<IntegrationTab>('assets');

  // Modals state
  const [issuingAssignment, setIssuingAssignment] = useState<EmployeeAssetAssignment | null>(null);
  const [returningAssignment, setReturningAssignment] = useState<EmployeeAssetAssignment | null>(null);
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);

  // Forms state
  const [issueWarehouseId, setIssueWarehouseId] = useState('');
  const [serialInputs, setSerialInputs] = useState<Record<string, string>>({});
  const [exitRemarks, setExitRemarks] = useState('');
  const [returnWarehouseId, setReturnWarehouseId] = useState('');
  const [returnConditions, setReturnConditions] = useState<Record<string, string>>({});

  // Queries
  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assetAssignments'],
    queryFn: () => getAssetAssignments(),
  });

  const { data: kits = [], isLoading: kitsLoading } = useQuery({
    queryKey: ['equipmentKits'],
    queryFn: () => getEquipmentKits(),
  });

  const { data: accountingEvents = [] } = useQuery({
    queryKey: ['accountingEvents'],
    queryFn: () => getAccountingEvents(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['inventoryNotifications'],
    queryFn: () => getInventoryNotifications(),
  });

  const { data: expiringBatches = [] } = useQuery({
    queryKey: ['expiringBatches'],
    queryFn: () => scanExpiringBatches(30),
  });

  const { data: webhooks = [] } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => getWebhooks(),
  });

  const { data: warehouses = [] } = useWarehouses();
  const { data: itemsData } = useInventoryItems({ activeOnly: 'true' });
  const items = itemsData?.items || [];

  const assignments = assignmentsData?.assignments || [];

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['assetAssignments'] });
    queryClient.invalidateQueries({ queryKey: ['equipmentKits'] });
    queryClient.invalidateQueries({ queryKey: ['accountingEvents'] });
    queryClient.invalidateQueries({ queryKey: ['inventoryNotifications'] });
    queryClient.invalidateQueries({ queryKey: ['expiringBatches'] });
    queryClient.invalidateQueries({ queryKey: ['webhooks'] });
  };

  // Issue Action
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuingAssignment || !issueWarehouseId) {
      toast.error('Please select an issuing warehouse.');
      return;
    }

    try {
      const allocations = issuingAssignment.assignedItems.map((item) => {
        const itemIdStr = typeof item.itemId === 'object' ? item.itemId._id : item.itemId;
        const serialText = serialInputs[itemIdStr] || '';
        const serials = serialText
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);

        return {
          itemId: itemIdStr,
          quantity: item.requestedQuantity,
          serialNumbers: serials,
          unitCost: typeof item.itemId === 'object' ? item.itemId.standardCost || 0 : 0,
        };
      });

      await issueAssets(issuingAssignment._id, {
        warehouseId: issueWarehouseId,
        allocations,
      });

      toast.success('Equipment physically issued and stock ledger updated!');
      setIssuingAssignment(null);
      refreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to issue equipment');
    }
  };

  // Return Action
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningAssignment) return;

    try {
      const returnsList = returningAssignment.assignedItems.map((item) => {
        const itemIdStr = typeof item.itemId === 'object' ? item.itemId._id : item.itemId;
        return {
          itemId: itemIdStr,
          condition: returnConditions[itemIdStr] || 'good',
        };
      });

      await processExitReturn(returningAssignment._id, {
        warehouseId: returnWarehouseId || undefined,
        returnsList,
      });

      toast.success('Asset return processed and restocked into warehouse!');
      setReturningAssignment(null);
      refreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to process return');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Laptop className="w-7 h-7 text-indigo-600" />
            Asset Kits, HRMS Bridge & Accounting Hooks
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Recruitment equipment provisioning, offboarding return checklists, general ledger events & webhooks
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold text-slate-600">
        <button
          onClick={() => setActiveTab('assets')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'assets'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Employee Asset Assignments ({assignments.length})
        </button>

        <button
          onClick={() => setActiveTab('kits')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'kits'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" /> Equipment Kits ({kits.length})
        </button>

        <button
          onClick={() => setActiveTab('accounting')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'accounting'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Accounting Journal Events ({accountingEvents.length})
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'alerts'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" /> Stock Alerts & Webhooks ({notifications.length + expiringBatches.length})
        </button>
      </div>

      {/* TAB 1: ASSET ASSIGNMENTS */}
      {activeTab === 'assets' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Assignment #</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Kit / Type</th>
                  <th className="py-3 px-4">Items Included</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No asset assignments logged yet. Onboarding new candidates automatically creates provisioning requests.
                    </td>
                  </tr>
                ) : (
                  assignments.map((asst) => (
                    <tr key={asst._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {asst.assignmentNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        <span className="font-semibold block">{asst.employeeId?.fullName}</span>
                        <span className="text-[10px] text-slate-400">
                          {asst.employeeId?.employeeCode} • {asst.employeeId?.designation}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {asst.kitId?.name || asst.requestType.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="space-y-0.5">
                          {asst.assignedItems.map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px]">
                              <span>• {typeof item.itemId === 'object' ? item.itemId.name : 'Item'} (x{item.requestedQuantity})</span>
                              {item.serialNumbers?.length ? (
                                <span className="text-[10px] text-indigo-600 font-mono">
                                  [{item.serialNumbers.join(', ')}]
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            asst.status === 'issued'
                              ? 'bg-indigo-100 text-indigo-800'
                              : asst.status === 'returned_full'
                              ? 'bg-emerald-100 text-emerald-800'
                              : asst.status === 'returned_partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {asst.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {asst.status === 'requested' && (
                            <button
                              onClick={() => {
                                setIssuingAssignment(asst);
                                setIssueWarehouseId(warehouses[0]?._id || '');
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                            >
                              Issue Assets
                            </button>
                          )}
                          {(asst.status === 'issued' || asst.status === 'returned_partial') && (
                            <button
                              onClick={() => {
                                setReturningAssignment(asst);
                                setReturnWarehouseId(warehouses[0]?._id || '');
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                            >
                              Exit Return Checklist
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EQUIPMENT KITS */}
      {activeTab === 'kits' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kits.map((kit) => (
            <div key={kit._id} className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{kit.name}</h3>
                  <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {kit.code}
                  </span>
                </div>
                {kit.isDefault && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    DEFAULT
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {kit.description || 'Configurable equipment provisioning template for new hires.'}
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="block text-[11px] font-bold text-slate-600 uppercase">Kit Items:</span>
                {kit.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-700">
                    <span>{typeof it.itemId === 'object' ? it.itemId.name : 'Item'}</span>
                    <span className="font-bold font-mono">x{it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ACCOUNTING JOURNAL EVENTS */}
      {activeTab === 'accounting' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Double-Entry Accounting Journal Stream
              </h3>
              <p className="text-[11px] text-slate-500">
                Automatic GL entries generated by Goods Receipts, Stock Issues, Transfers, and Returns
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Event ID</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Ref Document</th>
                  <th className="py-2.5 px-4">Debit Account</th>
                  <th className="py-2.5 px-4">Credit Account</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accountingEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No journal entries emitted yet.
                    </td>
                  </tr>
                ) : (
                  accountingEvents.map((ev, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{ev.eventId}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                          {ev.eventType}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">{ev.documentNumber}</td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {ev.entries.find((e) => e.debit > 0)?.accountName} ({ev.entries.find((e) => e.debit > 0)?.accountCode})
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {ev.entries.find((e) => e.credit > 0)?.accountName} ({ev.entries.find((e) => e.credit > 0)?.accountCode})
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold font-mono text-slate-900">
                        ${ev.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ALERTS & WEBHOOKS */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Expiring Batches */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Expiring Batches (Next 30 Days)
            </h3>
            {expiringBatches.length === 0 ? (
              <p className="text-xs text-slate-400">No batches expiring in the next 30 days.</p>
            ) : (
              <div className="space-y-2">
                {expiringBatches.map((alert: any, idx: number) => (
                  <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-900">{alert.title}</span>
                      <p className="text-[11px] text-amber-700">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Webhooks */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Webhook className="w-4 h-4 text-indigo-600" /> Active Webhook Subscriptions
            </h3>
            {webhooks.length === 0 ? (
              <p className="text-xs text-slate-400">No external webhooks registered.</p>
            ) : (
              <div className="space-y-2">
                {webhooks.map((wh) => (
                  <div key={wh.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-800">{wh.url}</span>
                      <span className="block text-[10px] text-slate-500">Events: {wh.events.join(', ')}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {issuingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-lg p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Issue Physical Equipment</h3>
            <p className="text-xs text-slate-500">
              Provisioning hardware for {issuingAssignment.employeeId?.fullName} ({issuingAssignment.assignmentNumber})
            </p>

            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Source Warehouse / IT Depot <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={issueWarehouseId}
                  onChange={(e) => setIssueWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                >
                  <option value="">-- Choose Warehouse --</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Serial Numbers Allocation</label>
                {issuingAssignment.assignedItems.map((item) => {
                  const itemIdStr = typeof item.itemId === 'object' ? item.itemId._id : item.itemId;
                  const itemName = typeof item.itemId === 'object' ? item.itemId.name : 'Item';
                  return (
                    <div key={itemIdStr} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="text-xs font-semibold text-slate-800">{itemName} (Qty: {item.requestedQuantity})</span>
                      <input
                        type="text"
                        placeholder="Comma separated serial numbers (e.g. SN-001, SN-002)..."
                        value={serialInputs[itemIdStr] || ''}
                        onChange={(e) => setSerialInputs({ ...serialInputs, [itemIdStr]: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg uppercase font-mono"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIssuingAssignment(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
                >
                  Confirm Issue & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returningAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-lg p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Exit Asset Return Checklist</h3>
            <p className="text-xs text-slate-500">
              Offboarding asset inspection for {returningAssignment.employeeId?.fullName}
            </p>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Receiving Warehouse for Restocking
                </label>
                <select
                  value={returnWarehouseId}
                  onChange={(e) => setReturnWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                >
                  <option value="">-- Choose Warehouse --</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Hardware Condition Inspection</label>
                {returningAssignment.assignedItems.map((item) => {
                  const itemIdStr = typeof item.itemId === 'object' ? item.itemId._id : item.itemId;
                  const itemName = typeof item.itemId === 'object' ? item.itemId.name : 'Item';
                  return (
                    <div key={itemIdStr} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">{itemName}</span>
                      <select
                        value={returnConditions[itemIdStr] || 'good'}
                        onChange={(e) => setReturnConditions({ ...returnConditions, [itemIdStr]: e.target.value })}
                        className="px-2 py-1 text-xs border border-slate-200 rounded-lg"
                      >
                        <option value="good">Good (Restock to Inventory)</option>
                        <option value="fair">Fair (Restock)</option>
                        <option value="damaged">Damaged (Scrap / Repair)</option>
                        <option value="lost">Lost / Unreturned</option>
                      </select>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturningAssignment(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
                >
                  Complete Exit Checklist & Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
