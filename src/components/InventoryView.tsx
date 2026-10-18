import React, { useState } from 'react';
import { 
  Boxes, 
  AlertTriangle, 
  ThermometerSnowflake, 
  Calendar, 
  Flame, 
  Search, 
  Filter, 
  ArrowRightLeft, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Clock, 
  Building2,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { HealthFacility, StockItem, LanguageCode } from '../types';
import { TRANSLATIONS } from '../i18n/translations';

interface InventoryViewProps {
  facilities: HealthFacility[];
  currentLanguage: LanguageCode;
  onNavigateToTab: (tab: string) => void;
  onUpdateMedicineStock: (facilityId: string, medicineId: string, newStock: number) => void;
  onInitiateTransferItem: (facilityId: string, medicineName: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  facilities,
  currentLanguage,
  onNavigateToTab,
  onUpdateMedicineStock,
  onInitiateTransferItem,
}) => {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal for logging drug dispensing / consumption
  const [dispenseModal, setDispenseModal] = useState<{
    open: boolean;
    facilityId: string;
    facilityName: string;
    medicine: StockItem | null;
    quantity: number;
    reason: string;
  }>({
    open: false,
    facilityId: '',
    facilityName: '',
    medicine: null,
    quantity: 10,
    reason: 'Outpatient Prescription Dispensing',
  });

  // Flattened inventory list with facility context
  const inventoryList = facilities.flatMap(fac => 
    fac.medicines.map(med => ({
      facilityId: fac.id,
      facilityName: fac.name,
      facilityType: fac.type,
      ...med,
    }))
  );

  const filteredItems = inventoryList.filter(item => {
    if (selectedFacilityId !== 'ALL' && item.facilityId !== selectedFacilityId) return false;
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.genericName.toLowerCase().includes(q) ||
        item.batchNo.toLowerCase().includes(q) ||
        item.facilityName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Critical stockout summary
  const criticalItems = inventoryList.filter(i => i.status === 'CRITICAL');
  const lowItems = inventoryList.filter(i => i.status === 'LOW');
  const surplusItems = inventoryList.filter(i => i.status === 'SURPLUS');

  const handleDispenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispenseModal.medicine) return;
    const newStock = Math.max(0, dispenseModal.medicine.currentStock - dispenseModal.quantity);
    onUpdateMedicineStock(dispenseModal.facilityId, dispenseModal.medicine.id, newStock);
    setDispenseModal({ ...dispenseModal, open: false });
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Boxes className="w-5 h-5 text-teal-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {t.navInventory}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time multi-tier stock monitoring with automated Days-of-Supply (DOS) tracking & early exhaustion alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-300 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>{criticalItems.length} Critical (&lt;48h)</span>
          </div>
          <div className="px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{lowItems.length} Low (&lt;5d)</span>
          </div>
          <div className="px-3 py-1.5 bg-purple-500/15 border border-purple-500/30 rounded-xl text-xs font-semibold text-purple-300 flex items-center gap-1.5">
            <ArrowRightLeft className="w-4 h-4 text-purple-400" />
            <span>{surplusItems.length} Surplus Donors</span>
          </div>
        </div>
      </div>

      {/* Critical Stockout Warning Cards */}
      {criticalItems.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-sm mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>URGENT: Imminent Stockout Warnings Active</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {criticalItems.map((item, idx) => (
              <div 
                key={`${item.facilityId}-${item.id}-${idx}`}
                className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded">
                      {item.facilityName}
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-400 animate-pulse">
                      {item.daysOfSupply} DOS Left
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm mt-1">{item.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    Stock: {item.currentStock} {item.unit} • Burn: {item.dailyBurnRate} {item.unit}/day
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-rose-300/80">Exhausts in &lt; 36 hours</span>
                  <button
                    onClick={() => {
                      onInitiateTransferItem(item.facilityId, item.name);
                      onNavigateToTab('redistribution');
                    }}
                    className="text-xs font-bold px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition flex items-center gap-1 shadow-sm"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    Reallocate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Facility Filter */}
        <div className="flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Health Centers ({facilities.length})</option>
            {facilities.map(f => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.type})
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Antibiotics">Antibiotics</option>
            <option value="Emergency & IV">Emergency & IV</option>
            <option value="Maternal & Child">Maternal & Child</option>
            <option value="Vaccines">Vaccines & Biologics</option>
            <option value="Analgesics">Analgesics & Antipyretics</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="CRITICAL">Critical Deficit (&lt;48h)</option>
            <option value="LOW">Low Stock (&lt;5d)</option>
            <option value="ADEQUATE">Adequate</option>
            <option value="SURPLUS">Surplus Reallocatable</option>
          </select>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Medicine & Formulation</th>
                <th className="py-3.5 px-4">Health Center</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4">Burn Rate</th>
                <th className="py-3.5 px-4">Days of Supply (DOS)</th>
                <th className="py-3.5 px-4">Cold Chain & Lot</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No medicines match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const dosPct = Math.min(100, Math.round((item.daysOfSupply / 30) * 100));

                  return (
                    <tr key={`${item.facilityId}-${item.id}-${idx}`} className="hover:bg-slate-750 transition">
                      {/* Name & Generic */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{item.name}</div>
                        <div className="text-[11px] text-slate-400">{item.genericName}</div>
                        <span className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                          {item.category}
                        </span>
                      </td>

                      {/* Center */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{item.facilityName}</div>
                        <span className="text-[10px] font-bold text-teal-400 font-mono">
                          {item.facilityType}
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-sm font-extrabold text-white">
                          {item.currentStock.toLocaleString()} {item.unit}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Min: {item.minThreshold} {item.unit}
                        </div>
                      </td>

                      {/* Burn Rate */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-200 font-semibold">
                          {item.dailyBurnRate} {item.unit}/day
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 text-amber-400" />
                          Catchment demand
                        </div>
                      </td>

                      {/* DOS & Status Gauge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-extrabold font-mono ${
                            item.status === 'CRITICAL' 
                              ? 'text-rose-400' 
                              : item.status === 'LOW' 
                              ? 'text-amber-400' 
                              : item.status === 'SURPLUS'
                              ? 'text-purple-300'
                              : 'text-emerald-400'
                          }`}>
                            {item.daysOfSupply} Days
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.status === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : item.status === 'LOW'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : item.status === 'SURPLUS'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="w-32 sm:w-40 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              item.status === 'CRITICAL'
                                ? 'bg-rose-500'
                                : item.status === 'LOW'
                                ? 'bg-amber-400'
                                : item.status === 'SURPLUS'
                                ? 'bg-purple-400'
                                : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.max(8, dosPct)}%` }}
                          />
                        </div>
                      </td>

                      {/* Cold Chain & Batch */}
                      <td className="py-3.5 px-4 text-[11px]">
                        {item.coldChainRequired ? (
                          <div className="flex items-center gap-1 text-cyan-300 font-semibold mb-0.5">
                            <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{item.coldChainTempCelsius || 4.2}°C (Safe)</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Ambient Storage</span>
                        )}
                        <div className="text-slate-400 font-mono">Lot: {item.batchNo}</div>
                        <div className="text-slate-500 text-[10px]">Exp: {item.expiryDate}</div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDispenseModal({
                              open: true,
                              facilityId: item.facilityId,
                              facilityName: item.facilityName,
                              medicine: item,
                              quantity: 10,
                              reason: 'Outpatient Prescription Dispensing'
                            })}
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-medium transition"
                            title="Log Dispensing"
                          >
                            Dispense
                          </button>
                          
                          {item.status === 'SURPLUS' ? (
                            <button
                              onClick={() => {
                                onInitiateTransferItem(item.facilityId, item.name);
                                onNavigateToTab('redistribution');
                              }}
                              className="px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded text-xs font-semibold transition"
                              title="Offer as Transfer Donor"
                            >
                              Donate
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                onInitiateTransferItem(item.facilityId, item.name);
                                onNavigateToTab('redistribution');
                              }}
                              className="px-2 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded text-xs font-semibold transition"
                              title="Request Transfer Requisition"
                            >
                              Requisition
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispense Modal */}
      {dispenseModal.open && dispenseModal.medicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Log Medicine Dispensing</h3>
                <p className="text-xs text-slate-400">{dispenseModal.facilityName}</p>
              </div>
              <button 
                onClick={() => setDispenseModal({ ...dispenseModal, open: false })}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispenseSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <div className="font-bold text-white text-sm">{dispenseModal.medicine.name}</div>
                <div className="text-slate-400 mt-1">
                  Current In-Stock: <strong className="text-teal-400 font-mono">{dispenseModal.medicine.currentStock} {dispenseModal.medicine.unit}</strong>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Quantity to Dispense ({dispenseModal.medicine.unit}):
                </label>
                <input
                  type="number"
                  min={1}
                  max={dispenseModal.medicine.currentStock}
                  value={dispenseModal.quantity}
                  onChange={(e) => setDispenseModal({ ...dispenseModal, quantity: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-sm focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Clinical / Dispensing Reason:
                </label>
                <select
                  value={dispenseModal.reason}
                  onChange={(e) => setDispenseModal({ ...dispenseModal, reason: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="Outpatient Prescription Dispensing">Outpatient Prescription Dispensing</option>
                  <option value="Emergency Ward Rapid Administration">Emergency Ward Rapid Administration</option>
                  <option value="Maternal Delivery Labor Support">Maternal Delivery Labor Support</option>
                  <option value="Sub-Center Field Worker Buffer Dispatch">Sub-Center Field Worker Buffer Dispatch</option>
                  <option value="Damaged / Expiry Quarantine">Damaged / Expiry Quarantine</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDispenseModal({ ...dispenseModal, open: false })}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition shadow-md shadow-teal-500/20"
                >
                  Confirm & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
