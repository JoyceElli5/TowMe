import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin } from './src/config/database';
import { createRequest } from './src/services/requests.service';

async function testBookingLogic() {
  const supabase = getSupabaseAdmin();
  const testUserId = 'test-user-' + uuidv4().substring(0, 8);
  const pickupLat = 5.6037;
  const pickupLng = -0.1870;

  try {
    console.log('Testing Booking Fixes...');

    // 1. Setup mock user
    await supabase.from('users').insert({
      id: testUserId,
      email: `${testUserId}@example.com`,
      full_name: 'Test User',
      phone: '1234567890',
      role: 'vehicle_owner'
    });

    console.log(`Created test user: ${testUserId}`);

    // 2. Create an initial pending request that is "stuck" (created 20 mins ago)
    const stuckRequestId = uuidv4();
    await supabase.from('towing_requests').insert({
      id: stuckRequestId,
      user_id: testUserId,
      pickup_address: 'Test Pickup',
      destination_address: 'Test Dest',
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      destination_lat: 5.61,
      destination_lng: -0.19,
      vehicle_type: 'car',
      estimated_price: 100,
      distance_km: 5,
      status: 'pending',
      created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    });

    console.log(`Created stuck pending request: ${stuckRequestId} (20 mins old)`);

    // 3. Attempt to create a NEW request via service. 
    // This should NOT throw an error, it should auto-cancel the stuck one.
    console.log('Attempting to create a new request... this should auto-cancel the stuck one.');

    // wait a moment so we can read the log

    const newRequest = await createRequest(testUserId, {
      pickupAddress: 'New Pickup',
      destinationAddress: 'New Dest',
      pickupLat,
      pickupLng,
      destinationLat: 5.62,
      destinationLng: -0.20,
      vehicleType: 'suv'
    });

    console.log(`Success! New request created: ${newRequest.id}`);

    // 4. Verify the old request was cancelled
    const { data: oldReq } = await supabase
      .from('towing_requests')
      .select('status, cancellation_reason')
      .eq('id', stuckRequestId)
      .single();

    if (oldReq && oldReq.status === 'cancelled') {
      console.log(`Verified! Old request status is now: ${oldReq.status}, Reason: ${oldReq.cancellation_reason}`);
    } else {
      console.error('Failed: Old request was not cancelled!');
    }

  } catch (error) {
    console.error('Test Failed:', error);
  } finally {
    console.log('Test complete.');
    process.exit(0);
  }
}

testBookingLogic();
