import { prisma } from './db.js';

const API_BASE = 'http://localhost:5000/api';

async function runPhase4TestSuite() {
  console.log('🧪 Starting Phase 4 — Dynamic Trip Date Auto-Expansion & Multi-City Test Suite...\n');
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
  const emailA = `phase4_usera_${Date.now()}@example.com`;
  const emailB = `phase4_userb_${Date.now()}@example.com`;

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

  // Fetch Cities to get valid IDs (Mumbai, Jaipur)
  const citiesRes = await fetch(`${API_BASE}/cities`);
  const citiesData: any = await citiesRes.json();
  const mumbaiCity = citiesData.cities.find((c: any) => c.name === 'Mumbai');
  const jaipurCity = citiesData.cities.find((c: any) => c.name === 'Jaipur');

  // 1. City Discovery Search & Country Filter Test
  await assertTest('1. City Discovery Search & Country Filter (India)', async () => {
    const searchRes = await fetch(`${API_BASE}/cities?country=India`);
    const searchData: any = await searchRes.json();
    return searchRes.status === 200 && Array.isArray(searchData.cities) && searchData.cities.some((c: any) => c.name === 'Mumbai');
  });

  // User A creates a Parent Trip (2026-11-05 to 2026-11-10)
  const parentTripRes = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'Grand India Dynamic Expansion Expedition',
      startDate: '2026-11-05',
      endDate: '2026-11-10',
      totalBudget: 100000,
      currency: 'INR',
    }),
  });
  const parentTripData: any = await parentTripRes.json();
  const tripId = parentTripData.trip.id;

  // 2. Dynamic Trip Dates Auto-Expansion Test
  await assertTest('2. Dynamic Trip Dates Auto-Expansion (Trip expands when user picks any date)', async () => {
    // User selects 2026-10-25 (earlier than 2026-11-05) and 2026-11-25 (later than 2026-11-10)
    const res = await fetch(`${API_BASE}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        cityId: mumbaiCity.id,
        startDate: '2026-10-25',
        endDate: '2026-11-25',
      }),
    });
    const data: any = await res.json();
    if (res.status === 201) {
      // Verify parent trip dates dynamically updated in DB
      const updatedTrip = await prisma.trip.findUnique({ where: { id: tripId } });
      const updatedStartStr = updatedTrip?.startDate.toISOString().split('T')[0];
      const updatedEndStr = updatedTrip?.endDate.toISOString().split('T')[0];
      return updatedStartStr === '2026-10-25' && updatedEndStr === '2026-11-25';
    }
    return false;
  });

  // 3. Stop Chronological Date Validation (Stop End Date < Stop Start Date)
  await assertTest('3. Stop Departure Date Before Arrival Date Blocked', async () => {
    const res = await fetch(`${API_BASE}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        cityId: mumbaiCity.id,
        startDate: '2026-11-10',
        endDate: '2026-11-05',
      }),
    });
    const data: any = await res.json();
    return res.status === 400 && data.error.includes('cannot be before');
  });

  // 4. Nonexistent City ID Addition Blocked
  await assertTest('4. Nonexistent City ID Addition Blocked', async () => {
    const res = await fetch(`${API_BASE}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        cityId: 'nonexistent-city-uuid-12345',
        startDate: '2026-11-02',
        endDate: '2026-11-06',
      }),
    });
    return res.status === 404;
  });

  // 5. Unauthorized Stop Addition Blocked (User Isolation)
  await assertTest('5. Unauthorized Stop Addition Blocked (User B -> User A Trip)', async () => {
    const res = await fetch(`${API_BASE}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        cityId: mumbaiCity.id,
        startDate: '2026-11-02',
        endDate: '2026-11-06',
      }),
    });
    return res.status === 403;
  });

  // 6. Multi-City Stops Addition & DB Persistence
  let stop1Id = '';
  let stop2Id = '';
  await assertTest('6. Multi-City Stops Addition & DB Persistence', async () => {
    const res1 = await fetch(`${API_BASE}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        cityId: mumbaiCity.id,
        startDate: '2026-11-01',
        endDate: '2026-11-08',
      }),
    });
    const data1: any = await res1.json();

    const res2 = await fetch(`${API_BASE}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        cityId: jaipurCity.id,
        startDate: '2026-11-09',
        endDate: '2026-11-18',
      }),
    });
    const data2: any = await res2.json();

    if (res1.status === 201 && res2.status === 201) {
      stop1Id = data1.stop.id;
      stop2Id = data2.stop.id;
      return true;
    }
    return false;
  });

  // 7. Multi-City Reordering Test
  await assertTest('7. Multi-City Stop Reordering (PUT /api/trips/:tripId/stops/reorder)', async () => {
    const res = await fetch(`${API_BASE}/trips/${tripId}/stops/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        orderedStopIds: [stop2Id, stop1Id],
      }),
    });
    const data: any = await res.json();
    if (res.status === 200) {
      const dbStop2 = await prisma.tripStop.findUnique({ where: { id: stop2Id } });
      return dbStop2?.order === 1;
    }
    return false;
  });

  // 8. Stop Removal Test
  await assertTest('8. Remove City Stop (DELETE /api/trips/:tripId/stops/:stopId)', async () => {
    const res = await fetch(`${API_BASE}/trips/${tripId}/stops/${stop1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    if (res.status === 200) {
      const dbStop = await prisma.tripStop.findUnique({ where: { id: stop1Id } });
      return dbStop === null;
    }
    return false;
  });

  console.log(`\n📊 Phase 4 Dynamic Expansion Test Summary: ${passedCount}/${totalCount} tests PASSED.`);
}

runPhase4TestSuite()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
