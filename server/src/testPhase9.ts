import { prisma } from './db.js';

const API_BASE = 'http://localhost:5000/api';

async function runPhase9TestSuite() {
  console.log('🧪 Starting Phase 9 — Unique Intelligence Layer Automated Test Suite...\n');
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

  // Register User A
  const emailA = `phase9_usera_${Date.now()}@example.com`;
  const resA = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User A', email: emailA, password: 'password123' }),
  });
  const dataA: any = await resA.json();
  const tokenA = dataA.token;

  // Fetch Indian Cities (Mumbai, Jaipur)
  const citiesRes = await fetch(`${API_BASE}/cities`);
  const citiesData: any = await citiesRes.json();
  const mumbaiCity = citiesData.cities.find((c: any) => c.name === 'Mumbai');
  const jaipurCity = citiesData.cities.find((c: any) => c.name === 'Jaipur');

  // Create User A Trip (Mumbai & Jaipur)
  const tripRes = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'Smart India Expedition',
      startDate: '2026-12-01',
      endDate: '2026-12-10',
      totalBudget: 80000,
      currency: 'INR',
    }),
  });
  const tripData: any = await tripRes.json();
  const tripId = tripData.trip.id;

  // Add Mumbai Stop (Dec 1-5) and Jaipur Stop (Dec 6-10)
  const stop1Res = await fetch(`${API_BASE}/trips/${tripId}/stops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      cityId: mumbaiCity.id,
      startDate: '2026-12-01',
      endDate: '2026-12-05',
    }),
  });
  const stop1Data: any = await stop1Res.json();
  const stop1Id = stop1Data.stop.id;

  await fetch(`${API_BASE}/trips/${tripId}/stops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      cityId: jaipurCity.id,
      startDate: '2026-12-06',
      endDate: '2026-12-10',
    }),
  });

  // Log 4 Activities on Dec 2 to trigger Smart Daily Balance overloaded day
  for (let i = 1; i <= 4; i++) {
    await fetch(`${API_BASE}/trip-activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        tripStopId: stop1Id,
        customName: `Activity ${i}`,
        scheduledDate: '2026-12-02',
        startTime: `${9 + i}:00`,
        endTime: `${11 + i}:00`,
        customCost: 2000,
      }),
    });
  }

  // 1. Fetch Trip Intelligence Endpoint
  let intelData: any = null;
  await assertTest('1. Fetch Trip Intelligence Endpoint (GET /api/trips/:tripId/intelligence)', async () => {
    const res = await fetch(`${API_BASE}/trips/${tripId}/intelligence`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data: any = await res.json();
    if (res.status === 200 && data.intelligence) {
      intelData = data.intelligence;
      return true;
    }
    return false;
  });

  // 2. Smart Daily Balance Overloaded Day Detection
  await assertTest('2. Smart Daily Pacing Balance (Overloaded Day Detection for Dec 2)', async () => {
    if (!intelData || !intelData.dailyBalance) return false;
    const overloadedDay = intelData.dailyBalance.find((d: any) => d.dateStr === '2026-12-02');
    return (
      overloadedDay !== undefined &&
      overloadedDay.activityCount >= 4 &&
      overloadedDay.isOverloaded === true &&
      overloadedDay.insight.includes('4 activities')
    );
  });

  // 3. Travel Flow Intelligence & Transit Distance (Mumbai -> Jaipur)
  await assertTest('3. Travel Flow Intelligence (Haversine transit distance calculation)', async () => {
    if (!intelData || !intelData.travelFlow) return false;
    const flow = intelData.travelFlow;
    return flow.totalDistanceKm > 0 && Array.isArray(flow.routeLegs) && flow.routeLegs.length === 1;
  });

  // 4. Personalized Recommendations with EXPLICIT VISIBLE REASONS
  await assertTest('4. Personalized Recommendations with Explicit Visible Rationale (reason field)', async () => {
    if (!intelData || !intelData.personalizedRecommendations) return false;
    const recs = intelData.personalizedRecommendations;
    return Array.isArray(recs) && recs.every((r: any) => typeof r.reason === 'string' && r.reason.length > 5);
  });

  console.log(`\n📊 Phase 9 Intelligence Layer Test Summary: ${passedCount}/${totalCount} tests PASSED.`);
}

runPhase9TestSuite()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
