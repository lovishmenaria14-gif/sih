/**
 * Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011
 * Statutory Rules, Penalties, and Font Dimension Thresholds
 */

export interface LegalRuleReference {
  ruleNumber: string;
  actReference: string;
  title: string;
  description: string;
  statutoryRequirements: string[];
  commonViolations: string[];
  penaltyProvision: string;
  minFineInr: number;
  maxFineInr: number;
}

export const LEGAL_METROLOGY_RULES: LegalRuleReference[] = [
  {
    ruleNumber: 'Rule 6(1)(a)',
    actReference: 'Section 18 & 36(1) of Legal Metrology Act, 2009',
    title: 'Manufacturer / Packer / Importer Details',
    description: 'Every package shall bear the name and complete address of the manufacturer, packer, or importer.',
    statutoryRequirements: [
      'Name of the manufacturer or packer or importer',
      'Complete address including premise name, street, city, state, and PIN code',
      'If imported, the name and address of the importer and Country of Origin (Rule 6(10))'
    ],
    commonViolations: [
      'Missing PIN code or street address (only stating city name)',
      'Missing "Manufactured by" or "Packed by" attribution',
      'Missing country of origin on imported packaged goods'
    ],
    penaltyProvision: 'Section 36(1) - Fine up to ₹25,000 for first offence, ₹50,000 for second offence, up to ₹1,00,000 and/or imprisonment up to 1 year for subsequent offences.',
    minFineInr: 10000,
    maxFineInr: 25000
  },
  {
    ruleNumber: 'Rule 6(1)(b) & Rule 11, 12',
    actReference: 'Section 18 & 36(1) of Legal Metrology Act, 2009',
    title: 'Net Quantity & Standard Units',
    description: 'Declaration of net quantity in terms of standard unit of weight, measure, or number without qualifying terms.',
    statutoryRequirements: [
      'Standard SI unit symbols: "g", "kg", "ml", "l" / "L", "m", "cm", "no." or "U"',
      'No non-standard symbols like "gms", "gm.", "kgs", "ltr", "mlt", "nos"',
      'No non-standard qualification like "approx", "when packed", "jumbo size", or "minimum"',
      'Must be placed on Principal Display Panel (PDP) with prescribed minimum font height'
    ],
    commonViolations: [
      'Use of non-standard abbreviation: "gms" instead of "g", or "ltr" instead of "l"',
      'Qualifying words such as "Approx. 500g" or "Net Wt. When Packed"',
      'Font size smaller than mandated under Rule 7 / Schedule II for the package weight'
    ],
    penaltyProvision: 'Section 36(1) - Fine of ₹25,000 (first offense) and seizure of non-compliant stock.',
    minFineInr: 10000,
    maxFineInr: 25000
  },
  {
    ruleNumber: 'Rule 6(1)(c) & Rule 18',
    actReference: 'Section 18, 36(1) & 36(2) of Legal Metrology Act, 2009',
    title: 'Maximum Retail Price (MRP) & Unit Sale Price (USP)',
    description: 'Retail sale price shall be clearly declared in Indian Currency including all taxes, along with Unit Sale Price.',
    statutoryRequirements: [
      'Format: "MRP ₹ xx.xx (incl. of all taxes)" or "Maximum Retail Price Rs. xx.xx (inclusive of all taxes)"',
      'No dual MRPs or price alteration through stickers or smudging (Rule 18(2))',
      'Unit Sale Price (USP) mandatory since 2022 amendment for multi-unit or packages >1kg/1L (e.g. ₹ 0.40 / g or ₹ 40.00 / 100g)'
    ],
    commonViolations: [
      'Missing "(inclusive of all taxes)" phrase',
      'Over-stickered price higher than manufacturer original MRP (violation of Rule 18)',
      'Missing Unit Sale Price (USP) for commodity sold in bulk / quantity > 1kg'
    ],
    penaltyProvision: 'Section 36(1) & Section 36(2) - Overcharging above MRP invites fine up to ₹50,000 and forfeiture.',
    minFineInr: 15000,
    maxFineInr: 50000
  },
  {
    ruleNumber: 'Rule 6(1)(d)',
    actReference: 'Section 18 & 36(1) of Legal Metrology Act, 2009',
    title: 'Month and Year of Manufacture / Packing',
    description: 'Declaration of the month and year in which the commodity is manufactured, packed, or pre-packed.',
    statutoryRequirements: [
      'Must state Month and Year (e.g., "04/2024", "Apr 2024", or "04-2024")',
      'For commodities with limited shelf-life (food, cosmetics, pharma), "Best Before" or "Use by" date is also mandatory'
    ],
    commonViolations: [
      'Missing year or completely blank date stamp',
      'Blurred dot-matrix inkjet coding making date illegible to consumers',
      'Only printing expiry date without original date of packing'
    ],
    penaltyProvision: 'Section 36(1) - Fine up to ₹25,000.',
    minFineInr: 10000,
    maxFineInr: 25000
  },
  {
    ruleNumber: 'Rule 6(1)(f)',
    actReference: 'Section 18 of Legal Metrology Act, 2009',
    title: 'Consumer Care Helpline & Redressal Mechanism',
    description: 'Name, address, telephone number, and email address of the person or officer to be contacted in case of consumer complaints.',
    statutoryRequirements: [
      'Official contact designation/person name (e.g. "Consumer Care Cell / Grievance Officer")',
      'Physical postal address',
      'Working toll-free or telephone helpline number',
      'Valid official email address (e.g., care@company.com)'
    ],
    commonViolations: [
      'Missing email address or only providing a generic website URL',
      'Missing contact phone/telephone number',
      'Illegible tiny font size hidden in the fold of packaging'
    ],
    penaltyProvision: 'Section 36(1) - Compounding fee / fine up to ₹25,000.',
    minFineInr: 5000,
    maxFineInr: 25000
  },
  {
    ruleNumber: 'Rule 7 & Schedule II',
    actReference: 'Section 18 & 36(1) of Legal Metrology Act, 2009',
    title: 'Minimum Font Height & Readability on PDP',
    description: 'Mandatory minimum height of letters and numerals on Principal Display Panel based on package size and net quantity.',
    statutoryRequirements: [
      'PDP Area ≤ 50 cm²: min 1.0mm font height (Net quantity min 1.5mm / 2.0mm blown)',
      '50 cm² < PDP ≤ 100 cm²: min 1.5mm font height (Net quantity min 2.0mm)',
      '100 cm² < PDP ≤ 500 cm²: min 2.0mm font height (Net quantity min 4.0mm)',
      '500 cm² < PDP ≤ 2500 cm²: min 4.0mm font height (Net quantity min 6.0mm)',
      'High contrast between text and background color (no deceptive camouflage)'
    ],
    commonViolations: [
      'Micro-printing mandatory warnings or net weight in sub-1mm font',
      'Low contrast (e.g., yellow text on white background or dark grey on black)',
      'Distorted or condensed fonts that fail minimum optical width standards'
    ],
    penaltyProvision: 'Rule 32 & Section 36(1) - Notice of non-compliance and fine up to ₹25,000.',
    minFineInr: 10000,
    maxFineInr: 25000
  },
  {
    ruleNumber: 'Rule 6(10)',
    actReference: 'Legal Metrology (Packaged Commodities) Amendment Rules',
    title: 'E-Commerce & Digital Marketplace Display',
    description: 'Mandatory display of all packaging declarations on digital marketplaces prior to consumer checkout.',
    statutoryRequirements: [
      'Display of manufacturer, MRP, expiry, net quantity, and country of origin on digital product page',
      'Digital photos must be clear and representative'
    ],
    commonViolations: [
      'E-commerce listing missing Country of Origin declaration',
      'Discrepancy between online displayed MRP and physical package delivered'
    ],
    penaltyProvision: 'Section 36(1) - Fine up to ₹25,000 on seller / marketplace operator.',
    minFineInr: 15000,
    maxFineInr: 25000
  }
];

/**
 * Calculates minimum required font height according to Schedule II / Rule 7
 */
export function getRequiredFontHeight(pdpAreaSqCm: number, isNetQuantity: boolean = false): number {
  if (isNetQuantity) {
    if (pdpAreaSqCm <= 50) return 1.5;
    if (pdpAreaSqCm <= 100) return 2.0;
    if (pdpAreaSqCm <= 500) return 4.0;
    return 6.0;
  }

  if (pdpAreaSqCm <= 50) return 1.0;
  if (pdpAreaSqCm <= 100) return 1.5;
  if (pdpAreaSqCm <= 500) return 2.0;
  if (pdpAreaSqCm <= 2500) return 4.0;
  return 6.0;
}
