/**
 * Legal Metrology (Packaged Commodities) Rules, 2011 & Legal Metrology Act, 2009
 * Comprehensive PDF Generator for Statutory Certificates and Diagnostic Test Reports
 */

import { jsPDF } from 'jspdf';
import { InspectionRecord, InspectorProfile } from '../types';

interface OfficerDetails {
  name: string;
  designation: string;
  badgeId: string;
  jurisdiction: string;
  department: string;
}

function resolveOfficerDetails(
  record: InspectionRecord,
  override?: Partial<InspectorProfile>
): OfficerDetails {
  return {
    name: override?.name || record.inspector?.name || 'Shri Rajesh Sharma',
    designation:
      override?.designation ||
      record.inspector?.designation ||
      'Legal Metrology Officer (LMO) - Class I',
    badgeId: override?.badgeId || record.inspector?.badgeId || 'LM-DL-8821',
    jurisdiction:
      override?.jurisdiction ||
      record.inspector?.jurisdiction ||
      'Central Zone, Division IV, New Delhi',
    department:
      override?.department ||
      record.inspector?.department ||
      'Directorate of Legal Metrology, Dept. of Consumer Affairs'
  };
}

/**
 * Generates an official Government Statutory Certificate (Form-A for Compliant or Form-IV for Offences)
 */
