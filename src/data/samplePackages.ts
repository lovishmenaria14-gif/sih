/**
 * Curated Indian packaged commodity label samples for instant scanning and testing.
 */

// Helper to generate a realistic SVG label data URL
function createSampleLabelSvg(options: {
  title: string;
  brand: string;
  category: string;
  netQty: string;
  mrp: string;
  usp?: string;
  mfgDate: string;
  manufacturer: string;
  consumerCare: string;
  countryOfOrigin?: string;
  badges?: string[];
  bgColor?: string;
  textColor?: string;
  warnings?: string;
}): string {
  const {
    title,
    brand,
    category,
    netQty,
    mrp,
    usp,
    mfgDate,
    manufacturer,
    consumerCare,
    countryOfOrigin,
    badges = [],
    bgColor = '#f8fafc',
    textColor = '#0f172a',
    warnings
  } = options;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">
    <defs>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f766e" />
        <stop offset="100%" stop-color="#115e59" />
      </linearGradient>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.1"/>
      </filter>
    </defs>
    
    <!-- Outer Card / Packaging Box -->
    <rect width="600" height="750" fill="${bgColor}" rx="16" stroke="#cbd5e1" stroke-width="4"/>
    
    <!-- Header Banner -->
    <rect x="0" y="0" width="600" height="110" fill="url(#headerGrad)" rx="16"/>
    <rect x="0" y="90" width="600" height="20" fill="url(#headerGrad)"/>
    
    <text x="30" y="45" fill="#f0fdfa" font-family="Arial, sans-serif" font-weight="900" font-size="28" letter-spacing="1">${brand.toUpperCase()}</text>
    <text x="30" y="80" fill="#99f6e4" font-family="Arial, sans-serif" font-weight="600" font-size="18">${title} • ${category}</text>
    
    ${badges.map((b, i) => `
      <rect x="${400 + i * 85}" y="35" width="75" height="30" rx="6" fill="#134e4a"/>
      <text x="${437 + i * 85}" y="55" fill="#ccfbf1" font-family="Arial, sans-serif" font-weight="700" font-size="11" text-anchor="middle">${b}</text>
    `).join('')}

    <!-- Principal Display Panel (PDP) Box -->
    <rect x="25" y="130" width="550" height="590" fill="#ffffff" rx="12" stroke="#e2e8f0" stroke-width="2"/>
    
    <!-- Nutrition / Core Details Section -->
    <line x1="25" y1="230" x2="575" y2="230" stroke="#f1f5f9" stroke-width="2"/>
    <text x="45" y="165" fill="#047857" font-family="Arial, sans-serif" font-weight="800" font-size="20">MANDATORY DECLARATIONS PANEL</text>
    <text x="45" y="195" fill="#64748b" font-family="Arial, sans-serif" font-weight="500" font-size="13">Legal Metrology (Packaged Commodities) Rules, 2011</text>
    <rect x="420" y="150" width="130" height="35" rx="6" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1.5"/>
    <text x="485" y="173" fill="#065f46" font-family="Arial, sans-serif" font-weight="700" font-size="12" text-anchor="middle">RULE 6 VERIFIED</text>

    <!-- Net Quantity Box -->
    <rect x="45" y="250" width="250" height="90" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="60" y="275" fill="#475569" font-family="Arial, sans-serif" font-weight="700" font-size="12">NET QUANTITY (Rule 6(1)(b)):</text>
    <text x="60" y="315" fill="${textColor}" font-family="Arial, sans-serif" font-weight="900" font-size="26">${netQty}</text>

    <!-- MRP & Unit Price Box -->
    <rect x="315" y="250" width="240" height="90" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="330" y="275" fill="#475569" font-family="Arial, sans-serif" font-weight="700" font-size="12">MAXIMUM RETAIL PRICE (MRP):</text>
    <text x="330" y="305" fill="${textColor}" font-family="Arial, sans-serif" font-weight="800" font-size="17">${mrp}</text>
    ${usp ? `<text x="330" y="325" fill="#0f766e" font-family="Arial, sans-serif" font-weight="600" font-size="12">Unit Sale Price: ${usp}</text>` : ''}

    <!-- Date of Manufacture / Packaging -->
    <rect x="45" y="355" width="510" height="50" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="60" y="385" fill="#475569" font-family="Arial, sans-serif" font-weight="700" font-size="13">DATE OF PACKING / MFG (Rule 6(1)(d)):</text>
    <text x="350" y="385" fill="${textColor}" font-family="Arial, sans-serif" font-weight="800" font-size="15">${mfgDate}</text>

    <!-- Manufacturer / Packer Details -->
    <rect x="45" y="420" width="510" height="85" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="60" y="445" fill="#475569" font-family="Arial, sans-serif" font-weight="700" font-size="13">MANUFACTURED &amp; PACKED BY (Rule 6(1)(a)):</text>
    <text x="60" y="470" fill="${textColor}" font-family="Arial, sans-serif" font-weight="600" font-size="13">${manufacturer}</text>
    ${countryOfOrigin ? `<text x="60" y="492" fill="#047857" font-family="Arial, sans-serif" font-weight="700" font-size="12">Country of Origin: ${countryOfOrigin}</text>` : ''}

    <!-- Consumer Care Helpline -->
    <rect x="45" y="520" width="510" height="90" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="60" y="545" fill="#475569" font-family="Arial, sans-serif" font-weight="700" font-size="13">CONSUMER CARE DETAILS (Rule 6(1)(f)):</text>
    <text x="60" y="570" fill="${textColor}" font-family="Arial, sans-serif" font-weight="500" font-size="12">${consumerCare}</text>
    <text x="60" y="595" fill="#64748b" font-family="Arial, sans-serif" font-size="11">For consumer complaints contact Executive - Customer Care at address above.</text>

    ${warnings ? `
      <!-- Intentional Violation / Warning Banner -->
      <rect x="45" y="625" width="510" height="50" rx="8" fill="#fef2f2" stroke="#f87171" stroke-width="1.5"/>
      <text x="60" y="655" fill="#991b1b" font-family="Arial, sans-serif" font-weight="700" font-size="12">⚠️ LABEL DEFECT / SIMULATION: ${warnings}</text>
    ` : `
      <rect x="45" y="625" width="510" height="40" rx="8" fill="#f0fdf4" stroke="#86efac" stroke-width="1"/>
      <text x="60" y="650" fill="#166534" font-family="Arial, sans-serif" font-weight="600" font-size="12">BARCODE / BATCH: 8901030829104 | B.No: B40822A</text>
    `}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface SamplePackageItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  expectedVerdict: 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW';
  keyIssues: string[];
  imageUrl: string;
  pdpAreaSqCm: number;
}

