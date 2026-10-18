import React, { useState } from 'react';
import { 
  Building2, 
  Bed, 
  UserCheck, 
  Users, 
  Activity, 
  Clock, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Sparkles, 
  Phone, 
  Stethoscope, 
  FlaskConical, 
  FileCheck2,
  SendHorizontal,
  QrCode,
  Camera,
  MessageSquareText
} from 'lucide-react';
import { HealthFacility, LanguageCode, AttendanceStatus, TestStatus, QualitativeReport, ReportStatus } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { QualitativeFeedbackDeck } from './QualitativeFeedbackDeck';

interface FacilityOpsViewProps {
  facility: HealthFacility;
  facilities: HealthFacility[];
  currentLanguage: LanguageCode;
  onSelectFacility: (id: string) => void;
  onUpdateBeds: (facilityId: string, wardType: 'general' | 'maternity' | 'emergency' | 'pediatric' | 'isolation', delta: number) => void;
  onUpdateDoctorAttendance: (facilityId: string, doctorId: string, status: AttendanceStatus) => void;
  onUpdateTestStatus: (facilityId: string, testId: string, status: TestStatus) => void;
  onIncrementFootfall: (facilityId: string, type: 'opd' | 'emergency') => void;
  onOpenQRScanner: () => void;
  onSubmitQualitativeReport: (facilityId: string, report: Omit<QualitativeReport, 'id' | 'timestamp' | 'status'>) => void;
  onUpdateReportStatus?: (facilityId: string, reportId: string, status: ReportStatus) => void;
}

