import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Scale,
  Building2,
  Calendar,
  MapPin,
  FileText,
  BadgeAlert,
  Send,
  HelpCircle,
  Copy,
  Check,
  ShieldAlert,
  Award,
  UserCheck,
  Edit3,
  BookmarkCheck,
  ExternalLink,
  Satellite,
  Navigation,
  Camera
} from 'lucide-react';
import { InspectionRecord, InspectorProfile } from '../types';
import { generateInspectionPdf, generateStatutoryCertificatePdf } from '../utils/pdfExport';
import { GpsPinpointMapModal } from './GpsPinpointMapModal';

interface InspectionModalProps {
  record: InspectionRecord | null;
  onClose: () => void;
  onNoticeIssued?: (updatedRecord: InspectionRecord) => void;
  currentRole: InspectorProfile['role'];
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  record,
  onClose,
  onNoticeIssued,
  currentRole
}) => {
  if (!record) return null;

  // Active view inside modal: 'audit' (diagnostic test), 'certificate' (official certificate), 'officer' (officer credentials)
  const [activeModalTab, setActiveModalTab] = useState<'audit' | 'certificate' | 'officer'>('audit');

  // Editable officer state
  const [officerName, setOfficerName] = useState<string>(record.inspector?.name || 'Inspector Rajesh Sharma');
  const [officerBadge, setOfficerBadge] = useState<string>(record.inspector?.badgeId || 'LM-DL-8821');
  const [officerDesignation, setOfficerDesignation] = useState<string>(
    record.inspector?.designation || 'Legal Metrology Officer (LMO) - Class I'
  );
  const [officerJurisdiction, setOfficerJurisdiction] = useState<string>(
    record.inspector?.jurisdiction || 'Central Zone, Division IV, New Delhi'
  );
  const [officerDepartment, setOfficerDepartment] = useState<string>(
    record.inspector?.department || 'Directorate of Legal Metrology, Dept. of Consumer Affairs'
  );

  const [isIssuingNotice, setIsIssuingNotice] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [showOsmModal, setShowOsmModal] = useState(false);
  const [activeEvidenceSide, setActiveEvidenceSide] = useState<number>(0);

  const isCompliant = record.overallStatus === 'COMPLIANT';
  const isNonCompliant = record.overallStatus === 'NON_COMPLIANT';
  const isWarning = record.overallStatus === 'NEEDS_REVIEW';

  const failedRules = record.declarations.filter((d) => d.verdict === 'FAIL');
  const warningRules = record.declarations.filter((d) => d.verdict === 'WARNING');
  const passedRules = record.declarations.filter((d) => d.verdict === 'PASS');

  const currentOfficerOverride: Partial<InspectorProfile> = {
    name: officerName,
    badgeId: officerBadge,
    designation: officerDesignation,
    jurisdiction: officerJurisdiction,
    department: officerDepartment
  };

  const handleIssueNotice = async () => {
    setIsIssuingNotice(true);
    try {
      const res = await fetch(`/api/inspections/${record.id}/notice`, { method: 'POST' });
      const data = await res.json();
      if (data.success && onNoticeIssued) {
        onNoticeIssued(data.record);
      }
    } catch (err) {
      console.error('Error issuing notice:', err);
    } finally {
      setIsIssuingNotice(false);
    }
  };

  const handleSaveOfficerDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const copyCitation = () => {
    const text = `LEGAL METROLOGY ACT, 2009 - STATUTORY NOTICE & VIOLATIONS
Inspection ID: ${record.id}
Commodity: ${record.productName} (${record.brandName})
Inspecting Officer: ${officerName} (${officerBadge})
Status: ${record.overallStatus}
Violations Detected (${failedRules.length}):
${failedRules.map((d) => `• [${d.ruleClause}] ${d.title}: ${d.violations.join('; ')} (Observed: "${d.extractedValue || 'MISSING'}")`).join('\n')}
Applicable Penalties (Section 36):
${record.penaltiesApplicable.map((p) => `• ${p.actSection}: ₹${p.minFineInr.toLocaleString()} - ₹${p.maxFineInr.toLocaleString()} (${p.description})`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Legal Metrology Inspection &amp; Certification
                </span>
                <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-emerald-300">
                  {record.id}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight mt-0.5">
                {record.productName} <span className="text-slate-400 font-normal">({record.brandName})</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Download Certificate PDF */}
            <button
              onClick={() => generateStatutoryCertificatePdf(record, currentOfficerOverride)}
              className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                isCompliant ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
              title="Download Official Government Statutory Certificate"
            >
              <Award className="w-3.5 h-3.5" />
              <span>{isCompliant ? 'Certificate (PDF)' : 'Violation Notice (PDF)'}</span>
            </button>

            {/* Download Full Audit Test Report PDF */}
            <button
              onClick={() => generateInspectionPdf(record, currentOfficerOverride)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Download Full Diagnostic Test Report"
            >
              <FileDown className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Test Report (PDF)</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 sm:px-6 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => setActiveModalTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeModalTab === 'audit'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Diagnostic Test Audit</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono">
                {record.declarations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveModalTab('certificate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeModalTab === 'certificate'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Award className={`w-3.5 h-3.5 ${isCompliant ? 'text-emerald-600' : 'text-rose-600'}`} />
              <span>Official Certificate</span>
              {failedRules.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-mono">
                  {failedRules.length} Broken
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveModalTab('officer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeModalTab === 'officer'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Inspecting Officer Details</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                {officerBadge}
              </span>
            </button>
          </div>

          {/* Quick summary of officer */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{officerName}</span>
            <span>•</span>
            <span>{officerDesignation}</span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* ========================================================================= */}
          {/* TAB 1: DIAGNOSTIC TEST AUDIT                                             */}
          {/* ========================================================================= */}
          {activeModalTab === 'audit' && (
            <div className="space-y-6">
              
              {/* Executive Summary Card */}
              <div
                className={`rounded-2xl p-5 border flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${
                  isCompliant
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : isNonCompliant
                    ? 'bg-rose-50/70 border-rose-200'
                    : 'bg-amber-50/70 border-amber-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {isCompliant ? (
                      <CheckCircle2 className="w-9 h-9 text-emerald-600 shrink-0" />
                    ) : isNonCompliant ? (
                      <XCircle className="w-9 h-9 text-rose-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-9 h-9 text-amber-600 shrink-0" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          isCompliant
                            ? 'bg-emerald-600 text-white'
                            : isNonCompliant
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {record.overallStatus.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        Category: {record.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        PDP: {record.pdpAreaSqCm} cm²
                      </span>
                    </div>
                    
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {isCompliant
                        ? 'Fully Compliant with Legal Metrology (Packaged Commodities) Rules, 2011'
                        : `Statutory Non-Compliance: ${record.criticalViolationsCount} Critical Rule Infraction(s) Detected`}
                    </h3>
                    
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {record.summary}
                    </p>
                  </div>
                </div>

                {/* Score & Metrics Pill */}
                <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/60">
                  <div className="text-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Compliance</span>
                    <span className="text-xl font-black text-slate-900">{record.complianceScore}%</span>
                  </div>

                  <div className="text-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Violations</span>
                    <span className="text-xl font-black text-rose-600">{record.criticalViolationsCount}</span>
                  </div>

                  <div className="text-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Pass Rate</span>
                    <span className="text-xl font-black text-emerald-600">
                      {passedRules.length}/{record.declarations.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* GPS Geotag & Enforcement Site Strip */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${record.latitude && record.longitude ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                    <Satellite className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{record.location}</span>
                      {record.latitude && record.longitude && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          GPS VERIFIED
                        </span>
                      )}
                    </div>
                    {record.latitude && record.longitude ? (
                      <p className="text-[11px] font-mono text-slate-600">
                        {record.latitude.toFixed(5)}° N, {record.longitude.toFixed(5)}° E
                        {record.gpsAccuracy ? ` (±${record.gpsAccuracy}m)` : ''}
                        {record.city ? ` • ${record.city}` : ''}
                        {record.state ? `, ${record.state}` : ''}
                        {record.gpsTimestamp ? ` • Timestamp: ${new Date(record.gpsTimestamp).toLocaleTimeString('en-IN')}` : ''}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500">Premises geocoded by municipal trade sector.</p>
                    )}
                  </div>
                </div>

                {record.latitude && record.longitude && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowOsmModal(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-300 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 text-sky-600" />
                      <span>Pinpoint GPS on Map</span>
                    </button>

                    <a
                      href={`https://www.openstreetmap.org/?mlat=${record.latitude}&mlon=${record.longitude}#map=17/${record.latitude}/${record.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-sky-700 bg-white px-2 py-1 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <span>OSM</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* DEDICATED BROKEN RULES CALLOUT (IF ANY) */}
              {failedRules.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BadgeAlert className="w-5 h-5 text-rose-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                        Set of Statutory Rules Broken ({failedRules.length} Breaches)
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveModalTab('certificate')}
                      className="text-xs font-bold text-rose-700 hover:text-rose-900 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Official Offence Certificate</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {failedRules.map((dec) => (
                      <div key={dec.id} className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-rose-900">
                            {dec.title}
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                            {dec.ruleClause}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center gap-1">
                          <span className="font-semibold text-slate-500">Observed:</span>
                          <span className="font-mono text-rose-800 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            {dec.extractedValue || 'NOT FOUND'}
                          </span>
                        </div>
                        {dec.violations?.map((v, i) => (
                          <p key={i} className="text-xs text-rose-700 font-medium flex items-start gap-1">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{v}</span>
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dual Panel: Evidence Image & Mandatory Declarations */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Audited Package Image (5 cols) */}
                <div className="lg:col-span-5 bg-slate-950 rounded-2xl p-3 border border-slate-800 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between text-slate-400 text-xs px-2 py-1 mb-2 border-b border-slate-800">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      Audited Package Evidence
                      {record.evidenceImages && record.evidenceImages.length > 1 && (
                        <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-800">
                          {record.evidenceImages.length} Sides
                        </span>
                      )}
                    </span>
                    <span>Batch: {record.sampleBatchNo || 'N/A'}</span>
                  </div>

                  {/* Multi-Side Navigation Tabs (if more than 1 image) */}
                  {record.evidenceImages && record.evidenceImages.length > 1 && (
                    <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 border-b border-slate-800">
                      {record.evidenceImages.map((_, idx) => {
                        const sideName = record.packageSides?.[idx]?.sideName || `Side ${idx + 1}`;
                        const isCurrent = idx === activeEvidenceSide;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveEvidenceSide(idx)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                          >
                            Side {idx + 1}: {sideName.replace(/\(.*?\)/g, '').trim()}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Current Active Side Image */}
                  {record.evidenceImages?.[activeEvidenceSide] || record.evidenceImages?.[0] ? (
                    <div className="relative w-full flex flex-col items-center">
                      <img
                        src={record.evidenceImages[activeEvidenceSide] || record.evidenceImages[0]}
                        alt={`Packaging Evidence Side ${activeEvidenceSide + 1}`}
                        className="max-h-[360px] w-auto object-contain rounded-xl shadow-lg"
                      />
                      {record.packageSides?.[activeEvidenceSide]?.sideName && (
                        <span className="mt-2 text-[11px] font-mono text-emerald-400 bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-slate-800">
                          {record.packageSides[activeEvidenceSide].sideName}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
                      No photographic evidence captured
                    </div>
                  )}

                  {/* Multi-Side Thumbnail Preview Strip */}
                  {record.evidenceImages && record.evidenceImages.length > 1 && (
                    <div className="w-full flex items-center justify-center gap-2 mt-3 pt-2 border-t border-slate-900">
                      {record.evidenceImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveEvidenceSide(idx)}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            idx === activeEvidenceSide
                              ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105'
                              : 'border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Thumb Side ${idx + 1}`}
                            className="w-10 h-10 object-cover bg-slate-900"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] font-bold text-center text-slate-300 py-0.2">
                            S{idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="w-full mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between px-2">
                    <span>Officer: {officerName}</span>
                    <span>Date: {new Date(record.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                {/* Declarations List (7 cols) */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Statutory Parameters Audit (Rule 6 &amp; 7 Checks)
                    </h3>
                    <span className="text-xs text-slate-500">
                      {passedRules.length} Passed • {failedRules.length} Failed
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {record.declarations.map((check) => {
                      const isPass = check.verdict === 'PASS';
                      const isFail = check.verdict === 'FAIL';

                      return (
                        <div
                          key={check.id}
                          className={`p-3.5 rounded-xl border transition-colors ${
                            isPass
                              ? 'bg-white border-slate-200'
                              : isFail
                              ? 'bg-rose-50/40 border-rose-200'
                              : 'bg-amber-50/40 border-amber-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  {check.title}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                  {check.ruleClause}
                                </span>
                              </div>

                              <div className="text-xs font-medium text-slate-700 mt-1 flex items-center gap-1.5">
                                <span className="text-slate-500">Declared:</span>
                                <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                  {check.extractedValue || 'NOT FOUND'}
                                </span>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="shrink-0">
                              {isPass ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                                </span>
                              ) : isFail ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                                  <XCircle className="w-3.5 h-3.5" /> Fail
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Warning
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Violations description */}
                          {check.violations && check.violations.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-rose-200/60 text-xs text-rose-800 space-y-1">
                              {check.violations.map((v, i) => (
                                <p key={i} className="flex items-start gap-1.5 font-medium">
                                  <span className="text-rose-600 font-bold">•</span>
                                  <span>{v}</span>
                                </p>
                              ))}
                            </div>
                          )}

                          {/* Font Analysis Special Display */}
                          {check.fontAnalysis && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                              <span className="text-[11px]">
                                Measured: <strong>{check.fontAnalysis.estimatedHeightMm}mm</strong> / Req. Minimum:{' '}
                                <strong>{check.fontAnalysis.minRequiredHeightMm}mm</strong>
                              </span>
                              <span className="text-[11px] font-semibold text-slate-700">
                                Readability: {check.fontAnalysis.readabilityScore}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Penalties Matrix */}
              {record.penaltiesApplicable && record.penaltiesApplicable.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                        Statutory Penalties Under Section 36 &amp; Section 49
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-rose-800">
                      Total Fine Liability: ₹
                      {record.penaltiesApplicable.reduce((sum, p) => sum + p.minFineInr, 0).toLocaleString('en-IN')}{' '}
                      - ₹{record.penaltiesApplicable.reduce((sum, p) => sum + p.maxFineInr, 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {record.penaltiesApplicable.map((pen, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-rose-200 text-xs">
                        <span className="font-bold text-rose-900 block">{pen.actSection}</span>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">{pen.description}</p>
                        <span className="inline-block mt-2 font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                          Fine: ₹{pen.minFineInr.toLocaleString('en-IN')} to ₹{pen.maxFineInr.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: OFFICIAL STATUTORY CERTIFICATE PREVIEW                             */}
          {/* ========================================================================= */}
          {activeModalTab === 'certificate' && (
            <div className="space-y-6">
              
              {/* Certificate Sheet Display */}
              <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-md p-6 sm:p-8 space-y-6 text-slate-800 relative">
                
                {/* Government Header */}
                <div className="text-center border-b border-slate-200 pb-5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 border border-slate-300 text-slate-700 mb-2">
                    <Scale className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase">
                    Government of India
                  </h3>
                  <h4 className="text-xs font-semibold text-slate-600 uppercase">
                    Ministry of Consumer Affairs, Food and Public Distribution
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Department of Consumer Affairs • Directorate of Legal Metrology
                  </p>

                  <div className="mt-4">
                    <span
                      className={`inline-block px-4 py-1.5 rounded-lg font-black text-xs uppercase tracking-wider text-white shadow-xs ${
                        isCompliant ? 'bg-emerald-600' : 'bg-rose-700'
                      }`}
                    >
                      {isCompliant
                        ? 'FORM-A: CERTIFICATE OF STATUTORY PACKAGING COMPLIANCE'
                        : 'FORM-IV: STATUTORY OFFENCE & VIOLATION CERTIFICATE'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 mt-4 px-2">
                    <span>Cert. Ref: <strong className="font-mono text-slate-800">{record.id}</strong></span>
                    <span>Date: <strong className="text-slate-800">{new Date(record.createdAt).toLocaleDateString('en-IN')}</strong></span>
                  </div>
                </div>

                {/* Section I: Inspecting Officer Particulars */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>I. Particulars of Inspecting Officer</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Officer Name:</span>
                      <strong className="text-slate-900">{officerName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Designation:</span>
                      <strong className="text-slate-900">{officerDesignation}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Badge / Warrant ID:</span>
                      <strong className="text-slate-900 font-mono">{officerBadge}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Jurisdiction:</span>
                      <strong className="text-slate-900">{officerJurisdiction}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block">Department:</span>
                      <strong className="text-slate-900">{officerDepartment}</strong>
                    </div>
                  </div>
                </div>

                {/* Section II: Commodity Particulars */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <BookmarkCheck className="w-4 h-4 text-teal-600" />
                    <span>II. Details of Packaged Commodity</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Commodity Name:</span>
                      <strong className="text-slate-900">{record.productName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Brand / Packer:</span>
                      <strong className="text-slate-900">{record.brandName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Category:</span>
                      <strong className="text-slate-900">{record.category.replace('_', ' ')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Principal Display Panel:</span>
                      <strong className="text-slate-900">{record.pdpAreaSqCm} cm²</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block">Inspection Location:</span>
                      <strong className="text-slate-900">{record.location}</strong>
                    </div>
                    {record.latitude && record.longitude && (
                      <div className="sm:col-span-3 pt-2.5 mt-1 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="p-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            STATUTORY GPS GEOTAG
                          </span>
                          <span className="font-mono text-slate-900 font-bold">
                            {record.latitude.toFixed(5)}° N, {record.longitude.toFixed(5)}° E
                          </span>
                          {record.gpsAccuracy && (
                            <span className="text-[11px] text-slate-500">
                              (Accuracy: ±{record.gpsAccuracy}m)
                            </span>
                          )}
                          {record.gpsTimestamp && (
                            <span className="text-[11px] text-slate-500 hidden sm:inline">
                              • Locked: {new Date(record.gpsTimestamp).toLocaleTimeString('en-IN')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowOsmModal(true)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 transition-colors cursor-pointer"
                          >
                            <Navigation className="w-3 h-3 text-sky-600" />
                            <span>Pinpoint GPS Coordinates</span>
                          </button>

                          <a
                            href={`https://www.openstreetmap.org/?mlat=${record.latitude}&mlon=${record.longitude}#map=17/${record.latitude}/${record.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-sky-700 hover:underline"
                          >
                            <span>OpenStreetMap</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section III: The Specific Set of Broken Rules */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-slate-700" />
                    <span>III. Statutory Determination &amp; Set of Rules Audited</span>
                  </h4>

                  {isCompliant ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
                      <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>NO STATUTORY VIOLATIONS DETECTED — 100% COMPLIANT</span>
                      </p>
                      <p className="text-slate-600 leading-relaxed">
                        This commodity strictly adheres to Rule 6 mandatory declarations and Rule 7 / Schedule II font height mandates of the Legal Metrology (Packaged Commodities) Rules, 2011. No prosecution or compounding is recommended.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-rose-700 font-semibold">
                        The package was found to violate the following statutory provisions under the Legal Metrology (Packaged Commodities) Rules, 2011:
                      </p>
                      <div className="overflow-x-auto border border-rose-200 rounded-xl">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-rose-100 text-rose-900 font-bold">
                            <tr>
                              <th className="p-2.5 border-b border-rose-200">Rule Clause</th>
                              <th className="p-2.5 border-b border-rose-200">Statutory Obligation</th>
                              <th className="p-2.5 border-b border-rose-200">Observed Packaging Value</th>
                              <th className="p-2.5 border-b border-rose-200">Defect Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-rose-100 bg-white">
                            {failedRules.map((f) => (
                              <tr key={f.id} className="hover:bg-rose-50/50">
                                <td className="p-2.5 font-mono font-bold text-rose-800 whitespace-nowrap">
                                  {f.ruleClause}
                                </td>
                                <td className="p-2.5 font-semibold text-slate-800">{f.title}</td>
                                <td className="p-2.5 font-mono text-slate-700">
                                  {f.extractedValue || 'NOT FOUND'}
                                </td>
                                <td className="p-2.5 text-rose-700 font-medium">
                                  {f.violations?.join('; ') || 'Non-compliant declaration'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section IV: Formal Officer Attestation & Seal */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">Official Certification Statement:</p>
                    <p>I certify that the aforesaid particulars are true and inspected as per powers under Section 15 of Legal Metrology Act, 2009.</p>
                    <p className="font-mono text-[10px] text-slate-400">Digital Seal: SHA256-{record.id}-{Date.now().toString(36).toUpperCase()}</p>
                  </div>

                  <div className="text-center border-2 border-dashed border-slate-300 rounded-xl p-3 min-w-[200px]">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-4">Official Seal &amp; Signature</div>
                    <div className="font-bold text-xs text-slate-900">{officerName}</div>
                    <div className="text-[10px] text-slate-500">{officerDesignation}</div>
                  </div>
                </div>

              </div>

              {/* Quick Actions for Certificate */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => generateStatutoryCertificatePdf(record, currentOfficerOverride)}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer ${
                    isCompliant ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>Download This Certificate as PDF</span>
                </button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: INSPECTING OFFICER CREDENTIALS                                     */}
          {/* ========================================================================= */}
          {activeModalTab === 'officer' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Inspecting Officer &amp; Authority Profile
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      These details appear on the official Certificate, Legal Notice, and Diagnostic Test Report PDF exports.
                    </p>
                  </div>
                  <UserCheck className="w-6 h-6 text-teal-600" />
                </div>

                {saveSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Officer details updated! All new PDF certificates will reflect these credentials.</span>
                  </div>
                )}

                <form onSubmit={handleSaveOfficerDetails} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Inspecting Officer Name
                      </label>
                      <input
                        type="text"
                        value={officerName}
                        onChange={(e) => setOfficerName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-emerald-500"
                        placeholder="e.g. Shri Rajesh Sharma"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Official Designation / Post
                      </label>
                      <input
                        type="text"
                        value={officerDesignation}
                        onChange={(e) => setOfficerDesignation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-emerald-500"
                        placeholder="e.g. Legal Metrology Officer (LMO) - Class I"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Badge / Warrant / Employee ID
                      </label>
                      <input
                        type="text"
                        value={officerBadge}
                        onChange={(e) => setOfficerBadge(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-emerald-500"
                        placeholder="e.g. LM-DL-8821"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Jurisdiction / Enforcement Zone
                      </label>
                      <input
                        type="text"
                        value={officerJurisdiction}
                        onChange={(e) => setOfficerJurisdiction(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-emerald-500"
                        placeholder="e.g. Central Zone, Division IV, New Delhi"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Directorate / Department
                      </label>
                      <input
                        type="text"
                        value={officerDepartment}
                        onChange={(e) => setOfficerDepartment(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-emerald-500"
                        placeholder="e.g. Directorate of Legal Metrology, Dept. of Consumer Affairs"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setOfficerName('Inspector Rajesh Sharma');
                        setOfficerBadge('LM-DL-8821');
                        setOfficerDesignation('Legal Metrology Officer (LMO) - Class I');
                        setOfficerJurisdiction('Central Zone, Division IV, New Delhi');
                        setOfficerDepartment('Directorate of Legal Metrology, Dept. of Consumer Affairs');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Reset to Official Defaults
                    </button>

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Save Officer Credentials
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Action Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Officer: <strong>{officerName}</strong> ({officerBadge})</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap justify-end">
            {/* Show cause notice button */}
            {isNonCompliant && !record.officialNoticeIssued && currentRole === 'ENFORCEMENT_OFFICER' && (
              <button
                onClick={handleIssueNotice}
                disabled={isIssuingNotice}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isIssuingNotice ? 'Issuing...' : 'Issue Show-Cause Notice'}</span>
              </button>
            )}

            {/* Download Certificate PDF */}
            <button
              onClick={() => generateStatutoryCertificatePdf(record, currentOfficerOverride)}
              className={`w-full sm:w-auto px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer ${
                isCompliant ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Download {isCompliant ? 'Certificate (PDF)' : 'Violation Notice (PDF)'}</span>
            </button>

            {/* Download Full Diagnostic Report */}
            <button
              onClick={() => generateInspectionPdf(record, currentOfficerOverride)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              <FileDown className="w-3.5 h-3.5 text-teal-400" />
              <span>Full Test Report (PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* OpenStreetMap Pinpoint Modal for this Inspection */}
      {record.latitude && record.longitude && (
        <GpsPinpointMapModal
          isOpen={showOsmModal}
          onClose={() => setShowOsmModal(false)}
          lat={record.latitude}
          lng={record.longitude}
          accuracy={record.gpsAccuracy}
          address={`${record.location}${record.city ? `, ${record.city}` : ''}`}
          title={`Inspection Site: ${record.productName}`}
        />
      )}
    </div>
  );
};