export const SAMPLE_PACKAGES: SamplePackageItem[] = [
  {
    id: 'sample-haldiram-compliant',
    name: "Haldiram's Nagpur Aloo Bhujia (200g)",
    brand: "Haldiram's",
    category: 'FOOD_BEVERAGE',
    description: 'Fully compliant snack packaging adhering to all 2011 Rules & 2022 amendments.',
    expectedVerdict: 'COMPLIANT',
    keyIssues: ['None - Fully Compliant with standard units, USP, PIN code, and complete consumer care'],
    pdpAreaSqCm: 180,
    imageUrl: createSampleLabelSvg({
      title: 'Aloo Bhujia Spicy Mint & Potato Sev',
      brand: "Haldiram's",
      category: 'Food Category - 15.0',
      netQty: '200 g',
      mrp: '₹ 55.00 (incl. of all taxes)',
      usp: '₹ 0.275 / g (₹ 27.50 / 100g)',
      mfgDate: 'PKD: 08/2024 | Best Before 6 Months',
      manufacturer: 'Haldiram Foods Intl. Pvt. Ltd., Plot 145/B, MIDC Industrial Area, Nagpur, Maharashtra - 440028',
      consumerCare: 'Phone: 1800-209-1937 | Email: customercare@haldirams.com | Web: haldirams.com',
      countryOfOrigin: 'India',
      badges: ['FSSAI 1001', 'ISO 22000']
    })
  },
  {
    id: 'sample-noodles-non-compliant',
    name: 'QuickNoodle Masala Express (70gms)',
    brand: 'QuickBite Foods',
    category: 'FOOD_BEVERAGE',
    description: 'Infractions: uses prohibited unit "gms", missing "(incl. of all taxes)", missing consumer care email & PIN code.',
    expectedVerdict: 'NON_COMPLIANT',
    keyIssues: [
      'Rule 11 Violation: Prohibited unit abbreviation "gms" used instead of standard "g"',
      'Rule 6(1)(c) Violation: MRP stated as "Rs. 15/-" without mandatory "(incl. of all taxes)" phrase',
      'Rule 6(1)(f) Violation: Consumer care email ID and postal address omitted',
      'Rule 6(1)(a) Violation: Missing postal PIN code in manufacturer address'
    ],
    pdpAreaSqCm: 95,
    imageUrl: createSampleLabelSvg({
      title: 'Instant Masala Noodles',
      brand: 'QuickBite',
      category: 'Packaged Food',
      netQty: '70 gms', // Violation: gms instead of g
      mrp: 'Rs. 15/- ONLY', // Violation: missing inclusive of taxes
      mfgDate: 'Packed: Jul 2024',
      manufacturer: 'QuickBite Foods Ltd., Industrial Estate, Surat, Gujarat', // Violation: missing PIN code
      consumerCare: 'Helpline: 9876543210', // Violation: missing email & postal address
      badges: ['Snack'],
      warnings: 'Violates Rule 11 ("gms"), Rule 6(1)(c) (taxes not declared), Rule 6(1)(f) (no email)'
    })
  },
  {
    id: 'sample-cosmetic-imported-violations',
    name: 'LuxeGlow Radiance Vitamin C Serum (30ml)',
    brand: 'LuxeGlow Paris',
    category: 'COSMETICS_PERSONAL_CARE',
    description: 'Imported cosmetic package failing Rule 6(10) (Missing Country of Origin) and missing registered Indian importer details.',
    expectedVerdict: 'NON_COMPLIANT',
    keyIssues: [
      'Rule 6(10) Violation: Country of Origin not declared on primary packaging',
      'Rule 6(1)(a) Violation: Imported item missing Indian registered importer name and address',
      'Rule 7 Violation: Net quantity font height is sub-standard (< 1.5mm)'
    ],
    pdpAreaSqCm: 45,
    imageUrl: createSampleLabelSvg({
      title: 'Advanced Brightening Serum',
      brand: 'LuxeGlow Paris',
      category: 'Cosmetics & Personal Care',
      netQty: '30 ml',
      mrp: 'MRP Rs. 899/- (all incl.)',
      mfgDate: 'Mfg: 01/2024',
      manufacturer: 'Laboratoires de Beaute, Rue de Rivoli, Paris, France', // Missing Indian Importer!
      consumerCare: 'contact@luxeglow.com', // Missing telephone & postal address
      badges: ['Derm Tested'],
      warnings: 'Missing Indian Importer details & Country of Origin declaration'
    })
  },
  {
    id: 'sample-electronics-needs-review',
    name: 'SonicBeat Pro Bluetooth Wireless Earbuds',
    brand: 'SonicBeat Audio',
    category: 'ELECTRONICS_APPLIANCES',
    description: 'Packaged electronics accessory with borderline font contrast and missing commodity dimensions/quantity units.',
    expectedVerdict: 'NEEDS_REVIEW',
    keyIssues: [
      'Rule 6(1)(b) Warning: Net quantity declared as "1 piece" instead of standard "1 U" or "1 N"',
      'Rule 7 Warning: Consumer grievance details printed in light grey with marginal contrast ratio',
      'Rule 6(1)(c) Compliant: MRP properly formatted with taxes'
    ],
    pdpAreaSqCm: 110,
    imageUrl: createSampleLabelSvg({
      title: 'True Wireless Stereo Earbuds with ANC',
      brand: 'SonicBeat',
      category: 'Electronic Appliance',
      netQty: '1 piece', // Non-standard unit (should be 1 U or 1 N)
      mrp: '₹ 1,999.00 (inclusive of all taxes)',
      usp: '₹ 1,999.00 / Unit',
      mfgDate: 'Imported: 06/2024',
      manufacturer: 'Imported & Marketed by: SonicBeat Tech India Pvt Ltd, Whitefield, Bengaluru, Karnataka - 560066',
      consumerCare: 'Ph: 080-49204920 | support@sonicbeat.in | Mon-Fri 9am-6pm',
      countryOfOrigin: 'China',
      badges: ['BIS Certified', 'RoHS'],
      warnings: 'Review: "1 piece" unit format check against Rule 13 (Standard Units)'
    })
  }
];
