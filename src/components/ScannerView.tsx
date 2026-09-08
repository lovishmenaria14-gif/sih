import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Info,
  RefreshCw,
  Eye,
  Sliders,
  SwitchCamera,
  Layers,
  Box,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Check,
  Edit3
} from 'lucide-react';
import { ProductCategory, InspectionRecord, InspectorProfile } from '../types';
import { SAMPLE_PACKAGES, SamplePackageItem } from '../data/samplePackages';
import { useGeolocation } from '../utils/useGeolocation';
import { GpsLocationBadge } from './GpsLocationBadge';

interface ScannerViewProps {
  onScanComplete: (record: InspectionRecord) => void;
  currentRole: InspectorProfile['role'];
}

export interface PackagingSideItem {
  id: number;
  name: string;
  imageUrl: string | null;
}

const DEFAULT_SIDE_TEMPLATES: Record<number, string[]> = {
  1: ['Principal Display Panel (Front)'],
  2: ['Front Panel (PDP - Brand & Net Qty)', 'Back Panel (Mfg, MRP, Details)'],
  3: ['Front Panel (PDP)', 'Side Panel A (MRP & Date)', 'Side Panel B (Manufacturer & Care)'],
  4: [
    'Front Panel (Principal Display Panel)',
    'Back Panel (Manufacturer & Care)',
    'Left Side Panel (MRP & USP)',
    'Right Side Panel (Date of Packing & Barcode)'
  ],
  5: [
    'Front Panel (Principal Display Panel)',
    'Back Panel (Manufacturer & Care)',
    'Left Side Panel',
    'Right Side Panel',
    'Top Flap (MRP & Date)'
  ],
  6: [
    'Front Panel (Principal Display Panel)',
    'Back Panel (Manufacturer & Consumer Care)',
    'Left Side Panel',
    'Right Side Panel',
    'Top Flap (MRP & Packing Date)',
    'Bottom Panel (Barcode & Regulatory Markings)'
  ]
};

