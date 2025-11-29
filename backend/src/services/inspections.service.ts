/**
 * Inspections Service
 * Handles vehicle inspection records
 */

import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin } from '../config/database';
import { INSPECTION_PHOTOS } from '../config/constants';
import { createError } from '../middleware/error.middleware';
import type { CreateInspectionRequest, InspectionResponse } from '../types/api.types';
import type { Inspection } from '../types/database.types';
import logger from '../utils/logger';

/**
 * Create an inspection record
 */
export async function createInspection(
  operatorId: string,
  data: CreateInspectionRequest
): Promise<Inspection> {
  const supabase = getSupabaseAdmin();

  // Verify request exists and operator is assigned
  const { data: request } = await supabase
    .from('towing_requests')
    .select('operator_id, status')
    .eq('id', data.requestId)
    .single();

  if (!request) {
    throw createError.notFound('Request not found');
  }

  if (request.operator_id !== operatorId) {
    throw createError.forbidden('You are not assigned to this request');
  }

  // Check if inspection already exists
  const { data: existingInspection } = await supabase
    .from('inspections')
    .select('id')
    .eq('request_id', data.requestId)
    .single();

  if (existingInspection) {
    throw createError.conflict('Inspection already exists for this request');
  }

  // Validate photo count
  if (data.photos.length < INSPECTION_PHOTOS.MIN) {
    throw createError.badRequest(`At least ${INSPECTION_PHOTOS.MIN} photos are required`);
  }

  if (data.photos.length > INSPECTION_PHOTOS.MAX) {
    throw createError.badRequest(`Maximum ${INSPECTION_PHOTOS.MAX} photos allowed`);
  }

  // Create inspection
  const { data: inspection, error } = await supabase
    .from('inspections')
    .insert({
      id: uuidv4(),
      request_id: data.requestId,
      operator_id: operatorId,
      photos: data.photos,
      vehicle_condition: data.vehicleCondition,
      notes: data.notes || null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating inspection:', error);
    throw createError.internal('Failed to create inspection');
  }

  return inspection;
}

/**
 * Get inspection for a request
 */
export async function getInspectionByRequest(requestId: string): Promise<Inspection | null> {
  const supabase = getSupabaseAdmin();

  const { data: inspection, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('request_id', requestId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    logger.error('Error fetching inspection:', error);
    throw createError.internal('Failed to fetch inspection');
  }

  return inspection || null;
}

/**
 * Get inspections by operator
 */
export async function getOperatorInspections(
  operatorId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ inspections: InspectionResponse[]; total: number }> {
  const supabase = getSupabaseAdmin();
  const offset = (page - 1) * limit;

  const { data: inspections, error, count } = await supabase
    .from('inspections')
    .select('*', { count: 'exact' })
    .eq('operator_id', operatorId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Error fetching operator inspections:', error);
    throw createError.internal('Failed to fetch inspections');
  }

  return {
    inspections: (inspections || []).map(mapInspectionToResponse),
    total: count || 0,
  };
}

/**
 * Add photos to an existing inspection
 */
export async function addInspectionPhotos(
  inspectionId: string,
  operatorId: string,
  newPhotos: string[]
): Promise<Inspection> {
  const supabase = getSupabaseAdmin();

  // Get existing inspection
  const { data: inspection } = await supabase
    .from('inspections')
    .select('*')
    .eq('id', inspectionId)
    .single();

  if (!inspection) {
    throw createError.notFound('Inspection not found');
  }

  if (inspection.operator_id !== operatorId) {
    throw createError.forbidden('You cannot modify this inspection');
  }

  // Check photo limit
  const totalPhotos = inspection.photos.length + newPhotos.length;
  if (totalPhotos > INSPECTION_PHOTOS.MAX) {
    throw createError.badRequest(`Maximum ${INSPECTION_PHOTOS.MAX} photos allowed`);
  }

  // Update photos
  const updatedPhotos = [...inspection.photos, ...newPhotos];

  const { data: updatedInspection, error } = await supabase
    .from('inspections')
    .update({ photos: updatedPhotos })
    .eq('id', inspectionId)
    .select()
    .single();

  if (error) {
    logger.error('Error adding inspection photos:', error);
    throw createError.internal('Failed to add photos');
  }

  return updatedInspection;
}

/**
 * Map database inspection to API response format
 */
function mapInspectionToResponse(inspection: Inspection): InspectionResponse {
  return {
    id: inspection.id,
    requestId: inspection.request_id,
    operatorId: inspection.operator_id,
    photos: inspection.photos,
    vehicleCondition: inspection.vehicle_condition,
    notes: inspection.notes,
    createdAt: inspection.created_at,
  };
}
