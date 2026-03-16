/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin } from '../config/database';
import {
  generateRefreshToken,
  generateToken,
  verifyRefreshToken,
} from '../middleware/auth.middleware';
import { createError } from '../middleware/error.middleware';
import type { AuthResponse, CreateProfileRequest, LoginRequest, RegisterRequest } from '../types/api.types';
import type { User } from '../types/database.types';
import logger from '../utils/logger';
import * as emailService from './email.service';

const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_HOURS = 1; // 1 hour
const VERIFICATION_OTP_EXPIRY_MINUTES = 10; // 10 minutes

/** Generate a 6-digit numeric OTP */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

  // Generate 6-digit OTP for email verification
  const verificationToken = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + VERIFICATION_OTP_EXPIRY_MINUTES);

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
    logger.error('Error creating user:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      fullError: error,
    });
    
    // Check for common database errors
    if (error.code === '23505') { // Unique violation
      throw createError.conflict('Email already registered');
    }
    if (error.code === '23503') { // Foreign key violation
      throw createError.badRequest('Invalid data provided');
    }
    if (error.code === '23502') { // Not null violation
      const field = error.details?.match(/column "(\w+)"/)?.[1] || 'unknown';
      throw createError.badRequest(`Missing required field: ${field}`);
    }
    if (error.code === '42501') { // Insufficient privilege (RLS)
      throw createError.forbidden('Permission denied. Please check database permissions.');
    }
    
    // Include error details in non-production
    const errorMessage = error.message || 'Failed to create user';
    const errorDetails = error.details || error.hint || '';
    const fullMessage = process.env.NODE_ENV === 'production'
      ? 'Failed to create user. Please try again.'
      : errorDetails 
        ? `${errorMessage}: ${errorDetails}` 
        : errorMessage;
    
    throw createError.internal(fullMessage);
  }

  // Store verification token (non-blocking - don't fail registration if this fails)
  try {
    await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        token: verificationToken,
        expires_at: expiresAt.toISOString(),
        used: false,
      });
  } catch (tokenError) {
    logger.warn('Failed to store verification token (non-critical):', tokenError);
    // Continue with registration even if token storage fails
  }

  // Send verification email
  try {
    await emailService.sendVerificationEmail(data.email, data.fullName, verificationToken);
  } catch (emailError) {
    logger.error('Failed to send verification email:', emailError);
    // Don't fail registration if email fails
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
    .select('id, full_name')
    .eq('email', email.toLowerCase())
    .single();

  if (!user) {
    // Don't reveal if email exists for security
    return;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

  // Store reset token
  await supabase
    .from('password_reset_tokens')
    .insert({
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

  // Send reset email
  try {
    await emailService.sendPasswordResetEmail(email, user.full_name, resetToken);
    logger.info(`Password reset email sent to: ${email}`);
  } catch (emailError) {
    logger.error('Failed to send password reset email:', emailError);
    throw createError.internal('Failed to send password reset email');
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Find valid reset token
  const { data: resetTokenData } = await supabase
    .from('password_reset_tokens')
    .select('user_id, expires_at, used')
    .eq('token', token)
    .eq('used', false)
    .single();

  if (!resetTokenData) {
    throw createError.badRequest('Invalid or expired reset token');
  }

  // Check if token is expired
  const expiresAt = new Date(resetTokenData.expires_at);
  if (expiresAt < new Date()) {
    throw createError.badRequest('Reset token has expired');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update user password
  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', resetTokenData.user_id);

  if (updateError) {
    logger.error('Error updating password:', updateError);
    throw createError.internal('Failed to update password');
  }

  // Mark token as used
  await supabase
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('token', token);

  logger.info(`Password reset successful for user: ${resetTokenData.user_id}`);
}

/**
 * Resend email verification OTP
 */
export async function resendVerificationEmail(email: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, is_verified')
    .eq('email', email.toLowerCase())
    .single();

  if (!user) {
    // Don't reveal if email exists
    return;
  }

  if (user.is_verified) {
    // Already verified – silently succeed so we don't leak info
    return;
  }

  // Invalidate old tokens for this user
  await supabase
    .from('email_verification_tokens')
    .update({ used: true })
    .eq('user_id', user.id)
    .eq('used', false);

  // Generate new OTP
  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + VERIFICATION_OTP_EXPIRY_MINUTES);

  await supabase.from('email_verification_tokens').insert({
    user_id: user.id,
    token: otp,
    expires_at: expiresAt.toISOString(),
    used: false,
  });

  await emailService.sendVerificationEmail(email, user.full_name, otp);
  logger.info(`Verification OTP resent to: ${email}`);
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Find valid verification token
  const { data: verificationTokenData } = await supabase
    .from('email_verification_tokens')
    .select('user_id, expires_at, used')
    .eq('token', token)
    .eq('used', false)
    .single();

  if (!verificationTokenData) {
    throw createError.badRequest('Invalid or expired verification token');
  }

  // Check if token is expired
  const expiresAt = new Date(verificationTokenData.expires_at);
  if (expiresAt < new Date()) {
    throw createError.badRequest('Verification token has expired');
  }

  // Update user as verified
  const { error: updateError } = await supabase
    .from('users')
    .update({ is_verified: true })
    .eq('id', verificationTokenData.user_id);

  if (updateError) {
    logger.error('Error verifying email:', updateError);
    throw createError.internal('Failed to verify email');
  }

  // Mark token as used
  await supabase
    .from('email_verification_tokens')
    .update({ used: true })
    .eq('token', token);

  logger.info(`Email verified for user: ${verificationTokenData.user_id}`);
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

  // Generate backend JWT tokens for subsequent API calls
  // We use a dual-token system where:
  // 1. Supabase handles initial authentication (login/signup)
  // 2. Backend generates its own tokens for API authorization
  // This approach provides:
  // - Independence from Supabase token expiration policies
  // - Ability to include custom claims (like role) in tokens
  // - Flexibility to add backend-specific session management features
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
