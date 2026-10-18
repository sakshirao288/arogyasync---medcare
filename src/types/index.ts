export type FacilityType = 'PHC' | 'CHC' | 'DISTRICT_HOSPITAL' | 'SUB_CENTER';

export type StockStatus = 'CRITICAL' | 'LOW' | 'ADEQUATE' | 'SURPLUS';

export type AttendanceStatus = 'PRESENT' | 'ON_DUTY' | 'ON_CALL' | 'LEAVE' | 'ABSENT';

export type TestStatus = 'AVAILABLE' | 'REAGENT_OUT' | 'EQUIPMENT_FAULT' | 'STAFF_UNAVAILABLE';

export type UserRole = 'CMO_ADMIN' | 'FACILITY_INCHARGE' | 'SUPPLY_PHARMACIST';

export type LanguageCode = 'en' | 'hi' | 'bn' | 'te' | 'ta' | 'mr';

export interface BedCategoryStat {
  total: number;
  occupied: number;
  available: number;
}

export interface BedBreakdown {
  general: BedCategoryStat;
  maternity: BedCategoryStat;
  emergency: BedCategoryStat;
  pediatric: BedCategoryStat;
  isolation: BedCategoryStat;
}

export interface DoctorStaff {
  id: string;
  name: string;
  designation: string;
  specialty: string;
  phone: string;
  shift: 'MORNING' | 'EVENING' | 'NIGHT' | 'GENERAL';
  status: AttendanceStatus;
  checkInTime?: string;
}

export interface StockItem {
  id: string;
  name: string;
  genericName: string;
  category: 'Antibiotics' | 'Emergency & IV' | 'Maternal & Child' | 'Vaccines' | 'Analgesics' | 'Chronic Care' | 'PPE & Consumables';
  unit: string;
  batchNo: string;
  currentStock: number;
  minThreshold: number;
  dailyBurnRate: number;
  daysOfSupply: number;
  status: StockStatus;
  expiryDate: string;
  coldChainRequired: boolean;
  coldChainTempCelsius?: number;
}

export interface DiagnosticTest {
  id: string;
  name: string;
  category: 'Serology' | 'Hematology' | 'Microbiology' | 'Biochemistry' | 'Imaging';
  status: TestStatus;
  testsConductedToday: number;
  avgTurnaroundMins: number;
  reagentStockDays: number;
  reagentLotExpiry?: string;
}

export interface HealthFacility {
  id: string;
  name: string;
  type: FacilityType;
  block: string;
  district: string;
  inChargeDoctor: string;
  inChargePhone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceFromDistrictHQKm: number;
  totalBeds: number;
  occupiedBeds: number;
  beds: BedBreakdown;
  patientFootfall: {
    todayOPD: number;
    emergencyCases: number;
    maternalCases: number;
    triageWaitMinutes: number;
    peakHours: string;
    hourlyTrend: { hour: string; count: number }[];
  };
  doctors: DoctorStaff[];
  medicines: StockItem[];
  diagnosticTests: DiagnosticTest[];
  qualitativeReports?: QualitativeReport[];
  resilienceScore: number; // 0 - 100
  overallStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL_ALERT';
  lastAuditTimestamp: string;
}

export type ReportCategory = 
  | 'EQUIPMENT_BREAKDOWN' 
  | 'INFRASTRUCTURE_UTILITY' 
  | 'LOCAL_COMMUNITY_CHALLENGE' 
  | 'MEDICINE_SUPPLY_GAP' 
  | 'STAFFING_WORKLOAD';

export type ReportSeverity = 'ROUTINE' | 'ELEVATED' | 'CRITICAL_URGENT';

export type ReportStatus = 'PENDING_REVIEW' | 'ACKNOWLEDGED_BY_CMO' | 'ACTION_IN_PROGRESS' | 'RESOLVED';

export interface QualitativeReport {
  id: string;
  timestamp: string;
  reporterName: string;
  reporterRole: string;
  category: ReportCategory;
  severity: ReportSeverity;
  title: string;
  description: string;
  equipmentIdOrItem?: string;
  status: ReportStatus;
  cmoRemarks?: string;
}

export interface RedistributionTransfer {
  id: string;
  transferSlipNo: string;
  fromFacilityId: string;
  fromFacilityName: string;
  toFacilityId: string;
  toFacilityName: string;
  itemName: string;
  quantity: number;
  unit: string;
  donorRemainingDOS: number;
  recipientNewDOS: number;
  distanceKm: number;
  estimatedTransitMins: number;
  priority: 'IMMEDIATE_ACTION' | 'HIGH_PRIORITY' | 'ROUTINE';
  status: 'PROPOSED' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED';
  transportMode: 'Cold-Chain Mobile Unit' | 'Emergency Courier' | 'Standard District Logistics';
  driverContact?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface AnomalyAuditResult {
  overallScore: number;
  statusLabel: 'OPTIMAL' | 'ATTENTION_REQUIRED' | 'NEEDS_INTERVENTION' | 'CRITICAL_EMERGENCY';
  executiveSummary: string;
  flaggedAnomalies: {
    category: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    detail: string;
  }[];
  cmoDirectives: string[];
}
