import express from 'express';
import { getRoute } from '../services/googleMaps.js';
import { validateRouteOptions } from '../services/routeValidator.js';
import { analyzeRoute } from '../services/gemini.js';

const router = express.Router();

router.post('/route', async (req, res) => {
  const { origin, destination, departureTime, vehicleType = 'camion', cargoType = 'general' } = req.body;

  if (!origin?.trim() || !destination?.trim()) {
    return res.status(400).json({ error: 'Se requieren los campos "origin" y "destination".' });
  }

  try {
    const googleMapsData = await getRoute(origin.trim(), destination.trim(), departureTime, vehicleType, cargoType);
    const rankedRoutes = validateRouteOptions(googleMapsData, departureTime, vehicleType, cargoType);
    const rankedGoogleMapsData = {
      ...googleMapsData,
      routes: rankedRoutes.map(item => item.route).filter(Boolean),
    };
    const validations = rankedRoutes.map(item => item.validation);
    const validation = validations[0];

    let geminiAnalysis = null;
    try {
      geminiAnalysis = await analyzeRoute(rankedGoogleMapsData, validation, vehicleType, cargoType);
    } catch (err) {
      console.warn('[Gemini] Análisis no disponible:', err.message);
    }

    // Normalize routes for the frontend
    const routes = rankedGoogleMapsData.routes.map((route, routeIdx) => ({
      index: routeIdx,
      originalIndex: rankedRoutes[routeIdx]?.originalIndex ?? routeIdx,
      summary: route.summary,
      bounds: route.bounds,
      overviewPolyline: route.overview_polyline.points,
      legs: route.legs.map(leg => ({
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        distance: leg.distance,
        duration: leg.duration,
        durationInTraffic: leg.duration_in_traffic || null,
        steps: leg.steps.map((step, stepIdx) => ({
          index: stepIdx,
          instruction: step.html_instructions || '',
          distance: step.distance,
          duration: step.duration,
          startLocation: step.start_location,
          endLocation: step.end_location,
          polyline: step.polyline?.points || '',
          travelMode: step.travel_mode,
          maneuver: step.maneuver || null,
        })),
      })),
    }));

    res.json({
      routes,
      validation,
      validations,
      geminiAnalysis,
      requestInfo: {
        origin: origin.trim(),
        destination: destination.trim(),
        departureTime: departureTime || new Date().toISOString(),
        vehicleType,
        cargoType,
      },
    });
  } catch (err) {
    console.error('[/api/route]', err.message);
    res.status(500).json({
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }
});

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Google Cargo API',
    timestamp: new Date().toISOString(),
    keys: {
      gmaps: !!process.env.GMAPS_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
    },
  });
});

export default router;
