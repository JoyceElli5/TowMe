/**
 * Directions Controller
 * Handles Google Directions API requests
 */

import { Response } from 'express';
import type { AuthenticatedRequest } from '../types/api.types';
import axios from 'axios';
import { logger } from '../utils/logger';

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

    if (!GOOGLE_DIRECTIONS_API_KEY) {
      logger.warn('Google Directions API key not configured');
      // Return straight line route as fallback
      const [originLat, originLng] = origin.split(',').map(Number);
      const [destLat, destLng] = destination.split(',').map(Number);
      
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
    }

    // Call Google Directions API
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

    // Parse the route
    const route = response.data.routes[0];
    const leg = route.legs[0];
    
    // Extract polyline points
    const points: Array<{ latitude: number; longitude: number }> = [];
    const overviewPolyline = route.overview_polyline.points;
    
    // Decode polyline (simplified - you might want to use a library like @mapbox/polyline)
    // For now, we'll extract the start and end points and key waypoints
    const steps = leg.steps;
    for (const step of steps) {
      const startLocation = step.start_location;
      points.push({
        latitude: startLocation.lat,
        longitude: startLocation.lng,
      });
    }
    
    // Add end location
    const endLocation = leg.end_location;
    points.push({
      latitude: endLocation.lat,
      longitude: endLocation.lng,
    });

    res.json({
      success: true,
      data: {
        points,
        distance: leg.distance.value, // in meters
        duration: leg.duration.value, // in seconds
      },
    });
  } catch (error: any) {
    logger.error('Error fetching directions:', error);
    
    // Fallback to straight line
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

