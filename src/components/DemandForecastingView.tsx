import React, { useState } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  AlertTriangle, 
  CloudRain, 
  SunMedium, 
  Bug, 
  Activity, 
  Boxes, 
  Building2, 
  Calendar, 
  ArrowRightLeft, 
  ShieldCheck,
  CheckCircle2,
  Zap,
  Info
} from 'lucide-react';
import { HealthFacility, StockItem, LanguageCode } from '../types';
import { TRANSLATIONS } from '../i18n/translations';

interface DemandForecastingViewProps {
  facilities: HealthFacility[];
  currentLanguage: LanguageCode;
  onInitiateTransferItem: (facilityId: string, medicineName: string) => void;
  onNavigateToTab: (tab: string) => void;
}

interface ForecastOutput {
  daysUntilStockout: number;
  projectedWeeklyDemand: number;
  riskLevel: string;
  confidenceScore: number;
  seasonalImpactSummary: string;
  recommendedReorderQty: number;
  epidemiologicalDrivers: string[];
  source?: string;
}

export const DemandForecastingView: React.FC<DemandForecastingViewProps> = ({
  facilities,
  currentLanguage,
  onInitiateTransferItem,
  onNavigateToTab,
}) => {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(facilities[0]?.id || '');
  const [selectedMedicineName, setSelectedMedicineName] = useState<string>('Amoxicillin 500mg Caps');
  const [seasonalFactor, setSeasonalFactor] = useState<string>('monsoon_surge');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [forecastResult, setForecastResult] = useState<ForecastOutput | null>({
    daysUntilStockout: 2,
    projectedWeeklyDemand: 280,
    riskLevel: 'CRITICAL',
    confidenceScore: 94,
    seasonalImpactSummary: 'Monsoon vector proliferation and stagnant riverine pools have triggered a 2.4x surge in secondary respiratory & bacterial infections.',
    recommendedReorderQty: 450,
    epidemiologicalDrivers: [
      'Pre-monsoon standing water in Bilaspur & Khadakpur river basin',
      'Increased pediatric acute respiratory and fever admissions (+42%)',
      'Inter-district supply truck delays from State Medical Depot'
    ],
    source: 'gemini-3.8-flash'
  });

  const currentFacility = facilities.find(f => f.id === selectedFacilityId) || facilities[0];
  const currentMedicine = currentFacility?.medicines.find(m => m.name === selectedMedicineName) || currentFacility?.medicines[0];

  const handleRunForecast = async () => {
    if (!currentFacility || !currentMedicine) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityName: currentFacility.name,
          medicineName: currentMedicine.name,
          currentStock: currentMedicine.currentStock,
          burnRate: currentMedicine.dailyBurnRate,
          seasonalFactor,
          currentFootfall: currentFacility.patientFootfall.todayOPD,
        }),
      });

      const data = await response.json();
      if (data.success && data.forecast) {
        setForecastResult(data.forecast);
      }
    } catch (err) {
      console.error('Forecast request failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 14-day projection points for SVG chart
  const currentStock = currentMedicine?.currentStock || 100;
  const normalBurn = currentMedicine?.dailyBurnRate || 20;
  const acceleratedBurn = forecastResult 
    ? Math.round(forecastResult.projectedWeeklyDemand / 7) 
    : Math.round(normalBurn * 2.2);

  const projectionDays = [0, 2, 4, 6, 8, 10, 12, 14];
  const normalStockCurve = projectionDays.map(d => Math.max(0, currentStock - (d * normalBurn)));
  const aiStockCurve = projectionDays.map(d => Math.max(0, currentStock - (d * acceleratedBurn)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-950/60 via-slate-900 to-indigo-950/60 p-6 rounded-2xl border border-teal-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-widest">
                Gemini 3.8 Flash Neural Forecasting
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              {t.navForecasting} & Epidemic Surge Simulator
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Anticipate drug stockouts and bed saturation before they happen. Gemini evaluates monsoon patterns, disease outbreak vectors, and footfall acceleration.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Model: <strong>gemini-3.8-flash</strong></span>
          </div>
        </div>
      </div>

      {/* Simulator Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration Form */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-teal-400" />
            Forecast Simulation Parameters
          </h2>

          {/* Select Facility */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Target Health Center
            </label>
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            >
              {facilities.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.type} • {f.block})
                </option>
              ))}
            </select>
          </div>

          {/* Select Medicine */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-slate-400" />
              Critical Medicine / Supply Line
            </label>
            <select
              value={selectedMedicineName}
              onChange={(e) => setSelectedMedicineName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            >
              {currentFacility?.medicines.map(m => (
                <option key={m.id} value={m.name}>
                  {m.name} (Stock: {m.currentStock} {m.unit} • {m.daysOfSupply} DOS)
                </option>
              ))}
            </select>
          </div>

          {/* Select Epidemic / Climate Stress Factor */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Epidemiological & Climate Stress Factor
            </label>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <label 
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                  seasonalFactor === 'monsoon_surge' 
                    ? 'bg-teal-500/15 border-teal-500/50 text-teal-200' 
                    : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <input 
                  type="radio" 
                  name="seasonal" 
                  value="monsoon_surge" 
                  checked={seasonalFactor === 'monsoon_surge'} 
                  onChange={(e) => setSeasonalFactor(e.target.value)} 
                  className="hidden" 
                />
                <CloudRain className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-bold">Monsoon & Flooding Surge</div>
                  <div className="text-[10px] text-slate-400">Dengue, Malaria, and secondary bacterial infections (+140% demand)</div>
                </div>
              </label>

              <label 
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                  seasonalFactor === 'heatwave' 
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-200' 
                    : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <input 
                  type="radio" 
                  name="seasonal" 
                  value="heatwave" 
                  checked={seasonalFactor === 'heatwave'} 
                  onChange={(e) => setSeasonalFactor(e.target.value)} 
                  className="hidden" 
                />
                <SunMedium className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold">Extreme Heatwave (44°C+)</div>
                  <div className="text-[10px] text-slate-400">Severe dehydration, heat exhaustion, ORS & IV fluids surge (+90%)</div>
                </div>
              </label>

              <label 
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                  seasonalFactor === 'viral_respiratory' 
                    ? 'bg-purple-500/15 border-purple-500/50 text-purple-200' 
                    : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <input 
                  type="radio" 
                  name="seasonal" 
                  value="viral_respiratory" 
                  checked={seasonalFactor === 'viral_respiratory'} 
                  onChange={(e) => setSeasonalFactor(e.target.value)} 
                  className="hidden" 
                />
                <Bug className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="font-bold">Viral Respiratory Influx</div>
                  <div className="text-[10px] text-slate-400">Post-harvest crop residue smoke & acute bronchitis wave</div>
                </div>
              </label>
            </div>
          </div>

          {/* Run Forecast Action Button */}
          <button
            onClick={handleRunForecast}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20 text-xs flex items-center justify-center gap-2 transition"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Querying Gemini 3.8 Flash...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate AI Demand Forecast</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Forecast Results & Visual Depletion Curve */}
        <div className="lg:col-span-2 space-y-4">
          {forecastResult && (
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-5">
              {/* Top Result Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                      forecastResult.riskLevel === 'CRITICAL' 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {forecastResult.riskLevel} STOCKOUT RISK
                    </span>
                    <span className="text-xs text-slate-400">
                      Confidence: <strong className="text-teal-400">{forecastResult.confidenceScore}%</strong>
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {selectedMedicineName} at {currentFacility?.name}
                  </h3>
                </div>

                <div className="text-right sm:border-l sm:border-slate-700 sm:pl-4">
                  <div className="text-xs text-slate-400">Days to Total Stockout</div>
                  <div className="text-3xl font-extrabold text-rose-400 font-mono">
                    {forecastResult.daysUntilStockout} Days
                  </div>
                </div>
              </div>

              {/* 14-Day Depletion Curve SVG Chart */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-300">14-Day Inventory Depletion Trajectory</span>
                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-2.5 h-0.5 bg-slate-400 inline-block" />
                      Normal Burn
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                      <span className="w-2.5 h-1 bg-rose-400 inline-block" />
                      AI Surge Forecast
                    </span>
                  </div>
                </div>

                {/* SVG Visual */}
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                  <svg viewBox="0 0 400 120" className="w-full h-32 overflow-visible">
                    {/* Gridlines */}
                    <line x1="40" y1="20" x2="380" y2="20" stroke="#334155" strokeDasharray="3 3" />
                    <line x1="40" y1="60" x2="380" y2="60" stroke="#334155" strokeDasharray="3 3" />
                    <line x1="40" y1="100" x2="380" y2="100" stroke="#475569" />

                    {/* Stock labels */}
                    <text x="35" y="24" fill="#94a3b8" fontSize="8" textAnchor="end">Max</text>
                    <text x="35" y="64" fill="#94a3b8" fontSize="8" textAnchor="end">Buffer</text>
                    <text x="35" y="104" fill="#ef4444" fontSize="8" textAnchor="end">0</text>

                    {/* Day ticks */}
                    {projectionDays.map((d, i) => {
                      const x = 50 + i * 45;
                      return (
                        <text key={d} x={x} y="115" fill="#64748b" fontSize="8" textAnchor="middle">
                          D+{d}
                        </text>
                      );
                    })}

                    {/* Normal stock path */}
                    <path
                      d={`M 50 ${Math.max(20, 100 - (normalStockCurve[0] / currentStock) * 80)} ` +
                        normalStockCurve.map((val, i) => `L ${50 + i * 45} ${Math.max(20, 100 - (val / currentStock) * 80)}`).join(' ')
                      }
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />

                    {/* AI Surge stock path */}
                    <path
                      d={`M 50 ${Math.max(20, 100 - (aiStockCurve[0] / currentStock) * 80)} ` +
                        aiStockCurve.map((val, i) => `L ${50 + i * 45} ${Math.max(20, 100 - (val / currentStock) * 80)}`).join(' ')
                      }
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="3"
                    />

                    {/* Stockout threshold marker */}
                    <circle 
                      cx={50 + Math.min(7, forecastResult.daysUntilStockout / 2) * 45} 
                      cy="100" 
                      r="4" 
                      fill="#ef4444" 
                      className="animate-ping" 
                    />
                  </svg>
                </div>
              </div>

              {/* Epidemiological Rationale & Drivers */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300">
                  AI Epidemiological Analysis:
                </div>
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 leading-relaxed">
                  {forecastResult.seasonalImpactSummary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  {forecastResult.epidemiologicalDrivers.map((driver, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-start gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                      <span>{driver}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Banner: Reorder / Reallocate */}
              <div className="pt-3 border-t border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400">Recommended Emergency Buffer:</div>
                  <div className="text-sm font-bold text-emerald-400">
                    +{forecastResult.recommendedReorderQty} units required within 48h
                  </div>
                </div>

                <button
                  onClick={() => {
                    onInitiateTransferItem(currentFacility.id, selectedMedicineName);
                    onNavigateToTab('redistribution');
                  }}
                  className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 transition"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Trigger Inter-Facility Redistribution Plan →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
