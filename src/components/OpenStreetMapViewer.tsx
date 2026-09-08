import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  Crosshair,
  MapPin,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Building,
  RefreshCw,
  Compass,
  ExternalLink,
  Layers,
  Search,
  Maximize2
} from 'lucide-react';
import { LocationHeatmapPoint, HeatmapMetricMode, InspectionRecord } from '../types';
import { calculateDistanceKm } from '../utils/geoUtils';

// Configure Leaflet fallback icons to unpkg so standard markers don't 404
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Modern HTML Marker for Officer Live GPS Location
const createPersonGpsIcon = () => {
  return L.divIcon({
    className: 'custom-person-gps-pin',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(14, 165, 233, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: #0284c7; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35);"></div>
        <div style="position: absolute; width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

// Custom Marker for Inspection Points
const createInspectionIcon = (point: LocationHeatmapPoint, isSelected: boolean) => {
  const isHighRisk = point.riskLevel === 'CRITICAL' || point.riskLevel === 'HIGH';
  const isModerate = point.riskLevel === 'MEDIUM';
  const bgColor = isHighRisk ? '#e11d48' : isModerate ? '#d97706' : '#16a34a';
  const borderColor = isSelected ? '#ffffff' : 'rgba(255,255,255,0.9)';
  const size = isSelected ? 34 : 26;

  return L.divIcon({
    className: 'custom-inspection-pin',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="width: 100%; height: 100%; border-radius: 50%; background: ${bgColor}; border: 2.5px solid ${borderColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: ${isSelected ? 12 : 10}px; font-family: system-ui, sans-serif;">
          ${point.totalTests}
        </div>
        ${isSelected ? `<div style="position: absolute; inset: -4px; border-radius: 50%; border: 2px dashed ${bgColor}; animation: spin 4s linear infinite;"></div>` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Helper component to smoothly center map
interface MapControllerProps {
  center: [number, number];
  zoom: number;
  triggerKey?: string | number;
}

const MapController: React.FC<MapControllerProps> = ({ center, zoom, triggerKey }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center[0], center[1], zoom, triggerKey, map]);
  return null;
};

interface OpenStreetMapViewerProps {
  points: LocationHeatmapPoint[];
  metric?: HeatmapMetricMode;
  userLocation: {
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp?: string;
  } | null;
  resolvedAddress?: string | null;
  onAcquireLocation?: () => void;
  onSelectPoint?: (point: LocationHeatmapPoint) => void;
  selectedPointId?: string | null;
  isAcquiringLocation?: boolean;
}

export const OpenStreetMapViewer: React.FC<OpenStreetMapViewerProps> = ({
  points,
  userLocation,
  resolvedAddress,
  onAcquireLocation,
  onSelectPoint,
  selectedPointId,
  isAcquiringLocation = false,
}) => {
  // Center coordinates: prefer user's GPS if available, otherwise central India
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    userLocation ? [userLocation.lat, userLocation.lng] : [22.3511, 78.6677]
  );
  const [mapZoom, setMapZoom] = useState<number>(userLocation ? 14 : 5);
  const [flyTrigger, setFlyTrigger] = useState<number>(0);
  const [tileProvider, setTileProvider] = useState<'standard' | 'humanitarian'>('standard');

  const personIcon = useMemo(() => createPersonGpsIcon(), []);

  // Nearest inspection hub to user GPS
  const nearestInspection = useMemo(() => {
    if (!userLocation || points.length === 0) return null;
    let closest = points[0];
    let minD = calculateDistanceKm(userLocation.lat, userLocation.lng, points[0].lat, points[0].lng);

    for (let i = 1; i < points.length; i++) {
      const d = calculateDistanceKm(userLocation.lat, userLocation.lng, points[i].lat, points[i].lng);
      if (d < minD) {
        minD = d;
        closest = points[i];
      }
    }
    return { point: closest, distanceKm: minD };
  }, [userLocation, points]);

  // Center on Person's GPS
  const handleCenterOnPersonGps = () => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setMapZoom(16);
      setFlyTrigger((prev) => prev + 1);
    } else if (onAcquireLocation) {
      onAcquireLocation();
    }
  };

  // Center on India overview
  const handleOverviewIndia = () => {
    setMapCenter([22.3511, 78.6677]);
    setMapZoom(5);
    setFlyTrigger((prev) => prev + 1);
  };

  // Center on a specific inspection point
  const handleCenterOnPoint = (point: LocationHeatmapPoint) => {
    setMapCenter([point.lat, point.lng]);
    setMapZoom(13);
    setFlyTrigger((prev) => prev + 1);
    if (onSelectPoint) {
      onSelectPoint(point);
    }
  };

  // Auto-center once when userLocation first becomes available
  const hasAutoCentered = useRef(false);
  useEffect(() => {
    if (userLocation && !hasAutoCentered.current) {
      hasAutoCentered.current = true;
      setMapCenter([userLocation.lat, userLocation.lng]);
      setMapZoom(15);
      setFlyTrigger((prev) => prev + 1);
    }
  }, [userLocation]);

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 flex flex-col">
      
      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left Side: GPS Geotag Status Pill */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md flex items-center gap-2 text-xs">
          {userLocation ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <Navigation className="w-3.5 h-3.5 text-sky-600" />
                  <span>GPS Pinpointed</span>
                  <span className="font-mono text-slate-700 ml-1">
                    {userLocation.lat.toFixed(5)}° N, {userLocation.lng.toFixed(5)}° E
                  </span>
                </div>
                {userLocation.accuracy && (
                  <span className="text-[10px] text-slate-500">
                    Accuracy: ±{Math.round(userLocation.accuracy)}m {resolvedAddress ? `• ${resolvedAddress}` : ''}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-slate-600">
              <Crosshair className="w-4 h-4 text-slate-400" />
              <span className="font-medium">No GPS location locked yet</span>
            </div>
          )}
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-md">
          {/* Fly to Person GPS Button */}
          <button
            type="button"
            onClick={handleCenterOnPersonGps}
            disabled={isAcquiringLocation}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            title="Fly and zoom directly to your pinpointed GPS location"
          >
            {isAcquiringLocation ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>{userLocation ? 'Pinpoint My GPS' : 'Lock My GPS'}</span>
          </button>

          {/* Focus Nearest Monitored Hub */}
          {nearestInspection && (
            <button
              type="button"
              onClick={() => handleCenterOnPoint(nearestInspection.point)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
              title={`Jump to nearest inspection hub: ${nearestInspection.point.city} (${nearestInspection.distanceKm} km)`}
            >
              <Building className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Nearest Hub ({nearestInspection.distanceKm}km)</span>
            </button>
          )}

          {/* Reset to National India Overview */}
          <button
            type="button"
            onClick={handleOverviewIndia}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset map view to whole of India"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">India View</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map with OpenStreetMap TileLayer */}
      <div className="flex-1 w-full h-full relative z-0">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Map Movement Animation Controller */}
          <MapController center={mapCenter} zoom={mapZoom} triggerKey={flyTrigger} />

          {/* OpenStreetMap Tile Layer as requested */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Person GPS Location Marker & Accuracy Circle */}
          {userLocation && (
            <>
              {userLocation.accuracy && userLocation.accuracy < 1000 && (
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={userLocation.accuracy}
                  pathOptions={{
                    color: '#0284c7',
                    fillColor: '#38bdf8',
                    fillOpacity: 0.15,
                    weight: 1.5,
                    dashArray: '4, 4',
                  }}
                />
              )}

              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={personIcon}
              >
                <Popup>
                  <div className="p-1 space-y-2 text-xs font-sans max-w-[260px]">
                    <div className="flex items-center gap-1.5 font-bold text-sky-900 border-b border-sky-100 pb-1">
                      <Navigation className="w-4 h-4 text-sky-600" />
                      <span>Officer Live GPS Location</span>
                    </div>

                    <div className="space-y-1 text-slate-700">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Coordinates:</span>
                        <strong className="font-mono text-slate-900">
                          {userLocation.lat.toFixed(6)}° N, {userLocation.lng.toFixed(6)}° E
                        </strong>
                      </div>

                      {userLocation.accuracy && (
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">GPS Accuracy:</span>
                          <span className="text-emerald-700 font-semibold">±{Math.round(userLocation.accuracy)} meters</span>
                        </div>
                      )}

                      {resolvedAddress && (
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Resolved Site:</span>
                          <p className="text-slate-900 text-xs leading-tight font-medium">{resolvedAddress}</p>
                        </div>
                      )}

                      {userLocation.timestamp && (
                        <div className="text-[10px] text-slate-400 pt-1">
                          Fix recorded at {new Date(userLocation.timestamp).toLocaleTimeString('en-IN')}
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* Surveillance & Inspection Points on OpenStreetMap */}
          {points.map((point) => {
            const isSelected = selectedPointId === point.id;
            return (
              <Marker
                key={point.id}
                position={[point.lat, point.lng]}
                icon={createInspectionIcon(point, isSelected)}
                eventHandlers={{
                  click: () => {
                    if (onSelectPoint) onSelectPoint(point);
                  },
                }}
              >
                <Popup>
                  <div className="p-1 space-y-2 text-xs font-sans max-w-[280px]">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <strong className="text-sm font-bold text-slate-900">{point.city}</strong>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          point.riskLevel === 'CRITICAL' || point.riskLevel === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : point.riskLevel === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {point.riskLevel} RISK
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs">{point.name}, {point.state}</p>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Total Audits:</span>
                        <strong className="text-slate-900 text-xs">{point.totalTests}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Non-Compliant:</span>
                        <strong className="text-rose-600 text-xs">{point.nonCompliantCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Compliance Rate:</span>
                        <strong className="text-emerald-700 text-xs">{point.complianceRate}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Penalties:</span>
                        <strong className="text-amber-700 text-xs">₹{point.estimatedFines.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    {userLocation && (
                      <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1">
                        <span>Distance from your GPS:</span>
                        <strong className="text-sky-700">
                          {calculateDistanceKm(userLocation.lat, userLocation.lng, point.lat, point.lng)} km
                        </strong>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectPoint) onSelectPoint(point);
                      }}
                      className="w-full mt-2 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold text-center cursor-pointer transition-colors"
                    >
                      View Hub Infractions ({point.totalTests})
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-md text-slate-800 text-xs flex flex-wrap items-center gap-3 pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-600 border-2 border-white shadow-xs inline-block" />
          <span className="font-semibold text-[11px]">Officer GPS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" />
          <span className="text-[11px]">High Violations</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
          <span className="text-[11px]">Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
          <span className="text-[11px]">Compliant</span>
        </div>
      </div>

      {/* Floating Coordinates Bar if GPS locked */}
      {userLocation && (
        <div className="absolute bottom-3 right-3 z-[1000] hidden md:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-[11px] font-mono text-slate-700 pointer-events-auto">
          <Crosshair className="w-3.5 h-3.5 text-sky-600" />
          <span>LAT: {userLocation.lat.toFixed(5)}° | LNG: {userLocation.lng.toFixed(5)}°</span>
        </div>
      )}
    </div>
  );
};