export const FacilityOpsView: React.FC<FacilityOpsViewProps> = ({
  facility,
  facilities,
  currentLanguage,
  onSelectFacility,
  onUpdateBeds,
  onUpdateDoctorAttendance,
  onUpdateTestStatus,
  onIncrementFootfall,
  onOpenQRScanner,
  onSubmitQualitativeReport,
  onUpdateReportStatus,
}) => {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const [activeSubTab, setActiveSubTab] = useState<'footfall' | 'beds' | 'doctors' | 'lab' | 'feedback'>('footfall');

  const bedOccupancy = Math.round((facility.occupiedBeds / (facility.totalBeds || 1)) * 100);
  const presentDocs = facility.doctors.filter(d => d.status === 'ON_DUTY' || d.status === 'PRESENT').length;

  return (
    <div className="space-y-6">
      {/* Facility Header & Selector */}
      <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {facility.type} Facility Deck
            </span>
            <span className="text-xs text-slate-400 font-mono">{facility.block}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            {facility.name} Operations & Audit
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Medical Officer In-Charge: <strong>{facility.inChargeDoctor}</strong> • {facility.inChargePhone}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Touchless Optical QR Scanner Button */}
          <button
            onClick={onOpenQRScanner}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-teal-500/20 transition cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan QR (Patient / Batch)</span>
          </button>

          {/* Facility Dropdown Switcher */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-xs">
            <Building2 className="w-4 h-4 text-teal-400 ml-1" />
            <select
              value={facility.id}
              onChange={(e) => onSelectFacility(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer pr-2"
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id} className="bg-slate-800 text-slate-100">
                  {f.name} ({f.type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Facility Mini Telemetry Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Footfall OPD */}
        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
          <div className="flex items-center justify-between text-slate-400">
            <span>Today's OPD</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-extrabold text-purple-300 mt-1">
            {facility.patientFootfall.todayOPD} Patients
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Avg. triage wait: {facility.patientFootfall.triageWaitMinutes} mins
          </div>
        </div>

        {/* Beds */}
        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
          <div className="flex items-center justify-between text-slate-400">
            <span>Bed Saturation</span>
            <Bed className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-white mt-1">
            {facility.occupiedBeds} / {facility.totalBeds}
            <span className={`ml-1 text-xs font-mono ${bedOccupancy >= 90 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ({bedOccupancy}%)
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {facility.totalBeds - facility.occupiedBeds} beds available
          </div>
        </div>

        {/* Doctors */}
        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
          <div className="flex items-center justify-between text-slate-400">
            <span>Doctor Attendance</span>
            <UserCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold text-cyan-300 mt-1">
            {presentDocs} / {facility.doctors.length} Present
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {facility.doctors.some(d => d.status === 'ABSENT') ? '1 Unexcused absence' : 'Roster verified'}
          </div>
        </div>

        {/* Lab Uptime */}
        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
          <div className="flex items-center justify-between text-slate-400">
            <span>Diagnostic Lab Uptime</span>
            <FlaskConical className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-extrabold text-teal-300 mt-1">
            {facility.diagnosticTests.filter(t => t.status === 'AVAILABLE').length} / {facility.diagnosticTests.length} Active
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {facility.diagnosticTests.some(t => t.status === 'REAGENT_OUT') ? 'Reagent outage reported' : 'All tests functional'}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-700/80 pb-2">
        <button
          onClick={() => setActiveSubTab('footfall')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'footfall'
              ? 'bg-teal-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Patient Footfall & Triage ({facility.patientFootfall.todayOPD})
        </button>

        <button
          onClick={() => setActiveSubTab('beds')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'beds'
              ? 'bg-teal-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Bed className="w-3.5 h-3.5" />
          Bed Availability & Wards ({bedOccupancy}%)
        </button>

        <button
          onClick={() => setActiveSubTab('doctors')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'doctors'
              ? 'bg-teal-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          Doctor Attendance Roster ({presentDocs}/{facility.doctors.length})
        </button>

        <button
          onClick={() => setActiveSubTab('lab')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'lab'
              ? 'bg-teal-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          Diagnostic & Lab Audits
        </button>

        <button
          onClick={() => setActiveSubTab('feedback')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'feedback'
              ? 'bg-teal-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <MessageSquareText className="w-3.5 h-3.5" />
          <span>Ground Feedback & Equipment ({facility.qualitativeReports?.length || 0})</span>
        </button>
      </div>

      {/* Sub-Tab 1: Patient Footfall & Triage */}
      {activeSubTab === 'footfall' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Intake Controls */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-400" />
              Quick Triage Registration
            </h3>
            <p className="text-xs text-slate-400">
              Instantly log OPD and emergency walk-ins to update live district triage queue metrics.
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={onOpenQRScanner}
                className="w-full py-2.5 bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-teal-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 border border-teal-500/40 text-teal-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
              >
                <Camera className="w-4 h-4 text-teal-400" />
                <span>Touchless QR Intake (ABHA / Slip)</span>
              </button>

              <button
                onClick={() => onIncrementFootfall(facility.id, 'opd')}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Log +1 General OPD Walk-in</span>
              </button>

              <button
                onClick={() => onIncrementFootfall(facility.id, 'emergency')}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Log +1 Critical Emergency Case</span>
              </button>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2 mt-4">
              <div className="flex justify-between text-slate-300">
                <span>Emergency Triage Cases Today:</span>
                <strong className="text-rose-400 font-mono">{facility.patientFootfall.emergencyCases}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Maternal / Delivery Registrations:</span>
                <strong className="text-teal-400 font-mono">{facility.patientFootfall.maternalCases}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Peak Congestion Window:</span>
                <strong className="text-amber-300 font-mono">{facility.patientFootfall.peakHours}</strong>
              </div>
            </div>
          </div>

          {/* Hourly Footfall Chart */}
          <div className="lg:col-span-2 bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Hourly Patient Inflow Curve</span>
              <span className="text-xs font-mono text-teal-400">Peak: {facility.patientFootfall.peakHours}</span>
            </h3>

            <div className="h-48 flex items-end justify-between gap-2 pt-6 px-4 bg-slate-900/80 rounded-xl border border-slate-800">
              {facility.patientFootfall.hourlyTrend.map((bar, idx) => {
                const max = Math.max(...facility.patientFootfall.hourlyTrend.map(b => b.count));
                const heightPct = Math.round((bar.count / (max || 1)) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <span className="text-[10px] font-mono text-teal-300 opacity-0 group-hover:opacity-100 transition">
                      {bar.count}
                    </span>
                    <div 
                      className="w-full bg-gradient-to-t from-teal-600 to-cyan-400 rounded-t-md transition-all group-hover:from-teal-400 group-hover:to-cyan-300 shadow-sm"
                      style={{ height: `${Math.max(15, heightPct)}%` }}
                    />
                    <span className="text-[10px] font-mono text-slate-400">
                      {bar.hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Bed Availability & Wards */}
      {activeSubTab === 'beds' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Ward Bed Allocation & Occupancy</h3>
            <span className="text-xs text-slate-400">1-Click Patient Admission & Discharge</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['general', 'maternity', 'emergency', 'pediatric', 'isolation'] as const).map((wardKey) => {
              const ward = facility.beds[wardKey];
              const wardPct = Math.round((ward.occupied / (ward.total || 1)) * 100);

              const wardNames = {
                general: t.generalBeds,
                maternity: t.maternityBeds,
                emergency: t.emergencyBeds,
                pediatric: t.pediatricBeds,
                isolation: t.isolationBeds,
              };

              return (
                <div 
                  key={wardKey}
                  className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{wardNames[wardKey]}</h4>
                      <span className={`text-xs font-mono font-bold ${wardPct >= 90 ? 'text-rose-400' : 'text-teal-400'}`}>
                        {wardPct}%
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline justify-between text-xs">
                      <span className="text-slate-400">Occupied: <strong className="text-white font-mono">{ward.occupied}</strong></span>
                      <span className="text-slate-400">Available: <strong className="text-emerald-400 font-mono">{ward.available}</strong></span>
                      <span className="text-slate-400">Total: <strong className="text-slate-300 font-mono">{ward.total}</strong></span>
                    </div>

                    <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={`h-full ${wardPct >= 90 ? 'bg-rose-500' : wardPct >= 75 ? 'bg-amber-400' : 'bg-teal-400'}`}
                        style={{ width: `${Math.min(100, wardPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Increment / Decrement actions */}
                  <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between">
                    <button
                      onClick={() => onUpdateBeds(facility.id, wardKey, -1)}
                      disabled={ward.occupied <= 0}
                      className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Minus className="w-3 h-3" />
                      Discharge
                    </button>

                    <button
                      onClick={() => onUpdateBeds(facility.id, wardKey, 1)}
                      disabled={ward.available <= 0}
                      className="px-2.5 py-1 bg-teal-500 hover:bg-teal-400 disabled:opacity-30 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                      Admit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Doctor Attendance Roster */}
      {activeSubTab === 'doctors' && (
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">{t.doctorRoster}</h3>
            <span className="text-xs text-slate-400">Real-time Biometric & Duty Log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Medical Officer / Specialist</th>
                  <th className="py-3 px-4">Specialty</th>
                  <th className="py-3 px-4">Designated Shift</th>
                  <th className="py-3 px-4">Biometric Punch</th>
                  <th className="py-3 px-4">Current Duty Status</th>
                  <th className="py-3 px-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-200">
                {facility.doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-750 transition">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div>{doc.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{doc.designation}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {doc.specialty}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {doc.shift}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {doc.checkInTime || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        doc.status === 'ON_DUTY' || doc.status === 'PRESENT'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : doc.status === 'ON_CALL'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : doc.status === 'LEAVE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={doc.status}
                        onChange={(e) => onUpdateDoctorAttendance(facility.id, doc.id, e.target.value as AttendanceStatus)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-teal-500 text-xs"
                      >
                        <option value="ON_DUTY">On Duty</option>
                        <option value="ON_CALL">On Call</option>
                        <option value="LEAVE">Leave Approved</option>
                        <option value="ABSENT">Absent (Unreported)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Diagnostic & Lab Audits */}
      {activeSubTab === 'lab' && (
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">{t.diagnosticAudits}</h3>
            <span className="text-xs text-slate-400">Reagent Depletion & Equipment Uptime Audit</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Diagnostic Test & Analyzer</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Tests Done Today</th>
                  <th className="py-3 px-4">Avg. Turnaround</th>
                  <th className="py-3 px-4">Reagents Supply</th>
                  <th className="py-3 px-4">Equipment Status</th>
                  <th className="py-3 px-4 text-right">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-200">
                {facility.diagnosticTests.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-750 transition">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {test.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {test.category}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-purple-300 font-bold">
                      {test.testsConductedToday} tests
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      ~{test.avgTurnaroundMins} mins
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className={test.reagentStockDays === 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {test.reagentStockDays} Days
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        test.status === 'AVAILABLE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : test.status === 'REAGENT_OUT'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {test.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={test.status}
                        onChange={(e) => onUpdateTestStatus(facility.id, test.id, e.target.value as TestStatus)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-teal-500 text-xs"
                      >
                        <option value="AVAILABLE">Fully Operational</option>
                        <option value="REAGENT_OUT">Reagents Exhausted</option>
                        <option value="EQUIPMENT_FAULT">Equipment Fault</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 5: Qualitative Ground Feedback & Equipment Challenges */}
      {activeSubTab === 'feedback' && (
        <QualitativeFeedbackDeck
          facility={facility}
          onSubmitReport={onSubmitQualitativeReport}
          onUpdateReportStatus={onUpdateReportStatus}
        />
      )}
    </div>
  );
};
