import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Scale,
  TrendingUp,
  FileText,
  BadgeAlert,
  ArrowUpRight,
  ShieldCheck,
  Building,
  BarChart3,
  Flame,
  MapPin,
  ChevronRight,
  Layers
} from 'lucide-react';
import { AnalyticsStats, InspectionRecord } from '../types';

interface DashboardViewProps {
  stats: AnalyticsStats | null;
  onSelectInspection: (record: InspectionRecord) => void;
  onNewScan: () => void;
  onNavigateToHeatmap?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  onSelectInspection,
  onNewScan,
  onNavigateToHeatmap
}) => {
  if (!stats) {
    return (
      <div className="p-12 text-center text-slate-500">
        Loading Legal Metrology enforcement metrics...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Legal Metrology Enforcement Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time surveillance analytics under Legal Metrology Act, 2009 &amp; Packaged Commodities Rules, 2011.
          </p>
        </div>

        <button
          onClick={onNewScan}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-950/20 flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Scale className="w-4 h-4" />
          <span>Conduct New Label Scan</span>
        </button>
      </div>

      {/* KPI Stats Cards (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Inspections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Audits
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.totalScans}</span>
            <span className="text-xs text-slate-500 font-medium">Packages Scanned</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Across retail stores, supermarkets &amp; e-commerce
          </p>
        </div>

        {/* Card 2: Compliance Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Compliance Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{stats.complianceRate}%</span>
            <span className="text-xs text-slate-500 font-medium">{stats.compliantCount} Passed</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.complianceRate}%` }}
            />
          </div>
        </div>

        {/* Card 3: Non-Compliant / Seizures */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Violations Detected
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">{stats.nonCompliantCount}</span>
            <span className="text-xs text-slate-500 font-medium">Under Section 36</span>
          </div>
          <p className="text-[11px] text-rose-700 font-semibold mt-2">
            Liable for Compound Notice / Seizure
          </p>
        </div>

        {/* Card 4: Penalties Applicable */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Fine Liability (Min)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              ₹{stats.totalEstimatedFines.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Compoundable under Legal Metrology Act
          </p>
        </div>

      </div>

      {/* Middle Section: Common Violations Breakdown & Recent Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Common Violations Distribution (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Most Frequent Statutory Infractions &amp; Rule Breaches
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Surveillance Analysis</span>
          </div>

          <div className="space-y-4 pt-1">
            {stats.commonViolations.map((v, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">
                      {v.clause}
                    </span>
                    <span className="font-semibold text-slate-800">{v.rule}</span>
                  </div>
                  <span className="font-bold text-slate-600">
                    {v.count} case(s) ({v.percentage}%)
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      i === 0
                        ? 'bg-rose-600'
                        : i === 1
                        ? 'bg-rose-500'
                        : i === 2
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.max(5, v.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <BadgeAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Enforcement Observation:</strong> Prohibited net weight units (e.g. &ldquo;gms&rdquo; instead of &ldquo;g&rdquo;) and missing consumer care contact emails continue to be the primary cause of product non-compliance under Rule 11 and Rule 6(1)(f).
            </p>
          </div>
        </div>

        {/* Right: Recent Inspections Table (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Recent Packaging Audits</h3>
            <span className="text-xs text-slate-500">Last 5 Scans</span>
          </div>

          <div className="space-y-3">
            {stats.recentInspections.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectInspection(item)}
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-mono text-[10px] text-slate-500">{item.id}</span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                        item.overallStatus === 'COMPLIANT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.overallStatus === 'NON_COMPLIANT'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.overallStatus}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 truncate">{item.productName}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{item.location}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-black text-slate-900 text-sm">{item.complianceScore}%</span>
                  <span className="block text-[10px] text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Geospatial Surveillance & Heatmap Intelligence Highlight Banner */}
      {onNavigateToHeatmap && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white border border-slate-700 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Flame className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Geospatial Surveillance Engine
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-100">
              Interactive Heat Maps of Tests Across Enforcement Locations
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Visualize packaging audit densities, identify non-compliance clusters in Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Surat, and drill down into site-specific statutory logs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onNavigateToHeatmap}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <MapPin className="w-4 h-4" />
              <span>Explore Location Heat Maps</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
