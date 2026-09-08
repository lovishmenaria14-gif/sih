import React, { useState, useRef, useMemo } from 'react';
import { LocationHeatmapPoint, HeatmapMetricMode } from '../types';
import { projectLatLngToSvg, calculatePointIntensity } from '../utils/geoUtils';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building,
  Info,
  Crosshair,
  Navigation
} from 'lucide-react';

interface InteractiveVectorHeatmapProps {
  points: LocationHeatmapPoint[];
  metric: HeatmapMetricMode;
  radius: number;
  intensity: number;
  onSelectPoint: (point: LocationHeatmapPoint) => void;
  selectedPointId?: string | null;
  userLocation?: { lat: number; lng: number; accuracy?: number } | null;
}

export const InteractiveVectorHeatmap: React.FC<InteractiveVectorHeatmapProps> = ({
  points,
  metric,
  radius,
  intensity,
  onSelectPoint,
  selectedPointId,
  userLocation
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<LocationHeatmapPoint | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const svgWidth = 840;
  const svgHeight = 720;

  // Project user GPS position if provided
  const userSvgCoords = useMemo(() => {
    if (!userLocation) return null;
    return projectLatLngToSvg(userLocation.lat, userLocation.lng, svgWidth, svgHeight);
  }, [userLocation, svgWidth, svgHeight]);

  const handleCenterUserGps = () => {
    if (!userSvgCoords) return;
    const targetZoom = 1.4;
    setZoom(targetZoom);
    setPan({
      x: (svgWidth / 2 - userSvgCoords.x) * targetZoom,
      y: (svgHeight / 2 - userSvgCoords.y) * targetZoom
    });
  };

  // Project points to 2D coordinates
  const projectedPoints = useMemo(() => {
    return points.map((p) => {
      const { x, y } = projectLatLngToSvg(p.lat, p.lng, svgWidth, svgHeight);
      const intensityVal = calculatePointIntensity(p, metric, points);
      return {
        ...p,
        svgX: x,
        svgY: y,
        intensity: intensityVal
      };
    });
  }, [points, metric, svgWidth, svgHeight]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only main left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(2.8, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Color mapping based on point risk/metric
  const getPointColor = (point: (typeof projectedPoints)[0]) => {
    if (point.riskLevel === 'CRITICAL') return '#ef4444'; // Red
    if (point.riskLevel === 'HIGH') return '#f97316';     // Orange
    if (point.riskLevel === 'MEDIUM') return '#eab308';   // Yellow
    return '#10b981';                                     // Green
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[580px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 select-none shadow-inner"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Background Radar / Geographic Gridlines */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 70%),
              linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px'
          }}
        />
      </div>

      {/* Main SVG Vector Layer */}
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Thermal heat gradient filter: blurs points into continuous smooth heat density */}
          <filter id="heatmap-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={Math.max(12, radius * 0.55)} result="blur" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 18 -7"
              result="matrix"
            />
          </filter>

          <radialGradient id="heat-radial-red" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="heat-radial-green" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Group with Pan & Zoom transform */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transformOrigin: 'center' }}>
          
          {/* Stylized India Geography Contour Background */}
          <g className="text-slate-800" opacity="0.6">
            {/* Simplified Geographic Boundary Silhouette for India */}
            <path
              d="M 280,110 
                 Q 330,80 390,120 
                 T 460,160 
                 L 510,190 
                 Q 590,200 660,240 
                 L 690,290 
                 L 650,330 
                 L 580,330 
                 L 550,380 
                 L 560,450 
                 L 500,530 
                 L 430,620 
                 L 390,650 
                 L 370,610 
                 L 330,520 
                 L 270,440 
                 L 220,380 
                 L 230,300 
                 L 260,260 
                 L 260,190 
                 Z"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="4 3"
            />

            {/* Latitude / Longitude Guidance Rings */}
            <circle cx="390" cy="380" r="160" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="6 4" />
            <circle cx="390" cy="380" r="280" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="6 4" />
          </g>

          {/* 1. Continuous Thermal Heatmap Layer (rendered underneath point markers) */}
          <g filter="url(#heatmap-blur)">
            {projectedPoints.map((p) => {
              const r = Math.max(25, radius * (0.6 + p.intensity * 0.8) * intensity);
              const isHighViolation = p.nonCompliantCount > p.compliantCount || p.riskLevel === 'CRITICAL';
              return (
                <circle
                  key={`heat-mesh-${p.id}`}
                  cx={p.svgX}
                  cy={p.svgY}
                  r={r}
                  fill={isHighViolation ? 'url(#heat-radial-red)' : 'url(#heat-radial-green)'}
                  opacity={0.45 * intensity}
                />
              );
            })}
          </g>

          {/* 2. Concentric Pulse Waves for Active Surveillance Locations */}
          {projectedPoints.map((p) => {
            const color = getPointColor(p);
            const isSelected = selectedPointId === p.id;
            return (
              <g key={`pulse-${p.id}`}>
                <circle
                  cx={p.svgX}
                  cy={p.svgY}
                  r={isSelected ? 32 : 22}
                  fill={color}
                  opacity="0.15"
                  className="animate-ping"
                  style={{ animationDuration: p.riskLevel === 'CRITICAL' ? '1.5s' : '3s' }}
                />
                <circle
                  cx={p.svgX}
                  cy={p.svgY}
                  r={isSelected ? 18 : 12}
                  fill={color}
                  opacity="0.25"
                />
              </g>
            );
          })}

          {/* 3. Interactive Location Node Pins & Badges */}
          {projectedPoints.map((p) => {
            const color = getPointColor(p);
            const isSelected = selectedPointId === p.id;
            const isHovered = hoveredPoint?.id === p.id;

            return (
              <g
                key={`node-${p.id}`}
                className="cursor-pointer transition-transform duration-150"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPoint(p);
                }}
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Center marker dot */}
                <circle
                  cx={p.svgX}
                  cy={p.svgY}
                  r={isSelected ? 8 : 6}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />

                {/* Location Badge (City Name & Test Count) */}
                <g transform={`translate(${p.svgX}, ${p.svgY - 14})`}>
                  <rect
                    x={-42}
                    y={-18}
                    width={84}
                    height={20}
                    rx={6}
                    fill={isSelected ? '#0284c7' : '#0f172a'}
                    stroke={isSelected ? '#38bdf8' : color}
                    strokeWidth={isSelected ? 1.5 : 1}
                    className="shadow-md"
                  />
                  <text
                    x={0}
                    y={-4}
                    fill="#f8fafc"
                    fontSize="9.5"
                    fontWeight="700"
                    textAnchor="middle"
                    fontFamily="system-ui, sans-serif"
                  >
                    {p.city} ({p.totalTests})
                  </text>
                </g>

                {/* High-risk warning beacon if critical */}
                {p.riskLevel === 'CRITICAL' && (
                  <circle
                    cx={p.svgX + 16}
                    cy={p.svgY - 18}
                    r={4}
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                )}
              </g>
            );
          })}

          {/* User Live GPS Marker if present */}
          {userSvgCoords && (
            <g
              transform={`translate(${userSvgCoords.x}, ${userSvgCoords.y})`}
              className="pointer-events-none"
            >
              {/* Pulsing ring */}
              <circle
                r="20"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                opacity="0.8"
                className="animate-ping"
              />
              <circle
                r="13"
                fill="#0284c7"
                fillOpacity="0.3"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <circle
                r="6"
                fill="#0284c7"
                stroke="#ffffff"
                strokeWidth="2"
              />
              {/* Badge */}
              <g transform="translate(0, -18)">
                <rect
                  x="-50"
                  y="-18"
                  width="100"
                  height="18"
                  rx="5"
                  fill="#0369a1"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  className="shadow-lg"
                />
                <text
                  x="0"
                  y="-5"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="800"
                  textAnchor="middle"
                  fontFamily="system-ui, sans-serif"
                >
                  OFFICER GPS
                </text>
              </g>
            </g>
          )}

        </g>
      </svg>

      {/* Floating Viewport Controls (Top Right) */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-xl z-10">
        {userSvgCoords && (
          <>
            <button
              onClick={handleCenterUserGps}
              title="Center View on Officer GPS Position"
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-sky-300 hover:text-white bg-sky-950/70 hover:bg-sky-900 border border-sky-700/60 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-sky-400" />
              <span>My GPS</span>
            </button>
            <div className="w-[1px] h-5 bg-slate-700 mx-0.5" />
          </>
        )}
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-5 bg-slate-700 mx-0.5" />
        <button
          onClick={handleResetView}
          title="Reset View"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Dynamic Hover Tooltip Card */}
      {hoveredPoint && (
        <div
          className="absolute pointer-events-none z-20 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-2xl text-white text-xs max-w-xs transition-opacity"
          style={{
            top: Math.min(svgHeight - 160, Math.max(16, hoveredPoint.lat * 4)),
            left: 20
          }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-100 text-sm">{hoveredPoint.city}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                hoveredPoint.riskLevel === 'CRITICAL'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : hoveredPoint.riskLevel === 'HIGH'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : hoveredPoint.riskLevel === 'MEDIUM'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {hoveredPoint.riskLevel} RISK
            </span>
          </div>

          <div className="mt-2 space-y-1.5 text-slate-300 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Inspections:</span>
              <strong className="text-slate-100 font-mono">{hoveredPoint.totalTests} tests</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Compliance Rate:</span>
              <span className="font-bold font-mono text-emerald-400">{hoveredPoint.complianceRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Violations Flagged:</span>
              <span className="font-bold font-mono text-rose-400">{hoveredPoint.nonCompliantCount} non-compliant</span>
            </div>
            {hoveredPoint.criticalViolations > 0 && (
              <div className="flex items-center justify-between text-red-400 font-semibold">
                <span>Critical Infractions:</span>
                <span>{hoveredPoint.criticalViolations}</span>
              </div>
            )}
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 truncate">
              {hoveredPoint.name}
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Spectrum & Status Footer */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-800 text-white text-xs z-10 shadow-lg flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Thermal Heat Intensity
          </span>
          <span className="text-[10px] text-emerald-400 font-medium">
            Active Metric: {metric}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-400 font-medium">Low Density</span>
          <div className="w-36 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 via-orange-500 to-red-600" />
          <span className="text-[10px] text-rose-400 font-bold">Hotspot</span>
        </div>
      </div>

      {/* Hint badge */}
      <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 z-10 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-slate-400" />
        <span>Click pin to inspect test logs &bull; Drag to pan &bull; Scroll/buttons to zoom</span>
      </div>
    </div>
  );
};
