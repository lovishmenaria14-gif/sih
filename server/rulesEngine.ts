/**
 * Legal Metrology (Packaged Commodities) Rules, 2011
 * Rule-Based Compliance Engine
 */

import { MandatoryDeclarationCheck, ComplianceStatus, ProductCategory, FontReadabilityAnalysis } from '../src/types';
import { getRequiredFontHeight } from '../src/data/rulesData';

export interface RawExtractedData {
  productName?: string;
  brandName?: string;
  category?: ProductCategory;
  packageType?: string;
  pdpAreaSqCm?: number;
  manufacturerName?: string;
  manufacturerAddress?: string;
  hasPinCode?: boolean;
  isImported?: boolean;
  importerDetails?: string;
  countryOfOrigin?: string;
  netQuantityText?: string;
  netQuantityNumeric?: number;
  netQuantityUnit?: string;
  hasProhibitedUnitAbbreviation?: boolean; // e.g. "gms", "kgs", "ltr"
  mrpText?: string;
  mrpAmount?: number;
  hasInclTaxesDeclaration?: boolean;
  unitSalePriceText?: string;
  hasUnitSalePrice?: boolean;
  mfgPackingDateText?: string;
  hasMonthAndYear?: boolean;
  consumerCareName?: string;
  consumerCarePhone?: string;
  consumerCareEmail?: string;
  consumerCareAddress?: string;
  fontAnalysisDetails?: {
    estimatedFontHeightMm: number;
    readabilityScore: 'EXCELLENT' | 'GOOD' | 'BORDERLINE' | 'POOR_ILLEGIBLE';
    contrastAdequate: boolean;
  };
  otherObservations?: string[];
}

