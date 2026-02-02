/**
 * Seed Script
 * Generates realistic dummy data for TowMe
 * Run with: npm run seed
 */

import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin } from '../config/database';
import { calculateDistance } from '../utils/distance.calculator';
import { calculateEstimatedPrice, calculateFinalPrice } from '../utils/price.calculator';
import logger from '../utils/logger';
import type {
  VehicleType,
  RequestStatus,
  VehicleCondition,
} from '../types/database.types';

// Ghanaian names for realistic data
const GHANAIAN_FIRST_NAMES = [
  'Kwame', 'Kofi', 'Kwesi', 'Yaw', 'Kwabena', 'Akosua', 'Ama', 'Adwoa',
  'Afua', 'Abena', 'Emmanuel', 'Samuel', 'Daniel', 'Isaac', 'Joseph',
  'Grace', 'Mercy', 'Patience', 'Comfort', 'Blessing',
];

const GHANAIAN_LAST_NAMES = [
  'Mensah', 'Asante', 'Owusu', 'Boateng', 'Adjei', 'Agyeman', 'Osei',
  'Amoah', 'Ankrah', 'Appiah', 'Boadu', 'Danso', 'Darko', 'Duah',
  'Frimpong', 'Gyasi', 'Kumi', 'Mensah', 'Nkrumah', 'Obeng',
];

// Accra locations with coordinates
const ACCRA_LOCATIONS = [
  { address: 'Ring Road Central, Accra', lat: 5.5500, lng: -0.2050 },
  { address: 'Osu Oxford Street, Accra', lat: 5.5550, lng: -0.1750 },
  { address: 'East Legon, Accra', lat: 5.6350, lng: -0.1550 },
  { address: 'Airport Residential Area, Accra', lat: 5.6050, lng: -0.1750 },
  { address: 'Cantonments, Accra', lat: 5.5800, lng: -0.1650 },
  { address: 'Accra Mall, Accra', lat: 5.6350, lng: -0.1650 },
  { address: 'Labone, Accra', lat: 5.5650, lng: -0.1650 },
  { address: 'Achimota, Accra', lat: 5.6150, lng: -0.2350 },
  { address: 'Adabraka, Accra', lat: 5.5650, lng: -0.2150 },
  { address: 'Circle, Accra', lat: 5.5700, lng: -0.2200 },
  { address: 'Dansoman, Accra', lat: 5.5350, lng: -0.2550 },
  { address: 'Madina, Accra', lat: 5.6800, lng: -0.1650 },
  { address: 'Tema Community 1', lat: 5.6600, lng: -0.0150 },
  { address: 'Sakumono, Tema', lat: 5.6300, lng: -0.0350 },
  { address: 'University of Ghana, Legon', lat: 5.6500, lng: -0.1850 },
  { address: 'Kotoka International Airport', lat: 5.6052, lng: -0.1668 },
  { address: 'Independence Square, Accra', lat: 5.5450, lng: -0.2050 },
  { address: 'Spintex Road, Accra', lat: 5.6250, lng: -0.1050 },
  { address: 'Tesano, Accra', lat: 5.5950, lng: -0.2350 },
  { address: 'Dzorwulu, Accra', lat: 5.6000, lng: -0.1950 },
];

// Ghana phone prefixes
const PHONE_PREFIXES = ['024', '054', '055', '059', '020', '050'];

// Vehicle types
const VEHICLE_TYPES: VehicleType[] = ['car', 'suv', 'saloon', 'van', 'truck', 'motorcycle', 'others'];

// Request statuses with distribution
const STATUS_DISTRIBUTION: { status: RequestStatus; count: number }[] = [
  { status: 'pending', count: 10 },
  { status: 'accepted', count: 8 },
  { status: 'in_progress', count: 7 },
  { status: 'completed', count: 20 },
  { status: 'cancelled', count: 5 },
];

// Vehicle conditions
const VEHICLE_CONDITIONS: VehicleCondition[] = ['good', 'damaged', 'needs_attention'];

// Rating comments
const POSITIVE_COMMENTS = [
  'Great service, very professional!',
  'Quick response time. Highly recommend.',
  'Friendly and efficient operator.',
  'Handled my vehicle with care.',
  'Excellent experience overall.',
  'Would definitely use again.',
  'Very helpful and courteous.',
  'Arrived faster than expected.',
  'Professional and reliable service.',
  'Top-notch towing service!',
];

const NEUTRAL_COMMENTS = [
  'Service was okay.',
  'Got the job done.',
  'Average experience.',
  'Nothing special but efficient.',
];

const NEGATIVE_COMMENTS = [
  'Took longer than expected.',
  'Could improve communication.',
  'Service was below expectations.',
];

// Helper functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone(): string {
  const prefix = randomElement(PHONE_PREFIXES);
  const suffix = String(randomBetween(1000000, 9999999));
  return `${prefix}${suffix}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  const num = randomBetween(1, 999);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${num}@${randomElement(domains)}`;
}

