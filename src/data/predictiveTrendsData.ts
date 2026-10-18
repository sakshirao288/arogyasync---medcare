export interface DailyTrendPoint {
  dayIndex: number; // -30 to +30
  dateStr: string;
  isForecast: boolean;
  totalOPD: number;
  emergencyCases: number;
  maternalCases: number;
  footfallUpperBand: number;
  footfallLowerBand: number;
  // Stock depletion in Days of Supply (DOS) across facilities
  bilaspurAmoxDOS: number;
  khadakpurRLDOS: number;
  sitapurRabiesDOS: number;
  rampurAmoxDOS: number;
  districtDepotAmoxDOS: number;
  // Risk index
  vectorBreedingIndex: number; // 0 - 100
  eventAnnotation?: string;
}

// Generates 61 days of continuous data (-30 days historic to +30 days forward predictive)
export function generate30DayPredictiveData(): DailyTrendPoint[] {
  const data: DailyTrendPoint[] = [];
  const baseDate = new Date(2026, 9, 17); // Oct 17, 2026

  for (let i = -30; i <= 30; i++) {
    const curDate = new Date(baseDate);
    curDate.setDate(baseDate.getDate() + i);
    const dateStr = curDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const isForecast = i > 0;

    // Realistic seasonal baseline curve with monsoon vector peak around Day +8 to Day +14
    const seasonalWave = Math.sin((i + 15) / 10) * 180;
    const outbreakPeak = i >= 6 && i <= 15 ? 420 * Math.exp(-Math.pow(i - 10, 2) / 8) : 0;
    const festiveSurge = i >= 20 && i <= 24 ? 260 : 0;
    const dayOfWeekFactor = (i % 7 === 0 || i % 7 === 1) ? -120 : 60; // Weekend vs weekday OPD

    // OPD Total
    const baseOPD = 1850;
    const totalOPD = Math.max(
      1100, 
      Math.round(baseOPD + seasonalWave + outbreakPeak + festiveSurge + dayOfWeekFactor + (isForecast ? i * 8 : Math.sin(i) * 40))
    );

    // Emergency & Maternal
    const emergencyCases = Math.max(90, Math.round(totalOPD * 0.085 + (outbreakPeak > 0 ? 35 : 0)));
    const maternalCases = Math.max(60, Math.round(totalOPD * 0.052 + Math.sin(i / 4) * 8));

    // Confidence bands for forecast uncertainty (broadens further into the future)
    const uncertaintySpread = isForecast ? Math.round(i * 12 + 45) : 0;
    const footfallUpperBand = totalOPD + uncertaintySpread;
    const footfallLowerBand = Math.max(800, totalOPD - uncertaintySpread);

    // Inventory Depletion Curves (Days of Supply)
    // PHC Bilaspur Amoxicillin: Starts at 1.5 DOS on Day 0, hits zero on Day 2 unless reallocated
    let bilaspurAmoxDOS = 0;
    if (i <= 0) {
      bilaspurAmoxDOS = Math.max(1.5, Number((8 - Math.abs(i) * 0.22).toFixed(1)));
    } else {
      bilaspurAmoxDOS = Math.max(0, Number((1.5 - i * 0.75).toFixed(1)));
    }

    // PHC Khadakpur Ringer Lactate (RL): Hits 0 at Day +3
    let khadakpurRLDOS = 0;
    if (i <= 0) {
      khadakpurRLDOS = Math.max(1.5, Number((6 - Math.abs(i) * 0.15).toFixed(1)));
    } else {
      khadakpurRLDOS = Math.max(0, Number((1.5 - i * 0.5).toFixed(1)));
    }

    // PHC Sitapur Rabies Vaccine: Hits 0 at Day +2
    let sitapurRabiesDOS = 0;
    if (i <= 0) {
      sitapurRabiesDOS = Math.max(1.3, Number((5 - Math.abs(i) * 0.12).toFixed(1)));
    } else {
      sitapurRabiesDOS = Math.max(0, Number((1.3 - i * 0.65).toFixed(1)));
    }

    // CHC Rampur (Surplus Donor): Starts at 53 DOS, gradually draws down to 38 DOS over 30 days
    const rampurAmoxDOS = Math.max(28, Number((53.3 - i * 0.45).toFixed(1)));

    // District Civil Hospital Depot: Holds steady 70-80 DOS
    const districtDepotAmoxDOS = Math.max(60, Number((80.5 - i * 0.3).toFixed(1)));

    // Vector breeding risk index (0 - 100)
    const vectorBreedingIndex = Math.min(
      96, 
      Math.max(25, Math.round(55 + Math.sin((i + 8) / 8) * 35 + (i >= 5 && i <= 14 ? 20 : 0)))
    );

    // Key event annotations
    let eventAnnotation: string | undefined = undefined;
    if (i === 0) eventAnnotation = 'Today: Live District Grid Synced';
    if (i === 2) eventAnnotation = 'D+2: Imminent Amoxicillin Exhaustion at PHC Bilaspur (0 DOS)';
    if (i === 10) eventAnnotation = 'D+10: Peak Monsoon Vector Surge (+38% Outbreak Admissions)';
    if (i === 21) eventAnnotation = 'D+21: Post-Harvest Congregation Inflow (+260 OPD pts)';

    data.push({
      dayIndex: i,
      dateStr,
      isForecast,
      totalOPD,
      emergencyCases,
      maternalCases,
      footfallUpperBand,
      footfallLowerBand,
      bilaspurAmoxDOS,
      khadakpurRLDOS,
      sitapurRabiesDOS,
      rampurAmoxDOS,
      districtDepotAmoxDOS,
      vectorBreedingIndex,
      eventAnnotation,
    });
  }

  return data;
}
