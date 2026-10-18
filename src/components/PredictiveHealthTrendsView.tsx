import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  AlertTriangle, 
  Users, 
  Boxes, 
  Flame, 
  Clock, 
  ArrowRightLeft, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  Building2,
  Info
} from 'lucide-react';
import { HealthFacility, LanguageCode } from '../types';
import { generate30DayPredictiveData, DailyTrendPoint } from '../data/predictiveTrendsData';
import { TRANSLATIONS } from '../i18n/translations';

interface PredictiveHealthTrendsViewProps {
  facilities: HealthFacility[];
  currentLanguage: LanguageCode;
  onNavigateToTab: (tab: string) => void;
  onInitiateTransferItem: (facilityId: string, medicineName: string) => void;
}

export const PredictiveHealthTrendsView: React.FC<PredictiveHealthTrendsViewProps> = ({
  facilities,
  currentLanguage,
  onNavigateToTab,
  onInitiateTransferItem,
}) => {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const rawData = useMemo(() => generate30DayPredictiveData(), []);

  const [viewScope, setViewScope] = useState<'FORECAST_ONLY' | 'HISTORIC_AND_FORECAST'>('HISTORIC_AND_FORECAST');
  const [activeChart, setActiveChart] = useState<'FOOTFALL' | 'INVENTORY' | 'BOTH'>('BOTH');
  const [hoveredPoint, setHoveredPoint] = useState<DailyTrendPoint | null>(null);

  // SVG Refs
  const footfallSvgRef = useRef<SVGSVGElement | null>(null);
  const inventorySvgRef = useRef<SVGSVGElement | null>(null);

  // Filtered dataset based on view scope
  const chartData = useMemo(() => {
    if (viewScope === 'FORECAST_ONLY') {
      return rawData.filter(d => d.dayIndex >= 0);
    }
    return rawData;
  }, [rawData, viewScope]);

  // Aggregate Metrics for next 30 days
  const futureData = useMemo(() => rawData.filter(d => d.dayIndex >= 0), [rawData]);
  const peakFootfallDay = useMemo(() => {
    return futureData.reduce((max, d) => d.totalOPD > max.totalOPD ? d : max, futureData[0]);
  }, [futureData]);

  const totalFutureFootfall = useMemo(() => {
    return futureData.reduce((sum, d) => sum + d.totalOPD, 0);
  }, [futureData]);

  // =========================================================================
  // D3 Chart 1: 30-Day Patient Footfall Surges with 95% Confidence Interval
  // =========================================================================
  useEffect(() => {
    if (!footfallSvgRef.current || chartData.length === 0) return;

    const svg = d3.select(footfallSvgRef.current);
    svg.selectAll('*').remove();

    const width = 820;
    const height = 300;
    const margin = { top: 25, right: 35, bottom: 45, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Day index)
    const xExtent = d3.extent(chartData, d => d.dayIndex) as [number, number];
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([0, innerWidth]);

    // Y Scale (Patient count)
    const yMax = d3.max(chartData, d => d.footfallUpperBand) || 2800;
    const yScale = d3.scaleLinear()
      .domain([0, Math.ceil(yMax * 1.12)])
      .range([innerHeight, 0]);

    // Gridlines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.12)
      .call(
        d3.axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      );

    // Confidence Interval Area Generator (D3.area)
    const areaConfidence = d3.area<DailyTrendPoint>()
      .x(d => xScale(d.dayIndex))
      .y0(d => yScale(d.footfallLowerBand))
      .y1(d => yScale(d.footfallUpperBand))
      .curve(d3.curveMonotoneX);

    // Draw 95% Confidence Interval for Forecast days
    const forecastSubset = chartData.filter(d => d.dayIndex >= 0);
    if (forecastSubset.length > 0) {
      // Gradient for confidence band
      const defs = svg.append('defs');
      const confGrad = defs.append('linearGradient')
        .attr('id', 'conf-grad')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%');
      confGrad.append('stop').attr('offset', '0%').attr('stop-color', '#14b8a6').attr('stop-opacity', 0.28);
      confGrad.append('stop').attr('offset', '100%').attr('stop-color', '#14b8a6').attr('stop-opacity', 0.04);

      g.append('path')
        .datum(forecastSubset)
        .attr('fill', 'url(#conf-grad)')
        .attr('d', areaConfidence);
    }

    // OPD Line Generator (D3.line)
    const opdLine = d3.line<DailyTrendPoint>()
      .x(d => xScale(d.dayIndex))
      .y(d => yScale(d.totalOPD))
      .curve(d3.curveMonotoneX);

    // Emergency Line Generator
    const emergencyLine = d3.line<DailyTrendPoint>()
      .x(d => xScale(d.dayIndex))
      .y(d => yScale(d.emergencyCases * 8)) // Scaled for visible trend
      .curve(d3.curveMonotoneX);

    // Draw OPD Line
    g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#2dd4bf')
      .attr('stroke-width', 3)
      .attr('d', opdLine);

    // Draw Emergency Line (scaled indicator)
    g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 3')
      .attr('d', emergencyLine);

    // Vertical Divider for TODAY (Day 0)
    if (xExtent[0] <= 0 && xExtent[1] >= 0) {
      const todayX = xScale(0);
      g.append('line')
        .attr('x1', todayX)
        .attr('x2', todayX)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3 3');

      g.append('text')
        .attr('x', todayX + 6)
        .attr('y', 14)
        .attr('fill', '#38bdf8')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text('TODAY (Day 0)');
    }

    // Event Annotation Pins on the Line
    chartData.filter(d => d.eventAnnotation && d.dayIndex > 0).forEach(d => {
      const px = xScale(d.dayIndex);
      const py = yScale(d.totalOPD);

      g.append('circle')
        .attr('cx', px)
        .attr('cy', py)
        .attr('r', 5)
        .attr('fill', d.dayIndex === 10 ? '#ef4444' : '#f59e0b')
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 2);

      g.append('circle')
        .attr('cx', px)
        .attr('cy', py)
        .attr('r', 10)
        .attr('fill', 'none')
        .attr('stroke', d.dayIndex === 10 ? '#ef4444' : '#f59e0b')
        .attr('stroke-width', 1)
        .attr('opacity', 0.6);
    });

    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(10)
      .tickFormat(d => {
        const val = Number(d);
        if (val === 0) return 'Today';
        return val > 0 ? `D+${val}` : `D${val}`;
      });

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('fill', '#94a3b8');

    // Y Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d}`);

    g.append('g')
      .call(yAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('fill', '#94a3b8');

    // Interactive Mouse Tracking Overlay
    const bisect = d3.bisector<DailyTrendPoint, number>(d => d.dayIndex).center;

    svg.on('mousemove', (event) => {
      const [mx] = d3.pointer(event, g.node());
      const dayVal = xScale.invert(mx);
      const idx = bisect(chartData, dayVal);
      const point = chartData[idx];
      if (point) setHoveredPoint(point);
    });

    svg.on('mouseleave', () => {
      setHoveredPoint(null);
    });

  }, [chartData]);

  // =========================================================================
  // D3 Chart 2: 30-Day Inventory Depletion & Stockout Exhaustion Timelines
  // =========================================================================
  useEffect(() => {
    if (!inventorySvgRef.current || chartData.length === 0) return;

    const svg = d3.select(inventorySvgRef.current);
    svg.selectAll('*').remove();

    const width = 820;
    const height = 280;
    const margin = { top: 25, right: 35, bottom: 45, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Day index)
    const xExtent = d3.extent(chartData, d => d.dayIndex) as [number, number];
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([0, innerWidth]);

    // Y Scale: Days of Supply (0 to 60 DOS)
    const yScale = d3.scaleLinear()
      .domain([0, 60])
      .range([innerHeight, 0]);

    // Gridlines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.12)
      .call(
        d3.axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      );

    // CRITICAL SAFETY THRESHOLD LINE (DOS = 2 Days)
    const critY = yScale(2);
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', critY)
      .attr('y2', critY)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5 4');

    g.append('text')
      .attr('x', innerWidth - 8)
      .attr('y', critY - 6)
      .attr('text-anchor', 'end')
      .attr('fill', '#ef4444')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text('CRITICAL STOCKOUT THRESHOLD (<2 DOS)');

    // Lines for facilities:
    // 1. PHC Bilaspur Amoxicillin (Plummets to 0 on Day +2)
    const lineBilaspur = d3.line<DailyTrendPoint>()
      .x(d => xScale(d.dayIndex))
      .y(d => yScale(d.bilaspurAmoxDOS))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#f43f5e') // Red
      .attr('stroke-width', 3)
      .attr('d', lineBilaspur);

    // 2. PHC Khadakpur Ringer Lactate (Hits 0 on Day +3)
    const lineKhadakpur = d3.line<DailyTrendPoint>()
      .x(d => xScale(d.dayIndex))
      .y(d => yScale(d.khadakpurRLDOS))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#fb923c') // Orange
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '4 3')
      .attr('d', lineKhadakpur);

    // 3. CHC Rampur Donor Amoxicillin (Stable > 30 DOS)
    const lineRampur = d3.line<DailyTrendPoint>()
      .x(d => xScale(d.dayIndex))
      .y(d => yScale(d.rampurAmoxDOS))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#10b981') // Emerald
      .attr('stroke-width', 2.5)
      .attr('d', lineRampur);

    // Zero Stockout Markers on Day +2 and Day +3
    const bilaspurZero = chartData.find(d => d.dayIndex === 2);
    if (bilaspurZero) {
      const bx = xScale(2);
      const by = yScale(0);

      g.append('circle')
        .attr('cx', bx)
        .attr('cy', by)
        .attr('r', 7)
        .attr('fill', '#ef4444')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      g.append('text')
        .attr('x', bx)
        .attr('y', by - 12)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ef4444')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .text('PHC Bilaspur 0 Stock');
    }

    // Vertical Divider for Today
    if (xExtent[0] <= 0 && xExtent[1] >= 0) {
      const todayX = xScale(0);
      g.append('line')
        .attr('x1', todayX)
        .attr('x2', todayX)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3 3');
    }

    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(10)
      .tickFormat(d => {
        const val = Number(d);
        if (val === 0) return 'Today';
        return val > 0 ? `D+${val}` : `D${val}`;
      });

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('fill', '#94a3b8');

    // Y Axis (Days of Supply)
    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d => `${d} DOS`);

    g.append('g')
      .call(yAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('fill', '#94a3b8');

  }, [chartData]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest font-mono">
                D3.js Mathematical Projection Engine
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              District-Wide 30-Day Predictive Health Trends
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Forecasting patient footfall surges, triage congestion, and Days-of-Supply (DOS) stockout curves across district PHCs and CHCs.
            </p>
          </div>

          {/* Time Scope Toggle */}
          <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setViewScope('FORECAST_ONLY')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                viewScope === 'FORECAST_ONLY' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Forward 30 Days (Predictive)
            </button>
            <button
              onClick={() => setViewScope('HISTORIC_AND_FORECAST')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                viewScope === 'HISTORIC_AND_FORECAST' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full Horizon (-30d to +30d)
            </button>
          </div>
        </div>
      </div>

      {/* 30-Day Predictive Key Indicators Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Projected Footfall */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Projected 30-Day Footfall</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-teal-300 font-mono">
              {totalFutureFootfall.toLocaleString()}
            </div>
            <div className="text-[11px] text-teal-400/80 mt-0.5 font-medium">
              +28% seasonal acceleration
            </div>
          </div>
        </div>

        {/* Peak Congestion Date */}
        <div className="bg-slate-800/80 border border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-amber-300 text-xs">
            <span>Predicted Outbreak Peak</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-white font-mono">
              Day +{peakFootfallDay.dayIndex} ({peakFootfallDay.dateStr})
            </div>
            <div className="text-[11px] text-amber-300/80 mt-0.5">
              ~{peakFootfallDay.totalOPD} patients/day across district
            </div>
          </div>
        </div>

        {/* Imminent Zero Stockout */}
        <div className="bg-slate-800/80 border border-rose-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-rose-300 text-xs">
            <span>Earliest Stockout Countdown</span>
            <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-rose-400 font-mono">
              36 Hours (Day +2)
            </div>
            <div className="text-[11px] text-rose-300/80 mt-0.5">
              PHC Bilaspur (Amoxicillin exhaustion)
            </div>
          </div>
        </div>

        {/* Buffer Requirement */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Preemptive Rebalancing Quota</span>
            <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-indigo-300 font-mono">
              +1,450 Units
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Recommended before Day +7
            </div>
          </div>
        </div>
      </div>

      {/* Chart Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveChart('BOTH')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeChart === 'BOTH' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Combined Trend View (Footfall & Depletion)
        </button>
        <button
          onClick={() => setActiveChart('FOOTFALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeChart === 'FOOTFALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Patient Footfall Trajectory
        </button>
        <button
          onClick={() => setActiveChart('INVENTORY')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeChart === 'INVENTORY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Inventory Days of Supply (DOS) Curves
        </button>
      </div>

      {/* Main D3 Visualization Cards */}
      <div className="space-y-6">
        {/* D3 Chart 1: Footfall Surge Prediction */}
        {(activeChart === 'FOOTFALL' || activeChart === 'BOTH') && (
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>30-Day Patient Footfall Surge & Triage Trajectory</span>
                </h3>
                <p className="text-xs text-slate-400">
                  D3.js mathematical curve with 95% Confidence Interval band based on historic monsoon and seasonal influx.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-teal-400 inline-block rounded-full" />
                  <span className="text-teal-300 font-semibold">Total OPD Footfall</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-rose-400 inline-block rounded-full" />
                  <span className="text-rose-300 font-semibold">Emergency Admissions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-2 bg-teal-500/30 inline-block rounded" />
                  <span className="text-slate-400">95% Confidence Band</span>
                </div>
              </div>
            </div>

            {/* D3 SVG Container */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 overflow-hidden">
              <svg ref={footfallSvgRef} className="w-full h-72" />
            </div>

            {/* Hover Data Inspection Card */}
            {hoveredPoint && (
              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-teal-500/30 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white text-sm">
                    {hoveredPoint.dateStr} ({hoveredPoint.dayIndex === 0 ? 'Today' : hoveredPoint.dayIndex > 0 ? `D+${hoveredPoint.dayIndex}` : `D${hoveredPoint.dayIndex}`})
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    hoveredPoint.isForecast ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {hoveredPoint.isForecast ? 'Predictive Forecast' : 'Historic Log'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>OPD: <strong className="text-teal-300">{hoveredPoint.totalOPD}</strong> pts</div>
                  <div>Emergency: <strong className="text-rose-400">{hoveredPoint.emergencyCases}</strong> cases</div>
                  <div>95% Spread: <span className="text-slate-400">[{hoveredPoint.footfallLowerBand} – {hoveredPoint.footfallUpperBand}]</span></div>
                </div>

                {hoveredPoint.eventAnnotation && (
                  <div className="w-full text-[11px] text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-900/40 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><strong>Event Driver:</strong> {hoveredPoint.eventAnnotation}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* D3 Chart 2: Inventory Depletion & Stockout Timeline */}
        {(activeChart === 'INVENTORY' || activeChart === 'BOTH') && (
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-rose-400" />
                  <span>30-Day Multi-Facility Inventory Depletion Curves</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Visualizes Days-of-Supply (DOS) depletion burn rates. Zero-stock intersection points trigger automated redistribution recommendations.
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-rose-500 inline-block rounded-full" />
                  <span className="text-rose-300 font-semibold">PHC Bilaspur (Amoxicillin)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-orange-400 inline-block rounded-full" />
                  <span className="text-orange-300 font-semibold">PHC Khadakpur (IV Saline)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-emerald-400 inline-block rounded-full" />
                  <span className="text-emerald-300 font-semibold">CHC Rampur Buffer (Donor)</span>
                </div>
              </div>
            </div>

            {/* D3 SVG Container */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 overflow-hidden">
              <svg ref={inventorySvgRef} className="w-full h-64" />
            </div>

            {/* Action Banner to Preempt Stockouts */}
            <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-teal-950/60 p-4 rounded-xl border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <div className="font-bold text-white text-sm">
                    Preemptive Action: Stockout Imminent in 36h (Day +2)
                  </div>
                  <p className="text-rose-200/80 text-xs">
                    Reallocate 350 capsules of Amoxicillin from CHC Rampur surplus (53.3 DOS) to PHC Bilaspur before exhaustion.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onInitiateTransferItem('fac-phc-bilaspur', 'Amoxicillin 500mg Caps');
                  onNavigateToTab('redistribution');
                }}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition shadow-md shadow-teal-500/20 flex items-center justify-center gap-1.5 shrink-0"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Issue Preemptive Waybill →</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
