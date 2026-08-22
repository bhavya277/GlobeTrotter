import { prisma } from './db.js';

const API_BASE = 'http://localhost:5000/api';

async function runPhase4TestSuite() {
  console.log('🧪 Starting Phase 4 — Overlapping City Stop Validation & Dynamic Expansion Test Suite...\n');
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

  // Fetch Cities to get valid IDs (Mumbai, Jaipur, Tokyo)
  const citiesRes = await fetch(`${API_BASE}/cities`);
  const citiesData: any = await citiesRes.json();
  const mumbaiCity = citiesData.cities.find((c: any) => c.name === 'Mumbai');
  const jaipurCity = citiesData.cities.find((c: any) => c.name === 'Jaipur');
  const tokyoCity = citiesData.cities.find((c: any) => c.name === 'Tokyo');

  // 1. City Discovery Search & Country Filter Test
  await assertTest('1. City Discovery Search & Country Filter (India)', async () => {
    const searchRes = await fetch(`${API_BASE}/cities?country=India`);
    const searchData: any = await searchRes.json();
    return searchRes.status === 200 && Array.isArray(searchData.cities) && searchData.cities.some((c: any) => c.name === 'Mumbai');
  });

  // User A creates a Parent Trip (2026-09-01 to 2026-09-30)
  const parentTripRes = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'Asia Grand Tour',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      totalBudget: 150000,
      currency: 'INR',
    }),
  });
  const parentTripData: any = await parentTripRes.json();
  const tripId = parentTripData.trip.id;

  // Stop 1: Mumbai (Sep 1 to Sep 15)
  let stop1Id = '';
  await assertTest('2. Adding Stop 1 (Mumbai Sep 1 to Sep 15)', async () => {
    const res = await fetch(`${API_BASE}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        cityId: mumbaiCity.id,
        startDate: '2026-09-01',
        endDate: '2026-09-15',
      }),
    });
    const data: any = await res.json();
    if (res.status === 201) {
      stop1Id = data.stop.id;
      return true;
    }
    return false;
  });

  // 3. Overlapping Stop Date Conflict Test (Tokyo Sep 1 to Sep 29 conflicts with Mumbai Sep 1 to Sep 15)
  await assertTest('3. Overlapping Stop Date Conflict Blocked (Tokyo Sep 1-29 vs Mumbai Sep 1-15)', async () => {
    const res = await fetch(`${API_BASE}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        cityId: tokyoCity.id,
        startDate: '2026-09-01',
        endDate: '2026-09-29', // Overlaps with Mumbai Sep 1 - Sep 15
      }),
    });
    const data: any = await res.json();
    return res.status === 400 && data.error.includes('Date Conflict') && data.error.includes('Mumbai');
  });

  // 4. Non-Overlapping Sequential Stop Addition (Tokyo Sep 16 to Sep 30)
  let stop2Id = '';
  await assertTest('4. Non-Overlapping Sequential Stop Addition (Tokyo Sep 16 to Sep 30)', async () => {
    const res = await fetch(`${API_BASE}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        cityId: tokyoCity.id,
        startDate: '2026-09-16',
        endDate: '2026-09-30',
      }),
    });
    const data: any = await res.json();
    if (res.status === 201) {
      stop2Id = data.stop.id;
      return true;
    }
    return false;
  });

  // 5. Dynamic Trip Dates Expansion
  await assertTest('5. Dynamic Trip Date Expansion when user selects dates outside trip range', async () => {
    // Add Stop 3 in Jaipur from Oct 1 to Oct 10 (expands parent trip end date)
    const res = await fetch(`${API_BASE}/trips/${tripId}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        cityId: jaipurCity.id,
        startDate: '2026-10-01',
        endDate: '2026-10-10',
      }),
    });
    if (res.status === 201) {
      const updatedTrip = await prisma.trip.findUnique({ where: { id: tripId } });
      const updatedEndStr = updatedTrip?.endDate.toISOString().split('T')[0];
      return updatedEndStr === '2026-10-10';
    }
    return false;
  });

  // 6. Stop Chronological Date Validation (Stop End Date < Stop Start Date)
  await assertTest('6. Stop Departure Date Before Arrival Date Blocked', async () => {
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

  // 7. Multi-City Stop Reordering
  await assertTest('7. Multi-City Stop Reordering (PUT /api/trips/:tripId/stops/reorder)', async () => {
    const res = await fetch(`${API_BASE}/trips/${tripId}/stops/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        orderedStopIds: [stop2Id, stop1Id],
      }),
    });
    if (res.status === 200) {
      const dbStop2 = await prisma.tripStop.findUnique({ where: { id: stop2Id } });
      return dbStop2?.order === 1;
    }
    return false;
  });

  // 8. Remove City Stop
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

  console.log(`\n📊 Phase 4 Overlapping Validation Test Summary: ${passedCount}/${totalCount} tests PASSED.`);
}

runPhase4TestSuite()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