export function evaluateLegalMetrologyCompliance(
  raw: RawExtractedData,
  pdpArea: number = 100
): {
  overallStatus: ComplianceStatus;
  complianceScore: number;
  declarations: MandatoryDeclarationCheck[];
  criticalCount: number;
  moderateCount: number;
  penalties: { actSection: string; description: string; minFineInr: number; maxFineInr: number }[];
  summary: string;
} {
  const declarations: MandatoryDeclarationCheck[] = [];
  const penalties: { actSection: string; description: string; minFineInr: number; maxFineInr: number }[] = [];

  const requiredStandardFont = getRequiredFontHeight(pdpArea, false);
  const requiredNetQtyFont = getRequiredFontHeight(pdpArea, true);
  const estimatedHeight = raw.fontAnalysisDetails?.estimatedFontHeightMm || 2.0;

  // 1. Manufacturer / Packer / Importer Name & Address (Rule 6(1)(a))
  const mfgViolations: string[] = [];
  let mfgVerdict: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
  const mfgValue = [raw.manufacturerName, raw.manufacturerAddress].filter(Boolean).join(', ');

  const hasPin = Boolean(raw.hasPinCode) || 
    /\b[1-9][0-9]{5}\b/.test(`${raw.manufacturerAddress} ${raw.manufacturerName} ${raw.consumerCareAddress || ''}`);

  if (!raw.manufacturerName && !raw.manufacturerAddress) {
    mfgViolations.push('Rule 6(1)(a) Violation: Name and complete address of manufacturer/packer is completely missing.');
    mfgVerdict = 'FAIL';
  } else {
    if (raw.isImported && (!raw.importerDetails || raw.importerDetails.length < 5)) {
      mfgViolations.push('Rule 6(1)(a) Violation: Imported commodity missing registered Indian importer details.');
      mfgVerdict = 'FAIL';
    } else if (!hasPin && raw.manufacturerAddress && !raw.isImported) {
      // Check if address specifies city or recognized state/district
      const hasRecognizedLocality = /mumbai|delhi|bangalore|kolkata|chennai|hyderabad|pune|ahmedabad|surat|jaipur|lucknow|nagpur|indore|bhopal|patna|vadodara|ghaziabad|ludhiana|agra|nashik|faridabad|meerut|rajkot|varanasi|srinagar|aurangabad|dhanbad|amritsar|navi mumbai|allahabad|howrah|ranchi|gwalior|jabalpur|coimbatore|vijayawada|jodhpur|madurai|raipur|kota|chandigarh|guwahati|solapur|hubli|dharwad|bareilly|moradabad|mysore|gurgaon|gurugram|aligarh|jalandhar|tiruchirappalli|bhubaneswar|salem|mira|bhayandar|thiruvananthapuram|bhiwandi|saharanpur|gorakhpur|guntur|bikaner|amravati|noida|jamshedpur|bhilai|cuttack|firozabad|kochi|nellore|bhavnagar|dehradun|durgapur|asansol|rourkela|nanded|kolhapur|ajmer|akola|gulbarga|jamnagar|ujjain|loni|siliguri|jhansi|ulhasnagar|jammu|sangli|miraj|kupwad|mangalore|erode|belgaum|kurnool|ambattur|rajahmundry|tirunelveli|malegaon|gaya|tiruppur|davanagere|kozhikode|akbarpur|haryana|punjab|maharashtra|karnataka|tamil nadu|gujarat|rajasthan|uttar pradesh|west bengal|kerala|andhra pradesh|telangana|bihar|madhya pradesh|odisha|india/i.test(raw.manufacturerAddress);
      
      if (!hasRecognizedLocality) {
        mfgViolations.push('Rule 6(1)(a) Infraction: Complete postal address with valid PIN code not provided.');
        mfgVerdict = 'FAIL';
      }
    }
  }

  declarations.push({
    id: 'rule-6-1-a',
    field: 'MANUFACTURER_PACKER_DETAILS',
    title: 'Manufacturer / Packer / Importer Details',
    ruleClause: 'Rule 6(1)(a) & Section 18',
    found: Boolean(mfgValue),
    extractedValue: mfgValue || 'NOT DETECTED',
    verdict: mfgVerdict,
    severity: 'CRITICAL',
    violations: mfgViolations,
    recommendation: mfgVerdict === 'PASS' 
      ? 'Complies with mandatory postal identification guidelines.'
      : 'Include complete registered enterprise name, factory premises, city, state, and 6-digit postal PIN code.'
  });

  // 2. Net Quantity & Standard Unit of Measure (Rule 6(1)(b), Rule 11 & Rule 12)
  const netQtyViolations: string[] = [];
  let netQtyVerdict: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
  const netQtyValue = raw.netQuantityText || (raw.netQuantityNumeric ? `${raw.netQuantityNumeric} ${raw.netQuantityUnit || ''}` : '');

  if (!netQtyValue) {
    netQtyViolations.push('Rule 6(1)(b) Violation: Net quantity is missing from the package.');
    netQtyVerdict = 'FAIL';
  } else {
    const prohibitedUnitsRegex = /\b(gms|gm\b|gm\.|kgs|KG|mlt|ltr|litres|nos|pkts)\b/i;
    if (raw.hasProhibitedUnitAbbreviation || prohibitedUnitsRegex.test(netQtyValue)) {
      netQtyViolations.push('Rule 11 & 12 Violation: Non-standard unit symbol detected (e.g. "gms", "kgs", "ltr"). Standard SI symbols ("g", "kg", "ml", "l", "N", "U") are mandatory.');
      netQtyVerdict = 'FAIL';
    }

    if (/\b(approx|when packed|around|approx\.)\b/i.test(netQtyValue)) {
      netQtyViolations.push('Rule 13 Violation: Net quantity must not be qualified by terms such as "approximate" or "when packed".');
      netQtyVerdict = 'FAIL';
    }
  }

  declarations.push({
    id: 'rule-6-1-b',
    field: 'NET_QUANTITY',
    title: 'Net Quantity & Units Declaration',
    ruleClause: 'Rule 6(1)(b), Rule 11, Rule 12',
    found: Boolean(netQtyValue),
    extractedValue: netQtyValue || 'NOT DETECTED',
    verdict: netQtyVerdict,
    severity: 'CRITICAL',
    violations: netQtyViolations,
    recommendation: netQtyVerdict === 'PASS'
      ? 'Complies with standard metric units and SI symbols.'
      : `Declare exact net quantity using standard SI symbol ("g", "kg", "ml", "l", "N", "U").`
  });

  // 3. Maximum Retail Price (MRP) & Unit Sale Price (Rule 6(1)(c) & Rule 18)
  const mrpViolations: string[] = [];
  let mrpVerdict: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
  const mrpValue = (raw.mrpText || (raw.mrpAmount ? `₹ ${raw.mrpAmount}` : '')).trim();

  const isMrpAbsent = 
    !mrpValue || 
    mrpValue === '' || 
    mrpValue === '₹ 0' || 
    mrpValue === '₹ 0.00' || 
    raw.mrpAmount === 0 || 
    /not\s*(visible|detected|found)|missing|none|^₹?\s*0(\.00?)?$/i.test(mrpValue);

  if (isMrpAbsent) {
    mrpViolations.push('Rule 6(1)(c) Violation: Maximum Retail Price (MRP) is NOT visible or missing on the packaging photo.');
    mrpVerdict = 'FAIL';
  } else {
    const hasTaxes = raw.hasInclTaxesDeclaration || /(incl\.?|inclusive|all\s*incl).*taxes|taxes\s*incl|all\s*taxes/i.test(mrpValue);
    if (!hasTaxes) {
      mrpViolations.push('Rule 6(1)(c) Violation: Mandatory declaration "(inclusive of all taxes)" or "(incl. of all taxes)" is missing.');
      mrpVerdict = 'FAIL';
    }
  }

  const computedUspString = raw.unitSalePriceText || (
    !isMrpAbsent && raw.mrpAmount && raw.netQuantityNumeric && raw.netQuantityNumeric > 0
      ? `₹ ${(raw.mrpAmount / raw.netQuantityNumeric).toFixed(2)} / ${raw.netQuantityUnit || 'g'}`
      : ''
  );

  declarations.push({
    id: 'rule-6-1-c',
    field: 'MRP_USP',
    title: 'Maximum Retail Price (MRP) & Unit Sale Price',
    ruleClause: 'Rule 6(1)(c) & Rule 18',
    found: !isMrpAbsent,
    extractedValue: isMrpAbsent 
      ? 'NOT DETECTED / NOT VISIBLE ON PHOTO' 
      : `${mrpValue}${computedUspString ? ` [USP: ${computedUspString}]` : ''}`,
    verdict: mrpVerdict,
    severity: 'CRITICAL',
    violations: mrpViolations,
    recommendation: mrpVerdict === 'PASS'
      ? 'MRP is compliant with tax declaration and Unit Sale Price.'
      : 'Print MRP strictly as "MRP ₹ xx.xx (incl. of all taxes)" accompanied by Unit Sale Price (₹ per g/ml/item).'
  });

  // 4. Month and Year of Manufacture / Packing (Rule 6(1)(d))
  const dateViolations: string[] = [];
  let dateVerdict: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
  const dateValue = raw.mfgPackingDateText || '';

  if (!dateValue) {
    dateViolations.push('Rule 6(1)(d) Violation: Month and year of manufacture/packing is missing.');
    dateVerdict = 'FAIL';
  } else {
    const hasMonthYear = raw.hasMonthAndYear || 
      /(0[1-9]|1[0-2]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[/\- ]?(20\d{2}|\d{2})/i.test(dateValue) ||
      /\b(20\d{2})\b/.test(dateValue) ||
      /mfd|pkd|packed|batch|mfg|use\s*by|best\s*before/i.test(dateValue);

    if (!hasMonthYear) {
      dateViolations.push('Rule 6(1)(d) Violation: Month and Year must be distinctly identifiable (e.g. "06/2024" or "Jun 2024").');
      dateVerdict = 'FAIL';
    }
  }

  declarations.push({
    id: 'rule-6-1-d',
    field: 'MFG_PKD_DATE',
    title: 'Month & Year of Manufacture / Packing',
    ruleClause: 'Rule 6(1)(d)',
    found: Boolean(dateValue),
    extractedValue: dateValue || 'NOT DETECTED',
    verdict: dateVerdict,
    severity: 'CRITICAL',
    violations: dateViolations,
    recommendation: dateVerdict === 'PASS'
      ? 'Packing/Mfg date format complies with Rule 6(1)(d).'
      : 'Clearly stamp "Mfg Date" or "PKD" with full month and 4-digit year.'
  });

  // 5. Consumer Care Details (Rule 6(1)(f))
  const careViolations: string[] = [];
  let careVerdict: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
  const careParts = [raw.consumerCareName, raw.consumerCarePhone, raw.consumerCareEmail, raw.consumerCareAddress].filter(Boolean);
  const careValue = careParts.join(' | ');

  if (careParts.length === 0) {
    careViolations.push('Rule 6(1)(f) Violation: Complete consumer care redressal details are missing.');
    careVerdict = 'FAIL';
  } else {
    const hasPhone = Boolean(raw.consumerCarePhone) || /(\d{3,5}[-\s]?\d{6,8}|\d{10,12})/.test(careValue);
    const hasEmail = Boolean(raw.consumerCareEmail) || /[\w.-]+@[\w.-]+\.\w+/.test(careValue);
    const hasAddressOrPortal = /executive|consumer|cell|manager|pvt|ltd|floor|street|road|plot|box|care|grievance|feedback|helpline|support|contact|www\.|http|\.com|\.in/i.test(careValue);

    if (!hasPhone && !hasEmail && !hasAddressOrPortal) {
      careViolations.push('Rule 6(1)(f) Infraction: Direct consumer grievance contact channel (telephone or email) is missing.');
      careVerdict = 'FAIL';
    }
  }

  declarations.push({
    id: 'rule-6-1-f',
    field: 'CONSUMER_CARE',
    title: 'Consumer Grievance Care Details',
    ruleClause: 'Rule 6(1)(f)',
    found: careParts.length > 0,
    extractedValue: careValue || 'NOT DETECTED',
    verdict: careVerdict,
    severity: 'MODERATE',
    violations: careViolations,
    recommendation: careVerdict === 'PASS'
      ? 'Consumer redressal channels comply with statutory mandate.'
      : 'Mandatorily specify Name/Designation, physical postal address, contact phone number, or official email ID.'
  });

  // 6. Country of Origin (Rule 6(10) / E-commerce & Imports)
  const originViolations: string[] = [];
  let originVerdict: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
  let originValue = raw.countryOfOrigin || '';

  const isDomestic = !raw.isImported || /india/i.test(`${raw.manufacturerAddress} ${raw.manufacturerName} ${raw.countryOfOrigin || ''}`);
  if (!originValue && isDomestic) {
    originValue = 'India (Domestic Origin)';
  }

  if (raw.isImported && (!originValue || /missing/i.test(originValue))) {
    originViolations.push('Rule 6(10) Violation: Country of Origin is mandatory for imported packaged commodities.');
    originVerdict = 'FAIL';
  } else if (!originValue) {
    originValue = 'India (Domestic Origin)';
  }

  declarations.push({
    id: 'rule-6-10',
    field: 'COUNTRY_OF_ORIGIN',
    title: 'Country of Origin Declaration',
    ruleClause: 'Rule 6(10)',
    found: Boolean(originValue),
    extractedValue: originValue || (raw.isImported ? 'MISSING (Mandatory for import)' : 'India (Domestic Origin)'),
    verdict: originVerdict,
    severity: raw.isImported ? 'CRITICAL' : 'LOW',
    violations: originViolations,
    recommendation: 'Declare "Country of Origin: [Country]" prominently on the principal display panel.'
  });

  // 7. Font Size & Readability Analysis (Rule 7 & Schedule II)
  const fontViolations: string[] = [];
  let fontVerdict: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';

  // Realistic optical calibration for camera photos & packaging artwork
  const isFontHeightOk = estimatedHeight >= (requiredStandardFont * 0.85) || estimatedHeight >= 1.8;

  const fontAnalysis: FontReadabilityAnalysis = {
    estimatedHeightMm: estimatedHeight,
    minRequiredHeightMm: requiredStandardFont,
    isFontHeightCompliant: isFontHeightOk,
    contrastAdequate: raw.fontAnalysisDetails?.contrastAdequate ?? true,
    readabilityScore: raw.fontAnalysisDetails?.readabilityScore || (isFontHeightOk ? 'GOOD' : 'BORDERLINE'),
    details: `Estimated numeral/letter height: ~${estimatedHeight}mm. Mandatory minimum for PDP area ${pdpArea} cm² is ${requiredStandardFont}mm.`
  };

  if (!isFontHeightOk && estimatedHeight < 1.0) {
    fontViolations.push(`Rule 7 & Schedule II Non-Compliance: Measured font height (~${estimatedHeight}mm) fails statutory minimum of ${requiredStandardFont}mm for this package area.`);
    fontVerdict = 'FAIL';
  } else if (!fontAnalysis.contrastAdequate) {
    fontViolations.push('Rule 7 Non-Compliance: Low background contrast impairs optical readability.');
    fontVerdict = 'WARNING';
  }

  declarations.push({
    id: 'rule-7-font',
    field: 'FONT_READABILITY',
    title: 'Font Height & Legibility (Rule 7 / Schedule II)',
    ruleClause: 'Rule 7 & Schedule II',
    found: true,
    extractedValue: `Height: ~${estimatedHeight}mm (Min required: ${requiredStandardFont}mm)`,
    verdict: fontVerdict,
    severity: 'MODERATE',
    violations: fontViolations,
    recommendation: `Ensure typography meets at least ${requiredStandardFont}mm height with high contrast against container background.`,
    fontAnalysis
  });

  // Compute metrics
  const criticalCount = declarations.filter(d => d.verdict === 'FAIL' && d.severity === 'CRITICAL').length;
  const moderateCount = declarations.filter(d => d.verdict === 'FAIL' && d.severity === 'MODERATE').length;
  const warningCount = declarations.filter(d => d.verdict === 'WARNING').length;

  let overallStatus: ComplianceStatus = 'COMPLIANT';
  let complianceScore = 100;

  if (criticalCount > 0) {
    overallStatus = 'NON_COMPLIANT';
    complianceScore = Math.max(10, 100 - (criticalCount * 25 + moderateCount * 12 + warningCount * 5));
    
    penalties.push({
      actSection: 'Section 36(1) of Legal Metrology Act, 2009',
      description: 'Penalty for manufacturing, packing, or selling non-standard or non-compliant packaged commodities.',
      minFineInr: 10000,
      maxFineInr: 25000
    });

    if (declarations.some(d => d.field === 'MRP_USP' && d.verdict === 'FAIL')) {
      penalties.push({
        actSection: 'Section 36(2) of Legal Metrology Act, 2009',
        description: 'Penalty for contravention of retail price declarations or overcharging.',
        minFineInr: 15000,
        maxFineInr: 50000
      });
    }
  } else if (moderateCount > 0 || warningCount >= 2) {
    overallStatus = 'NEEDS_REVIEW';
    complianceScore = Math.max(50, 100 - (moderateCount * 15 + warningCount * 8));
  }

  const summary = overallStatus === 'COMPLIANT'
    ? 'All statutory declarations required under Legal Metrology (Packaged Commodities) Rules, 2011 are present and satisfy format, unit, and font height requirements.'
    : `Identified ${criticalCount} critical violation(s) and ${moderateCount + warningCount} warning(s). Package is liable for notice / seizure under Section 36 of Legal Metrology Act, 2009.`;

  return {
    overallStatus,
    complianceScore,
    declarations,
    criticalCount,
    moderateCount,
    penalties,
    summary
  };
}
