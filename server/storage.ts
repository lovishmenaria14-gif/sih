/**
 * Storage Layer for Inspection Repository
 * Supports local persistence + MongoDB Atlas integration for Vercel/Render deployments.
 */

import fs from 'fs';
import path from 'path';
import dns from 'node:dns';
import { MongoClient, Db, Collection } from 'mongodb';
import { InspectionRecord, AnalyticsStats, ProductCategory, ComplianceStatus } from '../src/types';
import { SAMPLE_PACKAGES } from '../src/data/samplePackages';
import { evaluateLegalMetrologyCompliance } from './rulesEngine';

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'inspections.json');

// In-memory cache for fast response times
let memoryRecords: InspectionRecord[] = [];
let isInitialized = false;

// MongoDB Client State
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let inspectionsCollection: Collection<InspectionRecord> | null = null;
let isMongoConnected = false;

// Ensure storage directory exists
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create .data directory (read-only filesystem):', err);
  }
}

// Seed initial historical inspections based on curated realistic samples
function getSeedRecords(): InspectionRecord[] {
  const seeds: InspectionRecord[] = [];

  // Seed 1: Haldiram Compliant
  const haldiramEval = evaluateLegalMetrologyCompliance({
    productName: "Haldiram's Nagpur Aloo Bhujia (200g)",
    brandName: "Haldiram's",
    category: 'FOOD_BEVERAGE',
    packageType: 'POUCH',
    pdpAreaSqCm: 180,
    manufacturerName: 'Haldiram Foods Intl. Pvt. Ltd.',
    manufacturerAddress: 'Plot 145/B, MIDC Industrial Area, Nagpur, Maharashtra - 440028',
    hasPinCode: true,
    isImported: false,
    countryOfOrigin: 'India',
    netQuantityText: '200 g',
    netQuantityNumeric: 200,
    netQuantityUnit: 'g',
    hasProhibitedUnitAbbreviation: false,
    mrpText: '₹ 55.00 (incl. of all taxes)',
    mrpAmount: 55.0,
    hasInclTaxesDeclaration: true,
    unitSalePriceText: '₹ 0.275 / g (₹ 27.50 / 100g)',
    hasUnitSalePrice: true,
    mfgPackingDateText: 'PKD: 08/2024',
    hasMonthAndYear: true,
    consumerCareName: 'Executive - Customer Care',
    consumerCarePhone: '1800-209-1937',
    consumerCareEmail: 'customercare@haldirams.com',
    consumerCareAddress: 'Haldiram Foods Intl. Pvt. Ltd., Nagpur - 440028',
    fontAnalysisDetails: {
      estimatedFontHeightMm: 3.5,
      readabilityScore: 'EXCELLENT',
      contrastAdequate: true
    }
  }, 180);

  seeds.push({
    id: 'INSP-2024-00101',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    productName: "Haldiram's Nagpur Aloo Bhujia (200g)",
    brandName: "Haldiram's",
    category: 'FOOD_BEVERAGE',
    packageType: 'Flexible Pouch',
    overallStatus: haldiramEval.overallStatus,
    complianceScore: haldiramEval.complianceScore,
    pdpAreaSqCm: 180,
    sampleBatchNo: 'HLD-B40822A',
    inspector: {
      id: 'OFFICER-042',
      name: 'Rajesh Sharma',
      badgeId: 'LM-DL-8821',
      role: 'ENFORCEMENT_OFFICER',
      jurisdiction: 'New Delhi North Zone'
    },
    declarations: haldiramEval.declarations,
    criticalViolationsCount: haldiramEval.criticalCount,
    moderateViolationsCount: haldiramEval.moderateCount,
    summary: haldiramEval.summary,
    penaltiesApplicable: haldiramEval.penalties,
    officialNoticeIssued: false,
    evidenceImages: [SAMPLE_PACKAGES[0].imageUrl],
    location: 'Reliance Smart Supermarket, Karol Bagh, New Delhi',
    latitude: 28.6521,
    longitude: 77.1906,
    city: 'New Delhi',
    state: 'Delhi'
  });

  // Seed 2: Noodles Non-Compliant ("gms" violation & missing email & missing taxes)
  const noodlesEval = evaluateLegalMetrologyCompliance({
    productName: 'QuickNoodle Masala Express (70gms)',
    brandName: 'QuickBite Foods',
    category: 'FOOD_BEVERAGE',
    packageType: 'Pillow Pouch',
    pdpAreaSqCm: 95,
    manufacturerName: 'QuickBite Foods Ltd.',
    manufacturerAddress: 'Industrial Estate, Surat, Gujarat', // No PIN
    hasPinCode: false,
    isImported: false,
    countryOfOrigin: 'India',
    netQuantityText: '70 gms', // Non-standard unit!
    netQuantityNumeric: 70,
    netQuantityUnit: 'gms',
    hasProhibitedUnitAbbreviation: true,
    mrpText: 'Rs. 15/- ONLY', // Missing inclusive of taxes
    mrpAmount: 15.0,
    hasInclTaxesDeclaration: false,
    unitSalePriceText: '',
    hasUnitSalePrice: false,
    mfgPackingDateText: 'Packed: Jul 2024',
    hasMonthAndYear: true,
    consumerCareName: 'Customer Helpline',
    consumerCarePhone: '9876543210',
    consumerCareEmail: '', // Missing email
    consumerCareAddress: '',
    fontAnalysisDetails: {
      estimatedFontHeightMm: 1.1,
      readabilityScore: 'BORDERLINE',
      contrastAdequate: true
    }
  }, 95);

  seeds.push({
    id: 'INSP-2024-00102',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    productName: 'QuickNoodle Masala Express (70gms)',
    brandName: 'QuickBite Foods',
    category: 'FOOD_BEVERAGE',
    packageType: 'Pillow Pouch',
    overallStatus: noodlesEval.overallStatus,
    complianceScore: noodlesEval.complianceScore,
    pdpAreaSqCm: 95,
    sampleBatchNo: 'QCK-99120',
    inspector: {
      id: 'OFFICER-042',
      name: 'Rajesh Sharma',
      badgeId: 'LM-DL-8821',
      role: 'ENFORCEMENT_OFFICER',
      jurisdiction: 'New Delhi North Zone'
    },
    declarations: noodlesEval.declarations,
    criticalViolationsCount: noodlesEval.criticalCount,
    moderateViolationsCount: noodlesEval.moderateCount,
    summary: noodlesEval.summary,
    penaltiesApplicable: noodlesEval.penalties,
    officialNoticeIssued: true,
    noticeNumber: 'LM/NOTICE/2024/DEL-771',
    evidenceImages: [SAMPLE_PACKAGES[1].imageUrl],
    location: 'Blinkit Fulfillment Hub, Okhla Phase III, New Delhi',
    latitude: 28.5355,
    longitude: 77.2728,
    city: 'New Delhi',
    state: 'Delhi'
  });

  // Seed 3: Cosmetic Missing Country of Origin & Importer
  const cosmeticEval = evaluateLegalMetrologyCompliance({
    productName: 'LuxeGlow Radiance Vitamin C Serum (30ml)',
    brandName: 'LuxeGlow Paris',
    category: 'COSMETICS_PERSONAL_CARE',
    packageType: 'Glass Bottle with Monocarton',
    pdpAreaSqCm: 45,
    manufacturerName: 'Laboratoires de Beaute',
    manufacturerAddress: 'Rue de Rivoli, Paris, France',
    hasPinCode: false,
    isImported: true,
    importerDetails: '', // Missing importer!
    countryOfOrigin: '', // Missing country of origin!
    netQuantityText: '30 ml',
    netQuantityNumeric: 30,
    netQuantityUnit: 'ml',
    hasProhibitedUnitAbbreviation: false,
    mrpText: 'MRP Rs. 899/- (all incl.)',
    mrpAmount: 899,
    hasInclTaxesDeclaration: true,
    unitSalePriceText: '',
    hasUnitSalePrice: false,
    mfgPackingDateText: 'Mfg: 01/2024',
    hasMonthAndYear: true,
    consumerCareName: '',
    consumerCarePhone: '',
    consumerCareEmail: 'contact@luxeglow.com',
    consumerCareAddress: '',
    fontAnalysisDetails: {
      estimatedFontHeightMm: 0.8,
      readabilityScore: 'POOR_ILLEGIBLE',
      contrastAdequate: false
    }
  }, 45);

  seeds.push({
    id: 'INSP-2024-00103',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    productName: 'LuxeGlow Radiance Vitamin C Serum (30ml)',
    brandName: 'LuxeGlow Paris',
    category: 'COSMETICS_PERSONAL_CARE',
    packageType: 'Glass Dropper Bottle',
    overallStatus: cosmeticEval.overallStatus,
    complianceScore: cosmeticEval.complianceScore,
    pdpAreaSqCm: 45,
    sampleBatchNo: 'LX-FR-004',
    inspector: {
      id: 'OFFICER-019',
      name: 'Priyanka Iyer',
      badgeId: 'LM-MH-4419',
      role: 'ENFORCEMENT_OFFICER',
      jurisdiction: 'Mumbai Coastal Zone'
    },
    declarations: cosmeticEval.declarations,
    criticalViolationsCount: cosmeticEval.criticalCount,
    moderateViolationsCount: cosmeticEval.moderateCount,
    summary: cosmeticEval.summary,
    penaltiesApplicable: cosmeticEval.penalties,
    officialNoticeIssued: true,
    noticeNumber: 'LM/SEIZURE/2024/BOM-390',
    evidenceImages: [SAMPLE_PACKAGES[2].imageUrl],
    location: 'Nykaa Retail Outlet, Bandra West, Mumbai',
    latitude: 19.0596,
    longitude: 72.8295,
    city: 'Mumbai',
    state: 'Maharashtra'
  });

  // Seed 4: Bengaluru Organic Green Tea (Compliant)
  const greenTeaEval = evaluateLegalMetrologyCompliance({
    productName: 'Himalayan Pure Organic Green Tea (100g)',
    brandName: 'NatureLeaf Organics',
    category: 'FOOD_BEVERAGE',
    packageType: 'Carton Box',
    pdpAreaSqCm: 120,
    manufacturerName: 'NatureLeaf Plantation Pvt. Ltd.',
    manufacturerAddress: 'Survey 22, Devanahalli Rural, Bengaluru, Karnataka - 562110',
    hasPinCode: true,
    isImported: false,
    countryOfOrigin: 'India',
    netQuantityText: '100 g',
    netQuantityNumeric: 100,
    netQuantityUnit: 'g',
    hasProhibitedUnitAbbreviation: false,
    mrpText: '₹ 220.00 (inclusive of all taxes)',
    mrpAmount: 220,
    hasInclTaxesDeclaration: true,
    unitSalePriceText: '₹ 2.20 / g',
    hasUnitSalePrice: true,
    mfgPackingDateText: 'PKD: 09/2024',
    hasMonthAndYear: true,
    consumerCareName: 'Customer Relations Officer',
    consumerCarePhone: '080-28910291',
    consumerCareEmail: 'support@natureleaf.in',
    consumerCareAddress: 'NatureLeaf Plantation, Bengaluru - 562110',
    fontAnalysisDetails: {
      estimatedFontHeightMm: 2.8,
      readabilityScore: 'EXCELLENT',
      contrastAdequate: true
    }
  }, 120);

  seeds.push({
    id: 'INSP-2024-00104',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    productName: 'Himalayan Pure Organic Green Tea (100g)',
    brandName: 'NatureLeaf Organics',
    category: 'FOOD_BEVERAGE',
    packageType: 'Carton Box',
    overallStatus: greenTeaEval.overallStatus,
    complianceScore: greenTeaEval.complianceScore,
    pdpAreaSqCm: 120,
    sampleBatchNo: 'NL-GT-881',
    inspector: {
      id: 'OFFICER-033',
      name: 'Anand Kumar',
      badgeId: 'LM-KA-1904',
      role: 'ENFORCEMENT_OFFICER',
      jurisdiction: 'Bengaluru South Zone'
    },
    declarations: greenTeaEval.declarations,
    criticalViolationsCount: greenTeaEval.criticalCount,
    moderateViolationsCount: greenTeaEval.moderateCount,
    summary: greenTeaEval.summary,
    penaltiesApplicable: greenTeaEval.penalties,
    officialNoticeIssued: false,
    evidenceImages: [SAMPLE_PACKAGES[0].imageUrl],
    location: "Nature's Basket, Koramangala 4th Block, Bengaluru",
    latitude: 12.9352,
    longitude: 77.6245,
    city: 'Bengaluru',
    state: 'Karnataka'
  });

  // Seed 5: Hyderabad Ayurvedic Pain Relief Oil (Missing USP and Incomplete Address)
  const oilEval = evaluateLegalMetrologyCompliance({
    productName: 'MahaVed Maha Pain Relief Tailam (100ml)',
    brandName: 'MahaVed Ayurveda',
    category: 'PHARMACEUTICALS_WELLNESS',
    packageType: 'Pet Bottle',
    pdpAreaSqCm: 80,
    manufacturerName: 'MahaVed Healthcare',
    manufacturerAddress: 'Industrial Area, Hyderabad', // Missing PIN code
    hasPinCode: false,
    isImported: false,
    countryOfOrigin: 'India',
    netQuantityText: '100 ml',
    netQuantityNumeric: 100,
    netQuantityUnit: 'ml',
    hasProhibitedUnitAbbreviation: false,
    mrpText: 'MRP Rs. 180/- (Incl. of all taxes)',
    mrpAmount: 180,
    hasInclTaxesDeclaration: true,
    unitSalePriceText: '', // Missing USP
    hasUnitSalePrice: false,
    mfgPackingDateText: 'Batch Mfg: 06/2024',
    hasMonthAndYear: true,
    consumerCareName: 'Ayurveda Help Desk',
    consumerCarePhone: '040-67890123',
    consumerCareEmail: 'care@mahaved.in',
    consumerCareAddress: 'Hyderabad',
    fontAnalysisDetails: {
      estimatedFontHeightMm: 1.4,
      readabilityScore: 'GOOD',
      contrastAdequate: true
    }
  }, 80);

  seeds.push({
    id: 'INSP-2024-00105',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    productName: 'MahaVed Maha Pain Relief Tailam (100ml)',
    brandName: 'MahaVed Ayurveda',
    category: 'PHARMACEUTICALS_WELLNESS',
    packageType: 'Pet Bottle',
    overallStatus: oilEval.overallStatus,
    complianceScore: oilEval.complianceScore,
    pdpAreaSqCm: 80,
    sampleBatchNo: 'MV-OIL-302',
    inspector: {
      id: 'OFFICER-051',
      name: 'Venkatesh Rao',
      badgeId: 'LM-TS-5512',
      role: 'ENFORCEMENT_OFFICER',
      jurisdiction: 'Hyderabad Central Zone'
    },
    declarations: oilEval.declarations,
    criticalViolationsCount: oilEval.criticalCount,
    moderateViolationsCount: oilEval.moderateCount,
    summary: oilEval.summary,
    penaltiesApplicable: oilEval.penalties,
    officialNoticeIssued: true,
    noticeNumber: 'LM/NOTICE/2024/HYD-219',
    evidenceImages: [SAMPLE_PACKAGES[1].imageUrl],
    location: 'MedPlus Pharmacy, Banjara Hills Road No. 12, Hyderabad',
    latitude: 17.4156,
    longitude: 78.4350,
    city: 'Hyderabad',
    state: 'Telangana'
  });

  // Seed 6: Chennai Garam Masala Pack (Compliant)
  const masalaEval = evaluateLegalMetrologyCompliance({
    productName: 'Aachi Shahi Garam Masala (100g)',
    brandName: 'Aachi Spices',
    category: 'FOOD_BEVERAGE',
    packageType: 'Printed Pouch',
    pdpAreaSqCm: 110,
    manufacturerName: 'Aachi Spices & Foods Pvt. Ltd.',
    manufacturerAddress: 'Plot 1926, 34th Street, Ishwarya Colony, Anna Nagar West, Chennai, Tamil Nadu - 600040',
    hasPinCode: true,
    isImported: false,
    countryOfOrigin: 'India',
    netQuantityText: '100 g',
    netQuantityNumeric: 100,
    netQuantityUnit: 'g',
    hasProhibitedUnitAbbreviation: false,
    mrpText: '₹ 68.00 (incl. of all taxes)',
    mrpAmount: 68,
    hasInclTaxesDeclaration: true,
    unitSalePriceText: '₹ 0.68 / g',
    hasUnitSalePrice: true,
    mfgPackingDateText: 'PKD: 07/2024',
    hasMonthAndYear: true,
    consumerCareName: 'Customer Grievance Cell',
    consumerCarePhone: '1800-425-2888',
    consumerCareEmail: 'feedback@aachigroup.com',
    consumerCareAddress: 'Anna Nagar West, Chennai - 600040',
    fontAnalysisDetails: {
      estimatedFontHeightMm: 3.0,
      readabilityScore: 'EXCELLENT',
      contrastAdequate: true
    }
  }, 110);

  seeds.push({
    id: 'INSP-2024-00106',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    productName: 'Aachi Shahi Garam Masala (100g)',
    brandName: 'Aachi Spices',
    category: 'FOOD_BEVERAGE',
    packageType: 'Printed Pouch',
    overallStatus: masalaEval.overallStatus,
    complianceScore: masalaEval.complianceScore,
    pdpAreaSqCm: 110,
    sampleBatchNo: 'ACH-GM-770',
    inspector: {
      id: 'OFFICER-067',
      name: 'K. Senthil Nathan',
      badgeId: 'LM-TN-3301',
      role: 'ENFORCEMENT_OFFICER',
      jurisdiction: 'Chennai South Zone'
    },
    declarations: masalaEval.declarations,
    criticalViolationsCount: masalaEval.criticalCount,
    moderateViolationsCount: masalaEval.moderateCount,
    summary: masalaEval.summary,
    penaltiesApplicable: masalaEval.penalties,
    officialNoticeIssued: false,
    evidenceImages: [SAMPLE_PACKAGES[0].imageUrl],
    location: 'Reliance Fresh, Pondy Bazaar, T. Nagar, Chennai',
    latitude: 13.0418,
    longitude: 80.2341,
    city: 'Chennai',
    state: 'Tamil Nadu'
  });

  // Seed 7: Kolkata Premium Darjeeling Tea (Compliant)
  const kolkataEval = evaluateLegalMetrologyCompliance({
    productName: 'Goodricke Castleton Darjeeling Vintage Tea (250g)',
    brandName: 'Goodricke Group',
    category: 'FOOD_BEVERAGE',
    packageType: 'Tin Caddy Box',
    pdpAreaSqCm: 150,
    manufacturerName: 'Goodricke Group Limited',
    manufacturerAddress: 'Camac Street, Kolkata, West Bengal - 700016',
    hasPinCode: true,
    isImported: false,
    countryOfOrigin: 'India',
    netQuantityText: '250 g',
    netQuantityNumeric: 250,
    netQuantityUnit: 'g',
    hasProhibitedUnitAbbreviation: false,
    mrpText: '₹ 650.00 (inclusive of all taxes)',
    mrpAmount: 650,
    hasInclTaxesDeclaration: true,
    unitSalePriceText: '₹ 2.60 / g',
    hasUnitSalePrice: true,
    mfgPackingDateText: 'PKD: 08/2024',
    hasMonthAndYear: true,
    consumerCareName: 'Customer Support Manager',
    consumerCarePhone: '033-22873067',
    consumerCareEmail: 'corporate@goodricke.com',
    consumerCareAddress: 'Kolkata - 700016',
    fontAnalysisDetails: {
      estimatedFontHeightMm: 3.2,
      readabilityScore: 'EXCELLENT',
      contrastAdequate: true
    }
  }, 150);

  seeds.push({
    id: 'INSP-2024-00107',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    productName: 'Goodricke Castleton Darjeeling Vintage Tea (250g)',
    brandName: 'Goodricke Group',
    category: 'FOOD_BEVERAGE',
    packageType: 'Tin Caddy Box',
    overallStatus: kolkataEval.overallStatus,
    complianceScore: kolkataEval.complianceScore,
    pdpAreaSqCm: 150,
    sampleBatchNo: 'GDR-DJ-104',
    inspector: {
      id: 'OFFICER-088',
      name: 'Subrata Mukherjee',
      badgeId: 'LM-WB-9021',
      role: 'ENFORCEMENT_OFFICER',
      jurisdiction: 'Kolkata Central Zone'
    },
    declarations: kolkataEval.declarations,
    criticalViolationsCount: kolkataEval.criticalCount,
    moderateViolationsCount: kolkataEval.moderateCount,
    summary: kolkataEval.summary,
    penaltiesApplicable: kolkataEval.penalties,
    officialNoticeIssued: false,
    evidenceImages: [SAMPLE_PACKAGES[0].imageUrl],
    location: "Spencer's Retail Hyperstore, Park Street, Kolkata",
    latitude: 22.5535,
    longitude: 88.3518,
    city: 'Kolkata',
    state: 'West Bengal'
  });

  // Seed 8: Surat Textile Apparel Packaging (Severe Violation: No MRP / Non-compliant Unit)
  const suratEval = evaluateLegalMetrologyCompliance({
    productName: 'Pure Silk Designer Jacquard Saree (1 Pc)',
    brandName: 'Surat Textiles Hub',
    category: 'TEXTILES_APPAREL',
    packageType: 'Polybag with Tag',
    pdpAreaSqCm: 70,
    manufacturerName: 'Vardhman Fabrics',
    manufacturerAddress: 'Ring Road, Surat, Gujarat', // No PIN
    hasPinCode: false,
    isImported: false,
    countryOfOrigin: 'India',
    netQuantityText: '1 Nos', // Should be 1 N / 1 U
    netQuantityNumeric: 1,
    netQuantityUnit: 'Nos',
    hasProhibitedUnitAbbreviation: true,
    mrpText: 'Rate: 1450', // Missing Rs./MRP and taxes
    mrpAmount: 1450,
    hasInclTaxesDeclaration: false,
    unitSalePriceText: '',
    hasUnitSalePrice: false,
    mfgPackingDateText: '', // Missing date
    hasMonthAndYear: false,
    consumerCareName: '',
    consumerCarePhone: '9988776655',
    consumerCareEmail: '',
    consumerCareAddress: '',
    fontAnalysisDetails: {
      estimatedFontHeightMm: 0.9,
      readabilityScore: 'POOR_ILLEGIBLE',
      contrastAdequate: false
    }
  }, 70);

  seeds.push({
    id: 'INSP-2024-00108',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    productName: 'Pure Silk Designer Jacquard Saree (1 Pc)',
    brandName: 'Surat Textiles Hub',
    category: 'TEXTILES_APPAREL',
    packageType: 'Polybag with Tag',
    overallStatus: suratEval.overallStatus,
    complianceScore: suratEval.complianceScore,
    pdpAreaSqCm: 70,
    sampleBatchNo: 'SRT-TEX-99',
    inspector: {
      id: 'OFFICER-024',
      name: 'Bhavesh Patel',
      badgeId: 'LM-GJ-7718',
      role: 'ENFORCEMENT_OFFICER',
      jurisdiction: 'Surat Commercial Hub'
    },
    declarations: suratEval.declarations,
    criticalViolationsCount: suratEval.criticalCount,
    moderateViolationsCount: suratEval.moderateCount,
    summary: suratEval.summary,
    penaltiesApplicable: suratEval.penalties,
    officialNoticeIssued: true,
    noticeNumber: 'LM/SEIZURE/2024/SRT-882',
    evidenceImages: [SAMPLE_PACKAGES[1].imageUrl],
    location: 'Surat Textile Market, Ring Road, Surat',
    latitude: 21.1959,
    longitude: 72.8488,
    city: 'Surat',
    state: 'Gujarat'
  });

  // Seed 9: Ahmedabad FMCG Detergent (Compliant)
  const ahmedabadEval = evaluateLegalMetrologyCompliance({
    productName: 'GlowClean Bio-Enzyme Laundry Powder (1kg)',
    brandName: 'GlowClean Home Care',
    category: 'FMCG_HOUSEHOLD',
    packageType: 'Heavy Duty Poly Pouch',
    pdpAreaSqCm: 220,
    manufacturerName: 'GlowClean Industries Ltd.',
    manufacturerAddress: 'GIDC Industrial Estate, Naroda, Ahmedabad, Gujarat - 382330',
    hasPinCode: true,
    isImported: false,
    countryOfOrigin: 'India',
    netQuantityText: '1 kg',
    netQuantityNumeric: 1000,
    netQuantityUnit: 'kg',
    hasProhibitedUnitAbbreviation: false,
    mrpText: '₹ 140.00 (incl. of all taxes)',
    mrpAmount: 140,
    hasInclTaxesDeclaration: true,
    unitSalePriceText: '₹ 0.14 / g (₹ 140.00 / kg)',
    hasUnitSalePrice: true,
    mfgPackingDateText: 'PKD: 08/2024',
    hasMonthAndYear: true,
    consumerCareName: 'Customer Relations Executive',
    consumerCarePhone: '1800-233-4455',
    consumerCareEmail: 'support@glowclean.in',
    consumerCareAddress: 'Naroda, Ahmedabad - 382330',
    fontAnalysisDetails: {
      estimatedFontHeightMm: 4.2,
      readabilityScore: 'EXCELLENT',
      contrastAdequate: true
    }
  }, 220);

  seeds.push({
    id: 'INSP-2024-00109',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    productName: 'GlowClean Bio-Enzyme Laundry Powder (1kg)',
    brandName: 'GlowClean Home Care',
    category: 'FMCG_HOUSEHOLD',
    packageType: 'Heavy Duty Poly Pouch',
    overallStatus: ahmedabadEval.overallStatus,
    complianceScore: ahmedabadEval.complianceScore,
    pdpAreaSqCm: 220,
    sampleBatchNo: 'GLW-DET-550',
    inspector: {
      id: 'OFFICER-029',
      name: 'Hitesh Shah',
      badgeId: 'LM-GJ-8802',
      role: 'ENFORCEMENT_OFFICER',
      jurisdiction: 'Ahmedabad East Zone'
    },
    declarations: ahmedabadEval.declarations,
    criticalViolationsCount: ahmedabadEval.criticalCount,
    moderateViolationsCount: ahmedabadEval.moderateCount,
    summary: ahmedabadEval.summary,
    penaltiesApplicable: ahmedabadEval.penalties,
    officialNoticeIssued: false,
    evidenceImages: [SAMPLE_PACKAGES[0].imageUrl],
    location: 'Osia Hypermart, SG Highway, Ahmedabad',
    latitude: 23.0425,
    longitude: 72.5214,
    city: 'Ahmedabad',
    state: 'Gujarat'
  });

  return seeds;
}

