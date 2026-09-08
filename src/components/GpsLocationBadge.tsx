import React, { useState } from 'react';
import {
  Navigation,
  MapPin,
  Compass,
  Crosshair,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Building,
  Satellite
} from 'lucide-react';
import { GeolocationCoordinates, GeolocationStatus, GeocodeResult } from '../utils/useGeolocation';
import { GpsPinpointMapModal } from './GpsPinpointMapModal';

interface GpsLocationBadgeProps {
  coordinates: GeolocationCoordinates | null;
  status: GeolocationStatus;
  errorMessage: string | null;
  resolvedLocation: GeocodeResult | null;
  isReverseGeocoding: boolean;
  isWatching: boolean;
  onAcquireLocation: () => Promise<GeolocationCoordinates | null>;
  onToggleWatch: () => void;
  onApplyLocationText?: (locationStr: string, coords?: { lat: number; lng: number }) => void;
  compact?: boolean;
}

// Preset enforcement locations for rapid field testing & desktop simulation
const PRESET_ENFORCEMENT_HUBS = [
  {
    name: 'Reliance Smart, Karol Bagh',
    city: 'New Delhi',
    state: 'Delhi',
    lat: 28.6521,
    lng: 77.1906,
    hubType: 'Retail Supermarket'
  },
  {
    name: 'D-Mart Hypermarket, Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.1136,
    lng: 72.8697,
    hubType: 'FMCG Wholesale'
  },
  {
    name: 'Blinkit Fulfillment Dark Store, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9352,
    lng: 77.6245,
    hubType: 'Quick Commerce Hub'
  },
  {
    name: 'MedPlus Pharmacy, Banjara Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.4156,
    lng: 78.435,
    hubType: 'Health & Personal Care'
  },
  {
    name: 'Reliance Fresh, T. Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.0418,
    lng: 80.2341,
    hubType: 'Packaged Foods'
  },
  {
    name: 'Surat Textile Market, Ring Road',
    city: 'Surat',
    state: 'Gujarat',
    lat: 21.1959,
    lng: 72.8488,
    hubType: 'Apparel & Packaging'
  }
];