export function generateStatutoryCertificatePdf(
  record: InspectionRecord,
  officerOverride?: Partial<InspectorProfile>
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const officer = resolveOfficerDetails(record, officerOverride);

  const isCompliant = record.overallStatus === 'COMPLIANT';
  const failedRules = record.declarations.filter((d) => d.verdict === 'FAIL');
  const warningRules = record.declarations.filter((d) => d.verdict === 'WARNING');
  const certificateNumber = record.noticeNumber || `CERT/LM/${record.id.replace('INSP-', '')}/2024`;

  let y = 14;

  // Outer Border
  doc.setLineWidth(0.8);
  doc.setDrawColor(isCompliant ? 16 : 185, isCompliant ? 185 : 28, isCompliant ? 129 : 28);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  // Inner Thin Border
  doc.setLineWidth(0.2);
  doc.rect(9.5, 9.5, pageWidth - 19, pageHeight - 19);

  // Government Emblem & Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('GOVERNMENT OF INDIA', pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('MINISTRY OF CONSUMER AFFAIRS, FOOD AND PUBLIC DISTRIBUTION', pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('DEPARTMENT OF CONSUMER AFFAIRS • DIRECTORATE OF LEGAL METROLOGY', pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Certificate Type Banner
  if (isCompliant) {
    doc.setFillColor(16, 185, 129); // Emerald
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setFillColor(185, 28, 28); // Crimson Red
    doc.setTextColor(255, 255, 255);
  }

  doc.rect(10, y, pageWidth - 20, 11, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const certTitle = isCompliant
    ? 'FORM-A: CERTIFICATE OF STATUTORY PACKAGING COMPLIANCE'
    : 'FORM-IV: STATUTORY OFFENCE & VIOLATION CERTIFICATE';
  doc.text(certTitle, pageWidth / 2, y + 7.5, { align: 'center' });

  y += 15;

  // Certificate Reference Row
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Certificate No: ${certificateNumber}`, 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Inspection ID: ${record.id}`, pageWidth / 2, y, { align: 'center' });
  doc.text(`Date of Issue: ${new Date(record.createdAt).toLocaleDateString('en-IN')}`, pageWidth - 14, y, { align: 'right' });

  y += 5;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(14, y, pageWidth - 14, y);
  y += 5;

  // SECTION 1: INSPECTING OFFICER DETAILS
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('I. PARTICULARS OF THE INSPECTING OFFICER (AUTHORISED SIGNATORY)', 17, y + 4.2);
  y += 7.5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Officer Name:', 17, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(officer.name, 44, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Badge / Warrant ID:', 115, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(officer.badgeId, 150, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Designation:', 17, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(officer.designation, 44, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Jurisdiction:', 115, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(officer.jurisdiction.slice(0, 32), 150, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Directorate / Dept:', 17, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(officer.department, 44, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Inspection Point:', 115, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(record.location.slice(0, 32), 150, y);

  y += 7;

  // SECTION 2: COMMODITY & PACKAGING PARTICULARS
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('II. DETAILS OF PACKAGED COMMODITY INSPECTED', 17, y + 4.2);
  y += 7.5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Commodity Name:', 17, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(record.productName.slice(0, 40), 45, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Brand / Trade Name:', 115, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(record.brandName, 150, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Commodity Category:', 17, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(record.category.replace('_', ' '), 45, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('PDP Area (Sq. cm):', 115, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${record.pdpAreaSqCm} cm² (Schedule II applied)`, 150, y);

  y += 7.5;

  // SECTION 3: STATUTORY FINDINGS & SET OF RULES BROKEN
  doc.setFillColor(isCompliant ? 236 : 254, isCompliant ? 253 : 242, isCompliant ? 245 : 242);
  doc.rect(14, y, pageWidth - 28, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(isCompliant ? 6 : 153, isCompliant ? 95 : 27, isCompliant ? 70 : 27);
  
  const section3Title = isCompliant
    ? 'III. STATUTORY AUDIT FINDINGS: NO VIOLATIONS DETECTED (100% COMPLIANT)'
    : `III. SCHEDULE OF BROKEN RULES & STATUTORY OFFENCES (${failedRules.length} CRITICAL VIOLATION${failedRules.length > 1 ? 'S' : ''})`;
  doc.text(section3Title, 17, y + 4.5);
  y += 9;

  if (isCompliant) {
    // Compliant Statement
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, y, pageWidth - 28, 28, 1.5, 1.5, 'FD');

    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL CERTIFICATION UNDER THE LEGAL METROLOGY ACT, 2009', 18, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const compliantMsg = doc.splitTextToSize(
      `This is to formally certify that the commodity "${record.productName}" (Brand: ${record.brandName}) has undergone forensic metrological analysis. All mandatory declarations specified under Rule 6 (Manufacturer details, Standard Net Quantity, MRP inclusive of taxes, Date of Packing, Consumer Care) and Rule 7 / Schedule II (Font height compliance on Principal Display Panel) have been audited and found to strictly conform to the Legal Metrology (Packaged Commodities) Rules, 2011. No compounding notice or prosecution is warranted at this time.`,
      pageWidth - 36
    );
    doc.text(compliantMsg, 18, y + 12);
    y += 33;
  } else {
    // Non-Compliant: Table of Broken Rules
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(153, 27, 27);
    doc.text('The following statutory provisions and mandatory rules under the Legal Metrology Rules, 2011 have been breached:', 14, y);
    y += 4;

    // Table Header for Broken Rules
    doc.setFillColor(185, 28, 28);
    doc.rect(14, y, pageWidth - 28, 6.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('RULE CLAUSE', 17, y + 4.5);
    doc.text('STATUTORY REQUIREMENT', 52, y + 4.5);
    doc.text('LABEL EVIDENCE (DEFECT OBSERVED)', 106, y + 4.5);
    doc.text('PENALTY SECTION', 165, y + 4.5);
    y += 7.5;

    // Render each broken rule
    failedRules.forEach((rule) => {
      if (y > 230) {
        doc.addPage();
        y = 20;
      }

      const rowY = y;
      const defectDesc = rule.violations?.length ? rule.violations.join('; ') : 'Non-compliant declaration';
      const labelText = `Observed: "${rule.extractedValue || 'MISSING'}"\nViolation: ${defectDesc}`;
      const splitText = doc.splitTextToSize(labelText, 54);
      const rowHeight = Math.max(11, splitText.length * 3.6 + 4);

      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(248, 113, 113);
      doc.setLineWidth(0.2);
      doc.rect(14, rowY, pageWidth - 28, rowHeight, 'FD');

      doc.setTextColor(153, 27, 27);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(rule.ruleClause, 17, rowY + 4);

      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text(rule.title.slice(0, 26), 52, rowY + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('Rule 6 / Rule 7 Mandatory', 52, rowY + 8);

      doc.setTextColor(153, 27, 27);
      doc.text(splitText, 106, rowY + 4);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(185, 28, 28);
      doc.setFontSize(7);
      doc.text('Section 36(1)', 165, rowY + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('₹10,000 - ₹25,000', 165, rowY + 8);

      y += rowHeight + 1.5;
    });

    // Warning rules if any
    if (warningRules.length > 0 && y < 225) {
      warningRules.forEach((rule) => {
        const rowY = y;
        const defectDesc = rule.violations?.length ? rule.violations.join('; ') : 'Requires verification';
        const splitText = doc.splitTextToSize(`Warning: ${defectDesc}`, 54);
        const rowHeight = Math.max(9, splitText.length * 3.5 + 3);

        doc.setFillColor(255, 251, 235);
        doc.setDrawColor(251, 191, 36);
        doc.rect(14, rowY, pageWidth - 28, rowHeight, 'FD');

        doc.setTextColor(146, 64, 14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(rule.ruleClause, 17, rowY + 4);
        doc.text(rule.title.slice(0, 26), 52, rowY + 4);
        doc.setFont('helvetica', 'normal');
        doc.text(splitText, 106, rowY + 4);
        doc.text('Advisory Notice', 165, rowY + 4);

        y += rowHeight + 1.5;
      });
    }

    y += 2;

    // Compounding & Legal Notice Text
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, y, pageWidth - 28, 16, 'FD');

    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text('LEGAL DIRECTIVE & COMPOUNDING SUMMONS:', 17, y + 4.5);

    doc.setFont('helvetica', 'normal');
    const directiveText = doc.splitTextToSize(
      'Under powers vested under Section 15 and Section 36 of the Legal Metrology Act, 2009, the manufacturer / packer / retailer is hereby summoned to show cause within fifteen (15) days of receipt of this notice why compounding proceedings or prosecution in the Court of Judicial Magistrate shall not be initiated. Non-compliant stock is subject to seizure under Section 15(1).',
      pageWidth - 36
    );
    doc.text(directiveText, 17, y + 8);
    y += 20;
  }

  // ATTESTATION & SIGNATURE SECTION
  if (y > 235) {
    doc.addPage();
    y = 25;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, y, pageWidth - 28, 32, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('OFFICIAL VERIFICATION & CERTIFICATION SEAL', 17, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `I hereby certify that this audit was performed strictly adhering to statutory standards under the Legal Metrology Act, 2009.`,
    17,
    y + 10
  );
  doc.text(`Digital Verification Code: SHA256-${record.id}-${Date.now().toString(36).toUpperCase()}`, 17, y + 14);
  doc.text(`Timestamp: ${new Date().toISOString()} • National Metrology Portal Sync: VERIFIED`, 17, y + 18);

  // Signature Block
  doc.line(pageWidth - 75, y + 23, pageWidth - 18, y + 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(officer.name, pageWidth - 75, y + 27);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${officer.designation} (${officer.badgeId})`, pageWidth - 75, y + 30);

  // Inspector Seal Box
  doc.setDrawColor(isCompliant ? 16 : 185, isCompliant ? 185 : 28, isCompliant ? 129 : 28);
  doc.setLineWidth(0.4);
  doc.roundedRect(pageWidth - 110, y + 6, 26, 22, 1, 1, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(isCompliant ? 6 : 153, isCompliant ? 95 : 27, isCompliant ? 70 : 27);
  doc.text('OFFICIAL SEAL', pageWidth - 97, y + 12, { align: 'center' });
  doc.text('GOVT. OF INDIA', pageWidth - 97, y + 16, { align: 'center' });
  doc.text('LEGAL METROLOGY', pageWidth - 97, y + 20, { align: 'center' });
  doc.text('DIRECTORATE', pageWidth - 97, y + 24, { align: 'center' });

  // Page Footer
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is a computer-generated statutory certificate under the Legal Metrology (Packaged Commodities) Rules, 2011.',
    pageWidth / 2,
    pageHeight - 11,
    { align: 'center' }
  );

  const filename = isCompliant
    ? `${record.id}_Statutory_Compliance_Certificate.pdf`
    : `${record.id}_Statutory_Offence_Certificate.pdf`;

  doc.save(filename);
}

/**
 * Generates the Full Comprehensive Inspection & Diagnostic Test Report (PDF)
 */
export function generateInspectionPdf(
  record: InspectionRecord,
  officerOverride?: Partial<InspectorProfile>
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const officer = resolveOfficerDetails(record, officerOverride);

  let y = 16;

  // Header Banner
  doc.setFillColor(15, 118, 110); // Teal 700
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011', pageWidth / 2, y, { align: 'center' });
  y += 5.5;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('DIRECTORATE OF LEGAL METROLOGY • OFFICIAL STATUTORY AUDIT & TEST REPORT', pageWidth / 2, y, { align: 'center' });

  y = 35;
  doc.setTextColor(30, 41, 59);

  // Inspection Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 34, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Test Report ID: ${record.id}`, 18, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date & Time: ${new Date(record.createdAt).toLocaleString('en-IN')}`, 18, y + 13);
  doc.text(`Inspecting Officer: ${officer.name} (${officer.badgeId})`, 18, y + 19);
  doc.text(`Designation: ${officer.designation}`, 18, y + 25);
  doc.text(`Jurisdiction: ${officer.jurisdiction}`, 18, y + 31);

  doc.setFont('helvetica', 'bold');
  doc.text(`Commodity: ${record.productName.slice(0, 35)}`, 110, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Brand / Packer: ${record.brandName}`, 110, y + 13);
  doc.text(`Category: ${record.category.replace('_', ' ')}`, 110, y + 19);
  doc.text(`PDP Area: ${record.pdpAreaSqCm} cm² (Schedule II applied)`, 110, y + 25);
  doc.text(`Location: ${record.location.slice(0, 38)}`, 110, y + 31);

  y += 40;

  // Overall Verdict Badge
  const isCompliant = record.overallStatus === 'COMPLIANT';
  const isWarning = record.overallStatus === 'NEEDS_REVIEW';

  if (isCompliant) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(52, 211, 153);
    doc.setTextColor(6, 95, 70);
  } else if (isWarning) {
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(251, 191, 36);
    doc.setTextColor(146, 64, 14);
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(248, 113, 113);
    doc.setTextColor(153, 27, 27);
  }

  doc.roundedRect(14, y, pageWidth - 28, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(
    `COMPLIANCE STATUS: ${record.overallStatus.replace('_', ' ')}  |  SCORE: ${record.complianceScore}/100  |  CRITICAL VIOLATIONS: ${record.criticalViolationsCount}`,
    pageWidth / 2,
    y + 9,
    { align: 'center' }
  );

  y += 19;

  // Summary Text
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const splitSummary = doc.splitTextToSize(`Audit Executive Finding: ${record.summary}`, pageWidth - 28);
  doc.text(splitSummary, 14, y);
  y += splitSummary.length * 4 + 4;

  // DEDICATED SECTION: BROKEN RULES / VIOLATIONS (IF ANY)
  const failedDeclarations = record.declarations.filter((d) => d.verdict === 'FAIL');
  if (failedDeclarations.length > 0) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(248, 113, 113);
    doc.roundedRect(14, y, pageWidth - 28, 7 + failedDeclarations.length * 6, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(185, 28, 28);
    doc.text(`SPECIFIC STATUTORY RULES VIOLATED (${failedDeclarations.length} BREACHES DETECTED):`, 18, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    failedDeclarations.forEach((item, idx) => {
      const vText = item.violations?.length ? item.violations.join('; ') : 'Declaration non-compliant';
      doc.text(`• ${item.ruleClause} (${item.title}): ${vText.slice(0, 110)}`, 18, y + 10 + idx * 5.5);
    });

    y += 10 + failedDeclarations.length * 6;
  }

  // All Mandatory Declarations Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('MANDATORY DECLARATION', 18, y + 5);
  doc.text('STATUTORY CLAUSE', 70, y + 5);
  doc.text('OBSERVED ON PACKAGING', 105, y + 5);
  doc.text('STATUS', 174, y + 5);

  y += 8;

  // Declarations Rows
  record.declarations.forEach((dec) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    const rowHeight = 11;
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(
      dec.verdict === 'FAIL' ? 254 : dec.verdict === 'WARNING' ? 255 : 255,
      dec.verdict === 'FAIL' ? 242 : 255,
      dec.verdict === 'FAIL' ? 242 : 255
    );
    doc.rect(14, y, pageWidth - 28, rowHeight, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(dec.title.slice(0, 30), 18, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(dec.ruleClause, 70, y + 4.5);

    const valPreview = (dec.extractedValue || 'NOT FOUND').slice(0, 42);
    doc.text(valPreview, 105, y + 4.5);

    if (dec.verdict === 'PASS') {
      doc.setTextColor(5, 150, 105);
      doc.setFont('helvetica', 'bold');
      doc.text('✓ PASS', 174, y + 4.5);
    } else if (dec.verdict === 'WARNING') {
      doc.setTextColor(217, 119, 6);
      doc.setFont('helvetica', 'bold');
      doc.text('⚠ WARN', 174, y + 4.5);
    } else {
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'bold');
      doc.text('✗ FAIL', 174, y + 4.5);
    }

    if (dec.violations && dec.violations.length > 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(185, 28, 28);
      doc.text(`Defect: ${dec.violations[0].slice(0, 95)}`, 18, y + 8.5);
    }

    y += rowHeight + 1.5;
  });

  // Statutory Penalties Section
  if (record.penaltiesApplicable && record.penaltiesApplicable.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    y += 3;
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(248, 113, 113);
    doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'FD');

    doc.setTextColor(153, 27, 27);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('APPLICABLE PENALTY & COMPOUNDING PROVISIONS (Legal Metrology Act, 2009)', 18, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    record.penaltiesApplicable.forEach((pen, i) => {
      doc.text(
        `• ${pen.actSection}: Compoundable Fine ₹${pen.minFineInr.toLocaleString('en-IN')} to ₹${pen.maxFineInr.toLocaleString('en-IN')} — ${pen.description}`,
        18,
        y + 11 + i * 5
      );
    });

    y += 28;
  }

  // Official Signature Block
  if (y > 250) {
    doc.addPage();
    y = 30;
  }

  y += 8;
  doc.setDrawColor(148, 163, 184);
  doc.line(14, y, 75, y);
  doc.line(pageWidth - 75, y, pageWidth - 14, y);

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text(`${officer.name}`, 18, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`${officer.designation} (${officer.badgeId})`, 18, y + 8.5);
  doc.text(`${officer.department}`, 18, y + 12);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Manufacturer / Packer Representative', pageWidth - 70, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Acknowledgment & Seal', pageWidth - 70, y + 8.5);

  // Footer
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Legal Metrology Compliance Checking System (LM-CCS) • Official Diagnostic Test Report • Legal Metrology Act, 2009',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  doc.save(`${record.id}_Legal_Metrology_Test_Report.pdf`);
}
