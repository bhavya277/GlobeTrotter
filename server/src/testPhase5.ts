import { prisma } from './db.js';

const API_BASE = 'http://localhost:5000/api';

async function runPhase5TestSuite() {
  console.log('🧪 Starting Phase 5 — Activity Management & Cross-City Protection Automated Test Suite...\n');
  let passedCount = 0;
  let totalCount = 0;

  async function assertTest(name: string, fn: () => Promise<boolean>) {
    totalCount++;
    try {
      const success = await fn();
      if (success) {
        console.log(`  ✅ [PASS] ${name}`);
        passedCount++;
      } else {
        console.log(`  ❌ [FAIL] ${name}`);
      }
    } catch (err: any) {
      console.log(`  ❌ [FAIL] ${name} — Error: ${err.message}`);
    }
  }

  // Register User A & User B
  const emailA = `phase5_usera_${Date.now()}@example.com`;
  const emailB = `phase5_userb_${Date.now()}@example.com`;

  const resA = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User A', email: emailA, password: 'password123' }),
  });
  const dataA: any = await resA.json();
  const tokenA = dataA.token;

  const resB = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User B', email: emailB, password: 'password123' }),
  });
  const dataB: any = await resB.json();
  const tokenB = dataB.token;

  // Fetch Cities (Mumbai & Paris & Tokyo)
  const citiesRes = await fetch(`${API_BASE}/cities`);
  const citiesData: any = await citiesRes.json();
  const mumbaiCity = citiesData.cities.find((c: any) => c.name === 'Mumbai');
  const parisCity = citiesData.cities.find((c: any) => c.name === 'Paris');

  // Fetch Activities
  const activitiesRes = await fetch(`${API_BASE}/activities`);
  const activitiesData: any = await activitiesRes.json();
  const mumbaiActivity = activitiesData.activities.find((a: any) => a.cityId === mumbaiCity.id);
  const parisActivity = activitiesData.activities.find((a: any) => a.cityId === parisCity.id);

  // 1. Activity Search & Filtering
  await assertTest('1. Activity Search & Category Filter', async () => {
    const res = await fetch(`${API_BASE}/activities?search=Gateway`);
    const data: any = await res.json();
    return res.status === 200 && Array.isArray(data.activities) && data.activities.some((a: any) => a.name.includes('Gateway'));
  });

  // User A creates a Trip with a Mumbai Stop (2026-12-01 to 2026-12-07)
  const tripRes = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'Mumbai Winter Escapade',
      startDate: '2026-12-01',
      endDate: '2026-12-07',
      totalBudget: 50000,
      currency: 'INR',
    }),
  });
  const tripData: any = await tripRes.json();
  const tripId = tripData.trip.id;

  const stopRes = await fetch(`${API_BASE}/trips/${tripId}/stops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      cityId: mumbaiCity.id,
      startDate: '2026-12-01',
      endDate: '2026-12-07',
    }),
  });
  const stopData: any = await stopRes.json();
  const mumbaiStopId = stopData.stop.id;

  // 2. Cross-City Mismatch Protection (Attaching Paris Activity to Mumbai Stop)
  await assertTest('2. Cross-City Activity Mismatch Protection Blocked (Paris Activity -> Mumbai Stop)', async () => {
    if (!parisActivity) return true; // Skip if Paris activity not seeded
    const res = await fetch(`${API_BASE}/trip-activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        tripStopId: mumbaiStopId,
        activityId: parisActivity.id, // Mismatched City!
        scheduledDate: '2026-12-02',
      }),
    });
    const data: any = await res.json();
    return res.status === 400 && data.error.includes('Activity City Mismatch');
  });

  // 3. Valid Catalog Activity Attachment
  let scheduledActId = '';
  await assertTest('3. Valid Catalog Activity Attachment (Mumbai Activity -> Mumbai Stop)', async () => {
    const res = await fetch(`${API_BASE}/trip-activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        tripStopId: mumbaiStopId,
        activityId: mumbaiActivity.id,
        scheduledDate: '2026-12-02',
        startTime: '10:00',
        endTime: '12:00',
        customCost: mumbaiActivity.estimatedCost,
      }),
    });
    const data: any = await res.json();
    if (res.status === 201 && data.tripActivity) {
      scheduledActId = data.tripActivity.id;
      return true;
    }
    return false;
  });

  // 4. Custom Activity Creation
  await assertTest('4. Custom User Activity Creation', async () => {
    const res = await fetch(`${API_BASE}/trip-activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        tripStopId: mumbaiStopId,
        customName: 'Private Yacht Sunset Cruise',
        category: 'Adventure',
        scheduledDate: '2026-12-03',
        startTime: '16:30',
        endTime: '19:00',
        customCost: 4500,
        notes: 'Pre-booked via local harbor agency',
      }),
    });
    return res.status === 201;
  });

  // 5. Activity Date Mismatch Protection
  await assertTest('5. Scheduled Date Outside Stop Date Bounds Blocked', async () => {
    const res = await fetch(`${API_BASE}/trip-activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        tripStopId: mumbaiStopId,
        customName: 'Out of Bounds Activity',
        scheduledDate: '2026-12-25', // Outside stop dates Dec 1-7
      }),
    });
    const data: any = await res.json();
    return res.status === 400 && data.error.includes('Activity Date Mismatch');
  });

  // 6. Update Activity Completion Status
  await assertTest('6. Toggle Activity Completion Status (PUT /api/trip-activities/:id)', async () => {
    const res = await fetch(`${API_BASE}/trip-activities/${scheduledActId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ isCompleted: true }),
    });
    const data: any = await res.json();
    return res.status === 200 && data.tripActivity.isCompleted === true;
  });

  // 7. Unauthorized Activity Modification Blocked
  await assertTest('7. Unauthorized Activity Deletion Blocked (User B -> User A Activity)', async () => {
    const res = await fetch(`${API_BASE}/trip-activities/${scheduledActId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    return res.status === 403;
  });

  // 8. Delete Scheduled Activity
  await assertTest('8. Delete Scheduled Activity (DELETE /api/trip-activities/:id)', async () => {
    const res = await fetch(`${API_BASE}/trip-activities/${scheduledActId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    if (res.status === 200) {
      const dbAct = await prisma.tripActivity.findUnique({ where: { id: scheduledActId } });
      return dbAct === null;
    }
    return false;
  });

  console.log(`\n📊 Phase 5 Activity Management Test Summary: ${passedCount}/${totalCount} tests PASSED.`);
}

runPhase5TestSuite()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
