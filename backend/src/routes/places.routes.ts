/**
 * Places Routes
 * Proxies Google Places Autocomplete to keep the API key server-side.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { config } from '../config/env';
import logger from '../utils/logger';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/places/autocomplete?input=Accra&lat=5.6&lng=-0.19
 * Returns place predictions from Google Places Autocomplete.
 */
router.get(
  '/autocomplete',
  asyncHandler(async (req: Request, res: Response) => {
    const input = (req.query.input as string || '').trim();
    const lat = req.query.lat as string | undefined;
    const lng = req.query.lng as string | undefined;

    if (!input || input.length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    const apiKey = config.googleDirectionsApiKey;
    if (!apiKey) {
      res.status(503).json({ success: false, error: 'Places API not configured' });
      return;
    }

    const params = new URLSearchParams({
      input,
      key: apiKey,
      components: 'country:gh',  // bias to Ghana
      language: 'en',
    });

    if (lat && lng) {
      params.set('location', `${lat},${lng}`);
      params.set('radius', '50000'); // 50km bias radius
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;

    const response = await fetch(url);
    const json = await response.json() as any;

    if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
      logger.warn('Google Places error:', json.status, json.error_message);
      res.json({ success: true, data: [] });
      return;
    }

    const predictions = (json.predictions || []).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || '',
    }));

    res.json({ success: true, data: predictions });
  })
);

/**
 * GET /api/places/details?placeId=xxx
 * Returns lat/lng for a specific place ID.
 */
router.get(
  '/details',
  asyncHandler(async (req: Request, res: Response) => {
    const placeId = (req.query.placeId as string || '').trim();

    if (!placeId) {
      res.status(400).json({ success: false, error: 'placeId is required' });
      return;
    }

    const apiKey = config.googleDirectionsApiKey;
    const params = new URLSearchParams({
      place_id: placeId,
      fields: 'geometry,formatted_address,name',
      key: apiKey,
    });

    const url = `https://maps.googleapis.com/maps/api/place/details/json?${params}`;
    const response = await fetch(url);
    const json = await response.json() as any;

    if (json.status !== 'OK') {
      res.status(404).json({ success: false, error: 'Place not found' });
      return;
    }

    const result = json.result;
    res.json({
      success: true,
      data: {
        placeId,
        address: result.formatted_address,
        name: result.name,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
    });
  })
);

export default router;
