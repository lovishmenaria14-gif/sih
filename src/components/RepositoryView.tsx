import React, { useState } from 'react';
import {
  Search,
  Filter,
  FileDown,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BadgeAlert,
  Building2,
  ArrowUpDown,
  Download,
  Award
} from 'lucide-react';
import { InspectionRecord, ProductCategory, ComplianceStatus } from '../types';
import { generateInspectionPdf, generateStatutoryCertificatePdf } from '../utils/pdfExport';

interface RepositoryViewProps {
  records: InspectionRecord[];
  onSelectInspection: (record: InspectionRecord) => void;
  onDeleteRecord?: (id: string) => void;
}

export const RepositoryView: React.FC<RepositoryViewProps> = ({
  records,
  onSelectInspection,
  onDeleteRecord
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredRecords = records.filter((r) => {
    if (statusFilter !== 'ALL' && r.overallStatus !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return (
        r.productName.toLowerCase().includes(s) ||
        r.brandName.toLowerCase().includes(s) ||
        r.id.toLowerCase().includes(s) ||
        (r.sampleBatchNo && r.sampleBatchNo.toLowerCase().includes(s)) ||
        r.location.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const exportAllAsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `Legal_Metrology_Inspection_Repository_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  const exportAllAsCsv = () => {
    const headers = ['Report ID', 'Date', 'Product Name', 'Brand', 'Category', 'Status', 'Score', 'Violations', 'Location', 'Batch'];
    const rows = filteredRecords.map((r) => [
      r.id,
      r.createdAt,
      `"${r.productName.replace(/"/g, '""')}"`,
      `"${r.brandName.replace(/"/g, '""')}"`,
      r.category,
      r.overallStatus,
      r.complianceScore,
      r.criticalViolationsCount,
      `"${r.location.replace(/"/g, '""')}"`,
      r.sampleBatchNo || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', encodeURI(csvContent));
    dlAnchor.setAttribute('download', `Legal_Metrology_Audits_${new Date().toISOString().slice(0, 10)}.csv`);
    dlAnchor.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Title & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Repository of Scanned Packaged Commodities
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Archived inspection dossiers, statutory evidence photographs, and show-cause notice histories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportAllAsCsv}
            className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={exportAllAsJson}
            className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export JSON Archive</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, brand, batch ID, location, or report ref..."
            className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold px-2.5 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer w-full md:w-auto"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLIANT">Compliant</option>
              <option value="NON_COMPLIANT">Non-Compliant</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-semibold px-2.5 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer w-full md:w-auto"
            >
              <option value="ALL">All Categories</option>
              <option value="FOOD_BEVERAGE">Food &amp; Beverage</option>
              <option value="COSMETICS_PERSONAL_CARE">Cosmetics</option>
              <option value="ELECTRONICS_APPLIANCES">Electronics</option>
              <option value="FMCG_HOUSEHOLD">FMCG</option>
            </select>
          </div>
        </div>

      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Commodity / Label</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Inspection Date</th>
                <th className="py-3.5 px-4">Inspector</th>
                <th className="py-3.5 px-4">Status &amp; Score</th>
                <th className="py-3.5 px-4">Notice Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No matching packaged commodities found in the inspection repository.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {item.evidenceImages?.[0] ? (
                            <img
                              src={item.evidenceImages[0]}
                              alt={item.productName}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                              PKG
                            </div>
                          )}
                          {item.evidenceImages && item.evidenceImages.length > 1 && (
                            <span className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[9px] font-extrabold px-1 rounded shadow-xs border border-slate-700" title={`${item.evidenceImages.length} packaging sides inspected`}>
                              {item.evidenceImages.length}S
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="font-mono text-[10px] text-slate-400 block">{item.id}</span>
                          <span className="font-bold text-slate-900 block truncate max-w-xs sm:max-w-sm">
                            {item.productName}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                            {item.location}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {item.category.replace('_', ' ')}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {new Date(item.createdAt).toLocaleDateString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{item.inspector.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{item.inspector.badgeId}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            item.overallStatus === 'COMPLIANT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.overallStatus === 'NON_COMPLIANT'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.overallStatus}
                        </span>
                        <span className="font-bold text-slate-900">{item.complianceScore}%</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.officialNoticeIssued ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          <BadgeAlert className="w-3 h-3 text-amber-700" />
                          Notice Issued
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectInspection(item)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="View Full Audit"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => generateStatutoryCertificatePdf(item)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.overallStatus === 'COMPLIANT'
                              ? 'text-emerald-700 hover:bg-emerald-50'
                              : 'text-rose-700 hover:bg-rose-50'
                          }`}
                          title={item.overallStatus === 'COMPLIANT' ? 'Download Compliance Certificate (PDF)' : 'Download Violation Notice (PDF)'}
                        >
                          <Award className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => generateInspectionPdf(item)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Download Diagnostic Test Report (PDF)"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>

                        {onDeleteRecord && (
                          <button
                            onClick={() => onDeleteRecord(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
