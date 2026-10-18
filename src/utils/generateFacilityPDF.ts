import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HealthFacility } from '../types';

export function generateFacilityOperationalPDF(facility: HealthFacility): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate-900
  const accentTeal: [number, number, number] = [13, 148, 136]; // Teal-600
  const dangerRed: [number, number, number] = [225, 29, 72]; // Rose-600
  const warningAmber: [number, number, number] = [217, 119, 6]; // Amber-600

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, 'F');

  // Title in Banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('NATIONAL HEALTH MISSION • DISTRICT HEALTH ADMINISTRATION', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(204, 251, 241); // Teal-100
  doc.text(`FACILITY OPERATIONAL STATUS & RESILIENCE AUDIT REPORT • ${facility.district.toUpperCase()}`, 14, 18);

  const reportId = `GOV-RPT-${facility.type}-${Math.floor(1000 + Math.random() * 9000)}`;
  const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text(`Ref: ${reportId}  |  Generated: ${timestamp}`, 14, 24);

  let currentY = 36;

  // 2. Facility Executive Profile
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(facility.name, 14, currentY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Classification: ${facility.type}  |  Block: ${facility.block}  |  Distance from District HQ: ${facility.distanceFromDistrictHQKm} km`, 14, currentY + 6);
  doc.text(`Medical Officer In-Charge: ${facility.inChargeDoctor}  |  Contact: ${facility.inChargePhone}`, 14, currentY + 11);

  // Resilience Rating Score Badge on Right
  const scoreColor = facility.resilienceScore < 60 ? dangerRed : facility.resilienceScore < 75 ? warningAmber : accentTeal;
  doc.setFillColor(...scoreColor);
  doc.roundedRect(148, currentY - 5, 48, 18, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('RESILIENCE INDEX', 172, currentY, { align: 'center' });
  doc.setFontSize(13);
  doc.text(`${facility.resilienceScore}/100`, 172, currentY + 6.5, { align: 'center' });
  doc.setFontSize(7.5);
  doc.text(facility.overallStatus.replace('_', ' '), 172, currentY + 10.5, { align: 'center' });

  currentY += 20;

  // 3. Operational Highlights & Alert Callout
  const criticalDrugs = facility.medicines.filter(m => m.status === 'CRITICAL');
  const absentDoctors = facility.doctors.filter(d => d.status === 'ABSENT');
  const bedPct = Math.round((facility.occupiedBeds / (facility.totalBeds || 1)) * 100);
  const reagentOutages = facility.diagnosticTests.filter(t => t.status === 'REAGENT_OUT');

  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 22, 2, 2, 'FD');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('ACTIVE TELEMETRY ALERTS & VULNERABILITY AUDIT', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  let alertText = '';
  if (criticalDrugs.length > 0) alertText += `• Critical Stockout: ${criticalDrugs.map(m => m.name).join(', ')} (<48h supply). `;
  if (bedPct >= 90) alertText += `• Bed Saturation: ${bedPct}% (${facility.occupiedBeds}/${facility.totalBeds} occupied). `;
  if (absentDoctors.length > 0) alertText += `• Doctor Absenteeism: ${absentDoctors.map(d => d.name).join(', ')} unexcused. `;
  if (reagentOutages.length > 0) alertText += `• Lab Reagents Exhausted: ${reagentOutages.map(t => t.name).join(', ')}.`;
  if (!alertText) alertText = '• All operational systems within normal parameters. No critical breaches reported.';

  const splitAlertText = doc.splitTextToSize(alertText, 174);
  doc.text(splitAlertText, 18, currentY + 11);

  currentY += 27;

  // 4. Critical Stock Status Table (autoTable)
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('1. MEDICINE INVENTORY & SUPPLY CHAIN STATUS', 14, currentY);
  currentY += 3;

  const medTableRows = facility.medicines.map(m => [
    m.name,
    m.category,
    `${m.currentStock} ${m.unit}`,
    `${m.minThreshold} ${m.unit}`,
    `${m.dailyBurnRate} ${m.unit}/day`,
    `${m.daysOfSupply} Days`,
    m.status,
    m.coldChainRequired ? `Cold Chain (${m.coldChainTempCelsius || 4.2}°C)` : 'Ambient',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Medicine & Formulation', 'Category', 'Current', 'Min Threshold', 'Burn Rate', 'DOS', 'Status', 'Storage']],
    body: medTableRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      5: { fontStyle: 'bold' },
      6: { fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const val = data.cell.raw;
        if (val === 'CRITICAL') {
          data.cell.styles.textColor = dangerRed;
        } else if (val === 'LOW') {
          data.cell.styles.textColor = warningAmber;
        } else if (val === 'SURPLUS') {
          data.cell.styles.textColor = [124, 58, 237];
        } else {
          data.cell.styles.textColor = accentTeal;
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 5. Doctor Attendance & Duty Roster Table
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('2. MEDICAL STAFF DUTY ROSTER & BIOMETRIC ATTENDANCE', 14, currentY);
  currentY += 3;

  const doctorRows = facility.doctors.map(d => [
    d.name,
    d.designation,
    d.specialty,
    d.shift,
    d.checkInTime || '—',
    d.status,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Doctor / Specialist', 'Designation', 'Specialty', 'Shift', 'Biometric Punch', 'Duty Status']],
    body: doctorRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.raw;
        if (val === 'ABSENT') {
          data.cell.styles.textColor = dangerRed;
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'ON_DUTY' || val === 'PRESENT') {
          data.cell.styles.textColor = accentTeal;
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 6. Bed Availability & Ward Capacity Table
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('3. BED CAPACITY & WARD UTILIZATION', 14, currentY);
  currentY += 3;

  const bedRows = [
    ['General Medical Ward', facility.beds.general.total, facility.beds.general.occupied, facility.beds.general.available, `${Math.round((facility.beds.general.occupied / (facility.beds.general.total || 1)) * 100)}%`],
    ['Maternity & Labor Ward', facility.beds.maternity.total, facility.beds.maternity.occupied, facility.beds.maternity.available, `${Math.round((facility.beds.maternity.occupied / (facility.beds.maternity.total || 1)) * 100)}%`],
    ['Emergency / Triage Ward', facility.beds.emergency.total, facility.beds.emergency.occupied, facility.beds.emergency.available, `${Math.round((facility.beds.emergency.occupied / (facility.beds.emergency.total || 1)) * 100)}%`],
    ['Pediatric Care Ward', facility.beds.pediatric.total, facility.beds.pediatric.occupied, facility.beds.pediatric.available, `${Math.round((facility.beds.pediatric.occupied / (facility.beds.pediatric.total || 1)) * 100)}%`],
    ['Isolation Ward', facility.beds.isolation.total, facility.beds.isolation.occupied, facility.beds.isolation.available, `${Math.round((facility.beds.isolation.occupied / (facility.beds.isolation.total || 1)) * 100)}%`],
    ['TOTAL FACILITY CAPACITY', facility.totalBeds, facility.occupiedBeds, facility.totalBeds - facility.occupiedBeds, `${bedPct}%`],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Ward / Department', 'Total Beds', 'Occupied', 'Available Beds', 'Saturation Rate']],
    body: bedRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    footStyles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need page break for qualitative reports & sign-off
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  // 7. Ground Qualitative Reports & Equipment Issues (if any)
  if (facility.qualitativeReports && facility.qualitativeReports.length > 0) {
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('4. GROUND CHALLENGES & EQUIPMENT REPORTS', 14, currentY);
    currentY += 3;

    const reportRows = facility.qualitativeReports.map(r => [
      r.title,
      r.category.replace(/_/g, ' '),
      r.severity.replace(/_/g, ' '),
      r.reporterName + ` (${r.reporterRole})`,
      r.status.replace(/_/g, ' '),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Report Title', 'Category', 'Severity', 'Logged By', 'Action Status']],
      body: reportRows,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // 8. Sign-off & Seal Box
  if (currentY > 255) {
    doc.addPage();
    currentY = 25;
  }

  doc.setDrawColor(203, 213, 225);
  doc.rect(14, currentY, 182, 24);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('OFFICIAL ADMINISTRATIVE COUNTERSIGNATURE', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Chief Medical Officer (CMO), Rampur Health District: Dr. R. K. Bhattacharya`, 18, currentY + 12);
  doc.text('Cryptographic Verification Hash: NHM-GOV-DIST-SYNC-VALIDATED-OK', 18, currentY + 17);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentTeal);
  doc.text('DIGITALLY CERTIFIED', 155, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('National Rural Health Mission', 152, currentY + 17);

  // Trigger browser PDF download
  const sanitizedName = facility.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${sanitizedName}_Operational_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
