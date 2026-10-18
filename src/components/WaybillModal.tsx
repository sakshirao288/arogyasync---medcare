import React from 'react';
import { RedistributionTransfer, HealthFacility } from '../types';
import { Printer, X, CheckCircle2, ShieldCheck, Truck, MapPin, QrCode } from 'lucide-react';

interface WaybillModalProps {
  transfer: RedistributionTransfer | null;
  facilities: HealthFacility[];
  onClose: () => void;
}

export const WaybillModal: React.FC<WaybillModalProps> = ({
  transfer,
  facilities,
  onClose,
}) => {
  if (!transfer) return null;

  const donor = facilities.find(f => f.id === transfer.fromFacilityId);
  const recipient = facilities.find(f => f.id === transfer.toFacilityId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 text-slate-100 my-8">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Official Inter-Facility Transfer Waybill
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Box */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-5 text-xs font-sans text-slate-200">
          {/* Government / Health Dept Header */}
          <div className="text-center pb-4 border-b border-slate-800 space-y-1">
            <div className="text-[10px] uppercase font-bold tracking-widest text-teal-400">
              Department of Health & Family Welfare • District Health Administration
            </div>
            <h2 className="text-lg font-extrabold text-white uppercase tracking-tight">
              Inter-Facility Stock Transfer & Dispatch Manifest
            </h2>
            <div className="flex items-center justify-center gap-3 text-slate-400 text-[11px] font-mono">
              <span>Waybill #: <strong>{transfer.transferSlipNo}</strong></span>
              <span>•</span>
              <span>Date: <strong>{transfer.approvedAt || '2026-10-17 08:30 IST'}</strong></span>
            </div>
          </div>

          {/* Consignor & Consignee */}
          <div className="grid grid-cols-2 gap-4">
            {/* Origin */}
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-teal-400 block mb-1">
                Consignor (Origin Health Facility)
              </span>
              <div className="font-bold text-white text-sm">{transfer.fromFacilityName}</div>
              <div className="text-slate-400 mt-0.5">{donor?.block}, {donor?.district}</div>
              <div className="text-slate-400 text-[11px] mt-1">
                MOIC: {donor?.inChargeDoctor || 'Medical Superintendent'}
              </div>
              <div className="text-emerald-400 text-[11px] font-mono mt-1">
                Donor DOS Post-Dispatch: {transfer.donorRemainingDOS} Days (Buffer Safe)
              </div>
            </div>

            {/* Destination */}
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">
                Consignee (Recipient Health Facility)
              </span>
              <div className="font-bold text-white text-sm">{transfer.toFacilityName}</div>
              <div className="text-slate-400 mt-0.5">{recipient?.block}, {recipient?.district}</div>
              <div className="text-slate-400 text-[11px] mt-1">
                MOIC: {recipient?.inChargeDoctor || 'Medical Officer'}
              </div>
              <div className="text-teal-300 text-[11px] font-mono mt-1">
                Recipient Restored DOS: {transfer.recipientNewDOS} Days
              </div>
            </div>
          </div>

          {/* Item Table */}
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-2.5">Item Description & Specification</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Dispatched Qty</th>
                  <th className="p-2.5">Storage Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                <tr>
                  <td className="p-2.5 font-bold text-white">
                    {transfer.itemName}
                  </td>
                  <td className="p-2.5 text-slate-400">
                    Essential Medical Supply
                  </td>
                  <td className="p-2.5 font-mono text-teal-300 font-extrabold text-sm">
                    {transfer.quantity.toLocaleString()} {transfer.unit}
                  </td>
                  <td className="p-2.5 text-slate-400">
                    {transfer.transportMode.includes('Cold-Chain') ? 'Cold Chain (2°-8°C Monitored)' : 'Standard Ambient Dry Storage'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Transit & Courier Logistics */}
          <div className="grid grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-400 block">Transport Mode:</span>
              <strong className="text-slate-200">{transfer.transportMode}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Transit Distance:</span>
              <strong className="text-slate-200">{transfer.distanceKm} km (~{transfer.estimatedTransitMins} mins)</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Dispatch Status:</span>
              <strong className="text-emerald-400">{transfer.status}</strong>
            </div>
          </div>

          {/* Signatures & Barcode */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Digitally Authenticated by District CMO</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Cryptographic Token: AROGYA-GOV-{transfer.transferSlipNo}-VERIFIED
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-800">
              <QrCode className="w-8 h-8 text-slate-300" />
              <div className="text-[9px] text-slate-400 font-mono leading-tight">
                VERIFIED<br />DISTRICT CMS
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Close Waybill
          </button>
        </div>
      </div>
    </div>
  );
};
