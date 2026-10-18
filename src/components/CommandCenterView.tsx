import React, { useState } from 'react';
import { 
  Building2, 
  AlertTriangle, 
  Bed, 
  UserCheck, 
  Users, 
  ArrowRightLeft, 
  ShieldAlert, 
  Sparkles, 
  ArrowUpRight, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Clock, 
  SendHorizontal,
  ChevronRight,
  Filter,
  Map as MapIcon,
  TrendingUp,
  FileDown
} from 'lucide-react';
import { HealthFacility, LanguageCode, AnomalyAuditResult } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { GeographicalHeatmap } from './GeographicalHeatmap';
import { generateFacilityOperationalPDF } from '../utils/generateFacilityPDF';

interface CommandCenterViewProps {
  facilities: HealthFacility[];
  currentLanguage: LanguageCode;
  onSelectFacility: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
  onTriggerCMOAction: (facility: HealthFacility, actionType: string) => void;
  onInspectAudit: (facility: HealthFacility) => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  facilities,
  currentLanguage,
  onSelectFacility,
  onNavigateToTab,
  onTriggerCMOAction,
  onInspectAudit,
}) => {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'CHC'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingFacilityId, setDownloadingFacilityId] = useState<string | null>(null);

  const handleDownloadReport = (facility: HealthFacility) => {
    setDownloadingFacilityId(facility.id);
    setTimeout(() => {
      try {
        generateFacilityOperationalPDF(facility);
      } catch (err) {
        console.error('PDF generation error:', err);
      } finally {
        setDownloadingFacilityId(null);
      }
    }, 150);
  };

  // District Aggregates
  const totalBeds = facilities.reduce((acc, f) => acc + f.totalBeds, 0);
  const totalOccupiedBeds = facilities.reduce((acc, f) => acc + f.occupiedBeds, 0);
  const bedSaturationPct = Math.round((totalOccupiedBeds / (totalBeds || 1)) * 100);

  const totalDoctors = facilities.reduce((acc, f) => acc + f.doctors.length, 0);
  const presentDoctors = facilities.reduce(
    (acc, f) => acc + f.doctors.filter(d => d.status === 'ON_DUTY' || d.status === 'PRESENT').length, 
    0
  );
  const doctorAttendancePct = Math.round((presentDoctors / (totalDoctors || 1)) * 100);

  const totalOpd = facilities.reduce((acc, f) => acc + f.patientFootfall.todayOPD, 0);
  
  // Critical stockout items across district
  const criticalStockouts = facilities.flatMap(f => 
    f.medicines.filter(m => m.status === 'CRITICAL').map(m => ({ facility: f.name, facId: f.id, medicine: m }))
  );

  // Underperforming centres (resilience score < 65)
  const flaggedCentres = facilities.filter(f => f.resilienceScore < 65 || f.overallStatus === 'CRITICAL_ALERT');

  const filteredFacilities = facilities.filter(f => {
    if (filter === 'CRITICAL') return f.overallStatus === 'CRITICAL_ALERT' || f.resilienceScore < 65;
    if (filter === 'WARNING') return f.overallStatus === 'WARNING';
    if (filter === 'CHC') return f.type === 'CHC' || f.type === 'DISTRICT_HOSPITAL';
    return true;
  }).filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.block.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* District Header & Live Health Grid Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/80 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              Live District Health Grid Active
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">Rampur Health District (HQ Division)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t.navCommandCenter}
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Real-time multi-centre operational monitoring across Primary Health Centres (PHCs) and Community Health Centres (CHCs).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateToTab('trends')}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>30-Day Predictive Trends</span>
          </button>
          <button
            onClick={() => onNavigateToTab('forecasting')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            {t.runForecast}
          </button>
          <button
            onClick={() => onNavigateToTab('redistribution')}
            className="flex items-center gap-2 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition"
          >
            <ArrowRightLeft className="w-4 h-4 text-slate-950" />
            {t.navRedistribution}
          </button>
        </div>
      </div>

      {/* Aggregate KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Monitored Centers */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{t.totalFacilities}</span>
            <Building2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-white">{facilities.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              4 PHCs • 2 CHCs • 1 CMS Depot
            </div>
          </div>
        </div>

        {/* Critical Stockouts */}
        <div className="bg-slate-800/80 border border-rose-500/40 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-rose-300">
            <span className="text-xs font-medium">{t.stockoutAlerts}</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-rose-400">
              {criticalStockouts.length}
            </div>
            <div className="text-[11px] text-rose-300/80 mt-0.5">
              Medicines under 48h reserve
            </div>
          </div>
        </div>

        {/* District Bed Occupancy */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{t.districtBedOccupancy}</span>
            <Bed className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-white">{bedSaturationPct}%</span>
              <span className="text-xs text-slate-400">({totalOccupiedBeds}/{totalBeds})</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full ${bedSaturationPct > 85 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${bedSaturationPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Doctor Attendance */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{t.avgDoctorAttendance}</span>
            <UserCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-white">{doctorAttendancePct}%</span>
              <span className="text-xs text-slate-400">({presentDoctors}/{totalDoctors})</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Biometric roster synced
            </div>
          </div>
        </div>

        {/* OPD Footfall Today */}
        <div className="col-span-2 lg:col-span-1 bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{t.totalOpdToday}</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-purple-300">
              {totalOpd.toLocaleString()}
            </div>
            <div className="text-[11px] text-purple-300/80 mt-0.5">
              Peak: 09:30 - 12:45 IST
            </div>
          </div>
        </div>
      </div>

      {/* Automated Anomaly Flagging Banner - Requirement: automatically flag underperforming or under-resourced centres to district administrators for intervention */}
      {flaggedCentres.length > 0 && (
        <div className="bg-gradient-to-br from-rose-950/70 via-slate-900 to-amber-950/40 border border-rose-500/50 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-rose-500/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{t.underperformingAlert}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30 rounded-md">
                    {flaggedCentres.length} Centers Require CMO Intervention
                  </span>
                </h3>
                <p className="text-xs text-rose-200/80">
                  AI automated telemetry audit detected compounding stress: low Days-of-Supply, doctor absenteeism, or bed saturation exceeding 90%.
                </p>
              </div>
            </div>
          </div>

          {/* Flagged Centers Detailed Grid */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {flaggedCentres.map((centre) => {
              const bedPct = Math.round((centre.occupiedBeds / (centre.totalBeds || 1)) * 100);
              const absentDocs = centre.doctors.filter(d => d.status === 'ABSENT');
              const critMeds = centre.medicines.filter(m => m.status === 'CRITICAL');
              const reagentOutages = centre.diagnosticTests.filter(t => t.status === 'REAGENT_OUT');

              return (
                <div 
                  key={centre.id}
                  className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-4 flex flex-col justify-between hover:border-rose-400/60 transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                          {centre.type}
                        </span>
                        <h4 className="font-bold text-slate-100 text-sm">{centre.name}</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-400">
                        Resilience Score: {centre.resilienceScore}/100
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {centre.block} • {centre.distanceFromDistrictHQKm} km from District HQ
                    </p>

                    {/* Anomalies List */}
                    <div className="mt-3 space-y-1.5">
                      {critMeds.length > 0 && (
                        <div className="flex items-start gap-1.5 text-xs text-rose-300 bg-rose-950/40 px-2 py-1 rounded border border-rose-900/40">
                          <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Stockout Threat:</strong> {critMeds.map(m => `${m.name} (${m.daysOfSupply} DOS)`).join(', ')}
                          </span>
                        </div>
                      )}

                      {bedPct >= 90 && (
                        <div className="flex items-start gap-1.5 text-xs text-amber-300 bg-amber-950/40 px-2 py-1 rounded border border-amber-900/40">
                          <Bed className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Bed Saturation:</strong> {centre.occupiedBeds}/{centre.totalBeds} beds ({bedPct}%) occupied. General & Maternity at 100%.
                          </span>
                        </div>
                      )}

                      {absentDocs.length > 0 && (
                        <div className="flex items-start gap-1.5 text-xs text-rose-300 bg-rose-950/40 px-2 py-1 rounded border border-rose-900/40">
                          <UserCheck className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Doctor Absenteeism:</strong> {absentDocs.map(d => d.name).join(', ')} absent from duty roster.
                          </span>
                        </div>
                      )}

                      {reagentOutages.length > 0 && (
                        <div className="flex items-start gap-1.5 text-xs text-slate-300 bg-slate-800/60 px-2 py-1 rounded border border-slate-700">
                          <AlertTriangle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Diagnostic Gap:</strong> {reagentOutages.map(t => t.name).join(', ')} reagent outage.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for CMO */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => onInspectAudit(centre)}
                      className="text-xs text-teal-300 hover:text-teal-200 flex items-center gap-1 font-medium transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                      View AI Audit Directives
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onTriggerCMOAction(centre, 'DISPATCH_EMERGENCY_STOCK')}
                        className="text-xs font-semibold px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow transition flex items-center gap-1"
                      >
                        <SendHorizontal className="w-3 h-3" />
                        1-Click Requisition
                      </button>
                      <button
                        onClick={() => {
                          onSelectFacility(centre.id);
                          onNavigateToTab('facilityOps');
                        }}
                        className="text-xs font-medium px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
                      >
                        Manage Center →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Geographical Heatmap Overlay of District Health Resilience */}
      <GeographicalHeatmap
        facilities={facilities}
        currentLanguage={currentLanguage}
        onSelectFacility={onSelectFacility}
        onNavigateToTab={onNavigateToTab}
        onInspectAudit={onInspectAudit}
      />

      {/* District Facility Explorer Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">District Health Facility Network</h2>
            <span className="text-xs text-slate-400 font-mono">({filteredFacilities.length} facilities listed)</span>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 w-48 sm:w-60"
            />
            
            <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition ${filter === 'ALL' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('CRITICAL')}
                className={`px-2.5 py-1 rounded-md transition ${filter === 'CRITICAL' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Critical Alert
              </button>
              <button
                onClick={() => setFilter('WARNING')}
                className={`px-2.5 py-1 rounded-md transition ${filter === 'WARNING' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Warning
              </button>
              <button
                onClick={() => setFilter('CHC')}
                className={`px-2.5 py-1 rounded-md transition ${filter === 'CHC' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                CHCs & Hubs
              </button>
            </div>
          </div>
        </div>

        {/* Facility Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFacilities.map((facility) => {
            const bedOccupancy = Math.round((facility.occupiedBeds / (facility.totalBeds || 1)) * 100);
            const critCount = facility.medicines.filter(m => m.status === 'CRITICAL').length;
            const onDutyDocs = facility.doctors.filter(d => d.status === 'ON_DUTY' || d.status === 'PRESENT').length;

            return (
              <div
                key={facility.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 hover:border-slate-600 transition flex flex-col justify-between shadow-sm relative group"
              >
                <div>
                  {/* Top line: Type, Status chip, Resilience score */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                        facility.type === 'DISTRICT_HOSPITAL' 
                          ? 'bg-purple-950/80 text-purple-300 border-purple-500/30'
                          : facility.type === 'CHC'
                          ? 'bg-teal-950/80 text-teal-300 border-teal-500/30'
                          : 'bg-blue-950/80 text-blue-300 border-blue-500/30'
                      }`}>
                        {facility.type}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{facility.block}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        facility.overallStatus === 'CRITICAL_ALERT'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : facility.overallStatus === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}>
                        {facility.overallStatus === 'CRITICAL_ALERT' ? 'Critical' : facility.overallStatus === 'WARNING' ? 'Warning' : 'Optimal'}
                      </span>
                    </div>
                  </div>

                  {/* Title & In-charge */}
                  <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition">
                    {facility.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <span>MOIC: {facility.inChargeDoctor}</span>
                  </p>

                  {/* Telemetry Matrix */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-700/60 text-xs">
                    {/* Bed Saturation */}
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Beds</span>
                        <Bed className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {facility.occupiedBeds} / {facility.totalBeds}
                        <span className={`ml-1 text-[11px] font-mono ${bedOccupancy >= 90 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                          ({bedOccupancy}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className={`h-full ${bedOccupancy >= 90 ? 'bg-rose-500' : bedOccupancy >= 75 ? 'bg-amber-500' : 'bg-teal-500'}`}
                          style={{ width: `${Math.min(100, bedOccupancy)}%` }}
                        />
                      </div>
                    </div>

                    {/* Doctors On Duty */}
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Doctors</span>
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {onDutyDocs} / {facility.doctors.length}
                        <span className="ml-1 text-[11px] text-slate-400 font-normal">Present</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {facility.doctors.some(d => d.status === 'ABSENT') ? (
                          <span className="text-rose-400 font-semibold">1 Absent without leave</span>
                        ) : (
                          <span className="text-emerald-400">All shifts staffed</span>
                        )}
                      </div>
                    </div>

                    {/* Stock status */}
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Critical Drugs</div>
                      <div className="text-sm font-bold mt-1">
                        {critCount > 0 ? (
                          <span className="text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {critCount} Stockout Risk
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Adequate Reserve
                          </span>
                        )}
                      </div>
                    </div>

                    {/* OPD footfall */}
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Today's OPD</div>
                      <div className="text-sm font-bold text-purple-300 mt-1">
                        {facility.patientFootfall.todayOPD} pts
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          (~{facility.patientFootfall.triageWaitMinutes}m wait)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onInspectAudit(facility)}
                    className="text-xs text-teal-300 hover:text-teal-200 flex items-center gap-1 font-medium transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Audit
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        onSelectFacility(facility.id);
                        onNavigateToTab('facilityOps');
                      }}
                      className="px-2.5 py-1 bg-slate-700/70 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                    >
                      Operations Deck
                    </button>
                    <button
                      onClick={() => onNavigateToTab('redistribution')}
                      title="Inter-Center Stock Transfer"
                      className="p-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-lg text-xs transition"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
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
