import { prisma } from './db.js';

const API_BASE = 'http://localhost:5000/api';

async function runPhase3TestSuite() {
  console.log('🧪 Starting Phase 3 — Dashboard & Trip CRUD Automated Test Suite...\n');
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
  const emailA = `phase3_usera_${Date.now()}@example.com`;
  const emailB = `phase3_userb_${Date.now()}@example.com`;

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

  let createdTripId = '';

  // 1. Invalid Date Validation Test (End Date before Start Date)
  await assertTest('1. Invalid Dates Validation (End Date < Start Date)', async () => {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: 'Invalid Date Trip',
        startDate: '2026-10-15',
        endDate: '2026-10-01', // Before start
        totalBudget: 1000,
      }),
    });
    const data: any = await res.json();
    return res.status === 400 && data.error.includes('before start date');
  });

  // 2. Valid Trip Creation & Database Persistence
  await assertTest('2. Valid Trip Creation & DB Persistence', async () => {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: 'European Odyssey 2026',
        description: 'Exploring Paris and Rome',
        startDate: '2026-10-01',
        endDate: '2026-10-15',
        totalBudget: 3500,
        currency: 'EUR',
        visibility: 'PRIVATE',
      }),
    });
    const data: any = await res.json();
    if (res.status === 201 && data.trip && data.trip.id) {
      createdTripId = data.trip.id;
      // Double-check direct Prisma DB record
      const dbTrip = await prisma.trip.findUnique({ where: { id: createdTripId } });
      return dbTrip !== null && dbTrip.name === 'European Odyssey 2026';
    }
    return false;
  });

  // 3. My Trips List Retrieval
  await assertTest('3. My Trips List Endpoint (GET /api/trips)', async () => {
    const res = await fetch(`${API_BASE}/trips`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data: any = await res.json();
    return res.status === 200 && Array.isArray(data.trips) && data.trips.some((t: any) => t.id === createdTripId);
  });

  // 4. Update Trip (Edit CRUD)
  await assertTest('4. Update Trip (PUT /api/trips/:id)', async () => {
    const res = await fetch(`${API_BASE}/trips/${createdTripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: 'European Odyssey 2026 Updated',
        totalBudget: 4200,
      }),
    });
    const data: any = await res.json();
    if (res.status === 200 && data.trip && data.trip.name === 'European Odyssey 2026 Updated') {
      const dbTrip = await prisma.trip.findUnique({ where: { id: createdTripId } });
      return dbTrip?.totalBudget === 4200;
    }
    return false;
  });

  // 5. Unauthorized Trip Modification Blocked (User Isolation)
  await assertTest('5. Unauthorized Trip Modification Blocked (User B -> User A Trip)', async () => {
    const res = await fetch(`${API_BASE}/trips/${createdTripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'Hacked Trip Name' }),
    });
    return res.status === 403;
  });

  // 6. Delete Trip (Delete CRUD)
  await assertTest('6. Delete Trip (DELETE /api/trips/:id)', async () => {
    const res = await fetch(`${API_BASE}/trips/${createdTripId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    if (res.status === 200) {
      const dbTrip = await prisma.trip.findUnique({ where: { id: createdTripId } });
      return dbTrip === null;
    }
    return false;
  });

  console.log(`\n📊 Phase 3 Dashboard & Trip CRUD Test Summary: ${passedCount}/${totalCount} tests PASSED.`);
}

runPhase3TestSuite()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
