import React, { useState } from 'react';
import { 
  MessageSquareText, 
  Wrench, 
  Zap, 
  AlertTriangle, 
  AlertOctagon, 
  Boxes, 
  Users, 
  Plus, 
  CheckCircle2, 
  Clock, 
  SendHorizontal, 
  ShieldAlert, 
  Tag, 
  FileText,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { HealthFacility, QualitativeReport, ReportCategory, ReportSeverity, ReportStatus } from '../types';

interface QualitativeFeedbackDeckProps {
  facility: HealthFacility;
  onSubmitReport: (facilityId: string, report: Omit<QualitativeReport, 'id' | 'timestamp' | 'status'>) => void;
  onUpdateReportStatus?: (facilityId: string, reportId: string, status: ReportStatus) => void;
}

export const QualitativeFeedbackDeck: React.FC<QualitativeFeedbackDeckProps> = ({
  facility,
  onSubmitReport,
  onUpdateReportStatus,
}) => {
  const reports = facility.qualitativeReports || [];

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReportCategory>('EQUIPMENT_BREAKDOWN');
  const [severity, setSeverity] = useState<ReportSeverity>('CRITICAL_URGENT');
  const [equipmentId, setEquipmentId] = useState('');
  const [reporterName, setReporterName] = useState(facility.inChargeDoctor.split(' (')[0] || 'Medical Officer');
  const [reporterRole, setReporterRole] = useState('Medical Officer In-Charge');
  const [description, setDescription] = useState('');

  // Quick report templates for frontline health workers
  const applyTemplate = (tmpl: 'EQUIPMENT' | 'POWER' | 'ACCESS' | 'STAFF') => {
    setIsFormOpen(true);
    if (tmpl === 'EQUIPMENT') {
      setTitle('CBC Automated Cell Counter Aspiration Line Blockage');
      setCategory('EQUIPMENT_BREAKDOWN');
      setSeverity('CRITICAL_URGENT');
      setEquipmentId('HEM-CBC-301');
      setReporterRole('Senior Lab Technician');
      setDescription('Laser optical sensor error E-44 encountered during high fever OPD testing. Reagents intact but capillary tube suction failing. CBC tests paused.');
    } else if (tmpl === 'POWER') {
      setTitle('Solar Hybrid Backup Inverter Tripping During Load Shedding');
      setCategory('INFRASTRUCTURE_UTILITY');
      setSeverity('CRITICAL_URGENT');
      setEquipmentId('SOLAR-ILR-INV-02');
      setReporterRole('Pharmacist / Storekeeper');
      setDescription('Frequent 3-hour grid cuts causing Ice-Lined Refrigerator (ILR) battery to drop below safe voltage threshold. Risk of vaccine cold-chain excursion if not serviced.');
    } else if (tmpl === 'ACCESS') {
      setTitle('Riverine Access Road Submerged at Village Crossing');
      setCategory('LOCAL_COMMUNITY_CHALLENGE');
      setSeverity('ELEVATED');
      setEquipmentId('N/A (Approach Lane)');
      setReporterRole('Medical Officer In-Charge');
      setDescription('Canal culvert breach has flooded 70m of approach road. Ambulances cannot pull up to emergency bay; stretcher manual transfer currently required.');
    } else {
      setTitle('Maternity Ward Shift Fatigue Due to Active Labor Influx');
      setCategory('STAFFING_WORKLOAD');
      setSeverity('ELEVATED');
      setEquipmentId('Maternity Ward');
      setReporterRole('Head Staff Nurse');
      setDescription('4 simultaneous delivery admissions overnight handled by 1 staff nurse. Requesting relief auxiliary nurse midwife from sector buffer roster.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    onSubmitReport(facility.id, {
      title: title.trim(),
      category,
      severity,
      equipmentIdOrItem: equipmentId.trim() || undefined,
      reporterName: reporterName.trim(),
      reporterRole: reporterRole.trim(),
      description: description.trim(),
    });

    // Reset form
    setTitle('');
    setDescription('');
    setEquipmentId('');
    setIsFormOpen(false);
  };

  const getCategoryDetails = (cat: ReportCategory) => {
    switch (cat) {
      case 'EQUIPMENT_BREAKDOWN':
        return { label: 'Equipment Breakdown', icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' };
      case 'INFRASTRUCTURE_UTILITY':
        return { label: 'Power & Infrastructure', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/15 border-cyan-500/30' };
      case 'LOCAL_COMMUNITY_CHALLENGE':
        return { label: 'Community / Geographic Challenge', icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' };
      case 'MEDICINE_SUPPLY_GAP':
        return { label: 'Drug & Consumables Gap', icon: Boxes, color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30' };
      case 'STAFFING_WORKLOAD':
        return { label: 'Staffing & Workload', icon: Users, color: 'text-teal-400', bg: 'bg-teal-500/15 border-teal-500/30' };
    }
  };

  const filteredReports = reports.filter(r => {
    if (filterCategory === 'ALL') return true;
    return r.category === filterCategory;
  });

  const criticalCount = reports.filter(r => r.severity === 'CRITICAL_URGENT').length;
  const pendingCount = reports.filter(r => r.status === 'PENDING_REVIEW').length;

  return (
    <div className="space-y-5">
      {/* Overview Banner */}
      <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquareText className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">
              Ground Feedback & Qualitative Facility Reports
            </h3>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Direct frontline channel for healthcare staff to report equipment failures, power outages, road cutoffs, and field challenges straight to the District CMO desk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 text-xs flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span><strong>{criticalCount}</strong> Critical Urgent</span>
          </div>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-teal-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Ground Report</span>
          </button>
        </div>
      </div>

      {/* Quick 1-Click Templates */}
      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          Common Frontline Templates:
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => applyTemplate('EQUIPMENT')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-amber-500/30 transition flex items-center gap-1"
          >
            <Wrench className="w-3 h-3" />
            Lab Analyzer Breakdown
          </button>
          <button
            onClick={() => applyTemplate('POWER')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg border border-cyan-500/30 transition flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            Solar / ILR Backup Tripping
          </button>
          <button
            onClick={() => applyTemplate('ACCESS')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg border border-rose-500/30 transition flex items-center gap-1"
          >
            <AlertTriangle className="w-3 h-3" />
            Road Flooding / Ambulance Block
          </button>
          <button
            onClick={() => applyTemplate('STAFF')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg border border-teal-500/30 transition flex items-center gap-1"
          >
            <Users className="w-3 h-3" />
            Maternal Delivery Relief
          </button>
        </div>
      </div>

      {/* Report Submission Drawer / Modal Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-800/95 border border-teal-500/40 rounded-2xl p-5 space-y-4 shadow-xl text-xs animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div>
              <h4 className="font-bold text-white text-sm">Submit New Qualitative Ground Report</h4>
              <p className="text-[11px] text-slate-400">Transmitted directly to District Health Administration & CMO</p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                Report Title / Executive Summary *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Automated Centrifuge Motor Overheating in Lab"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Operational Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategory)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="EQUIPMENT_BREAKDOWN">Equipment / Medical Device Breakdown</option>
                <option value="INFRASTRUCTURE_UTILITY">Power, Water & Cold-Chain Utility</option>
                <option value="LOCAL_COMMUNITY_CHALLENGE">Local Community / Geographic Challenge</option>
                <option value="MEDICINE_SUPPLY_GAP">Medicine & Consumables Shortage</option>
                <option value="STAFFING_WORKLOAD">Staffing Shortage & Workload Fatigue</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Urgency & Severity Level *
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as ReportSeverity)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-teal-500 font-semibold"
              >
                <option value="CRITICAL_URGENT">Critical Urgent (Direct Patient Risk / Service Halt)</option>
                <option value="ELEVATED">Elevated (Severe Friction / Operational Constraint)</option>
                <option value="ROUTINE">Routine (Preventive Maintenance / Non-Emergency)</option>
              </select>
            </div>

            {/* Equipment / Item ID */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Equipment / Asset ID (Optional)
              </label>
              <input
                type="text"
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
                placeholder="e.g. HEM-CBC-301 or SOLAR-INV-02"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>

            {/* Reporter Role */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Reporter Role / Clinical Title *
              </label>
              <input
                type="text"
                value={reporterRole}
                onChange={(e) => setReporterRole(e.target.value)}
                placeholder="e.g. Senior Lab Technician / Staff Nurse"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            {/* Detailed Description */}
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                Ground Reality & Operational Impact Narrative *
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurred, root cause, symptoms, current workaround in place, and what administrative assistance is requested..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 leading-relaxed"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition shadow-md shadow-teal-500/20 flex items-center gap-1.5"
            >
              <SendHorizontal className="w-3.5 h-3.5" />
              <span>Submit Report to CMO Desk</span>
            </button>
          </div>
        </form>
      )}

      {/* Reports List */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Facility Reports Log</span>
            <span className="text-xs text-slate-400 font-mono">({filteredReports.length} records)</span>
          </h4>

          {/* Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Filter:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Categories</option>
              <option value="EQUIPMENT_BREAKDOWN">Equipment Breakdowns</option>
              <option value="INFRASTRUCTURE_UTILITY">Power & Infrastructure</option>
              <option value="LOCAL_COMMUNITY_CHALLENGE">Local Challenges</option>
              <option value="MEDICINE_SUPPLY_GAP">Medicine Supply Gaps</option>
              <option value="STAFFING_WORKLOAD">Staffing & Workload</option>
            </select>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="font-bold text-white text-sm">No Active Ground Challenges Reported</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All medical equipment, power lines, and clinical workflows are operating without logged impediments.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredReports.map((report) => {
              const catInfo = getCategoryDetails(report.category);
              const CatIcon = catInfo.icon;

              return (
                <div
                  key={report.id}
                  className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4.5 space-y-3 shadow-sm hover:border-slate-600 transition"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        report.severity === 'CRITICAL_URGENT'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          : report.severity === 'ELEVATED'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {report.severity.replace('_', ' ')}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${catInfo.bg} ${catInfo.color}`}>
                        <CatIcon className="w-3 h-3" />
                        <span>{catInfo.label}</span>
                      </span>

                      {report.equipmentIdOrItem && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          Asset: {report.equipmentIdOrItem}
                        </span>
                      )}
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        report.status === 'RESOLVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : report.status === 'ACTION_IN_PROGRESS'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : report.status === 'ACKNOWLEDGED_BY_CMO'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {report.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h5 className="font-bold text-white text-sm">{report.title}</h5>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      {report.description}
                    </p>
                  </div>

                  {/* CMO Remarks if present */}
                  {report.cmoRemarks && (
                    <div className="text-xs bg-teal-950/40 border border-teal-500/30 p-2.5 rounded-xl text-teal-200">
                      <strong className="text-teal-400 block mb-0.5">CMO Action Memo:</strong>
                      {report.cmoRemarks}
                    </div>
                  )}

                  {/* Footer with Reporter & Action buttons */}
                  <div className="pt-2 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>Logged by <strong>{report.reporterName}</strong> ({report.reporterRole})</span>
                      <span>•</span>
                      <span className="font-mono text-[11px]">{report.timestamp}</span>
                    </div>

                    {onUpdateReportStatus && (
                      <div className="flex items-center gap-1.5">
                        {report.status === 'PENDING_REVIEW' && (
                          <button
                            onClick={() => onUpdateReportStatus(facility.id, report.id, 'ACKNOWLEDGED_BY_CMO')}
                            className="px-2 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 rounded text-xs font-semibold transition"
                          >
                            Acknowledge
                          </button>
                        )}
                        {report.status !== 'RESOLVED' && (
                          <button
                            onClick={() => onUpdateReportStatus(facility.id, report.id, 'RESOLVED')}
                            className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded text-xs font-semibold transition flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
