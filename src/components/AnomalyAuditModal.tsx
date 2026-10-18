import React, { useEffect, useState } from 'react';
import { HealthFacility, AnomalyAuditResult } from '../types';
import { 
  Sparkles, 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  SendHorizontal, 
  Activity, 
  Bed, 
  UserCheck, 
  Boxes, 
  Flame 
} from 'lucide-react';

interface AnomalyAuditModalProps {
  facility: HealthFacility | null;
  onClose: () => void;
  onTriggerCMOAction: (facility: HealthFacility, actionType: string) => void;
}

export const AnomalyAuditModal: React.FC<AnomalyAuditModalProps> = ({
  facility,
  onClose,
  onTriggerCMOAction,
}) => {
  const [auditResult, setAuditResult] = useState<AnomalyAuditResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!facility) return;
    setIsLoading(true);

    fetch('/api/ai/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityData: facility }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.audit) {
          setAuditResult(data.audit);
        }
      })
      .catch(err => {
        console.error('Audit fetch failed:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [facility]);

  if (!facility) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                ArogyaSync AI Facility Telemetry Audit
              </h3>
              <p className="text-xs text-slate-400">
                {facility.name} ({facility.type}) • {facility.block}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-8 h-8 border-3 border-teal-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-300">
              Gemini 3.8 Flash evaluating bed telemetry, burn rates, doctor shifts, and reagent lots...
            </p>
          </div>
        )}

        {/* Audit Report Content */}
        {!isLoading && auditResult && (
          <div className="space-y-4">
            {/* Score & Status banner */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Facility Resilience Rating
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold text-white font-mono">
                    {auditResult.overallScore}/100
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    auditResult.statusLabel === 'CRITICAL_EMERGENCY' || auditResult.statusLabel === 'NEEDS_INTERVENTION'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {auditResult.statusLabel.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="text-right text-xs text-slate-400 font-mono">
                Model: <strong>gemini-3.8-flash</strong><br />
                Audit Time: {new Date().toLocaleTimeString()}
              </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-xs text-slate-200 leading-relaxed">
              <strong className="text-teal-400 block mb-1">Executive Clinical Summary:</strong>
              {auditResult.executiveSummary}
            </div>

            {/* Flagged Operational Anomalies */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Flagged Operational Anomalies ({auditResult.flaggedAnomalies.length})
              </h4>
              <div className="space-y-2">
                {auditResult.flaggedAnomalies.map((anom, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-start gap-3"
                  >
                    <div className="mt-0.5">
                      {anom.severity === 'CRITICAL' ? (
                        <Flame className="w-4 h-4 text-rose-400" />
                      ) : anom.severity === 'HIGH' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{anom.category.replace('_', ' ')}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          anom.severity === 'CRITICAL' 
                            ? 'bg-rose-500/20 text-rose-300' 
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {anom.severity}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-0.5">{anom.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CMO Directives */}
            <div className="bg-teal-950/30 p-4 rounded-xl border border-teal-500/30 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                <SendHorizontal className="w-3.5 h-3.5" />
                Actionable CMO Directives for Intervention
              </h4>
              <div className="space-y-2">
                {auditResult.cmoDirectives.map((directive, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span>{directive}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Close Audit
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onTriggerCMOAction(facility, 'DEPLOY_MOBILE_UNIT');
                onClose();
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-semibold transition"
            >
              Deploy Mobile Unit
            </button>
            <button
              onClick={() => {
                onTriggerCMOAction(facility, 'DISPATCH_EMERGENCY_STOCK');
                onClose();
              }}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-teal-500/20 transition flex items-center gap-1.5"
            >
              <SendHorizontal className="w-3.5 h-3.5" />
              1-Click Requisition Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