export async function initStorage() {
  if (isInitialized) return;
  ensureDataDir();

  // Try connecting to MongoDB if URI is configured
  const mongoUri = process.env.MONGODB_URI?.trim();
  if (mongoUri && !isMongoConnected) {
    try {
      // Use public Google & Cloudflare DNS to reliably resolve MongoDB Atlas SRV records
      try {
        dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
      } catch {
        // Fallback to system default if custom DNS cannot be configured
      }

      console.log('Connecting to MongoDB database...');
      mongoClient = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });
      await mongoClient.connect();
      mongoDb = mongoClient.db();
      inspectionsCollection = mongoDb.collection<InspectionRecord>('inspections');
      isMongoConnected = true;
      console.log('MongoDB successfully connected and operational.');

      // Check existing inspections in MongoDB
      const count = await inspectionsCollection.countDocuments();
      if (count === 0) {
        console.log('Seeding initial Legal Metrology compliance records into MongoDB...');
        const seeds = getSeedRecords();
        await inspectionsCollection.insertMany(seeds);
        memoryRecords = seeds;
      } else {
        const docs = await inspectionsCollection.find({}).sort({ createdAt: -1 }).toArray();
        memoryRecords = docs.map(doc => {
          // Remove Mongo _id from object representation if present
          const { _id, ...rest } = doc as any;
          return rest as InspectionRecord;
        });
        console.log(`Loaded ${memoryRecords.length} records from MongoDB.`);
      }

      isInitialized = true;
      return;
    } catch (mongoErr) {
      console.warn('MongoDB connection notice (will use structured local persistence):', (mongoErr as any)?.message || mongoErr);
      isMongoConnected = false;
    }
  }

  // Fallback to local structured JSON file persistence
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      memoryRecords = JSON.parse(data);

      // Harmonize historical declarations with statutory rules engine
      let updatedAny = false;
      memoryRecords = memoryRecords.map(rec => {
        if (rec.declarations) {
          rec.declarations = rec.declarations.map(dec => {
            if (dec.field === 'NET_QUANTITY' && dec.verdict === 'WARNING' && dec.violations.some(v => v.includes('font height'))) {
              dec.verdict = 'PASS';
              dec.violations = dec.violations.filter(v => !v.includes('font height'));
              dec.recommendation = 'Complies with standard metric units and SI symbols.';
              updatedAny = true;
            }
            if (dec.field === 'COUNTRY_OF_ORIGIN' && dec.verdict === 'WARNING' && !rec.productName.toLowerCase().includes('imported')) {
              dec.verdict = 'PASS';
              dec.extractedValue = dec.extractedValue === 'Not Explicitly Stated' ? 'India (Domestic Origin)' : dec.extractedValue;
              dec.violations = [];
              updatedAny = true;
            }
            return dec;
          });

          // If no violations remain, ensure status is COMPLIANT and score is 100
          const hasFailures = rec.declarations.some(d => d.verdict === 'FAIL');
          const hasWarnings = rec.declarations.some(d => d.verdict === 'WARNING');
          if (!hasFailures && !hasWarnings) {
            rec.overallStatus = 'COMPLIANT';
            rec.complianceScore = 100;
            rec.criticalViolationsCount = 0;
            rec.moderateViolationsCount = 0;
            rec.penaltiesApplicable = [];
            updatedAny = true;
          }
        }
        return rec;
      });

      if (updatedAny) {
        saveToDisk();
      }
    } else {
      memoryRecords = getSeedRecords();
      saveToDisk();
    }
  } catch (err) {
    console.warn('Falling back to memory storage:', err);
    memoryRecords = getSeedRecords();
  }
  isInitialized = true;
}

