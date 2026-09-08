import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { analyzePackagedCommodityImage } from './server/geminiService';
import { evaluateLegalMetrologyCompliance } from './server/rulesEngine';
import {
  getAllInspections,
  getInspectionById,
  saveInspection,
  deleteInspection,
  updateNoticeStatus,
  getAnalytics,
  getLocationAnalytics,
  initStorage,
  resolveNearbyCity
} from './server/storage';
import { InspectionRecord } from './src/types';

async function startServer() {
  console.log('🚀 Starting Legal Metrology Compliance Inspector...');
  const app = express();
  const PORT = 3000;

  // High payload limit for camera photo uploads / label base64 images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize storage repository
  await initStorage();

  // -------------------------------------------------------------
  // API Routes
  // -------------------------------------------------------------

  // System Health & Deployment Readiness Check
  app.get('/api/health', (req, res) => {
    const rawKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');
    const isConfigured = Boolean(
      rawKey &&
      rawKey !== 'MY_GEMINI_API_KEY' &&
      rawKey !== 'your_gemini_api_key' &&
      !rawKey.startsWith('<') &&
      rawKey.length > 8
    );
    res.json({
      status: 'ok',
      service: 'Legal Metrology Compliance Inspector API',
      version: '2.1.0',
      geminiKeyConfigured: isConfigured,
      database: process.env.MONGODB_URI ? 'MongoDB (Configured)' : 'Local File Repository (Ready)',
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Reverse Geocoding API for Live Device GPS Coordinates
  app.get('/api/reverse-geocode', async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'Valid lat and lng query parameters are required.' });
      }

      // 1. Attempt lookup via OpenStreetMap Nominatim with a short timeout
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        const resp = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'LegalMetrologyComplianceAudit/2.1 (surveillance@gov.in)'
          },
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (resp.ok) {
          const data = await resp.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || addr.suburb || addr.district || 'National Capital Region';
          const state = addr.state || 'India';
          const road = addr.road || addr.suburb || addr.neighbourhood || '';
          const shop = addr.shop || addr.amenity || addr.building || '';

          const fullAddress = [shop, road, city, state].filter(Boolean).join(', ') || data.display_name || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;

          return res.json({
            address: fullAddress,
            city,
            state,
            country: addr.country || 'India',
            postcode: addr.postcode || '',
            lat,
            lng,
            source: 'nominatim'
          });
        }
      } catch (nomErr) {
        // Fallback to internal geographic hub database
      }

      // 2. Geographic hub fallback
      const localResult = resolveNearbyCity(lat, lng);
      res.json({
        address: `${localResult.locality}, ${localResult.city}, ${localResult.state}`,
        city: localResult.city,
        state: localResult.state,
        country: 'India',
        lat,
        lng,
        source: 'local_lookup'
      });
    } catch (err: any) {
      console.error('Reverse geocode error:', err);
      res.status(500).json({ error: err.message || 'Failed to reverse geocode coordinates' });
    }
  });

  // Analytics Dashboard Data
  app.get('/api/analytics', async (req, res) => {
    try {
      const stats = await getAnalytics();
      res.json(stats);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch analytics' });
    }
  });

  // Geographic Test Heatmap & Location Surveillance Metrics
  app.get('/api/analytics/locations', async (req, res) => {
    try {
      const locationData = await getLocationAnalytics();
      res.json(locationData);
    } catch (err: any) {
      console.error('Error fetching location heatmap analytics:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch location analytics' });
    }
  });

  // Query & Filter Inspections
  app.get('/api/inspections', async (req, res) => {
    try {
      const { search, status, category, page, limit } = req.query;
      const data = await getAllInspections({
        search: search as string,
        status: status as string,
        category: category as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50
      });
      res.json(data);
    } catch (err: any) {
      console.error('Error listing inspections:', err);
      res.status(500).json({ error: err.message || 'Failed to list inspections' });
    }
  });

  // Get Single Inspection by ID
  app.get('/api/inspections/:id', async (req, res) => {
    try {
      const record = await getInspectionById(req.params.id);
      if (!record) {
        return res.status(404).json({ error: 'Inspection record not found' });
      }
      res.json(record);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Scan & Analyze Packaged Commodity Label Image (Single or Multi-Side)
  app.post('/api/scan', async (req, res) => {
    try {
      const {
        image,
        images,
        sides,
        sideCount,
        productNameHint,
        category = 'FOOD_BEVERAGE',
        pdpAreaSqCm = 100,
        location = 'General Retail Store',
        inspectorName = 'Inspector Rajesh Sharma',
        badgeId = 'LM-DL-8821',
        latitude,
        longitude,
        gpsAccuracy,
        gpsTimestamp,
        city,
        state
      } = req.body;

      // Collect packaging sides evidence
      let collectedSides: { sideNumber: number; sideName: string; imageUrl: string; capturedAt?: string }[] = [];
      let collectedImages: string[] = [];

      if (Array.isArray(sides) && sides.length > 0) {
        collectedSides = sides
          .filter((s: any) => s && (s.imageUrl || s.dataUrl))
          .map((s: any, idx: number) => ({
            sideNumber: s.sideNumber || idx + 1,
            sideName: s.sideName || `Side ${idx + 1}`,
            imageUrl: s.imageUrl || s.dataUrl,
            capturedAt: s.capturedAt || new Date().toISOString()
          }));
        collectedImages = collectedSides.map((s) => s.imageUrl);
      } else if (Array.isArray(images) && images.length > 0) {
        collectedImages = images.filter((img: any) => typeof img === 'string' && img.trim().length > 0);
        collectedSides = collectedImages.map((img, idx) => ({
          sideNumber: idx + 1,
          sideName: `Side ${idx + 1}`,
          imageUrl: img,
          capturedAt: new Date().toISOString()
        }));
      } else if (image && typeof image === 'string' && image.trim().length > 0) {
        collectedImages = [image];
        collectedSides = [
          {
            sideNumber: 1,
            sideName: 'Front Panel (Principal Display Panel)',
            imageUrl: image,
            capturedAt: new Date().toISOString()
          }
        ];
      }

      if (collectedImages.length === 0) {
        return res.status(400).json({ error: 'At least one packaging image or side photo is required for compliance inspection.' });
      }

      // Step 1: AI Multimodal Label Text & Multi-Side Declaration Extraction
      const extractedRaw = await analyzePackagedCommodityImage(
        collectedSides.map((s) => ({ sideName: s.sideName, dataUrl: s.imageUrl })),
        {
          productName: productNameHint,
          category,
          pdpAreaSqCm: Number(pdpAreaSqCm) || 100,
          sideCount: typeof sideCount === 'number' ? sideCount : collectedSides.length
        }
      );

      // Step 2: Rule-based Legal Metrology Evaluation Engine
      const evaluation = evaluateLegalMetrologyCompliance(
        extractedRaw,
        Number(pdpAreaSqCm) || 100
      );

      // Step 3: Construct Full Inspection Record
      const serial = Math.floor(1000 + Math.random() * 9000);
      const year = new Date().getFullYear();
      const inspectionId = `INSP-${year}-${serial}`;

      const newRecord: InspectionRecord = {
        id: inspectionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        productName: extractedRaw.productName || productNameHint || 'Packaged Commodity Item',
        brandName: extractedRaw.brandName || 'Unspecified Brand',
        category: (extractedRaw.category as any) || category,
        packageType: extractedRaw.packageType || `${collectedSides.length}-Sided Packaging`,
        overallStatus: evaluation.overallStatus,
        complianceScore: evaluation.complianceScore,
        pdpAreaSqCm: Number(pdpAreaSqCm) || 100,
        sampleBatchNo: `BATCH-${Math.floor(100000 + Math.random() * 900000)}`,
        inspector: {
          id: 'INSP-USER-1',
          name: inspectorName,
          badgeId: badgeId,
          role: 'ENFORCEMENT_OFFICER',
          jurisdiction: 'National Capital Region / State Directorate'
        },
        declarations: evaluation.declarations,
        criticalViolationsCount: evaluation.criticalCount,
        moderateViolationsCount: evaluation.moderateCount,
        summary: evaluation.summary,
        penaltiesApplicable: evaluation.penalties,
        officialNoticeIssued: false,
        evidenceImages: collectedImages,
        packageSides: collectedSides,
        sideCount: typeof sideCount === 'number' ? sideCount : collectedSides.length,
        location: location || 'Field Inspection Site',
        latitude: typeof latitude === 'number' && !isNaN(latitude) ? latitude : undefined,
        longitude: typeof longitude === 'number' && !isNaN(longitude) ? longitude : undefined,
        gpsAccuracy: typeof gpsAccuracy === 'number' && !isNaN(gpsAccuracy) ? gpsAccuracy : undefined,
        gpsTimestamp: typeof gpsTimestamp === 'string' ? gpsTimestamp : undefined,
        city: typeof city === 'string' && city.trim() ? city.trim() : undefined,
        state: typeof state === 'string' && state.trim() ? state.trim() : undefined,
        rawAnalysisText: extractedRaw.otherObservations?.join('\n')
      };

      // Step 4: Persist in storage repository
      const saved = await saveInspection(newRecord);
      res.status(201).json(saved);
    } catch (err: any) {
      console.error('Inspection scan error:', err);
      res.status(500).json({ error: err.message || 'Inspection scan failed' });
    }
  });

  // Issue Official Legal Metrology Notice / Show Cause Notice
  app.post('/api/inspections/:id/notice', async (req, res) => {
    try {
      const year = new Date().getFullYear();
      const noticeCode = `LM/NOTICE/${year}/${Math.floor(1000 + Math.random() * 9000)}`;
      const updated = await updateNoticeStatus(req.params.id, noticeCode);
      if (!updated) {
        return res.status(404).json({ error: 'Inspection record not found' });
      }
      res.json({ success: true, record: updated, noticeNumber: noticeCode });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete an inspection
  app.delete('/api/inspections/:id', async (req, res) => {
    try {
      const deleted = await deleteInspection(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Record not found' });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // Vite & Static Asset Handling
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ======================================================`);
    console.log(`  Legal Metrology Compliance Inspector Server is LIVE!`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/`);
    console.log(`  ======================================================\n`);
  });
}

startServer();
