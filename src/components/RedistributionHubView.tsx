import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  Sparkles, 
  Truck, 
  Clock, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  MapPin, 
  Printer, 
  SendHorizontal,
  ChevronRight,
  Flame,
  UserCheck
} from 'lucide-react';
import { RedistributionTransfer, HealthFacility, LanguageCode } from '../types';
import { TRANSLATIONS } from '../i18n/translations';

interface RedistributionHubViewProps {
  transfers: RedistributionTransfer[];
  facilities: HealthFacility[];
  currentLanguage: LanguageCode;
  onApproveTransfer: (transferId: string) => void;
  onOpenWaybill: (transfer: RedistributionTransfer) => void;
  onGenerateAIPlan: (deficitItem: string) => Promise<void>;
  isGeneratingPlan: boolean;
}

export const RedistributionHubView: React.FC<RedistributionHubViewProps> = ({
  transfers,
  facilities,
  currentLanguage,
  onApproveTransfer,
  onOpenWaybill,
  onGenerateAIPlan,
  isGeneratingPlan,
}) => {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const [targetItemInput, setTargetItemInput] = useState('Amoxicillin 500mg Caps');

  // Stats
  const proposedCount = transfers.filter(t => t.status === 'PROPOSED').length;
  const approvedCount = transfers.filter(t => t.status === 'APPROVED' || t.status === 'IN_TRANSIT').length;
  const completedCount = transfers.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/60 to-slate-900 p-6 rounded-2xl border border-teal-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ArrowRightLeft className="w-5 h-5 text-teal-400" />
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-widest">
                Inter-Facility Supply Balancing Engine
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              {t.navRedistribution}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Algorithmic and AI-driven stock balancing across district PHCs and CHCs. Transfer surplus stocks to prevent stockouts without compromising donor safety.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span><strong>{proposedCount}</strong> Pending Approvals</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span><strong>{approvedCount}</strong> In Transit</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Rebalancing Trigger Card */}
      <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Compute Multi-Center Redistribution Solution
            </h3>
            <p className="text-xs text-slate-400">
              Gemini evaluates all facility Days-of-Supply, calculates road transit times, and proposes non-depleting transfers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={targetItemInput}
            onChange={(e) => setTargetItemInput(e.target.value)}
            placeholder="Item e.g. Amoxicillin, ORS..."
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 w-48 sm:w-56"
          />
          <button
            onClick={() => onGenerateAIPlan(targetItemInput)}
            disabled={isGeneratingPlan}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition whitespace-nowrap"
          >
            {isGeneratingPlan ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Transfers List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>District Reallocation Manifests</span>
            <span className="text-xs text-slate-400 font-mono">({transfers.length} total)</span>
          </h2>
          <span className="text-xs text-slate-400">CMO Digital Approval Gate</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {transfers.map((tsf) => {
            const isApproved = tsf.status === 'APPROVED' || tsf.status === 'IN_TRANSIT' || tsf.status === 'COMPLETED';

            return (
              <div
                key={tsf.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 hover:border-slate-600 transition shadow-sm space-y-4"
              >
                {/* Header row: Slip No, Priority badge, Transport Mode */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/80">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
                      #{tsf.transferSlipNo}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      tsf.priority === 'IMMEDIATE_ACTION'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {tsf.priority.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-500" />
                      {tsf.transportMode}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      isApproved 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                    }`}>
                      {tsf.status === 'PROPOSED' ? 'Awaiting CMO Approval' : tsf.status}
                    </span>
                  </div>
                </div>

                {/* Main Route & Quantity Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Donor Facility (Surplus) */}
                  <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Origin / Surplus Donor
                    </div>
                    <div className="font-bold text-white text-sm mt-1">{tsf.fromFacilityName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Remaining DOS: <strong className="text-emerald-300 font-mono">{tsf.donorRemainingDOS} Days</strong> (Safe)
                    </div>
                  </div>

                  {/* Transfer Details / Arrow */}
                  <div className="flex flex-col items-center justify-center text-center px-2">
                    <div className="text-xs font-bold text-white mb-1">
                      {tsf.itemName}
                    </div>
                    <div className="text-xl font-extrabold text-teal-400 font-mono">
                      {tsf.quantity.toLocaleString()} {tsf.unit}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{tsf.distanceKm} km route</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        ETA: ~{tsf.estimatedTransitMins} mins
                      </span>
                    </div>
                  </div>

                  {/* Recipient Facility (Deficit) */}
                  <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      Destination / Deficit Centre
                    </div>
                    <div className="font-bold text-white text-sm mt-1">{tsf.toFacilityName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      New Post-Transfer DOS: <strong className="text-teal-300 font-mono">{tsf.recipientNewDOS} Days</strong>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-slate-400">
                    {isApproved && tsf.approvedBy ? (
                      <span className="flex items-center gap-1 text-emerald-300">
                        <UserCheck className="w-3.5 h-3.5" />
                        Digitally signed by {tsf.approvedBy} ({tsf.approvedAt})
                      </span>
                    ) : (
                      <span>Requires District CMO digital countersignature</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenWaybill(tsf)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-medium transition flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{t.waybillTitle}</span>
                    </button>

                    {!isApproved ? (
                      <button
                        onClick={() => onApproveTransfer(tsf.id)}
                        className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition shadow-md shadow-teal-500/20 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.approveTransfer}</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved & Dispatched
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
