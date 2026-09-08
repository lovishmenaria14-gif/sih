import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScannerView } from './components/ScannerView';
import { DashboardView } from './components/DashboardView';
import { LocationHeatmapView } from './components/LocationHeatmapView';
import { RepositoryView } from './components/RepositoryView';
import { RulesReferenceView } from './components/RulesReferenceView';
import { InspectionModal } from './components/InspectionModal';
import { InspectionRecord, AnalyticsStats, InspectorProfile } from './types';
import { Scale, ShieldCheck, HeartHandshake } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scan' | 'dashboard' | 'heatmap' | 'repository' | 'rules'>('scan');
  const [currentRole, setCurrentRole] = useState<InspectorProfile['role']>('ENFORCEMENT_OFFICER');
  
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load inspections and analytics from the backend API
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [inspRes, statsRes] = await Promise.all([
        fetch('/api/inspections'),
        fetch('/api/analytics')
      ]);

      if (inspRes.ok) {
        const inspData = await inspRes.json();
        setRecords(inspData.records || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Error loading data from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScanComplete = (newRecord: InspectionRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    setSelectedRecord(newRecord);
    // Refresh stats
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  };

  const handleNoticeIssued = (updatedRecord: InspectionRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)));
    setSelectedRecord(updatedRecord);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inspection record?')) return;
    try {
      const res = await fetch(`/api/inspections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        if (selectedRecord?.id === id) {
          setSelectedRecord(null);
        }
        // Refresh stats
        fetch('/api/analytics')
          .then((r) => r.json())
          .then((d) => setStats(d));
      }
    } catch (err) {
      console.error('Error deleting record:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Top Header & Role Switcher */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        totalInspections={records.length}
      />

      {/* Main Tab Views */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === 'scan' && (
          <ScannerView
            onScanComplete={handleScanComplete}
            currentRole={currentRole}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            onSelectInspection={(record) => setSelectedRecord(record)}
            onNewScan={() => setActiveTab('scan')}
            onNavigateToHeatmap={() => setActiveTab('heatmap')}
          />
        )}

        {activeTab === 'heatmap' && (
          <LocationHeatmapView
            records={records}
            onSelectInspection={(record) => setSelectedRecord(record)}
            onNewScan={() => setActiveTab('scan')}
          />
        )}

        {activeTab === 'repository' && (
          <RepositoryView
            records={records}
            onSelectInspection={(record) => setSelectedRecord(record)}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {activeTab === 'rules' && (
          <RulesReferenceView />
        )}
      </main>

      {/* Detailed Inspection Audit Modal */}
      {selectedRecord && (
        <InspectionModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onNoticeIssued={handleNoticeIssued}
          currentRole={currentRole}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">
              Legal Metrology Compliance Checking System (LM-CCS)
            </span>
            <span className="text-slate-400">•</span>
            <span>Legal Metrology Act, 2009 &amp; Packaged Commodities Rules, 2011</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Section 36 Penalty Enforcement</span>
            <span>Schedule II Font Analyzer</span>
            <span>National Enforcement Portal</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