export const GpsLocationBadge: React.FC<GpsLocationBadgeProps> = ({
  coordinates,
  status,
  errorMessage,
  resolvedLocation,
  isReverseGeocoding,
  isWatching,
  onAcquireLocation,
  onToggleWatch,
  onApplyLocationText,
  compact = false
}) => {
  const [copied, setCopied] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showOsmModal, setShowOsmModal] = useState(false);

  const handleCopyCoords = () => {
    if (!coordinates) return;
    const text = `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyResolved = () => {
    if (resolvedLocation && onApplyLocationText) {
      onApplyLocationText(resolvedLocation.address, coordinates ? { lat: coordinates.latitude, lng: coordinates.longitude } : undefined);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_ENFORCEMENT_HUBS[0]) => {
    if (onApplyLocationText) {
      onApplyLocationText(`${preset.name}, ${preset.city}`, { lat: preset.lat, lng: preset.lng });
    }
    setShowPresets(false);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {coordinates ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GPS: {coordinates.latitude.toFixed(4)}°, {coordinates.longitude.toFixed(4)}° (±{coordinates.accuracy}m)</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onAcquireLocation()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5 text-slate-600" />
            <span>Acquire GPS</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${coordinates ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
            <Satellite className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">Enforcement GPS Geotag</span>
              {coordinates && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  LOCKED
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500">
              Statutory verification metadata under Sec 15 of Legal Metrology Act, 2009
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onAcquireLocation()}
            disabled={status === 'requesting'}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
            title="Request high-accuracy GPS fix from browser"
          >
            {status === 'requesting' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Crosshair className="w-3.5 h-3.5" />
            )}
            <span>{status === 'requesting' ? 'Locking...' : coordinates ? 'Refresh GPS' : 'Lock GPS'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleWatch}
            title={isWatching ? 'Stop continuous GPS monitoring' : 'Keep GPS locked continuously'}
            className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
              isWatching
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 ${isWatching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* GPS Status and Details */}
      {coordinates ? (
        <div className="space-y-2 pt-1 border-t border-slate-200/60">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-mono text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-bold">{coordinates.latitude.toFixed(5)}° N, {coordinates.longitude.toFixed(5)}° E</span>
              <button
                type="button"
                onClick={handleCopyCoords}
                title="Copy coordinates"
                className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                <span>Accuracy:</span>
                <strong className={coordinates.accuracy <= 15 ? 'text-emerald-700' : 'text-amber-700'}>
                  ±{coordinates.accuracy} m
                </strong>
              </span>
              {coordinates.altitude !== null && (
                <span className="hidden sm:inline bg-white px-2 py-0.5 rounded border border-slate-200">
                  Alt: {Math.round(coordinates.altitude)} m
                </span>
              )}
            </div>
          </div>

          {/* Reverse Geocoded Address */}
          {resolvedLocation && (
            <div className="p-2 bg-emerald-50/70 border border-emerald-200/70 rounded-lg flex items-center justify-between gap-2 text-xs">
              <div className="truncate">
                <span className="text-[10px] font-bold text-emerald-900 uppercase block">Resolved Site Address:</span>
                <span className="text-emerald-950 font-medium truncate block">{resolvedLocation.address}</span>
              </div>
              {onApplyLocationText && (
                <button
                  type="button"
                  onClick={handleApplyResolved}
                  className="shrink-0 px-2 py-1 text-[10px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded cursor-pointer transition-colors shadow-2xs"
                >
                  Apply to Form
                </button>
              )}
            </div>
          )}

          {isReverseGeocoding && (
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
              <span>Reverse-geocoding street address for coordinates...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="pt-1 border-t border-slate-200/60">
          {status === 'denied' ? (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">GPS Permission Denied in Browser</p>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Allow location access in your address bar icon, or choose one of the pre-calibrated enforcement hubs below to simulate coordinates.
                </p>
              </div>
            </div>
          ) : status === 'requesting' ? (
            <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
              <span>Acquiring satellite lock from device hardware...</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
              <span>No GPS coordinates locked yet. Click "Lock GPS" to attach live coordinates.</span>
            </div>
          )}
        </div>
      )}

      {/* Preset Hubs Toggle for Quick Field Simulation */}
      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="text-[11px] font-bold text-slate-700 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Building className="w-3 h-3" />
          <span>{showPresets ? 'Hide Standard Field Hubs' : 'Select Pre-Calibrated Enforcement Hub (Simulation)'}</span>
        </button>

        {coordinates && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOsmModal(true)}
              className="text-[11px] text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded inline-flex items-center gap-1 font-semibold cursor-pointer transition-colors"
            >
              <Navigation className="w-3 h-3 text-sky-600" />
              <span>Pinpoint GPS on Map</span>
            </button>

            <a
              href={`https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}#map=17/${coordinates.latitude}/${coordinates.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-slate-500 hover:text-sky-700 hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>OSM</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        )}
      </div>

      {/* Interactive OpenStreetMap Pinpoint Modal */}
      {coordinates && (
        <GpsPinpointMapModal
          isOpen={showOsmModal}
          onClose={() => setShowOsmModal(false)}
          lat={coordinates.latitude}
          lng={coordinates.longitude}
          accuracy={coordinates.accuracy}
          address={resolvedLocation?.address}
          title="Field Officer GPS Pinpoint"
        />
      )}

      {/* Preset List Dropdown */}
      {showPresets && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
          {PRESET_ENFORCEMENT_HUBS.map((hub) => (
            <button
              key={hub.name}
              type="button"
              onClick={() => handleSelectPreset(hub)}
              className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-xs transition-all flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-slate-900 truncate">{hub.city}</span>
                <span className="text-[10px] text-emerald-700 font-medium">{hub.hubType}</span>
              </div>
              <span className="text-[11px] text-slate-500 truncate mt-0.5">{hub.name}</span>
              <span className="text-[10px] font-mono text-slate-400 mt-1">
                {hub.lat.toFixed(4)}° N, {hub.lng.toFixed(4)}° E
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
