import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env reliably whether server is started from repo root or /backend
const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
];

for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    jwtSecret: process.env.SUPABASE_JWT_SECRET || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : '*',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Email (Brevo SMTP via Nodemailer)
  email: {
    smtpHost: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@towme.app',
    fromName: process.env.EMAIL_FROM_NAME || 'TowMe',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8081',
  },

  // Admin dashboard: set ADMIN_SECRET + ADMIN_EMAIL + ADMIN_PASSWORD to enable login
  admin: {
    secret: process.env.ADMIN_SECRET || '',
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
  },
};

const DEFAULT_JWT_SECRET = 'development-secret-key-change-in-production';

// Validate required environment variables
export function validateEnv(): void {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
    if (missing.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is required for user registration and other admin operations!');
    }
  }

  if (config.nodeEnv === 'production') {
    const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
    if (!process.env.JWT_SECRET || secret === DEFAULT_JWT_SECRET) {
      throw new Error(
        'JWT_SECRET must be set to a non-default value in production. ' +
        'Generate a strong secret and set the JWT_SECRET environment variable.'
      );
    }

    // Warn about weak admin password
    if (config.admin.password && config.admin.password.length < 12) {
      console.warn(
        'WARNING: ADMIN_PASSWORD is shorter than 12 characters. ' +
        'Use a strong password in production.'
      );
    }
  }
}
