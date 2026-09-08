import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Navigation, Crosshair, MapPin, Copy, Check, ExternalLink } from 'lucide-react';

interface GpsPinpointMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
  title?: string;
}

// Custom Person GPS Pin Icon
const personPinIcon = L.divIcon({
  className: 'modal-person-gps-pin',
  html: `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(14, 165, 233, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: #0284c7; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35);"></div>
      <div style="position: absolute; width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

export const GpsPinpointMapModal: React.FC<GpsPinpointMapModalProps> = ({
  isOpen,
  onClose,
  lat,
  lng,
  accuracy,
  address,
  title = 'Pinpointed GPS Location'
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <Navigation className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-100">{title}</h3>
              <p className="text-[11px] text-slate-400">OpenStreetMap Live Geospatial Fix</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Coords & Accuracy Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-slate-800">
            <Crosshair className="w-3.5 h-3.5 text-sky-600" />
            <strong className="font-bold">{lat.toFixed(6)}° N, {lng.toFixed(6)}° E</strong>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded cursor-pointer"
              title="Copy GPS Coordinates"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-600 text-[11px]">
            {accuracy && (
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                Accuracy: <strong className="text-emerald-700">±{Math.round(accuracy)}m</strong>
              </span>
            )}
            <a
              href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sky-700 hover:underline font-medium"
            >
              <span>View on OSM.org</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Address Banner if available */}
        {address && (
          <div className="px-5 py-2 bg-emerald-50/60 border-b border-emerald-200/60 text-xs text-emerald-950 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="font-medium truncate">{address}</span>
          </div>
        )}

        {/* Leaflet Map with OpenStreetMap TileLayer */}
        <div className="relative w-full h-[450px] bg-slate-100">
          <MapContainer
            center={[lat, lng]}
            zoom={16}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
          >
            {/* User requested OpenStreetMap TileLayer */}
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            {/* GPS Accuracy Circle */}
            {accuracy && accuracy < 1000 && (
              <Circle
                center={[lat, lng]}
                radius={accuracy}
                pathOptions={{
                  color: '#0284c7',
                  fillColor: '#38bdf8',
                  fillOpacity: 0.2,
                  weight: 1.5,
                  dashArray: '4, 4',
                }}
              />
            )}

            {/* Pinpointed Location Marker */}
            <Marker position={[lat, lng]} icon={personPinIcon}>
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <strong className="text-slate-900 block font-bold">{title}</strong>
                  <p className="font-mono text-slate-700 text-[11px]">{lat.toFixed(6)}°, {lng.toFixed(6)}°</p>
                  {accuracy && (
                    <span className="text-[10px] text-emerald-700 font-semibold block">
                      Radius: ±{Math.round(accuracy)}m
                    </span>
                  )}
                  {address && (
                    <p className="text-[11px] text-slate-600 mt-1">{address}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Map tiles served by OpenStreetMap Foundation</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer transition-colors"
          >
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
};
