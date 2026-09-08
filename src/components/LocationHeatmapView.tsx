import React, { useState, useMemo } from 'react';
import {
  InspectionRecord,
  LocationHeatmapPoint,
  HeatmapMetricMode,
  ProductCategory
} from '../types';
import { aggregateLocationHeatmapPoints, findNearestHub, calculateDistanceKm } from '../utils/geoUtils';
import { useGeolocation } from '../utils/useGeolocation';
import { InteractiveVectorHeatmap } from './InteractiveVectorHeatmap';
import { OpenStreetMapViewer } from './OpenStreetMapViewer';
import {
  MapPin,
  Flame,
  Layers,
  Sliders,
  Filter,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  TrendingDown,
  Scale,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Search,
  Sparkles,
  Crosshair,
  Navigation,
  Satellite,
  Compass,
  RefreshCw
} from 'lucide-react';

interface LocationHeatmapViewProps {
  records: InspectionRecord[];
  onSelectInspection: (record: InspectionRecord) => void;
  onNewScan: () => void;
}

export const LocationHeatmapView: React.FC<LocationHeatmapViewProps> = ({
  records,
  onSelectInspection,
  onNewScan
}) => {
  // Heatmap state
  const [metric, setMetric] = useState<HeatmapMetricMode>('DENSITY');
  const [viewEngine, setViewEngine] = useState<'OSM_MAP' | 'VECTOR_RADAR'>('OSM_MAP');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [radius, setRadius] = useState<number>(36);
  const [intensity, setIntensity] = useState<number>(1.5);
  const [selectedPoint, setSelectedPoint] = useState<LocationHeatmapPoint | null>(null);

  // Officer Live Geolocation
  const {
    coordinates: userGps,
    status: gpsStatus,
    errorMessage: gpsError,
    resolvedLocation,
    acquireLocation,
    isWatching,
    toggleWatch
  } = useGeolocation();

  // Filter inspection records first
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesLoc = (r.location || '').toLowerCase().includes(query);
        const matchesProd = (r.productName || '').toLowerCase().includes(query);
        const matchesCity = (r.city || '').toLowerCase().includes(query);
        if (!matchesLoc && !matchesProd && !matchesCity) return false;
      }
      return true;
    });
  }, [records, categoryFilter, searchQuery]);

  // Aggregate into location heatmap points
  const allHeatmapPoints = useMemo(() => {
    return aggregateLocationHeatmapPoints(filteredRecords);
  }, [filteredRecords]);

  // Closest surveillance point to officer GPS
  const nearestHub = useMemo(() => {
    if (!userGps || allHeatmapPoints.length === 0) return null;
    return findNearestHub(userGps.latitude, userGps.longitude, allHeatmapPoints);
  }, [userGps, allHeatmapPoints]);

  // City filter for map points
  const displayPoints = useMemo(() => {
    if (selectedCity === 'ALL') return allHeatmapPoints;
    return allHeatmapPoints.filter((p) => p.city.toLowerCase() === selectedCity.toLowerCase());
  }, [allHeatmapPoints, selectedCity]);

  // Distinct cities list for filter pills
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    allHeatmapPoints.forEach((p) => set.add(p.city));
    return Array.from(set).sort();
  }, [allHeatmapPoints]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const totalLocations = allHeatmapPoints.length;
    const totalTests = filteredRecords.length;
    const nonCompliantTests = filteredRecords.filter((r) => r.overallStatus === 'NON_COMPLIANT').length;
    const criticalViolations = filteredRecords.reduce((sum, r) => sum + (r.criticalViolationsCount || 0), 0);
    const totalFines = filteredRecords.reduce((sum, r) => {
      const f = (r.penaltiesApplicable || []).reduce((acc, p) => acc + (p.minFineInr || 0), 0);
      return sum + f;
    }, 0);

    const highestRiskPoint = [...allHeatmapPoints].sort(
      (a, b) => b.nonCompliantCount - a.nonCompliantCount
    )[0];

    return {
      totalLocations,
      totalTests,
      nonCompliantTests,
      criticalViolations,
      totalFines,
      highestRiskCity: highestRiskPoint ? highestRiskPoint.city : 'N/A'
    };
  }, [allHeatmapPoints, filteredRecords]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Flame className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Test Locations &amp; Surveillance Heat Map
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Geospatial density of commodity packaging inspections, non-compliance hotspots, and Section 36 violation enforcement.
          </p>
        </div>

        {/* View Mode Toggle: OpenStreetMap (with GPS Pinpoint) vs Interactive Vector Radar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewEngine('OSM_MAP')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewEngine === 'OSM_MAP'
                ? 'bg-white text-sky-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-sky-600" />
            <span>OpenStreetMap &amp; GPS Pinpoint</span>
          </button>

          <button
            type="button"
            onClick={() => setViewEngine('VECTOR_RADAR')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewEngine === 'VECTOR_RADAR'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Surveillance Vector Radar</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>SURVEILLANCE HUBS</span>
            <Building className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{summaryStats.totalLocations}</span>
            <span className="text-xs text-slate-500">Commercial Centers</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>COMMODITY TESTS</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{summaryStats.totalTests}</span>
            <span className="text-xs text-slate-500">Audits Performed</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>TOP INFRACTION HUB</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-rose-600 truncate">{summaryStats.highestRiskCity}</span>
            <span className="text-xs text-slate-500">{summaryStats.nonCompliantTests} Violations</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>ESTIMATED PENALTIES</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ₹{(summaryStats.totalFines / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-slate-500">Sec 36 Exposure</span>
          </div>
        </div>

      </div>

      {/* Main Map Visualizer & Control Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        {/* Officer GPS Proximity & Real-time Location Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${userGps ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
              <Satellite className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Enforcement Officer GPS Radar</span>
                {userGps && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    SATELLITE LOCKED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {userGps ? (
                  <>
                    <strong className="font-mono text-slate-800">{userGps.latitude.toFixed(4)}° N, {userGps.longitude.toFixed(4)}° E</strong> (±{userGps.accuracy}m)
                    {nearestHub && (
                      <span className="ml-2 text-emerald-700 font-semibold">
                        • Nearest monitored center: {nearestHub.point.city} ({nearestHub.distanceKm} km)
                      </span>
                    )}
                  </>
                ) : (
                  'Click "Lock Officer GPS" to project your field location onto the national surveillance radar.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            {nearestHub && (
              <button
                type="button"
                onClick={() => setSelectedPoint(nearestHub.point)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-pointer transition-colors"
              >
                Focus Nearest Hub
              </button>
            )}

            <button
              type="button"
              onClick={() => acquireLocation()}
              disabled={gpsStatus === 'requesting'}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
            >
              {gpsStatus === 'requesting' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Crosshair className="w-3.5 h-3.5" />
              )}
              <span>{gpsStatus === 'requesting' ? 'Locking...' : userGps ? 'Refresh GPS' : 'Lock Officer GPS'}</span>
            </button>
          </div>
        </div>

        {/* Metric Mode Selectors & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          
          {/* Metric Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase mr-1">Heat Metric:</span>
            
            <button
              onClick={() => setMetric('DENSITY')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                metric === 'DENSITY'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              📊 Test Density
            </button>

            <button
              onClick={() => setMetric('VIOLATIONS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                metric === 'VIOLATIONS'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🚨 Violations Hotspots
            </button>

            <button
              onClick={() => setMetric('CRITICAL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                metric === 'CRITICAL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ⚠️ Critical (Rule 6 &amp; 7)
            </button>

            <button
              onClick={() => setMetric('COMPLIANCE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                metric === 'COMPLIANCE'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🛡️ Non-Compliance Alert
            </button>

            <button
              onClick={() => setMetric('PENALTIES')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                metric === 'PENALTIES'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              💰 Penalty Exposure
            </button>
          </div>

          {/* Thermal Calibration Sliders */}
          <div className="flex items-center gap-4 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium text-[11px]">Radius:</span>
              <input
                type="range"
                min="20"
                max="60"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-16 accent-emerald-600 cursor-pointer"
              />
              <span className="text-[11px] font-mono text-slate-700">{radius}px</span>
            </div>

            <div className="w-[1px] h-4 bg-slate-200" />

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium text-[11px]">Intensity:</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.2"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-16 accent-emerald-600 cursor-pointer"
              />
              <span className="text-[11px] font-mono text-slate-700">{intensity}x</span>
            </div>
          </div>

        </div>

        {/* Filters Row: Category & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Category:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-emerald-500"
            >
              <option value="ALL">All Commodity Categories</option>
              <option value="FOOD_BEVERAGE">Food &amp; Beverage</option>
              <option value="COSMETICS_PERSONAL_CARE">Cosmetics &amp; Personal Care</option>
              <option value="FMCG_HOUSEHOLD">FMCG &amp; Household</option>
              <option value="TEXTILES_APPAREL">Textiles &amp; Apparel</option>
              <option value="PHARMACEUTICALS_WELLNESS">Wellness &amp; Health</option>
            </select>

            <span className="text-slate-300 mx-1">|</span>

            <span className="text-slate-500 font-semibold">City / Hub:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-emerald-500"
            >
              <option value="ALL">All Regions (National View)</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search premise or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-emerald-500"
            />
          </div>

        </div>

        {/* Map Display Container */}
        <div className="relative">
          {viewEngine === 'OSM_MAP' ? (
            <OpenStreetMapViewer
              points={displayPoints}
              metric={metric}
              userLocation={
                userGps
                  ? {
                      lat: userGps.latitude,
                      lng: userGps.longitude,
                      accuracy: userGps.accuracy,
                      timestamp: new Date(userGps.timestamp).toISOString(),
                    }
                  : null
              }
              resolvedAddress={resolvedLocation?.address}
              onAcquireLocation={acquireLocation}
              onSelectPoint={(pt) => setSelectedPoint(pt)}
              selectedPointId={selectedPoint?.id}
              isAcquiringLocation={gpsStatus === 'requesting'}
            />
          ) : (
            <InteractiveVectorHeatmap
              points={displayPoints}
              metric={metric}
              radius={radius}
              intensity={intensity}
              onSelectPoint={(pt) => setSelectedPoint(pt)}
              selectedPointId={selectedPoint?.id}
              userLocation={userGps ? { lat: userGps.latitude, lng: userGps.longitude, accuracy: userGps.accuracy } : null}
            />
          )}
        </div>

      </div>

      {/* Two Column Section: Location Leaderboard & Selected Point Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Location Surveillance Leaderboard */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Surveillance Locations &amp; Inspection Audit Log
              </h3>
              <p className="text-xs text-slate-500">
                Click any row or map pin to inspect tests conducted at that location.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
              {displayPoints.length} Monitored Centers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Location / Hub</th>
                  <th className="py-2.5 px-3">City &amp; State</th>
                  <th className="py-2.5 px-3 text-center">Tests</th>
                  <th className="py-2.5 px-3 text-center">Compliance</th>
                  <th className="py-2.5 px-3 text-center">Risk Tier</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayPoints.map((point) => {
                  const isSelected = selectedPoint?.id === point.id;
                  return (
                    <tr
                      key={point.id}
                      onClick={() => setSelectedPoint(point)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50/70 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 truncate max-w-[200px]" title={point.name}>
                          {point.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Lat: {point.lat.toFixed(3)}, Lng: {point.lng.toFixed(3)}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800">{point.city}</span>
                        <span className="text-[10px] text-slate-400 block">{point.state}</span>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono">
                        {point.totalTests}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1 font-bold font-mono">
                          <span
                            className={
                              point.complianceRate >= 75
                                ? 'text-emerald-600'
                                : point.complianceRate >= 50
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }
                          >
                            {point.complianceRate}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            point.riskLevel === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : point.riskLevel === 'HIGH'
                              ? 'bg-orange-100 text-orange-800'
                              : point.riskLevel === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {point.riskLevel}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPoint(point);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Selected Location Drilldown Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          {selectedPoint ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{selectedPoint.city}, {selectedPoint.state}</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-sm mt-0.5 leading-tight">
                    {selectedPoint.name}
                  </h3>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                    selectedPoint.riskLevel === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800'
                      : selectedPoint.riskLevel === 'HIGH'
                      ? 'bg-orange-100 text-orange-800'
                      : selectedPoint.riskLevel === 'MEDIUM'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {selectedPoint.riskLevel} RISK
                </span>
              </div>

              {/* Mini Stats Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">TOTAL AUDITS</span>
                  <span className="text-lg font-black text-slate-900 font-mono">{selectedPoint.totalTests}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">COMPLIANCE</span>
                  <span className="text-lg font-black text-emerald-600 font-mono">{selectedPoint.complianceRate}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">VIOLATIONS</span>
                  <span className="text-lg font-black text-rose-600 font-mono">{selectedPoint.nonCompliantCount}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">EST. FINES</span>
                  <span className="text-base font-black text-slate-900 font-mono">₹{selectedPoint.estimatedFines.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* List of Inspections Conducted at this location */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Test Records at this Location ({selectedPoint.inspections.length})
                </h4>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {selectedPoint.inspections.map((insp) => (
                    <div
                      key={insp.id}
                      onClick={() => onSelectInspection(insp)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 cursor-pointer transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-900 truncate max-w-[160px]">
                          {insp.productName}
                        </span>
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            insp.overallStatus === 'COMPLIANT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : insp.overallStatus === 'NON_COMPLIANT'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {insp.overallStatus}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Score: {insp.complianceScore}/100</span>
                        <span>{new Date(insp.createdAt).toLocaleDateString()}</span>
                      </div>

                      {insp.criticalViolationsCount > 0 && (
                        <div className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{insp.criticalViolationsCount} Critical Infractions</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <MapPin className="w-10 h-10 text-slate-300" />
              <div>
                <p className="font-bold text-slate-700 text-xs">No Location Selected</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                  Click on any heatmap cluster or table row to drill down into statutory test logs.
                </p>
              </div>
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-slate-100">
            <button
              onClick={onNewScan}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Perform New Field Audit</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
