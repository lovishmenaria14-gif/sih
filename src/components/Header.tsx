import React, { useState, useEffect } from 'react';
import {
  Scale,
  ShieldCheck,
  ScanLine,
  LayoutDashboard,
  Database,
  BookOpen,
  UserCheck,
  BadgeAlert,
  Flame,
  MapPin,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';
import { InspectorProfile } from '../types';

interface HeaderProps {
  activeTab: 'scan' | 'dashboard' | 'heatmap' | 'repository' | 'rules';
  setActiveTab: (tab: 'scan' | 'dashboard' | 'heatmap' | 'repository' | 'rules') => void;
  currentRole: InspectorProfile['role'];
  setCurrentRole: (role: InspectorProfile['role']) => void;
  totalInspections: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  totalInspections
}) => {
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (res.ok) setServerOnline(true);
        else setServerOnline(false);
      })
      .catch(() => setServerOnline(false));
  }, []);
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & National Directorate Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-950/40 border border-emerald-400/30">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                  Government of India
                </span>
                <span className="text-[11px] text-slate-400">
                  Legal Metrology Act, 2009
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Legal Metrology <span className="text-emerald-400">Compliance Inspector</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Packaged Commodities Rules, 2011 • Automated Label Scanner &amp; Enforcement Portal
              </p>
            </div>
          </div>

          {/* Role Switcher & System Status */}
          <div className="hidden md:flex items-center gap-4">
            {/* Role selector */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium">Auditor Role:</span>
              </div>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as any)}
                className="bg-slate-900 text-white font-semibold rounded px-2.5 py-1 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ENFORCEMENT_OFFICER">Enforcement Officer (Govt)</option>
                <option value="COMPLIANCE_MANAGER">Brand QA / Packaging Manager</option>
                <option value="PUBLIC_AUDITOR">Consumer / Public Whistleblower</option>
              </select>
            </div>

            {/* Server Connection Status Pill */}
            <div
              title={
                serverOnline === true
                  ? 'Connected to Legal Metrology Backend API & Storage'
                  : serverOnline === false
                  ? 'Server connection check failed'
                  : 'Checking server status...'
              }
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${
                serverOnline === true
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                  : serverOnline === false
                  ? 'bg-rose-950/60 text-rose-300 border-rose-800/80'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {serverOnline === true ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden lg:inline">API: Online</span>
                </>
              ) : serverOnline === false ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Offline</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  <span>Connecting</span>
                </>
              )}
            </div>

            {/* Quick Badge */}
            <div className="flex items-center gap-2 bg-slate-800/80 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Repo: {totalInspections} Audited</span>
            </div>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-none border-t border-slate-800/80 pt-2">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'scan'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            <span>Label Scanner &amp; AI Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Enforcement Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('heatmap')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'heatmap'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Location Heat Maps</span>
          </button>

          <button
            onClick={() => setActiveTab('repository')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'repository'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Repository &amp; History</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'rules'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Rules &amp; Font Handbook</span>
          </button>
        </div>

      </div>
    </header>
  );
};
