/**
 * Operators API Client
 * API functions for operator management: profile, vehicles, documents, availability
 */

import apiClient from './client';

// ============================================================================
// TYPES
// ============================================================================

export type TowTruckType = 'flatbed' | 'wheel_lift' | 'integrated' | 'hook_and_chain';
export type DocumentType = 'ghana_card' | 'drivers_license' | 'vehicle_registration' | 'insurance_certificate' | 'roadworthy_certificate' | 'business_permit';
export type DocumentStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type OperatorStatus = 'pending' | 'documents_submitted' | 'under_review' | 'approved' | 'suspended' | 'rejected';
export type VehicleType = 'car' | 'suv' | 'saloon' | 'van' | 'truck' | 'motorcycle' | 'others';

export interface OperatorProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  business_address: string | null;
  business_phone: string | null;
  years_of_experience: number;
  verification_status: OperatorStatus;
  verification_notes: string | null;
  verified_at: string | null;
  service_radius_km: number;
  primary_location_lat: number | null;
  primary_location_lng: number | null;
  completed_jobs: number;
  cancelled_jobs: number;
  acceptance_rate: number;
  average_rating: number | null;
  total_ratings: number;
  created_at: string;
  updated_at: string;
}

export interface OperatorVehicle {
  id: string;
  operator_id: string;
  tow_truck_type: TowTruckType;
  make: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
  max_towing_capacity_kg: number;
  can_tow_types: VehicleType[];
  photo_front_url: string | null;
  photo_side_url: string | null;
  photo_back_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface OperatorDocument {
  id: string;
  operator_id: string;
  vehicle_id: string | null;
  document_type: DocumentType;
  document_number: string | null;
  document_url: string;
  issue_date: string | null;
  expiry_date: string | null;
  status: DocumentStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OperatorAvailability {
  id: string;
  operator_id: string;
  vehicle_id: string | null;
  is_online: boolean;
  is_available: boolean;
  current_request_id: string | null;
  current_lat: number | null;
  current_lng: number | null;
  heading: number | null;
  speed: number | null;
  last_location_update: string;
  went_online_at: string | null;
  updated_at: string;
}

// ============================================================================
// OPERATOR PROFILE
// ============================================================================

/**
 * Create operator profile (after registration)
 */
export async function createOperatorProfile(data: {
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  yearsOfExperience?: number;
  serviceRadiusKm?: number;
  primaryLocationLat?: number;
  primaryLocationLng?: number;
}): Promise<OperatorProfile> {
  const response = await apiClient.post<OperatorProfile>('/operators/profile', data);
  return response.data!;
}

/**
 * Get current operator profile
 */
export async function getOperatorProfile(): Promise<OperatorProfile> {
  const response = await apiClient.get<OperatorProfile>('/operators/profile');
  return response.data!;
}

/**
 * Update operator profile
 */
export async function updateOperatorProfile(data: {
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  yearsOfExperience?: number;
  serviceRadiusKm?: number;
  primaryLocationLat?: number;
  primaryLocationLng?: number;
}): Promise<OperatorProfile> {
  const response = await apiClient.patch<OperatorProfile>('/operators/profile', data);
  return response.data!;
}

/**
 * Submit profile for verification
 */
export async function submitForVerification(): Promise<OperatorProfile> {
  const response = await apiClient.post<OperatorProfile>('/operators/profile/submit', {});
  return response.data!;
}

// ============================================================================
// OPERATOR VEHICLES
// ============================================================================

/**
 * Register a new vehicle
 */
export async function registerVehicle(data: {
  towTruckType: TowTruckType;
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  maxTowingCapacityKg: number;
  canTowTypes: VehicleType[];
  photoFrontUrl?: string;
  photoSideUrl?: string;
  photoBackUrl?: string;
}): Promise<OperatorVehicle> {
  const response = await apiClient.post<OperatorVehicle>('/operators/vehicles', data);
  return response.data!;
}

/**
 * Get all operator vehicles
 */
export async function getOperatorVehicles(): Promise<OperatorVehicle[]> {
  const response = await apiClient.get<OperatorVehicle[]>('/operators/vehicles');
  return response.data || [];
}

/**
 * Get single vehicle
 */
export async function getVehicleById(vehicleId: string): Promise<OperatorVehicle> {
  const response = await apiClient.get<OperatorVehicle>(`/operators/vehicles/${vehicleId}`);
  return response.data!;
}

/**
 * Update vehicle
 */
export async function updateVehicle(
  vehicleId: string,
  data: {
    towTruckType?: TowTruckType;
    make?: string;
    model?: string;
    year?: number;
    color?: string;
    maxTowingCapacityKg?: number;
    canTowTypes?: VehicleType[];
    photoFrontUrl?: string;
    photoSideUrl?: string;
    photoBackUrl?: string;
    isActive?: boolean;
  }
): Promise<OperatorVehicle> {
  const response = await apiClient.patch<OperatorVehicle>(`/operators/vehicles/${vehicleId}`, data);
  return response.data!;
}

/**
 * Delete vehicle
 */
export async function deleteVehicle(vehicleId: string): Promise<void> {
  await apiClient.delete(`/operators/vehicles/${vehicleId}`);
}

// ============================================================================
// OPERATOR DOCUMENTS
// ============================================================================

/**
 * Upload a document
 */
export async function uploadDocument(data: {
  documentType: DocumentType;
  documentNumber?: string;
  documentUrl: string;
  vehicleId?: string;
  issueDate?: string;
  expiryDate?: string;
}): Promise<OperatorDocument> {
  const response = await apiClient.post<OperatorDocument>('/operators/documents', data);
  return response.data!;
}

/**
 * Get all operator documents
 */
export async function getOperatorDocuments(vehicleId?: string): Promise<OperatorDocument[]> {
  const url = vehicleId ? `/operators/documents?vehicleId=${vehicleId}` : '/operators/documents';
  const response = await apiClient.get<OperatorDocument[]>(url);
  return response.data || [];
}

/**
 * Delete document
 */
export async function deleteDocument(documentId: string): Promise<void> {
  await apiClient.delete(`/operators/documents/${documentId}`);
}

// ============================================================================
// OPERATOR AVAILABILITY & LOCATION
// ============================================================================

/**
 * Go online (start accepting requests)
 */
export async function goOnline(data: {
  vehicleId: string;
  lat: number;
  lng: number;
}): Promise<OperatorAvailability> {
  const response = await apiClient.post<OperatorAvailability>('/operators/online', data);
  return response.data!;
}

/**
 * Go offline (stop accepting requests)
 */
export async function goOffline(): Promise<OperatorAvailability> {
  const response = await apiClient.post<OperatorAvailability>('/operators/offline', {});
  return response.data!;
}

/**
 * Update location
 */
export async function updateOperatorLocation(data: {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
}): Promise<OperatorAvailability> {
  const response = await apiClient.post<OperatorAvailability>('/operators/location', data);
  return response.data!;
}

/**
 * Get current availability status
 */
export async function getOperatorAvailability(): Promise<OperatorAvailability | null> {
  try {
    const response = await apiClient.get<OperatorAvailability>('/operators/availability');
    return response.data || null;
  } catch {
    return null;
  }
}

// ============================================================================
// FIND NEARBY OPERATORS (for users)
// ============================================================================

export interface NearbyOperator {
  operator: OperatorAvailability;
  vehicle: OperatorVehicle;
  distanceKm: number;
}

/**
 * Find nearby available operators
 */
export async function findNearbyOperators(
  lat: number,
  lng: number,
  options?: {
    radius?: number;
    vehicleType?: VehicleType;
  }
): Promise<NearbyOperator[]> {
  let url = `/operators/nearby?lat=${lat}&lng=${lng}`;
  if (options?.radius) url += `&radius=${options.radius}`;
  if (options?.vehicleType) url += `&vehicleType=${options.vehicleType}`;
  
  const response = await apiClient.get<NearbyOperator[]>(url);
  return response.data || [];
}

// ============================================================================
// ONBOARDING STATUS CHECK
// ============================================================================

export interface OnboardingStatus {
  hasProfile: boolean;
  hasVehicle: boolean;
  hasRequiredDocuments: boolean;
  isVerified: boolean;
  verificationStatus: OperatorStatus | null;
  missingDocuments: DocumentType[];
  canGoOnline: boolean;
}

/**
 * Check operator onboarding status
 * Returns what steps are complete and what's missing
 */
export async function checkOnboardingStatus(): Promise<OnboardingStatus> {
  const requiredDocuments: DocumentType[] = ['ghana_card', 'drivers_license'];
  
  let hasProfile = false;
  let hasVehicle = false;
  let verificationStatus: OperatorStatus | null = null;
  const uploadedDocTypes: DocumentType[] = [];

  try {
    // Check profile
    const profile = await getOperatorProfile();
    hasProfile = true;
    verificationStatus = profile.verification_status;
  } catch {
    hasProfile = false;
  }

  try {
    // Check vehicles
    const vehicles = await getOperatorVehicles();
    hasVehicle = vehicles.length > 0;
  } catch {
    hasVehicle = false;
  }

  try {
    // Check documents
    const documents = await getOperatorDocuments();
    documents.forEach(doc => {
      if (!uploadedDocTypes.includes(doc.document_type)) {
        uploadedDocTypes.push(doc.document_type);
      }
    });
  } catch {
    // No documents
  }

  const missingDocuments = requiredDocuments.filter(doc => !uploadedDocTypes.includes(doc));
  const hasRequiredDocuments = missingDocuments.length === 0;
  const isVerified = verificationStatus === 'approved';
  const canGoOnline = isVerified && hasVehicle;

  return {
    hasProfile,
    hasVehicle,
    hasRequiredDocuments,
    isVerified,
    verificationStatus,
    missingDocuments,
    canGoOnline,
  };
}