function generateRating(): number {
  // Weighted towards higher ratings
  const weights = [0.05, 0.10, 0.15, 0.30, 0.40]; // 1-5 stars
  const random = Math.random();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) return i + 1;
  }
  return 5;
}

function getRandomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - randomBetween(0, daysAgo));
  date.setHours(randomBetween(6, 22), randomBetween(0, 59), 0, 0);
  return date;
}

function getRatingComment(rating: number): string | null {
  if (Math.random() < 0.3) return null; // 30% chance of no comment
  if (rating >= 4) return randomElement(POSITIVE_COMMENTS);
  if (rating === 3) return randomElement(NEUTRAL_COMMENTS);
  return randomElement(NEGATIVE_COMMENTS);
}

// Main seed function
async function seed() {
  const supabase = getSupabaseAdmin();

  logger.info('🌱 Starting database seed...');

  try {
    // Clear existing data (in reverse order of dependencies)
    logger.info('Clearing existing data...');
    await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('operator_locations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('inspections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('ratings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('towing_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Generate users (15 vehicle owners + 5 operators)
    logger.info('Creating users...');
    const users: Array<{
      id: string;
      email: string;
      full_name: string;
      phone: string;
      role: 'vehicle_owner' | 'tow_operator';
      average_rating: number;
      total_trips: number;
      is_online: boolean;
      is_verified: boolean;
    }> = [];

    // Vehicle owners
    for (let i = 0; i < 15; i++) {
      const firstName = randomElement(GHANAIAN_FIRST_NAMES);
      const lastName = randomElement(GHANAIAN_LAST_NAMES);
      users.push({
        id: uuidv4(),
        email: generateEmail(firstName, lastName),
        full_name: `${firstName} ${lastName}`,
        phone: generatePhone(),
        role: 'vehicle_owner',
        average_rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        total_trips: randomBetween(1, 20),
        is_online: false,
        is_verified: Math.random() > 0.2,
      });
    }

    // Tow operators
    for (let i = 0; i < 5; i++) {
      const firstName = randomElement(GHANAIAN_FIRST_NAMES);
      const lastName = randomElement(GHANAIAN_LAST_NAMES);
      users.push({
        id: uuidv4(),
        email: generateEmail(firstName, lastName),
        full_name: `${firstName} ${lastName}`,
        phone: generatePhone(),
        role: 'tow_operator',
        average_rating: Math.round((4.0 + Math.random() * 1.0) * 10) / 10,
        total_trips: randomBetween(10, 100),
        is_online: Math.random() > 0.4, // 60% chance of being online
        is_verified: true,
      });
    }

    const { error: usersError } = await supabase.from('users').insert(users);
    if (usersError) throw usersError;
    logger.info(`✓ Created ${users.length} users`);

    const vehicleOwners = users.filter(u => u.role === 'vehicle_owner');
    const operators = users.filter(u => u.role === 'tow_operator');

    // Generate towing requests (50 total)
    logger.info('Creating towing requests...');
    const requests: Array<{
      id: string;
      user_id: string;
      operator_id: string | null;
      pickup_address: string;
      destination_address: string;
      pickup_lat: number;
      pickup_lng: number;
      destination_lat: number;
      destination_lng: number;
      vehicle_type: VehicleType;
      estimated_price: number;
      final_price: number | null;
      distance_km: number;
      status: RequestStatus;
      cancellation_reason: string | null;
      created_at: string;
      accepted_at: string | null;
      started_at: string | null;
      completed_at: string | null;
    }> = [];

    for (const statusInfo of STATUS_DISTRIBUTION) {
      for (let i = 0; i < statusInfo.count; i++) {
        const pickup = randomElement(ACCRA_LOCATIONS);
        let destination = randomElement(ACCRA_LOCATIONS);
        while (destination.address === pickup.address) {
          destination = randomElement(ACCRA_LOCATIONS);
        }

        const vehicleType = randomElement(VEHICLE_TYPES);
        const distanceKm = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
        const estimatedPrice = await calculateEstimatedPrice(distanceKm, vehicleType);
        const user = randomElement(vehicleOwners);
        const operator = statusInfo.status !== 'pending' ? randomElement(operators) : null;

        const createdAt = getRandomDate(30);
        let acceptedAt: Date | null = null;
        let startedAt: Date | null = null;
        let completedAt: Date | null = null;

        if (statusInfo.status !== 'pending') {
          acceptedAt = new Date(createdAt.getTime() + randomBetween(1, 10) * 60000);
        }
        if (['in_progress', 'completed'].includes(statusInfo.status)) {
          startedAt = new Date(acceptedAt!.getTime() + randomBetween(5, 20) * 60000);
        }
        if (statusInfo.status === 'completed') {
          completedAt = new Date(startedAt!.getTime() + randomBetween(15, 60) * 60000);
        }

        const finalPrice = statusInfo.status === 'completed' 
          ? await calculateFinalPrice(distanceKm, vehicleType) 
          : null;

        requests.push({
          id: uuidv4(),
          user_id: user.id,
          operator_id: operator?.id || null,
          pickup_address: pickup.address,
          destination_address: destination.address,
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          destination_lat: destination.lat,
          destination_lng: destination.lng,
          vehicle_type: vehicleType,
          estimated_price: estimatedPrice,
          final_price: finalPrice,
          distance_km: distanceKm,
          status: statusInfo.status,
          cancellation_reason: statusInfo.status === 'cancelled' ? randomElement(['Changed mind', 'Found alternative', 'Emergency resolved', 'No available operator']) : null,
          created_at: createdAt.toISOString(),
          accepted_at: acceptedAt?.toISOString() || null,
          started_at: startedAt?.toISOString() || null,
          completed_at: completedAt?.toISOString() || null,
        });
      }
    }

    const { error: requestsError } = await supabase.from('towing_requests').insert(requests);
    if (requestsError) throw requestsError;
    logger.info(`✓ Created ${requests.length} towing requests`);

    // Generate ratings (2 per completed request)
    logger.info('Creating ratings...');
    const completedRequests = requests.filter(r => r.status === 'completed');
    const ratings: Array<{
      id: string;
      request_id: string;
      from_user_id: string;
      to_user_id: string;
      rating: number;
      comment: string | null;
      created_at: string;
    }> = [];

    for (const request of completedRequests) {
      if (!request.operator_id) continue;

      // User rates operator
      const userRating = generateRating();
      ratings.push({
        id: uuidv4(),
        request_id: request.id,
        from_user_id: request.user_id,
        to_user_id: request.operator_id,
        rating: userRating,
        comment: getRatingComment(userRating),
        created_at: new Date(new Date(request.completed_at!).getTime() + 5 * 60000).toISOString(),
      });

      // Operator rates user
      const operatorRating = generateRating();
      ratings.push({
        id: uuidv4(),
        request_id: request.id,
        from_user_id: request.operator_id,
        to_user_id: request.user_id,
        rating: operatorRating,
        comment: getRatingComment(operatorRating),
        created_at: new Date(new Date(request.completed_at!).getTime() + 10 * 60000).toISOString(),
      });
    }

    const { error: ratingsError } = await supabase.from('ratings').insert(ratings);
    if (ratingsError) throw ratingsError;
    logger.info(`✓ Created ${ratings.length} ratings`);

    // Generate inspections (for completed trips)
    logger.info('Creating inspections...');
    const inspections: Array<{
      id: string;
      request_id: string;
      operator_id: string;
      photos: string[];
      vehicle_condition: VehicleCondition;
      notes: string | null;
      created_at: string;
    }> = [];

    for (const request of completedRequests.slice(0, 20)) { // Only create inspections for 20 requests
      if (!request.operator_id || !request.started_at) continue;

      const photoCount = randomBetween(3, 5);
      const photos = Array.from({ length: photoCount }, (_, i) =>
        `https://storage.supabase.co/v1/object/public/inspections/${request.id}/photo-${i + 1}.jpg`
      );

      inspections.push({
        id: uuidv4(),
        request_id: request.id,
        operator_id: request.operator_id,
        photos,
        vehicle_condition: randomElement(VEHICLE_CONDITIONS),
        notes: Math.random() > 0.5 ? 'Vehicle in acceptable condition. Minor scratches noted.' : null,
        created_at: new Date(new Date(request.started_at).getTime() - 2 * 60000).toISOString(),
      });
    }

    const { error: inspectionsError } = await supabase.from('inspections').insert(inspections);
    if (inspectionsError) throw inspectionsError;
    logger.info(`✓ Created ${inspections.length} inspections`);

    // Generate payments (for completed trips)
    logger.info('Creating payments...');
    const payments: Array<{
      id: string;
      request_id: string;
      user_id: string;
      operator_id: string;
      amount: number;
      status: 'completed';
      payment_method: string;
      transaction_reference: string;
      created_at: string;
      completed_at: string;
    }> = [];

    for (const request of completedRequests) {
      if (!request.operator_id || !request.final_price || !request.completed_at) continue;

      payments.push({
        id: uuidv4(),
        request_id: request.id,
        user_id: request.user_id,
        operator_id: request.operator_id,
        amount: request.final_price,
        status: 'completed',
        payment_method: randomElement(['mobile_money', 'cash', 'card']),
        transaction_reference: `TXN-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`,
        created_at: request.completed_at,
        completed_at: new Date(new Date(request.completed_at).getTime() + 1 * 60000).toISOString(),
      });
    }

    const { error: paymentsError } = await supabase.from('payments').insert(payments);
    if (paymentsError) throw paymentsError;
    logger.info(`✓ Created ${payments.length} payments`);

    logger.info('');
    logger.info('🎉 Database seeding completed successfully!');
    logger.info('');
    logger.info('Summary:');
    logger.info(`  - Users: ${users.length} (${vehicleOwners.length} owners, ${operators.length} operators)`);
    logger.info(`  - Towing Requests: ${requests.length}`);
    logger.info(`  - Ratings: ${ratings.length}`);
    logger.info(`  - Inspections: ${inspections.length}`);
    logger.info(`  - Payments: ${payments.length}`);

  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed
seed();
