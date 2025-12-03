/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 */

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin } from '../config/database';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../middleware/auth.middleware';
import { createError } from '../middleware/error.middleware';
import type { RegisterRequest, LoginRequest, AuthResponse, CreateProfileRequest } from '../types/api.types';
import type { User } from '../types/database.types';
import logger from '../utils/logger';

const SALT_ROUNDS = 10;

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const supabase = getSupabaseAdmin();

  // Check if email already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', data.email.toLowerCase())
    .single();

  if (existingUser) {
    throw createError.conflict('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Create user ID
  const userId = uuidv4();

  // Create user in database with password hash
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: data.email.toLowerCase(),
      full_name: data.fullName,
      phone: data.phone,
      role: data.role,
      password_hash: passwordHash,
      average_rating: 0,
      total_trips: 0,
      is_online: false,
      is_verified: false,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating user:', error);
    throw createError.internal('Failed to create user');
  }

  // Generate tokens
  const accessToken = generateToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: mapUserToResponse(user),
    accessToken,
    refreshToken,
  };
}

/**
 * Login a user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const supabase = getSupabaseAdmin();

  // Get user by email including password hash
  const { data: user, error } = await supabase
    .from('users')
    .select('*, password_hash')
    .eq('email', data.email.toLowerCase())
    .single();

  if (error || !user) {
    throw createError.unauthorized('Invalid email or password');
  }

  // Verify password
  const passwordHash = user.password_hash as string | undefined;
  if (!passwordHash) {
    // For backwards compatibility with demo data that may not have password_hash
    logger.warn(`User ${user.id} has no password hash set`);
  } else {
    const isValidPassword = await bcrypt.compare(data.password, passwordHash);
    if (!isValidPassword) {
      throw createError.unauthorized('Invalid email or password');
    }
  }

  // Generate tokens
  const accessToken = generateToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: mapUserToResponse(user),
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  const decoded = verifyRefreshToken(refreshToken);
  
  if (!decoded) {
    throw createError.unauthorized('Invalid refresh token');
  }

  const supabase = getSupabaseAdmin();
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', decoded.userId)
    .single();

  if (error || !user) {
    throw createError.unauthorized('User not found');
  }

  const accessToken = generateToken(user.id, user.email, user.role);

  return { accessToken };
}

/**
 * Get current user by ID
 */
export async function getCurrentUser(userId: string): Promise<AuthResponse['user']> {
  const supabase = getSupabaseAdmin();

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw createError.notFound('User not found');
  }

  return mapUserToResponse(user);
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (!user) {
    // Don't reveal if email exists
    return;
  }

  // In a real implementation:
  // 1. Generate a reset token
  // 2. Store token with expiration in database
  // 3. Send email with reset link
  logger.info(`Password reset requested for: ${email}`);
}

/**
 * Reset password with token
 */
export async function resetPassword(_token: string, _newPassword: string): Promise<void> {
  // In a real implementation:
  // 1. Verify token is valid and not expired
  // 2. Hash new password
  // 3. Update user password
  // 4. Invalidate reset token
  throw createError.internal('Password reset not implemented');
}

/**
 * Map database user to API response format
 */
function mapUserToResponse(user: User): AuthResponse['user'] {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatar_url,
    averageRating: user.average_rating,
    totalTrips: user.total_trips,
    isOnline: user.is_online,
    isVerified: user.is_verified,
  };
}

/**
 * Create a user profile after Supabase authentication
 * This is called after the user signs up with Supabase Auth
 * The userId must match the authenticated user's ID from the Supabase JWT
 */
export async function createProfile(
  data: CreateProfileRequest,
  authenticatedUserId: string
): Promise<AuthResponse> {
  // Security check: ensure the authenticated user is creating their own profile
  if (data.userId !== authenticatedUserId) {
    throw createError.forbidden('You can only create a profile for yourself');
  }

  const supabase = getSupabaseAdmin();

  // Check if user profile already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', data.userId)
    .single();

  if (existingUser) {
    throw createError.conflict('User profile already exists');
  }

  // Check if email already exists (different user)
  const { data: existingEmail } = await supabase
    .from('users')
    .select('id')
    .eq('email', data.email.toLowerCase())
    .single();

  if (existingEmail) {
    throw createError.conflict('Email already registered');
  }

  // Create user profile in database
  // Note: We don't store password_hash here since Supabase Auth handles authentication
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      id: data.userId, // Use the Supabase Auth user ID
      email: data.email.toLowerCase(),
      full_name: data.fullName,
      phone: data.phone,
      role: data.role,
      average_rating: 0,
      total_trips: 0,
      is_online: false,
      is_verified: false,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating user profile:', error);
    throw createError.internal('Failed to create user profile');
  }

  // Generate our own tokens for subsequent API calls
  // This allows the backend to have its own session management if needed
  const accessToken = generateToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);

  logger.info(`User profile created for Supabase user: ${user.id}`);

  return {
    user: mapUserToResponse(user),
    accessToken,
    refreshToken,
  };
}

/**
 * Get session data for a Supabase authenticated user
 * This is called after Supabase login to get the user's profile and generate backend tokens
 */
export async function getSessionForSupabaseUser(supabaseUserId: string): Promise<AuthResponse> {
  const supabase = getSupabaseAdmin();

  // Get user profile by Supabase user ID
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', supabaseUserId)
    .single();

  if (error || !user) {
    throw createError.notFound('User profile not found. Please complete registration first.');
  }

  // Generate backend tokens for subsequent API calls
  const accessToken = generateToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: mapUserToResponse(user),
    accessToken,
    refreshToken,
  };
}