export const ScannerView: React.FC<ScannerViewProps> = ({ onScanComplete, currentRole }) => {
  // Packaging Multi-Side Configuration
  const [sideCount, setSideCount] = useState<number>(2);
  const [sides, setSides] = useState<PackagingSideItem[]>([
    {
      id: 1,
      name: 'Front Panel (PDP - Brand & Net Qty)',
      imageUrl: SAMPLE_PACKAGES[0].imageUrl
    },
    {
      id: 2,
      name: 'Back Panel (Mfg, MRP, Details)',
      imageUrl: null
    }
  ]);
  const [activeSideIndex, setActiveSideIndex] = useState<number>(0);
  const [isEditingSideName, setIsEditingSideName] = useState<boolean>(false);

  // Commodity Metadata
  const [productName, setProductName] = useState<string>(SAMPLE_PACKAGES[0].name);
  const [category, setCategory] = useState<ProductCategory>('FOOD_BEVERAGE');
  const [pdpAreaSqCm, setPdpAreaSqCm] = useState<number>(SAMPLE_PACKAGES[0].pdpAreaSqCm);
  const [location, setLocation] = useState<string>('Reliance Supermarket, Karol Bagh, New Delhi');
  const [inspectorName, setInspectorName] = useState<string>('Inspector Rajesh Sharma');
  const [badgeId, setBadgeId] = useState<string>('LM-DL-8821');

  // Device Geolocation Hook
  const {
    coordinates: gpsCoordinates,
    status: gpsStatus,
    errorMessage: gpsError,
    resolvedLocation,
    isReverseGeocoding,
    isWatching,
    acquireLocation,
    toggleWatch,
    setCoordinates: setGpsCoordinates
  } = useGeolocation();

  // Camera & Scan State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStepText, setScanStepText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Ensure srcObject attaches reliably to video element when stream or isCameraActive changes
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn('Video auto-play interrupted or failed:', err);
      });
    }
  }, [isCameraActive]);

  // Adjust side count and preserve existing images
  const setPackageSideCount = (count: number) => {
    const clampedCount = Math.max(1, Math.min(8, count));
    setSideCount(clampedCount);
    setSides((prev) => {
      const templates = DEFAULT_SIDE_TEMPLATES[clampedCount] || [];
      const newSides: PackagingSideItem[] = [];
      for (let i = 0; i < clampedCount; i++) {
        newSides.push({
          id: i + 1,
          name: prev[i]?.name || templates[i] || `Packaging Side ${i + 1}`,
          imageUrl: prev[i]?.imageUrl || null
        });
      }
      return newSides;
    });
    if (activeSideIndex >= clampedCount) {
      setActiveSideIndex(0);
    }
  };

  const currentSide = sides[activeSideIndex] || sides[0];
  const capturedCount = sides.filter((s) => Boolean(s.imageUrl)).length;

  const startCamera = async (overrideFacingMode?: 'environment' | 'user') => {
    try {
      setErrorMsg(null);
      setCameraLoading(true);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const targetFacing = overrideFacingMode || facingMode;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser or frame environment.');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: targetFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (firstErr: any) {
        console.warn('Ideal constraints failed, retrying with basic video:', firstErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
          });
        } catch (secondErr: any) {
          throw new Error(`Unable to access camera (${secondErr?.name || 'PermissionDenied'}). Please grant camera permission or use photo upload.`);
        }
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setCameraLoading(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn('Video play call error:', err);
        });
      }
    } catch (err: any) {
      console.error('Camera start error:', err);
      setCameraLoading(false);
      setIsCameraActive(false);
      setErrorMsg(err.message || 'Failed to start camera. Please upload an image instead.');
    }
  };

  const toggleCameraFacing = async () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    if (isCameraActive) {
      await startCamera(newFacing);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Capture active side photo
  const captureActiveSideFrame = (proceedToNext: boolean = false) => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      setSides((prev) => {
        const copy = [...prev];
        if (copy[activeSideIndex]) {
          copy[activeSideIndex] = {
            ...copy[activeSideIndex],
            imageUrl: dataUrl
          };
        }
        return copy;
      });

      setErrorMsg(null);

      // Check if there is a next uncaptured side
      const nextIndex = (activeSideIndex + 1) % sides.length;
      if (proceedToNext && nextIndex !== activeSideIndex) {
        setActiveSideIndex(nextIndex);
      } else if (!proceedToNext) {
        stopCamera();
      }
    }
  };

  // File upload for active side
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cleanFileName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .trim();

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSides((prev) => {
        const copy = [...prev];
        if (copy[activeSideIndex]) {
          copy[activeSideIndex] = {
            ...copy[activeSideIndex],
            imageUrl: dataUrl
          };
        }
        return copy;
      });
      stopCamera();

      // If product name is generic, update with file name
      if (productName.includes('Benchmark') || productName.includes('Live Field') || !productName) {
        setProductName(cleanFileName.length > 2 ? cleanFileName : 'Inspected Packaged Commodity');
      }
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be uploaded if reselected
    e.target.value = '';
  };

  const clearActiveSideImage = () => {
    setSides((prev) => {
      const copy = [...prev];
      if (copy[activeSideIndex]) {
        copy[activeSideIndex] = {
          ...copy[activeSideIndex],
          imageUrl: null
        };
      }
      return copy;
    });
  };

  const updateActiveSideName = (name: string) => {
    setSides((prev) => {
      const copy = [...prev];
      if (copy[activeSideIndex]) {
        copy[activeSideIndex] = {
          ...copy[activeSideIndex],
          name
        };
      }
      return copy;
    });
  };

  const loadSample = (sample: SamplePackageItem) => {
    stopCamera();
    // Configure sample with 2 sides: Front populated, Back ready for scan or evaluation
    setSideCount(2);
    setSides([
      {
        id: 1,
        name: 'Front Panel (PDP - Brand & Net Qty)',
        imageUrl: sample.imageUrl
      },
      {
        id: 2,
        name: 'Back Panel (Mfg, MRP, Details)',
        imageUrl: null
      }
    ]);
    setActiveSideIndex(0);
    setProductName(sample.name);
    setCategory(sample.category as ProductCategory);
    setPdpAreaSqCm(sample.pdpAreaSqCm);
    setErrorMsg(null);
  };

  const handleRunScan = async () => {
    const validSides = sides.filter((s) => Boolean(s.imageUrl));
    if (validSides.length === 0) {
      setErrorMsg('Please photograph or upload at least one packaging side before running evaluation.');
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);

    // Progressive step simulation for multi-side inspection
    setScanStepText(`Step 1/4: Aggregating photos from ${validSides.length} packaging sides...`);
    setTimeout(() => {
      setScanStepText('Step 2/4: Cross-referencing Rule 6 statutory declarations across all panels...');
    }, 1200);
    setTimeout(() => {
      setScanStepText('Step 3/4: Assessing Rule 7 font height & Schedule II area thresholds...');
    }, 2400);
    setTimeout(() => {
      setScanStepText('Step 4/4: Calculating Section 36 penalties and compiling consolidated report...');
    }, 3600);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sides: validSides.map((s) => ({
            sideNumber: s.id,
            sideName: s.name,
            imageUrl: s.imageUrl
          })),
          sideCount: sides.length,
          productNameHint: productName,
          category,
          pdpAreaSqCm,
          location,
          inspectorName,
          badgeId,
          latitude: gpsCoordinates?.latitude,
          longitude: gpsCoordinates?.longitude,
          gpsAccuracy: gpsCoordinates?.accuracy,
          gpsTimestamp: gpsCoordinates ? new Date(gpsCoordinates.timestamp).toISOString() : undefined,
          city: resolvedLocation?.city,
          state: resolvedLocation?.state
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to scan package.');
      }

      const record: InspectionRecord = await response.json();
      setIsScanning(false);
      onScanComplete(record);
    } catch (err: any) {
      console.error('Scan error:', err);
      setIsScanning(false);
      setErrorMsg(err.message || 'Legal Metrology compliance scan failed. Please verify server connection.');
    }
  };

  // Find next uncaptured side index
  const nextUncapturedIndex = sides.findIndex((s, idx) => idx !== activeSideIndex && !s.imageUrl);

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900 text-xs shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Inspection Notice:</span> {errorMsg}
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:text-rose-800 font-bold ml-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Package Form Factor & Side Selector Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Commodity Packaging Form Factor &amp; Side Configuration
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify how many sides/faces the package has, capture photos for each side, and evaluate statutory compliance.
            </p>
          </div>

          {/* Captured Progress Counter */}
          <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Evidence Status
              </span>
              <span className="text-xs font-extrabold text-slate-900">
                {capturedCount} of {sides.length} Sides Captured ({Math.round((capturedCount / sides.length) * 100)}%)
              </span>
            </div>
            <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(capturedCount / sides.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Preset Side Structure Pills & Stepper */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 mr-1">Package Type:</span>

          {[
            { count: 1, label: '1 Side (Flat Pouch / Card)' },
            { count: 2, label: '2 Sides (Front & Back)' },
            { count: 3, label: '3 Sides (Tetra / Prism)' },
            { count: 4, label: '4 Sides (Standard Carton)' },
            { count: 6, label: '6 Sides (Complete 3D Box)' }
          ].map((preset) => (
            <button
              key={preset.count}
              type="button"
              onClick={() => setPackageSideCount(preset.count)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                sideCount === preset.count
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}

          {/* Custom Stepper */}
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 ml-auto">
            <button
              type="button"
              onClick={() => setPackageSideCount(sideCount - 1)}
              disabled={sideCount <= 1}
              className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
            >
              -
            </button>
            <span className="px-2.5 text-xs font-bold text-slate-800">
              {sideCount} {sideCount === 1 ? 'Side' : 'Sides'}
            </span>
            <button
              type="button"
              onClick={() => setPackageSideCount(sideCount + 1)}
              disabled={sideCount >= 8}
              className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Side Tabs Navigation Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
          {sides.map((side, idx) => {
            const isActive = idx === activeSideIndex;
            const hasImage = Boolean(side.imageUrl);

            return (
              <button
                key={side.id}
                type="button"
                onClick={() => {
                  setActiveSideIndex(idx);
                  setIsEditingSideName(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  isActive
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                    : hasImage
                    ? 'border-emerald-200 bg-white hover:border-emerald-300'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : hasImage
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    Side {side.id}
                  </span>

                  {hasImage ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Ready
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Needed</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {hasImage ? (
                    <img
                      src={side.imageUrl!}
                      alt={side.name}
                      className="w-7 h-7 object-cover rounded border border-slate-300 shrink-0 bg-slate-100"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0 bg-slate-50">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-800 truncate block">
                    {side.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Test Samples Bar */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Quick Test Packages (Pre-Calibrated Benchmark Labels)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Click to load instantly</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {SAMPLE_PACKAGES.map((sample) => {
            const isSelected = sides[0]?.imageUrl === sample.imageUrl;
            return (
              <button
                key={sample.id}
                onClick={() => loadSample(sample)}
                className={`text-left p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-slate-900 truncate">{sample.brand}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        sample.expectedVerdict === 'COMPLIANT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sample.expectedVerdict === 'NON_COMPLIANT'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sample.expectedVerdict}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {sample.name}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>PDP: {sample.pdpAreaSqCm} cm²</span>
                  <span className="font-semibold text-emerald-700">Load Test &rarr;</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Scanner Section: Dual Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image / Camera Preview for Active Side (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {activeSideIndex + 1}
              </span>
              {isEditingSideName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={currentSide.name}
                    onChange={(e) => updateActiveSideName(e.target.value)}
                    className="text-xs font-bold px-2 py-1 border border-emerald-500 rounded bg-emerald-50 text-slate-900 focus:outline-none"
                    autoFocus
                    onBlur={() => setIsEditingSideName(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingSideName(false);
                    }}
                  />
                  <button
                    onClick={() => setIsEditingSideName(false)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {currentSide.name}
                  </h3>
                  <button
                    onClick={() => setIsEditingSideName(true)}
                    title="Edit side label"
                    className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                Upload Photo
              </button>

              {!isCameraActive ? (
                <button
                  onClick={() => startCamera()}
                  disabled={cameraLoading}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {cameraLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  <span>{cameraLoading ? 'Starting Camera...' : 'Live Camera'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleCameraFacing}
                    title="Flip camera lens (Front/Back)"
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
                  >
                    <SwitchCamera className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">
                      {facingMode === 'environment' ? 'Rear' : 'Front'}
                    </span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Close Camera
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Side Viewer / Camera Area */}
          <div className="relative min-h-[380px] max-h-[500px] w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
            {isCameraActive ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full max-h-[460px] object-contain"
                />

                {/* Packaging Reticle Guide */}
                <div className="absolute inset-8 border-2 border-dashed border-emerald-400/70 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex items-center justify-between text-emerald-400 text-[11px] font-mono font-bold bg-slate-950/70 px-2.5 py-1 rounded w-fit">
                    <span>ALIGN: {currentSide.name.toUpperCase()}</span>
                  </div>
                  <div className="text-center text-[11px] text-emerald-300 font-mono bg-slate-950/60 px-3 py-1 rounded self-center">
                    Keep statutory declarations sharp &amp; well-lit
                  </div>
                </div>

                {/* Floating In-Camera Capture Buttons */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3 px-4">
                  <button
                    onClick={() => captureActiveSideFrame(false)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all border border-emerald-400/40"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Side {activeSideIndex + 1}</span>
                  </button>

                  {sides.length > 1 && (
                    <button
                      onClick={() => captureActiveSideFrame(true)}
                      className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-emerald-400 font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-all border border-emerald-500/40 backdrop-blur-md"
                    >
                      <span>Capture &amp; Next Side</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : currentSide.imageUrl ? (
              <div className="relative w-full h-full flex items-center justify-center p-3">
                <img
                  src={currentSide.imageUrl}
                  alt={currentSide.name}
                  className="max-h-[440px] w-auto object-contain rounded-lg shadow-md"
                />

                {/* Simulated scanning laser line during scan */}
                {isScanning && (
                  <div className="absolute inset-x-4 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce pointer-events-none" />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                  <Camera className="w-7 h-7" />
                </div>
                <p className="font-semibold text-sm text-slate-200">
                  No photo captured for Side {activeSideIndex + 1}
                </p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Photograph <strong className="text-slate-300">{currentSide.name}</strong> using the live camera or upload a clear label photo.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => startCamera()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Open Live Camera
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-colors"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Upload File
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Side Footer Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSideIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeSideIndex === 0}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 font-semibold text-slate-700 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev Side</span>
              </button>
              <button
                onClick={() => setActiveSideIndex((prev) => Math.min(sides.length - 1, prev + 1))}
                disabled={activeSideIndex === sides.length - 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 font-semibold text-slate-700 cursor-pointer"
              >
                <span>Next Side</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {currentSide.imageUrl && (
                <button
                  onClick={clearActiveSideImage}
                  className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  Clear This Side Photo
                </button>
              )}
              {nextUncapturedIndex !== -1 && (
                <button
                  onClick={() => setActiveSideIndex(nextUncapturedIndex)}
                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Go to Side {nextUncapturedIndex + 1} ({sides[nextUncapturedIndex].name.slice(0, 16)}...)</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Parameters & Inspection Trigger (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Inspection Parameters &amp; Thresholds
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure parameters for Rule 7 font analysis and official notice drafting.
            </p>
          </div>

          {/* Product Name & Category */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Commodity Name / Package Label
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Aloo Bhujia Namkeen 200g"
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-slate-50/50 cursor-pointer"
              >
                <option value="FOOD_BEVERAGE">Food &amp; Packaged Beverages</option>
                <option value="COSMETICS_PERSONAL_CARE">Cosmetics &amp; Personal Care</option>
                <option value="ELECTRONICS_APPLIANCES">Electronics &amp; Appliances</option>
                <option value="FMCG_HOUSEHOLD">FMCG &amp; Household Goods</option>
                <option value="TEXTILES_APPAREL">Textiles &amp; Garments</option>
                <option value="PHARMACEUTICALS_WELLNESS">Wellness &amp; Supplements</option>
                <option value="OTHER">Other Packaged Commodities</option>
              </select>
            </div>

            {/* Principal Display Panel (PDP) Area Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>Principal Display Panel Area</span>
                  <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {pdpAreaSqCm} cm²
                  </span>
                </label>
              </div>

              <input
                type="range"
                min="20"
                max="800"
                step="10"
                value={pdpAreaSqCm}
                onChange={(e) => setPdpAreaSqCm(Number(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />

              {/* Quick Area Presets */}
              <div className="flex items-center gap-1.5 mt-2">
                {[
                  { label: 'Sachet (40 cm²)', val: 40 },
                  { label: 'Pouch (120 cm²)', val: 120 },
                  { label: 'Box (300 cm²)', val: 300 },
                  { label: 'Carton (600 cm²)', val: 600 }
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setPdpAreaSqCm(preset.val)}
                    className={`text-[10px] font-semibold px-2 py-1 rounded transition-colors cursor-pointer ${
                      pdpAreaSqCm === preset.val
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 mt-1.5">
                Statutory font height mandate under Rule 7: Minimum{' '}
                <strong className="text-slate-800">
                  {pdpAreaSqCm <= 50 ? '1.0mm' : pdpAreaSqCm <= 100 ? '1.5mm' : pdpAreaSqCm <= 500 ? '2.0mm' : '4.0mm'}
                </strong>{' '}
                for general text and{' '}
                <strong className="text-slate-800">
                  {pdpAreaSqCm <= 50 ? '1.5mm' : pdpAreaSqCm <= 100 ? '2.0mm' : pdpAreaSqCm <= 500 ? '4.0mm' : '6.0mm'}
                </strong>{' '}
                for net quantity numerals.
              </p>
            </div>

            {/* Inspection Site & Badge Details */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Enforcement Officer
                </label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500 text-slate-900 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Officer Badge / ID
                </label>
                <input
                  type="text"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500 text-slate-900 bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Inspection Location / Retail Point
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Market / Retail Store Name"
                className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500 text-slate-900 bg-slate-50"
              />
            </div>

            {/* GPS Geotag & Enforcement Hardware Acquisition */}
            <GpsLocationBadge
              coordinates={gpsCoordinates}
              status={gpsStatus}
              errorMessage={gpsError}
              resolvedLocation={resolvedLocation}
              isReverseGeocoding={isReverseGeocoding}
              isWatching={isWatching}
              onAcquireLocation={acquireLocation}
              onToggleWatch={toggleWatch}
              onApplyLocationText={(locStr, coords) => {
                setLocation(locStr);
                if (coords) {
                  setGpsCoordinates({
                    latitude: coords.lat,
                    longitude: coords.lng,
                    accuracy: 5,
                    altitude: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null,
                    timestamp: Date.now()
                  });
                }
              }}
            />
          </div>

          {/* Action Trigger Button */}
          <div className="pt-3 border-t border-slate-100">
            {capturedCount > 0 && capturedCount < sides.length && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-2.5">
                Note: <strong>{capturedCount} of {sides.length} sides</strong> photographed. The audit will inspect all captured sides together.
              </p>
            )}

            <button
              onClick={handleRunScan}
              disabled={isScanning || capturedCount === 0}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isScanning || capturedCount === 0
                  ? 'bg-slate-400 cursor-not-allowed opacity-80'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-emerald-950/20'
              }`}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Legal Metrology Rules...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Evaluate Legal Metrology Compliance ({capturedCount}/{sides.length} Sides)
                  </span>
                </>
              )}
            </button>

            {isScanning && (
              <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 animate-pulse">
                <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-semibold">{scanStepText}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
