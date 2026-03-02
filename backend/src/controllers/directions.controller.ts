/**
 * Directions Controller
 * Handles routing using OSRM (preferred) or Google Directions API as fallback
 */

import axios from 'axios';
import { Response } from 'express';
import type { AuthenticatedRequest } from '../types/api.types';
import logger from '../utils/logger';

// Primary routing engine: OSRM (self-hosted, using OpenStreetMap data)
const OSRM_BASE_URL = process.env.OSRM_BASE_URL || '';

// Fallback routing engine: Google Directions API (hosted)
const GOOGLE_DIRECTIONS_API_KEY = process.env.GOOGLE_DIRECTIONS_API_KEY || '';
const GOOGLE_DIRECTIONS_API_URL = 'https://maps.googleapis.com/maps/api/directions/json';

interface RouteQuery {
  origin: string; // "lat,lng"
  destination: string; // "lat,lng"
}

/**
 * GET /api/directions
 * Get route between two points using Google Directions API
 */
export async function getRoute(req: AuthenticatedRequest<{}, {}, RouteQuery>, res: Response): Promise<void> {
  try {
    const { origin, destination } = req.query;
    const [originLat, originLng] = origin.split(',').map(Number);
    const [destLat, destLng] = destination.split(',').map(Number);

    // 1) Try OSRM first if configured
    if (OSRM_BASE_URL) {
      const osrmUrl = `${OSRM_BASE_URL}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}`;

      const response = await axios.get(osrmUrl, {
        params: {
          overview: 'full',
          geometries: 'geojson',
        },
      });

      if (response.data?.routes?.length) {
        const route = response.data.routes[0];
        const coords: [number, number][] = route.geometry.coordinates;

        const points = coords.map(([lng, lat]) => ({
          latitude: lat,
          longitude: lng,
        }));

        res.json({
          success: true,
          data: {
            points,
            distance: route.distance, // meters
            duration: route.duration, // seconds
          },
        });
        return;
      }

      logger.error('OSRM returned no routes');
      // fall through to Google / straight-line fallback
    }

    // 2) Fallback: Google Directions API if key is configured
    if (GOOGLE_DIRECTIONS_API_KEY) {
      const response = await axios.get(GOOGLE_DIRECTIONS_API_URL, {
        params: {
          origin,
          destination,
          key: GOOGLE_DIRECTIONS_API_KEY,
          mode: 'driving',
          alternatives: false,
        },
      });

      if (response.data.status !== 'OK') {
        logger.error('Google Directions API error:', response.data.status);
        throw new Error(`Directions API error: ${response.data.status}`);
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];

      const points: Array<{ latitude: number; longitude: number }> = [];
      const steps = leg.steps;
      for (const step of steps) {
        const startLocation = step.start_location;
        points.push({
          latitude: startLocation.lat,
          longitude: startLocation.lng,
        });
      }
      const endLocation = leg.end_location;
      points.push({
        latitude: endLocation.lat,
        longitude: endLocation.lng,
      });

      res.json({
        success: true,
        data: {
          points,
          distance: leg.distance.value,
          duration: leg.duration.value,
        },
      });
      return;
    }

    // 3) If neither OSRM nor Google are configured, fall back to straight line
    logger.warn('No routing engine configured (OSRM_BASE_URL or GOOGLE_DIRECTIONS_API_KEY). Using straight line.');
    res.json({
      success: true,
      data: {
        points: [
          { latitude: originLat, longitude: originLng },
          { latitude: destLat, longitude: destLng },
        ],
        distance: 0,
        duration: 0,
      },
    });
    return;
  } catch (error: any) {
    logger.error('Error fetching directions:', error);

    const [originLat, originLng] = req.query.origin.split(',').map(Number);
    const [destLat, destLng] = req.query.destination.split(',').map(Number);

    res.json({
      success: true,
      data: {
        points: [
          { latitude: originLat, longitude: originLng },
          { latitude: destLat, longitude: destLng },
        ],
        distance: 0,
        duration: 0,
      },
    });
  }
}

