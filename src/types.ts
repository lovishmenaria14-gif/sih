/**
 * Legal Metrology (Packaged Commodities) Rules, 2011
 * Shared Type Definitions
 */

export type ProductCategory =
  | 'FOOD_BEVERAGE'
  | 'COSMETICS_PERSONAL_CARE'
  | 'ELECTRONICS_APPLIANCES'
  | 'FMCG_HOUSEHOLD'
  | 'TEXTILES_APPAREL'
  | 'PHARMACEUTICALS_WELLNESS'
  | 'OTHER';

export type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW';

export type CheckVerdict = 'PASS' | 'FAIL' | 'WARNING' | 'NOT_APPLICABLE';

export type ViolationSeverity = 'CRITICAL' | 'MODERATE' | 'LOW';

export interface FontReadabilityAnalysis {
  estimatedHeightMm: number;
  minRequiredHeightMm: number;
  isFontHeightCompliant: boolean;
  contrastAdequate: boolean;
  readabilityScore: 'EXCELLENT' | 'GOOD' | 'BORDERLINE' | 'POOR_ILLEGIBLE';
  details: string;
}

export interface MandatoryDeclarationCheck {
  id: string;
  field: string;
  title: string;
  ruleClause: string;
  found: boolean;
  extractedValue: string;
  verdict: CheckVerdict;
  severity: ViolationSeverity;
  violations: string[];
  recommendation: string;
  fontAnalysis?: FontReadabilityAnalysis;
}

export interface InspectorProfile {
  id: string;
  name: string;
  badgeId: string;
  role: 'ENFORCEMENT_OFFICER' | 'COMPLIANCE_MANAGER' | 'PUBLIC_AUDITOR';
  jurisdiction: string;
  designation?: string;
  department?: string;
}

export interface PackagingSideEvidence {
  sideNumber: number;
  sideName: string;
  imageUrl: string;
  capturedAt?: string;
}

export interface InspectionRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  productName: string;
  brandName: string;
  category: ProductCategory;
  packageType: string;
  overallStatus: ComplianceStatus;
  complianceScore: number; // 0 - 100
  pdpAreaSqCm: number;
  sampleBatchNo?: string;
  inspector: InspectorProfile;
  declarations: MandatoryDeclarationCheck[];
  criticalViolationsCount: number;
  moderateViolationsCount: number;
  summary: string;
  penaltiesApplicable: {
    actSection: string;
    description: string;
    minFineInr: number;
    maxFineInr: number;
  }[];
  officialNoticeIssued: boolean;
  noticeNumber?: string;
  evidenceImages: string[];
  packageSides?: PackagingSideEvidence[];
  sideCount?: number;
  location: string;
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number; // In meters
  gpsTimestamp?: string;
  city?: string;
  state?: string;
  rawAnalysisText?: string;
}

export type HeatmapMetricMode = 'DENSITY' | 'VIOLATIONS' | 'CRITICAL' | 'COMPLIANCE' | 'PENALTIES';

export interface LocationHeatmapPoint {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  totalTests: number;
  compliantCount: number;
  nonCompliantCount: number;
  needsReviewCount: number;
  complianceRate: number;
  criticalViolations: number;
  estimatedFines: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recentTestDate: string;
  inspections: InspectionRecord[];
}

export interface AnalyticsStats {
  totalScans: number;
  compliantCount: number;
  nonCompliantCount: number;
  needsReviewCount: number;
  complianceRate: number;
  totalEstimatedFines: number;
  commonViolations: {
    rule: string;
    clause: string;
    count: number;
    percentage: number;
  }[];
  recentInspections: InspectionRecord[];
}

export interface ScanRequestPayload {
  image: string; // Base64 data URL
  productNameHint?: string;
  category?: ProductCategory;
  pdpAreaSqCm?: number;
  location?: string;
  inspectorName?: string;
  badgeId?: string;
}
