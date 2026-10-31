import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  Layers,
  ChevronDown,
  ChevronRight,
  QrCode,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  Layers as LayersIcon,
  Archive,
  Boxes,
} from 'lucide-react';
import {
  useWarehouses,
  useWarehouseZones,
  useWarehouseBins,
  useCreateWarehouse,
  useCreateWarehouseZone,
  useCreateWarehouseBin,
} from '../../hooks/useInventory';
import { getBinQrCode } from '../../lib/inventoryApi';
import type { Warehouse, WarehouseZone, WarehouseBin } from '../../types/inventory';
import { CreateWarehouseModal } from '../../components/inventory/CreateWarehouseModal';
import { CreateBinModal } from '../../components/inventory/CreateBinModal';
import { ItemQrModal } from '../../components/inventory/ItemQrModal';

export const InventoryWarehousesPage: React.FC = () => {
  const { data: warehouses = [], isLoading } = useWarehouses();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);

  const [showCreateWarehouseModal, setShowCreateWarehouseModal] = useState(false);
  const [showCreateBinModal, setShowCreateBinModal] = useState(false);
  const [showNewZoneInput, setShowNewZoneInput] = useState(false);
  const [newZoneCode, setNewZoneCode] = useState('');
  const [newZoneName, setNewZoneName] = useState('');

  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    title: string;
    code: string;
    subtitle?: string;
    qrDataUrl?: string;
  }>({
    isOpen: false,
    title: '',
    code: '',
  });

  const activeWarehouse =
    warehouses.find((w) => w._id === selectedWarehouseId) || warehouses[0] || null;

  const currentWarehouseId = activeWarehouse?._id || null;

  const { data: zones = [] } = useWarehouseZones(currentWarehouseId);
  const { data: bins = [] } = useWarehouseBins(currentWarehouseId);

  const createWarehouseMutation = useCreateWarehouse();
  const createZoneMutation = useCreateWarehouseZone();
  const createBinMutation = useCreateWarehouseBin();

  const handleOpenBinQr = async (bin: WarehouseBin) => {
    try {
      const res = await getBinQrCode(bin._id);
      setQrModalData({
        isOpen: true,
        title: `Location Slot ${bin.binCode}`,
        code: bin.binCode,
        subtitle: `Warehouse: ${activeWarehouse?.name || ''}`,
        qrDataUrl: res.qrDataUrl,
      });
    } catch (err) {
      console.error('Failed to get bin QR:', err);
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWarehouseId || !newZoneCode.trim() || !newZoneName.trim()) return;

    await createZoneMutation.mutateAsync({
      warehouseId: currentWarehouseId,
      payload: {
        code: newZoneCode.trim().toUpperCase(),
        name: newZoneName.trim(),
        zoneType: 'storage',
      },
    });

    setNewZoneCode('');
    setNewZoneName('');
    setShowNewZoneInput(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100/70 border border-orange-200/60 text-orange-700 text-[11px] font-bold">
              <Building2 className="w-3 h-3 text-orange-500" />
              Location Topology
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {warehouses.length} Warehouses Registered
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Warehouses, Zones & Bins
          </h1>
          <p className="text-sm text-slate-500">
            Hierarchical multi-location tracking with rack/aisle bin codes and printable QR labels.
          </p>
        </div>

        <button
          onClick={() => setShowCreateWarehouseModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-2xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Warehouse
        </button>
      </motion.div>

      {/* ── Main Layout: Warehouse Selector (Left) & Zone/Bin Inspector (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Warehouse List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 px-1">
            Storage Facilities
          </h3>

          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading facilities...</div>
          ) : warehouses.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-400">
              <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">No Warehouses Configured</p>
            </div>
          ) : (
            warehouses.map((wh) => {
              const isSelected = activeWarehouse?._id === wh._id;
              return (
                <div
                  key={wh._id}
                  onClick={() => setSelectedWarehouseId(wh._id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-50/60 border-orange-300 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{wh.code}</span>
                        {wh.isDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Primary Hub
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 mt-1">{wh.name}</h4>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? 'text-orange-500 translate-x-1' : 'text-slate-300'
                      }`}
                    />
                  </div>

                  {wh.address?.city && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {wh.address.city}, {wh.address.state || wh.address.country}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-600">
                    <span className="flex items-center gap-1">
                      <LayersIcon className="w-3.5 h-3.5 text-slate-400" />
                      {wh.zoneCount || 0} Zones
                    </span>
                    <span className="flex items-center gap-1">
                      <Archive className="w-3.5 h-3.5 text-slate-400" />
                      {wh.binCount || 0} Bins
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Zones and Bins Details */}
        <div className="lg:col-span-8 space-y-6">
          {activeWarehouse ? (
            <div className="space-y-6">
              {/* Warehouse Details Banner */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200/60">
                        {activeWarehouse.code}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        {activeWarehouse.name}
                      </h3>
                    </div>
                    {activeWarehouse.contactPerson?.name && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>Facility Lead: <strong>{activeWarehouse.contactPerson.name}</strong></span>
                        {activeWarehouse.contactPerson.email && <span>{activeWarehouse.contactPerson.email}</span>}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowNewZoneInput(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-500" />
                      Add Zone
                    </button>

                    <button
                      onClick={() => setShowCreateBinModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-2xs transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Bin Location
                    </button>
                  </div>
                </div>

                {/* Inline New Zone Form */}
                {showNewZoneInput && (
                  <form onSubmit={handleCreateZone} className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Zone Code (e.g. ZONE-A)"
                      value={newZoneCode}
                      onChange={(e) => setNewZoneCode(e.target.value.toUpperCase())}
                      className="w-36 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono uppercase"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Zone Name (e.g. High-Bay Storage)"
                      value={newZoneName}
                      onChange={(e) => setNewZoneName(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                    />
                    <button
                      type="submit"
                      disabled={createZoneMutation.isPending}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 disabled:opacity-50"
                    >
                      Save Zone
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewZoneInput(false)}
                      className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 text-xs"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>

              {/* Zones Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-medium text-slate-400 mr-1">Zones:</span>
                {zones.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No zones created yet</span>
                ) : (
                  zones.map((z) => (
                    <span
                      key={z._id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      {z.name} <span className="font-mono text-slate-400">({z.code})</span>
                    </span>
                  ))
                )}
              </div>

              {/* Bins Table */}
              <div className="rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-orange-500" />
                    Storage Bin Locations ({bins.length})
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-mono text-[11px] uppercase">
                      <tr>
                        <th className="px-5 py-3">Bin Code</th>
                        <th className="px-5 py-3">Zone</th>
                        <th className="px-5 py-3">Barcode</th>
                        <th className="px-5 py-3">Capacity</th>
                        <th className="px-5 py-3 text-right">QR Label</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bins.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                            No bin locations defined in this warehouse yet. Click "Add Bin Location".
                          </td>
                        </tr>
                      ) : (
                        bins.map((bin) => (
                          <tr key={bin._id} className="hover:bg-slate-50/60">
                            <td className="px-5 py-3 font-mono font-bold text-slate-900">
                              {bin.binCode}
                            </td>
                            <td className="px-5 py-3 text-slate-600">
                              {typeof bin.zoneId === 'object' && bin.zoneId ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px]">
                                  {bin.zoneId.code}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">General</span>
                              )}
                            </td>
                            <td className="px-5 py-3 font-mono text-slate-500 text-[11px]">
                              {bin.barcode || bin.binCode}
                            </td>
                            <td className="px-5 py-3 text-slate-600 font-mono text-[11px]">
                              {bin.capacity?.maxWeightKg ? `${bin.capacity.maxWeightKg} kg` : '-'}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <button
                                onClick={() => handleOpenBinQr(bin)}
                                title="Generate QR Code"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-[11px] font-semibold transition-colors"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                Label
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select or create a warehouse to inspect zones and bin slots.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateWarehouseModal
        isOpen={showCreateWarehouseModal}
        onClose={() => setShowCreateWarehouseModal(false)}
        onSubmit={async (data) => {
          await createWarehouseMutation.mutateAsync(data);
        }}
        isSubmitting={createWarehouseMutation.isPending}
      />

      {currentWarehouseId && (
        <CreateBinModal
          isOpen={showCreateBinModal}
          onClose={() => setShowCreateBinModal(false)}
          warehouseId={currentWarehouseId}
          zones={zones}
          onSubmit={async (data) => {
            await createBinMutation.mutateAsync({ warehouseId: currentWarehouseId, payload: data });
          }}
          isSubmitting={createBinMutation.isPending}
        />
      )}

      <ItemQrModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
        title={qrModalData.title}
        code={qrModalData.code}
        subtitle={qrModalData.subtitle}
        qrDataUrl={qrModalData.qrDataUrl}
      />
    </div>
  );
};