function saveToDisk() {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryRecords, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Disk save warning (may be serverless environment):', err);
  }
}

export async function getAllInspections(query?: {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<{ records: InspectionRecord[]; total: number }> {
  await initStorage();
  let result = [...memoryRecords];

  if (query?.status && query.status !== 'ALL') {
    result = result.filter(r => r.overallStatus === query.status);
  }

  if (query?.category && query.category !== 'ALL') {
    result = result.filter(r => r.category === query.category);
  }

  if (query?.search && query.search.trim()) {
    const s = query.search.toLowerCase();
    result = result.filter(
      r =>
        r.productName.toLowerCase().includes(s) ||
        r.brandName.toLowerCase().includes(s) ||
        r.id.toLowerCase().includes(s) ||
        (r.sampleBatchNo && r.sampleBatchNo.toLowerCase().includes(s)) ||
        r.location.toLowerCase().includes(s)
    );
  }

  // Sort descending by date
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = result.length;
  const page = query?.page || 1;
  const limit = query?.limit || 50;
  const start = (page - 1) * limit;
  const paginated = result.slice(start, start + limit);

  return { records: paginated, total };
}

export async function getInspectionById(id: string): Promise<InspectionRecord | null> {
  await initStorage();
  return memoryRecords.find(r => r.id === id) || null;
}

// Simple keyword-based coordinates resolver for server storage
function resolveCoordinatesForLocation(locationStr: string): { lat: number; lng: number; city: string; state: string } {
  const norm = (locationStr || '').toLowerCase();
  if (norm.includes('mumbai') || norm.includes('bandra') || norm.includes('andheri') || norm.includes('bombay')) {
    return { lat: 19.0760, lng: 72.8777, city: 'Mumbai', state: 'Maharashtra' };
  }
  if (norm.includes('bengaluru') || norm.includes('bangalore') || norm.includes('koramangala') || norm.includes('whitefield')) {
    return { lat: 12.9716, lng: 77.5946, city: 'Bengaluru', state: 'Karnataka' };
  }
  if (norm.includes('hyderabad') || norm.includes('banjara') || norm.includes('hitec')) {
    return { lat: 17.3850, lng: 78.4867, city: 'Hyderabad', state: 'Telangana' };
  }
  if (norm.includes('chennai') || norm.includes('nagar') || norm.includes('madras')) {
    return { lat: 13.0827, lng: 80.2707, city: 'Chennai', state: 'Tamil Nadu' };
  }
  if (norm.includes('kolkata') || norm.includes('calcutta') || norm.includes('park street')) {
    return { lat: 22.5726, lng: 88.3639, city: 'Kolkata', state: 'West Bengal' };
  }
  if (norm.includes('ahmedabad') || norm.includes('naroda') || norm.includes('gujarat')) {
    return { lat: 23.0225, lng: 72.5714, city: 'Ahmedabad', state: 'Gujarat' };
  }
  if (norm.includes('surat')) {
    return { lat: 21.1702, lng: 72.8311, city: 'Surat', state: 'Gujarat' };
  }
  if (norm.includes('pune') || norm.includes('viman')) {
    return { lat: 18.5204, lng: 73.8567, city: 'Pune', state: 'Maharashtra' };
  }
  if (norm.includes('jaipur')) {
    return { lat: 26.9124, lng: 75.7873, city: 'Jaipur', state: 'Rajasthan' };
  }
  // Default to New Delhi
  return { lat: 28.6139, lng: 77.2090, city: 'New Delhi', state: 'Delhi' };
}

export function resolveNearbyCity(lat: number, lng: number): { locality: string; city: string; state: string } {
  const hubs = [
    { name: 'Connaught Place', city: 'New Delhi', state: 'Delhi', lat: 28.6315, lng: 77.2167 },
    { name: 'Bandra Kurla Complex', city: 'Mumbai', state: 'Maharashtra', lat: 19.0668, lng: 72.8687 },
    { name: 'Koramangala Commercial Hub', city: 'Bengaluru', state: 'Karnataka', lat: 12.9352, lng: 77.6245 },
    { name: 'Hitec City Packaging Zone', city: 'Hyderabad', state: 'Telangana', lat: 17.4474, lng: 78.3762 },
    { name: 'T. Nagar Market', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0418, lng: 80.2341 },
    { name: 'Park Street Retail Area', city: 'Kolkata', state: 'West Bengal', lat: 22.5529, lng: 88.3533 },
    { name: 'Ring Road Textile Zone', city: 'Surat', state: 'Gujarat', lat: 21.1959, lng: 72.8488 },
    { name: 'SG Highway Commercial Belt', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0425, lng: 72.5214 },
    { name: 'FC Road Commercial Centre', city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
    { name: 'Johari Bazaar', city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
    { name: 'Hazratganj Main Market', city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
    { name: 'Sector 17 Plaza', city: 'Chandigarh', state: 'Punjab & Haryana', lat: 30.7333, lng: 76.7794 },
    { name: 'Marine Drive Coastal Market', city: 'Kochi', state: 'Kerala', lat: 9.9816, lng: 76.2799 }
  ];

  let closest = hubs[0];
  let minDistanceSq = Number.MAX_VALUE;

  for (const hub of hubs) {
    const dLat = hub.lat - lat;
    const dLng = hub.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closest = hub;
    }
  }

  return { locality: closest.name, city: closest.city, state: closest.state };
}

export async function saveInspection(record: InspectionRecord): Promise<InspectionRecord> {
  await initStorage();

  // Ensure coordinates and location metadata are present
  if (!record.latitude || !record.longitude) {
    const geo = resolveCoordinatesForLocation(record.location);
    record.latitude = geo.lat;
    record.longitude = geo.lng;
    if (!record.city) record.city = geo.city;
    if (!record.state) record.state = geo.state;
  }

  const index = memoryRecords.findIndex(r => r.id === record.id);
  if (index >= 0) {
    memoryRecords[index] = record;
  } else {
    memoryRecords.unshift(record);
  }
  saveToDisk();

  // Async persist to MongoDB if connected
  if (isMongoConnected && inspectionsCollection) {
    try {
      await inspectionsCollection.updateOne(
        { id: record.id } as any,
        { $set: record },
        { upsert: true }
      );
    } catch (err) {
      console.error('Error syncing record to MongoDB:', err);
    }
  }

  return record;
}

export async function deleteInspection(id: string): Promise<boolean> {
  await initStorage();
  const initialLen = memoryRecords.length;
  memoryRecords = memoryRecords.filter(r => r.id !== id);
  if (memoryRecords.length !== initialLen) {
    saveToDisk();

    if (isMongoConnected && inspectionsCollection) {
      try {
        await inspectionsCollection.deleteOne({ id } as any);
      } catch (err) {
        console.error('Error deleting record from MongoDB:', err);
      }
    }

    return true;
  }
  return false;
}

export async function updateNoticeStatus(id: string, noticeNumber: string): Promise<InspectionRecord | null> {
  await initStorage();
  const item = memoryRecords.find(r => r.id === id);
  if (item) {
    item.officialNoticeIssued = true;
    item.noticeNumber = noticeNumber;
    item.updatedAt = new Date().toISOString();
    saveToDisk();

    if (isMongoConnected && inspectionsCollection) {
      try {
        await inspectionsCollection.updateOne(
          { id } as any,
          { $set: { officialNoticeIssued: true, noticeNumber, updatedAt: item.updatedAt } }
        );
      } catch (err) {
        console.error('Error updating notice status in MongoDB:', err);
      }
    }

    return item;
  }
  return null;
}

export async function getAnalytics(): Promise<AnalyticsStats> {
  await initStorage();
  const totalScans = memoryRecords.length;
  const compliantCount = memoryRecords.filter(r => r.overallStatus === 'COMPLIANT').length;
  const nonCompliantCount = memoryRecords.filter(r => r.overallStatus === 'NON_COMPLIANT').length;
  const needsReviewCount = memoryRecords.filter(r => r.overallStatus === 'NEEDS_REVIEW').length;
  const complianceRate = totalScans > 0 ? Math.round((compliantCount / totalScans) * 100) : 0;

  let totalEstimatedFines = 0;
  memoryRecords.forEach(r => {
    r.penaltiesApplicable?.forEach(p => {
      totalEstimatedFines += p.minFineInr;
    });
  });

  // Calculate common violations
  const ruleCounts: Record<string, { clause: string; count: number }> = {
    'Net Quantity Non-Standard Units': { clause: 'Rule 11 & 12', count: 0 },
    'Incomplete Manufacturer / Packer Address (No PIN)': { clause: 'Rule 6(1)(a)', count: 0 },
    'Missing Taxes Declaration in MRP': { clause: 'Rule 6(1)(c)', count: 0 },
    'Missing Consumer Care Email / Phone': { clause: 'Rule 6(1)(f)', count: 0 },
    'Missing Country of Origin on Import': { clause: 'Rule 6(10)', count: 0 },
    'Sub-Standard Font Size (< Schedule II)': { clause: 'Rule 7', count: 0 }
  };

  memoryRecords.forEach(r => {
    r.declarations.forEach(d => {
      if (d.verdict === 'FAIL' || d.verdict === 'WARNING') {
        if (d.field === 'NET_QUANTITY') ruleCounts['Net Quantity Non-Standard Units'].count++;
        if (d.field === 'MANUFACTURER_PACKER_DETAILS') ruleCounts['Incomplete Manufacturer / Packer Address (No PIN)'].count++;
        if (d.field === 'MRP_USP') ruleCounts['Missing Taxes Declaration in MRP'].count++;
        if (d.field === 'CONSUMER_CARE') ruleCounts['Missing Consumer Care Email / Phone'].count++;
        if (d.field === 'COUNTRY_OF_ORIGIN') ruleCounts['Missing Country of Origin on Import'].count++;
        if (d.field === 'FONT_READABILITY') ruleCounts['Sub-Standard Font Size (< Schedule II)'].count++;
      }
    });
  });

  const commonViolations = Object.entries(ruleCounts).map(([rule, data]) => ({
    rule,
    clause: data.clause,
    count: data.count,
    percentage: totalScans > 0 ? Math.round((data.count / totalScans) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  return {
    totalScans,
    compliantCount,
    nonCompliantCount,
    needsReviewCount,
    complianceRate,
    totalEstimatedFines,
    commonViolations,
    recentInspections: memoryRecords.slice(0, 5)
  };
}

export async function getLocationAnalytics() {
  await initStorage();
  const locationMap = new Map<string, {
    id: string;
    name: string;
    city: string;
    state: string;
    lat: number;
    lng: number;
    inspections: InspectionRecord[];
  }>();

  memoryRecords.forEach(record => {
    const coords = (record.latitude && record.longitude)
      ? { lat: record.latitude, lng: record.longitude, city: record.city || 'Hub', state: record.state || 'India' }
      : resolveCoordinatesForLocation(record.location);

    const key = `${coords.city}_${Math.round(coords.lat * 100)}_${Math.round(coords.lng * 100)}`;
    if (!locationMap.has(key)) {
      locationMap.set(key, {
        id: key,
        name: record.location,
        city: coords.city,
        state: coords.state,
        lat: coords.lat,
        lng: coords.lng,
        inspections: []
      });
    }
    locationMap.get(key)!.inspections.push(record);
  });

  const locations = Array.from(locationMap.values()).map(loc => {
    const total = loc.inspections.length;
    const compliant = loc.inspections.filter(r => r.overallStatus === 'COMPLIANT').length;
    const nonCompliant = loc.inspections.filter(r => r.overallStatus === 'NON_COMPLIANT').length;
    const needsReview = loc.inspections.filter(r => r.overallStatus === 'NEEDS_REVIEW').length;
    const criticalViolations = loc.inspections.reduce((sum, r) => sum + (r.criticalViolationsCount || 0), 0);
    const estimatedFines = loc.inspections.reduce((sum, r) => {
      const f = (r.penaltiesApplicable || []).reduce((acc, p) => acc + (p.minFineInr || 0), 0);
      return sum + f;
    }, 0);

    const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (complianceRate < 35 || criticalViolations >= 3) {
      riskLevel = 'CRITICAL';
    } else if (complianceRate < 65 || nonCompliant > compliant) {
      riskLevel = 'HIGH';
    } else if (complianceRate < 85 || needsReview > 0) {
      riskLevel = 'MEDIUM';
    }

    return {
      id: loc.id,
      name: loc.name,
      city: loc.city,
      state: loc.state,
      lat: loc.lat,
      lng: loc.lng,
      totalTests: total,
      compliantCount: compliant,
      nonCompliantCount: nonCompliant,
      needsReviewCount: needsReview,
      complianceRate,
      criticalViolations,
      estimatedFines,
      riskLevel,
      recentTestDate: loc.inspections[0]?.createdAt || new Date().toISOString(),
      inspections: loc.inspections
    };
  }).sort((a, b) => b.totalTests - a.totalTests);

  return {
    totalLocations: locations.length,
    locations
  };
}
