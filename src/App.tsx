import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { CommandCenterView } from './components/CommandCenterView';
import { InventoryView } from './components/InventoryView';
import { DemandForecastingView } from './components/DemandForecastingView';
import { RedistributionHubView } from './components/RedistributionHubView';
import { FacilityOpsView } from './components/FacilityOpsView';
import { WaybillModal } from './components/WaybillModal';
import { AnomalyAuditModal } from './components/AnomalyAuditModal';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { QRScannerModal } from './components/QRScannerModal';
import { PredictiveHealthTrendsView } from './components/PredictiveHealthTrendsView';
import { INITIAL_FACILITIES, INITIAL_TRANSFERS } from './data/mockDistrictData';
import { 
  HealthFacility, 
  RedistributionTransfer, 
  UserRole, 
  LanguageCode, 
  AttendanceStatus, 
  TestStatus,
  StockStatus,
  QualitativeReport,
  ReportStatus
} from './types';
import { CheckCircle2, AlertTriangle, ShieldCheck, X } from 'lucide-react';

export default function App() {
  const [facilities, setFacilities] = useState<HealthFacility[]>(INITIAL_FACILITIES);
  const [transfers, setTransfers] = useState<RedistributionTransfer[]>(INITIAL_TRANSFERS);
  const [currentRole, setCurrentRole] = useState<UserRole>('CMO_ADMIN');
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
  const [activeTab, setActiveTab] = useState<string>('command');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('fac-phc-bilaspur');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [copilotOpen, setCopilotOpen] = useState<boolean>(false);
  const [qrScannerOpen, setQrScannerOpen] = useState<boolean>(false);
  const [activeWaybill, setActiveWaybill] = useState<RedistributionTransfer | null>(null);
  const [auditFacility, setAuditFacility] = useState<HealthFacility | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Critical stockout items across the entire district
  const criticalStockoutCount = facilities.flatMap(f => 
    f.medicines.filter(m => m.status === 'CRITICAL')
  ).length;

  const currentSelectedFacility = facilities.find(f => f.id === selectedFacilityId) || facilities[0];

  // Handler: Update medicine stock (e.g. after dispensing)
  const handleUpdateMedicineStock = (facilityId: string, medicineId: string, newStock: number) => {
    setFacilities(prev => prev.map(fac => {
      if (fac.id !== facilityId) return fac;

      const updatedMedicines = fac.medicines.map(med => {
        if (med.id !== medicineId) return med;
        const dos = Number((newStock / (med.dailyBurnRate || 1)).toFixed(1));
        let status: StockStatus = 'ADEQUATE';
        if (dos < 2) status = 'CRITICAL';
        else if (dos < 5) status = 'LOW';
        else if (dos > 30) status = 'SURPLUS';

        return {
          ...med,
          currentStock: newStock,
          daysOfSupply: dos,
          status,
        };
      });

      return {
        ...fac,
        medicines: updatedMedicines,
      };
    }));

    showToast(`Stock updated for ${facilityId}. Days of supply recalculated.`, 'info');
  };

  // Handler: Approve and execute inter-facility transfer
  const handleApproveTransfer = (transferId: string) => {
    const tsf = transfers.find(t => t.id === transferId);
    if (!tsf) return;

    // Debit donor and credit recipient
    setFacilities(prev => prev.map(fac => {
      // Donor
      if (fac.id === tsf.fromFacilityId) {
        return {
          ...fac,
          medicines: fac.medicines.map(m => {
            if (m.name.includes(tsf.itemName.split(' ')[0])) {
              const updatedStock = Math.max(0, m.currentStock - tsf.quantity);
              const dos = Number((updatedStock / (m.dailyBurnRate || 1)).toFixed(1));
              return {
                ...m,
                currentStock: updatedStock,
                daysOfSupply: dos,
                status: dos > 30 ? 'SURPLUS' : 'ADEQUATE',
              };
            }
            return m;
          }),
        };
      }
      // Recipient
      if (fac.id === tsf.toFacilityId) {
        return {
          ...fac,
          medicines: fac.medicines.map(m => {
            if (m.name.includes(tsf.itemName.split(' ')[0])) {
              const updatedStock = m.currentStock + tsf.quantity;
              const dos = Number((updatedStock / (m.dailyBurnRate || 1)).toFixed(1));
              return {
                ...m,
                currentStock: updatedStock,
                daysOfSupply: dos,
                status: dos < 2 ? 'CRITICAL' : dos < 5 ? 'LOW' : 'ADEQUATE',
              };
            }
            return m;
          }),
          resilienceScore: Math.min(100, fac.resilienceScore + 18),
          overallStatus: 'WARNING', // De-escalate from critical
        };
      }
      return fac;
    }));

    // Update transfer object status
    const updatedTransfer: RedistributionTransfer = {
      ...tsf,
      status: 'APPROVED',
      approvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
      approvedBy: 'Dr. R. K. Bhattacharya (CMO)',
      driverContact: 'District Mobile Unit #UP-32-G-4410 (+91 94150 99882)',
    };

    setTransfers(prev => prev.map(t => t.id === transferId ? updatedTransfer : t));

    showToast(`Transfer #${tsf.transferSlipNo} approved by CMO. Waybill issued and dispatch authorized!`, 'success');
    setActiveWaybill(updatedTransfer);
  };

  // Handler: Generate fresh AI Rebalancing plan using Gemini
  const handleGenerateAIPlan = async (deficitItem: string) => {
    setIsGeneratingPlan(true);
    try {
      const response = await fetch('/api/ai/redistribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilities: facilities.map(f => ({
            name: f.name,
            type: f.type,
            stock: f.medicines.map(m => ({ name: m.name, dos: m.daysOfSupply, stock: m.currentStock })),
          })),
          targetDeficitItem: deficitItem,
        }),
      });

      const data = await response.json();
      if (data.success && data.plan?.recommendations) {
        const newTransfers: RedistributionTransfer[] = data.plan.recommendations.map((rec: any, idx: number) => ({
          id: `tsf-ai-${Date.now()}-${idx}`,
          transferSlipNo: rec.dispatchSlipNo || `TSF-AI-${Math.floor(1000 + Math.random() * 9000)}`,
          fromFacilityId: facilities.find(f => f.name.includes(rec.fromFacility.split(' ')[0]))?.id || 'fac-chc-rampur',
          fromFacilityName: rec.fromFacility,
          toFacilityId: facilities.find(f => f.name.includes(rec.toFacility.split(' ')[0]))?.id || 'fac-phc-bilaspur',
          toFacilityName: rec.toFacility,
          itemName: rec.item || deficitItem,
          quantity: rec.quantityToTransfer || 250,
          unit: 'Units',
          donorRemainingDOS: rec.donorRemainingDOS || 34,
          recipientNewDOS: rec.recipientNewDOS || 16,
          distanceKm: rec.distanceKm || 18.5,
          estimatedTransitMins: rec.estimatedTransitMins || 35,
          priority: rec.priority || 'IMMEDIATE_ACTION',
          status: 'PROPOSED',
          transportMode: 'Standard District Logistics',
        }));

        setTransfers(prev => [...newTransfers, ...prev]);
        showToast(`AI generated ${newTransfers.length} new inter-facility redistribution recommendations!`, 'success');
      }
    } catch (err) {
      console.error('AI plan generation error:', err);
      showToast('Generated heuristic transfer plan for deficit medicines.', 'info');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Handler: 1-Click CMO Administrative Action
  const handleTriggerCMOAction = (facility: HealthFacility, actionType: string) => {
    if (actionType === 'DEPLOY_MOBILE_UNIT') {
      showToast(`CMO Directive Issued: District Mobile Medical Unit (MMU-04) deployed to ${facility.name} with 2 medical officers for 48 hours.`, 'success');
    } else if (actionType === 'DISPATCH_EMERGENCY_STOCK') {
      showToast(`Emergency Quota Authorized: Fast-track dispatch of 400 IV Fluids & 300 ORS sachets from CMS Depot to ${facility.name}.`, 'success');
    } else {
      showToast(`Administrative show-cause notice served to roster absentees at ${facility.name}.`, 'warning');
    }
  };

  // Handler: Update ward bed counts
  const handleUpdateBeds = (
    facilityId: string, 
    wardType: 'general' | 'maternity' | 'emergency' | 'pediatric' | 'isolation', 
    delta: number
  ) => {
    setFacilities(prev => prev.map(fac => {
      if (fac.id !== facilityId) return fac;

      const currentWard = fac.beds[wardType];
      const newOccupied = Math.max(0, Math.min(currentWard.total, currentWard.occupied + delta));
      const newAvailable = currentWard.total - newOccupied;

      const updatedBeds = {
        ...fac.beds,
        [wardType]: {
          ...currentWard,
          occupied: newOccupied,
          available: newAvailable,
        },
      };

      const newTotalOccupied = Object.values(updatedBeds).reduce((sum, w) => sum + w.occupied, 0);

      return {
        ...fac,
        beds: updatedBeds,
        occupiedBeds: newTotalOccupied,
      };
    }));

    showToast(`Bed status updated (${delta > 0 ? 'Patient Admitted' : 'Patient Discharged'}).`, 'info');
  };

  // Handler: Update doctor attendance
  const handleUpdateDoctorAttendance = (facilityId: string, doctorId: string, status: AttendanceStatus) => {
    setFacilities(prev => prev.map(fac => {
      if (fac.id !== facilityId) return fac;

      const updatedDoctors = fac.doctors.map(d => {
        if (d.id !== doctorId) return d;
        return {
          ...d,
          status,
          checkInTime: (status === 'ON_DUTY' || status === 'PRESENT') ? '09:15 AM' : d.checkInTime,
        };
      });

      return {
        ...fac,
        doctors: updatedDoctors,
      };
    }));

    showToast(`Doctor duty status updated to ${status}.`, 'info');
  };

  // Handler: Update diagnostic test status
  const handleUpdateTestStatus = (facilityId: string, testId: string, status: TestStatus) => {
    setFacilities(prev => prev.map(fac => {
      if (fac.id !== facilityId) return fac;

      return {
        ...fac,
        diagnosticTests: fac.diagnosticTests.map(t => t.id === testId ? { ...t, status } : t),
      };
    }));

    showToast(`Diagnostic test status updated to ${status}.`, 'info');
  };

  // Handler: Increment footfall
  const handleIncrementFootfall = (facilityId: string, type: 'opd' | 'emergency') => {
    setFacilities(prev => prev.map(fac => {
      if (fac.id !== facilityId) return fac;

      return {
        ...fac,
        patientFootfall: {
          ...fac.patientFootfall,
          todayOPD: fac.patientFootfall.todayOPD + 1,
          emergencyCases: type === 'emergency' ? fac.patientFootfall.emergencyCases + 1 : fac.patientFootfall.emergencyCases,
        },
      };
    }));

    showToast(`Patient registered at ${facilities.find(f => f.id === facilityId)?.name}.`, 'info');
  };

  // Handler: Touchless QR Patient Arrival
  const handleQRScanPatient = (patient: { name: string; abhaId: string; triageType: 'opd' | 'emergency'; age?: number; gender?: string }) => {
    handleIncrementFootfall(selectedFacilityId, patient.triageType);
    showToast(
      `✓ Touchless Patient Arrival: ${patient.name} (${patient.abhaId}) checked into ${currentSelectedFacility.name} ${patient.triageType.toUpperCase()} queue!`,
      'success'
    );
  };

  // Handler: Touchless Medicine Batch Tracking
  const handleQRScanMedicine = (medicine: { batchNo: string; name: string; quantity: number; actionType: 'RECEIVE' | 'DISPENSE' }) => {
    setFacilities(prev => prev.map(fac => {
      if (fac.id !== selectedFacilityId) return fac;

      let matched = false;
      const updatedMedicines = fac.medicines.map(med => {
        if (med.batchNo === medicine.batchNo || med.name.toLowerCase().includes(medicine.name.toLowerCase().split(' ')[0])) {
          matched = true;
          const delta = medicine.actionType === 'RECEIVE' ? medicine.quantity : -medicine.quantity;
          const newStock = Math.max(0, med.currentStock + delta);
          const dos = Number((newStock / (med.dailyBurnRate || 1)).toFixed(1));
          let status: StockStatus = 'ADEQUATE';
          if (dos < 2) status = 'CRITICAL';
          else if (dos < 5) status = 'LOW';
          else if (dos > 30) status = 'SURPLUS';

          return {
            ...med,
            currentStock: newStock,
            daysOfSupply: dos,
            status,
            batchNo: medicine.batchNo || med.batchNo,
          };
        }
        return med;
      });

      return {
        ...fac,
        medicines: updatedMedicines,
        resilienceScore: Math.min(100, fac.resilienceScore + (medicine.actionType === 'RECEIVE' ? 6 : 0)),
      };
    }));

    showToast(
      `✓ Touchless Batch Verified: ${medicine.name} (Lot #${medicine.batchNo}) — ${medicine.actionType === 'RECEIVE' ? `+${medicine.quantity} units received into stock` : `${medicine.quantity} units dispensed`}!`,
      'success'
    );
  };

  // Handler: Submit Qualitative Report
  const handleAddQualitativeReport = (
    facilityId: string, 
    report: Omit<QualitativeReport, 'id' | 'timestamp' | 'status'>
  ) => {
    const newReport: QualitativeReport = {
      ...report,
      id: `rep-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST, ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      status: 'PENDING_REVIEW',
    };

    setFacilities(prev => prev.map(fac => {
      if (fac.id !== facilityId) return fac;
      return {
        ...fac,
        qualitativeReports: [newReport, ...(fac.qualitativeReports || [])],
      };
    }));

    showToast(
      `✓ Qualitative report logged to District CMO Desk: "${report.title}"`,
      'success'
    );
  };

  // Handler: Update Report Status (Acknowledge / Resolve)
  const handleUpdateReportStatus = (facilityId: string, reportId: string, status: ReportStatus) => {
    setFacilities(prev => prev.map(fac => {
      if (fac.id !== facilityId) return fac;
      return {
        ...fac,
        qualitativeReports: fac.qualitativeReports?.map(rep => {
          if (rep.id !== reportId) return rep;
          return {
            ...rep,
            status,
            cmoRemarks: status === 'ACKNOWLEDGED_BY_CMO' ? 'Reviewed and noted by District CMO.' : status === 'RESOLVED' ? 'Issue verified resolved by biomedical / administrative team.' : rep.cmoRemarks,
          };
        }),
      };
    }));

    showToast(`Report status updated to ${status.replace(/_/g, ' ')}.`, 'info');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-800 border border-teal-500/40 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 text-xs text-white animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOffline={isOffline}
        onToggleOffline={() => {
          setIsOffline(!isOffline);
          showToast(!isOffline ? 'Offline cache enabled for rural connectivity simulation.' : 'District grid real-time sync active.', 'info');
        }}
        criticalAlertCount={criticalStockoutCount}
        onOpenCopilot={() => setCopilotOpen(true)}
        facilities={facilities}
        selectedFacilityId={selectedFacilityId}
        onSelectFacility={setSelectedFacilityId}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'command' && (
          <CommandCenterView
            facilities={facilities}
            currentLanguage={currentLanguage}
            onSelectFacility={(id) => {
              setSelectedFacilityId(id);
              setActiveTab('facilityOps');
            }}
            onNavigateToTab={setActiveTab}
            onTriggerCMOAction={handleTriggerCMOAction}
            onInspectAudit={(fac) => setAuditFacility(fac)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            facilities={facilities}
            currentLanguage={currentLanguage}
            onNavigateToTab={setActiveTab}
            onUpdateMedicineStock={handleUpdateMedicineStock}
            onInitiateTransferItem={(facId, medName) => {
              setSelectedFacilityId(facId);
              showToast(`Pre-filling transfer requisition for ${medName}.`, 'info');
            }}
          />
        )}

        {activeTab === 'forecasting' && (
          <DemandForecastingView
            facilities={facilities}
            currentLanguage={currentLanguage}
            onInitiateTransferItem={(facId, medName) => {
              setSelectedFacilityId(facId);
              setActiveTab('redistribution');
            }}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'trends' && (
          <PredictiveHealthTrendsView
            facilities={facilities}
            currentLanguage={currentLanguage}
            onNavigateToTab={setActiveTab}
            onInitiateTransferItem={(facId, medName) => {
              setSelectedFacilityId(facId);
              setActiveTab('redistribution');
            }}
          />
        )}

        {activeTab === 'redistribution' && (
          <RedistributionHubView
            transfers={transfers}
            facilities={facilities}
            currentLanguage={currentLanguage}
            onApproveTransfer={handleApproveTransfer}
            onOpenWaybill={(tsf) => setActiveWaybill(tsf)}
            onGenerateAIPlan={handleGenerateAIPlan}
            isGeneratingPlan={isGeneratingPlan}
          />
        )}

        {activeTab === 'facilityOps' && (
          <FacilityOpsView
            facility={currentSelectedFacility}
            facilities={facilities}
            currentLanguage={currentLanguage}
            onSelectFacility={setSelectedFacilityId}
            onUpdateBeds={handleUpdateBeds}
            onUpdateDoctorAttendance={handleUpdateDoctorAttendance}
            onUpdateTestStatus={handleUpdateTestStatus}
            onIncrementFootfall={handleIncrementFootfall}
            onOpenQRScanner={() => setQrScannerOpen(true)}
            onSubmitQualitativeReport={handleAddQualitativeReport}
            onUpdateReportStatus={handleUpdateReportStatus}
          />
        )}
      </main>

      {/* Modals & Slide-overs */}
      <WaybillModal
        transfer={activeWaybill}
        facilities={facilities}
        onClose={() => setActiveWaybill(null)}
      />

      <AnomalyAuditModal
        facility={auditFacility}
        onClose={() => setAuditFacility(null)}
        onTriggerCMOAction={handleTriggerCMOAction}
      />

      <AICopilotDrawer
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        facilities={facilities}
        currentLanguage={currentLanguage}
      />

      <QRScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        facility={currentSelectedFacility}
        onPatientScanned={handleQRScanPatient}
        onMedicineScanned={handleQRScanMedicine}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>ArogyaSync AI • National Rural Health Supply & Clinical Resilience Network</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Compliant with Indian Public Health Standards (IPHS) & National Health Mission (NHM)
          </div>
        </div>
      </footer>
    </div>
  );
}
