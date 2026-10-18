import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Layers, 
  Sparkles, 
  ArrowRightLeft, 
  Bed, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Navigation, 
  Compass, 
  Maximize2, 
  Eye, 
  EyeOff,
  Stethoscope,
  Info
} from 'lucide-react';
import { HealthFacility, LanguageCode } from '../types';

interface GeographicalHeatmapProps {
  facilities: HealthFacility[];
  currentLanguage: LanguageCode;
  onSelectFacility: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
  onInspectAudit: (facility: HealthFacility) => void;
}

export const GeographicalHeatmap: React.FC<GeographicalHeatmapProps> = ({
  facilities,
  currentLanguage,
  onSelectFacility,
  onNavigateToTab,
  onInspectAudit,
}) => {
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showTransitRoutes, setShowTransitRoutes] = useState<boolean>(true);
  const [showRiverBasin, setShowRiverBasin] = useState<boolean>(true);
  const [selectedFacility, setSelectedFacility] = useState<HealthFacility | null>(facilities[0] || null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'RESILIENT'>('ALL');
  const [heatmapMetric, setHeatmapMetric] = useState<'RESILIENCE' | 'BED_SATURATION' | 'STOCKOUT_RISK'>('RESILIENCE');

  // Geographic bounds of Rampur Health District
  // Lat: ~26.70 to 26.95, Lng: ~80.80 to 81.06
  const minLat = 26.68;
  const maxLat = 26.96;
  const minLng = 80.79;
  const maxLng = 81.07;

  const mapWidth = 840;
  const mapHeight = 440;
  const padding = 55;

  // Project lat/lng to SVG canvas x/y
  const projectCoordinates = (lat: number, lng: number) => {
    const x = padding + ((lng - minLng) / (maxLng - minLng)) * (mapWidth - 2 * padding);
    // Invert latitude because SVG Y goes downward
    const y = padding + ((maxLat - lat) / (maxLat - minLat)) * (mapHeight - 2 * padding);
    return { x, y };
  };

  const facilitiesWithCoords = useMemo(() => {
    return facilities.map(fac => ({
      ...fac,
      svgPos: projectCoordinates(fac.coordinates.lat, fac.coordinates.lng),
    }));
  }, [facilities]);

  const filteredFacilities = useMemo(() => {
    if (activeFilter === 'CRITICAL') return facilitiesWithCoords.filter(f => f.resilienceScore < 65);
    if (activeFilter === 'RESILIENT') return facilitiesWithCoords.filter(f => f.resilienceScore >= 75);
    return facilitiesWithCoords;
  }, [facilitiesWithCoords, activeFilter]);

  // Color helper based on Resilience Score
  const getResilienceColor = (score: number) => {
    if (score < 60) return { hex: '#f43f5e', bg: 'bg-rose-500', text: 'text-rose-400', label: 'Critical' };
    if (score < 75) return { hex: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-400', label: 'Warning' };
    return { hex: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Resilient' };
  };

  // Center locations for transit links
  const distHQ = facilitiesWithCoords.find(f => f.type === 'DISTRICT_HOSPITAL') || facilitiesWithCoords[5];
  const chcRampur = facilitiesWithCoords.find(f => f.name.includes('Rampur')) || facilitiesWithCoords[1];
  const phcBilaspur = facilitiesWithCoords.find(f => f.name.includes('Bilaspur')) || facilitiesWithCoords[0];
  const phcKhadakpur = facilitiesWithCoords.find(f => f.name.includes('Khadakpur')) || facilitiesWithCoords[2];
  const phcSitapur = facilitiesWithCoords.find(f => f.name.includes('Sitapur')) || facilitiesWithCoords[4];

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl space-y-0">
      {/* Map Control Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[11px] font-bold text-teal-400 uppercase tracking-widest font-mono">
              Geographical Command Intelligence
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">Rampur Health District Sector Grid</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
            <span>District Health Center Resilience Heatmap</span>
            <span className="text-xs font-mono font-normal text-slate-400">
              (Live Telemetry Overlay)
            </span>
          </h2>
        </div>

        {/* Toggles & Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition ${
              showHeatmap
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>Heatmap Overlay {showHeatmap ? 'ON' : 'OFF'}</span>
          </button>

          {/* Metric Selector */}
          {showHeatmap && (
            <select
              value={heatmapMetric}
              onChange={(e) => setHeatmapMetric(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-teal-500 font-medium text-xs"
            >
              <option value="RESILIENCE">Heatmap: Resilience Index (0-100)</option>
              <option value="BED_SATURATION">Heatmap: Bed Saturation %</option>
              <option value="STOCKOUT_RISK">Heatmap: Stockout Vulnerability</option>
            </select>
          )}

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                activeFilter === 'ALL' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({facilities.length})
            </button>
            <button
              onClick={() => setActiveFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                activeFilter === 'CRITICAL' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hotspots (&lt;65)
            </button>
            <button
              onClick={() => setActiveFilter('RESILIENT')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                activeFilter === 'RESILIENT' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hubs (&gt;75)
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative w-full bg-slate-950 min-h-[460px] overflow-hidden">
        {/* SVG Map Canvas */}
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-[460px] select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="district-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.6" />
            </pattern>

            {/* Gaussian Blur Filter for Natural Heatmap Diffusion */}
            <filter id="heatmap-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="34" result="blur" />
              <feColorMatrix
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.3 0"
              />
            </filter>

            {/* Radial Gradient for Critical Center (Hot Red) */}
            <radialGradient id="heat-critical" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#f43f5e" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>

            {/* Radial Gradient for Strained Center (Amber) */}
            <radialGradient id="heat-warning" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.75" />
              <stop offset="45%" stopColor="#eab308" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>

            {/* Radial Gradient for Resilient Capacity Hub (Emerald / Teal) */}
            <radialGradient id="heat-resilient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.65" />
              <stop offset="40%" stopColor="#14b8a6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Grid */}
          <rect width={mapWidth} height={mapHeight} fill="#090d16" />
          <rect width={mapWidth} height={mapHeight} fill="url(#district-grid)" />

          {/* District Boundary Contour Simulation */}
          <path
            d="M 60 70 Q 220 30 450 50 Q 720 40 790 120 Q 820 280 740 380 Q 520 420 310 400 Q 100 420 50 310 Z"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.8"
          />

          {/* River Basin (Bilaspur-Khadakpur River Basin) - Outbreak Vector Zone */}
          {showRiverBasin && (
            <g opacity="0.65">
              <path
                d="M 120 40 C 200 130 250 200 360 250 C 420 280 500 340 590 410"
                fill="none"
                stroke="#0284c7"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.4"
              />
              <path
                d="M 120 40 C 200 130 250 200 360 250 C 420 280 500 340 590 410"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="6 3"
              />
              <text x="210" y="165" fill="#38bdf8" fontSize="9" fontWeight="bold" opacity="0.8">
                ~ Sarayu River Catchment (Vector Breeding Basin)
              </text>
            </g>
          )}

          {/* Inter-Facility Logistical Transit Corridors */}
          {showTransitRoutes && (
            <g opacity="0.6">
              {/* Highway Corridor from District Hospital to CHC Rampur */}
              {distHQ && chcRampur && (
                <line
                  x1={distHQ.svgPos.x}
                  y1={distHQ.svgPos.y}
                  x2={chcRampur.svgPos.x}
                  y2={chcRampur.svgPos.y}
                  stroke="#14b8a6"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                />
              )}
              {/* Reallocation Pipeline: CHC Rampur to PHC Bilaspur */}
              {chcRampur && phcBilaspur && (
                <line
                  x1={chcRampur.svgPos.x}
                  y1={chcRampur.svgPos.y}
                  x2={phcBilaspur.svgPos.x}
                  y2={phcBilaspur.svgPos.y}
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeDasharray="6 3"
                />
              )}
              {/* Transit to Khadakpur */}
              {distHQ && phcKhadakpur && (
                <line
                  x1={distHQ.svgPos.x}
                  y1={distHQ.svgPos.y}
                  x2={phcKhadakpur.svgPos.x}
                  y2={phcKhadakpur.svgPos.y}
                  stroke="#64748b"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              )}
              {/* Transit to Sitapur */}
              {distHQ && phcSitapur && (
                <line
                  x1={distHQ.svgPos.x}
                  y1={distHQ.svgPos.y}
                  x2={phcSitapur.svgPos.x}
                  y2={phcSitapur.svgPos.y}
                  stroke="#64748b"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              )}
            </g>
          )}

          {/* ======================================================== */}
          {/* GEOGRAPHICAL HEATMAP OVERLAY LAYER                      */}
          {/* ======================================================== */}
          {showHeatmap && (
            <g filter="url(#heatmap-blur)">
              {facilitiesWithCoords.map((fac) => {
                let heatGradient = 'url(#heat-resilient)';
                let heatRadius = 110;

                if (heatmapMetric === 'RESILIENCE') {
                  if (fac.resilienceScore < 60) {
                    // Critical hotspot (high intensity red glow)
                    heatGradient = 'url(#heat-critical)';
                    heatRadius = 135;
                  } else if (fac.resilienceScore < 75) {
                    // Moderate warning hotspot
                    heatGradient = 'url(#heat-warning)';
                    heatRadius = 115;
                  } else {
                    // Resilient surplus capacity
                    heatGradient = 'url(#heat-resilient)';
                    heatRadius = 95;
                  }
                } else if (heatmapMetric === 'BED_SATURATION') {
                  const bedPct = Math.round((fac.occupiedBeds / (fac.totalBeds || 1)) * 100);
                  if (bedPct >= 90) {
                    heatGradient = 'url(#heat-critical)';
                    heatRadius = 130;
                  } else if (bedPct >= 70) {
                    heatGradient = 'url(#heat-warning)';
                    heatRadius = 110;
                  } else {
                    heatGradient = 'url(#heat-resilient)';
                    heatRadius = 90;
                  }
                } else {
                  // Stockout risk
                  const hasCritMed = fac.medicines.some(m => m.status === 'CRITICAL');
                  if (hasCritMed) {
                    heatGradient = 'url(#heat-critical)';
                    heatRadius = 140;
                  } else {
                    heatGradient = 'url(#heat-resilient)';
                    heatRadius = 95;
                  }
                }

                return (
                  <circle
                    key={`heat-${fac.id}`}
                    cx={fac.svgPos.x}
                    cy={fac.svgPos.y}
                    r={heatRadius}
                    fill={heatGradient}
                  />
                );
              })}
            </g>
          )}

          {/* ======================================================== */}
          {/* INTERACTIVE FACILITY MAP MARKERS LAYER                  */}
          {/* ======================================================== */}
          <g>
            {filteredFacilities.map((fac) => {
              const colorInfo = getResilienceColor(fac.resilienceScore);
              const isSelected = selectedFacility?.id === fac.id;
              const isCritical = fac.resilienceScore < 60;

              return (
                <g
                  key={`marker-${fac.id}`}
                  transform={`translate(${fac.svgPos.x}, ${fac.svgPos.y})`}
                  onClick={() => setSelectedFacility(fac)}
                  className="cursor-pointer group"
                >
                  {/* Pulsing Beacon Rings for Critical Centers */}
                  {isCritical && (
                    <>
                      <circle
                        r="24"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        opacity="0.8"
                        className="animate-ping"
                      />
                      <circle
                        r="18"
                        fill="#ef4444"
                        fillOpacity="0.25"
                      />
                    </>
                  )}

                  {/* Base Marker Shadow & Halo */}
                  <circle
                    r={isSelected ? 18 : 15}
                    fill="#0f172a"
                    stroke={isSelected ? '#38bdf8' : colorInfo.hex}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all duration-200"
                  />

                  {/* Marker Center Pill / Score */}
                  <circle
                    r={isSelected ? 13 : 11}
                    fill={colorInfo.hex}
                  />

                  {/* Inner Icon / Text */}
                  <text
                    textAnchor="middle"
                    dy="4"
                    fill="#030712"
                    fontSize={isSelected ? '9' : '8'}
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {fac.resilienceScore}
                  </text>

                  {/* Facility Label Tag Floating Below Marker */}
                  <g transform="translate(0, 24)">
                    <rect
                      x="-55"
                      y="-1"
                      width="110"
                      height="18"
                      rx="4"
                      fill="#0f172a"
                      stroke={isSelected ? '#38bdf8' : '#334155'}
                      strokeWidth={isSelected ? '1.5' : '1'}
                      opacity="0.95"
                    />
                    <text
                      textAnchor="middle"
                      dy="11"
                      fill={isSelected ? '#38bdf8' : '#f8fafc'}
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {fac.name.split(' (')[0]}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* Compass Rose */}
          <g transform="translate(45, 45)" opacity="0.8">
            <circle r="18" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <path d="M 0 -14 L 4 -2 L -4 -2 Z" fill="#ef4444" />
            <path d="M 0 14 L 4 2 L -4 2 Z" fill="#94a3b8" />
            <text x="0" y="-16" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">N</text>
          </g>
        </svg>

        {/* Selected Facility Dossier Overlay Card (Interactive Tooltip / Flyout) */}
        {selectedFacility && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl space-y-3 z-20 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                    selectedFacility.type === 'DISTRICT_HOSPITAL'
                      ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                      : selectedFacility.type === 'CHC'
                      ? 'bg-teal-950 text-teal-300 border-teal-500/40'
                      : 'bg-blue-950 text-blue-300 border-blue-500/40'
                  }`}>
                    {selectedFacility.type}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{selectedFacility.block}</span>
                </div>
                <h3 className="font-extrabold text-white text-sm sm:text-base mt-1">
                  {selectedFacility.name}
                </h3>
              </div>

              {/* Resilience Score Badge */}
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Resilience Score
                </span>
                <span className={`text-xl font-mono font-extrabold ${getResilienceColor(selectedFacility.resilienceScore).text}`}>
                  {selectedFacility.resilienceScore}/100
                </span>
              </div>
            </div>

            {/* Telemetry Breakdown */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
              <div>
                <div className="text-[10px] text-slate-400">Bed Occupancy</div>
                <div className="font-bold text-white font-mono mt-0.5">
                  {selectedFacility.occupiedBeds}/{selectedFacility.totalBeds}
                  <span className="text-[10px] text-slate-400 ml-1">
                    ({Math.round((selectedFacility.occupiedBeds / (selectedFacility.totalBeds || 1)) * 100)}%)
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">Critical Drugs</div>
                <div className="font-bold font-mono mt-0.5">
                  {selectedFacility.medicines.some(m => m.status === 'CRITICAL') ? (
                    <span className="text-rose-400 flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      Deficit
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Adequate
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">Doctor Presence</div>
                <div className="font-bold text-cyan-300 font-mono mt-0.5">
                  {selectedFacility.doctors.filter(d => d.status === 'ON_DUTY' || d.status === 'PRESENT').length}/{selectedFacility.doctors.length} On Duty
                </div>
              </div>
            </div>

            {/* Quick Actions inside Tooltip */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                onClick={() => onInspectAudit(selectedFacility)}
                className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Directives
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateToTab('redistribution')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium border border-slate-700 transition flex items-center gap-1"
                >
                  <ArrowRightLeft className="w-3 h-3 text-teal-400" />
                  Reallocate
                </button>
                <button
                  onClick={() => {
                    onSelectFacility(selectedFacility.id);
                    onNavigateToTab('facilityOps');
                  }}
                  className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg transition"
                >
                  Open Center →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Legend Bar & Guidance */}
      <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Heatmap Legend Scale */}
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
            Resilience Gradient:
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-slate-300 text-[11px]">0-59 (Critical Deficit Hotspot)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-300 text-[11px]">60-74 (Strained Operational Baseline)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-300 text-[11px]">75-100 (High Resilience / Supply Hub)</span>
            </div>
          </div>
        </div>

        {/* Legend Symbols */}
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-rose-500 inline-block" />
            Active Transfer Pipeline
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-sky-400 inline-block" />
            River Vector Surge Zone
          </span>
        </div>
      </div>
    </div>
  );
};
