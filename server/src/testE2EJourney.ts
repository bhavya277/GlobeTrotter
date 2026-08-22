import { prisma } from './db.js';

const API_BASE = 'http://localhost:5000/api';

async function runFullE2EJourneyTest() {
  console.log('🚀 Starting GlobeTrotter Comprehensive End-to-End Journey Verification...\n');
  let passedCount = 0;
  let totalCount = 0;

  async function assertStep(stageNum: number, stageName: string, fn: () => Promise<boolean>) {
    totalCount++;
    try {
      const success = await fn();
      if (success) {
        console.log(`  ✅ [PASS] Stage ${stageNum}: ${stageName}`);
        passedCount++;
      } else {
        console.log(`  ❌ [FAIL] Stage ${stageNum}: ${stageName}`);
      }
    } catch (err: any) {
      console.log(`  ❌ [FAIL] Stage ${stageNum}: ${stageName} — Error: ${err.message}`);
    }
  }

  // Tokens & User Storage
  let tokenA = '';
  let tokenB = '';
  let userAObj: any = null;
  let userBObj: any = null;
  let createdTripId = '';
  let shareToken = '';
  let stopMumbaiId = '';
  let stopJaipurId = '';
  let stopGoaId = '';

  // 1. Stage 1: Login
  await assertStep(1, 'Login (Authenticate User A & User B)', async () => {
    const resA = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex@globetrotter.com', password: 'password123' }),
    });
    const dataA: any = await resA.json();
    tokenA = dataA.token;
    userAObj = dataA.user;

    const emailB = `e2e_userb_${Date.now()}@example.com`;
    const resB = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User B Explorer', email: emailB, password: 'password123' }),
    });
    const dataB: any = await resB.json();
    tokenB = dataB.token;
    userBObj = dataB.user;

    return Boolean(tokenA && tokenB && userAObj && userBObj);
  });

  // 2. Stage 2: Dashboard
  await assertStep(2, 'Dashboard Telemetry & User Trips Overview', async () => {
    const res = await fetch(`${API_BASE}/trips`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data: any = await res.json();
    return res.status === 200 && Array.isArray(data.trips);
  });

  // 3. Stage 3: Create Trip
  await assertStep(3, 'Create Trip Wizard (Grand India Golden Triangle Expedition)', async () => {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: 'Grand India Golden Triangle Expedition',
        description: 'Exploring Mumbai, Jaipur, and Goa coastlines.',
        startDate: '2026-11-01',
        endDate: '2026-11-15',
        totalBudget: 75000,
        currency: 'INR',
        visibility: 'PRIVATE',
      }),
    });
    const data: any = await res.json();
    if (res.status === 201 && data.trip) {
      createdTripId = data.trip.id;
      shareToken = data.trip.shareToken;
      return true;
    }
    return false;
  });

  // 4. Stage 4: City Search
  let mumbaiCity: any = null;
  let jaipurCity: any = null;
  let goaCity: any = null;
  await assertStep(4, 'City Search & Discovery Catalog', async () => {
    const res = await fetch(`${API_BASE}/cities`);
    const data: any = await res.json();
    if (res.status === 200 && Array.isArray(data.cities)) {
      mumbaiCity = data.cities.find((c: any) => c.name === 'Mumbai');
      jaipurCity = data.cities.find((c: any) => c.name === 'Jaipur');
      goaCity = data.cities.find((c: any) => c.name === 'Goa');
      return Boolean(mumbaiCity && jaipurCity && goaCity);
    }
    return false;
  });

  // 5. Stage 5: Add Multiple Cities (Mumbai, Jaipur, Goa)
  await assertStep(5, 'Add Multiple City Stops (Mumbai, Jaipur, Goa)', async () => {
    const stop1 = await fetch(`${API_BASE}/trips/${createdTripId}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ cityId: mumbaiCity.id, startDate: '2026-11-01', endDate: '2026-11-05' }),
    });
    const data1: any = await stop1.json();
    stopMumbaiId = data1.stop.id;

    const stop2 = await fetch(`${API_BASE}/trips/${createdTripId}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ cityId: jaipurCity.id, startDate: '2026-11-06', endDate: '2026-11-10' }),
    });
    const data2: any = await stop2.json();
    stopJaipurId = data2.stop.id;

    const stop3 = await fetch(`${API_BASE}/trips/${createdTripId}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ cityId: goaCity.id, startDate: '2026-11-11', endDate: '2026-11-15' }),
    });
    const data3: any = await stop3.json();
    stopGoaId = data3.stop.id;

    return Boolean(stopMumbaiId && stopJaipurId && stopGoaId);
  });

  // 6. Stage 6: Reorder City Stops
  await assertStep(6, 'Reorder City Stops (Jaipur -> Mumbai -> Goa)', async () => {
    const newOrder = [stopJaipurId, stopMumbaiId, stopGoaId];
    const res = await fetch(`${API_BASE}/trips/${createdTripId}/stops/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ orderedStopIds: newOrder }),
    });
    return res.status === 200;
  });

  // 7. Stage 7: Activities Attachment
  await assertStep(7, 'Activity Search & Attachment to City Stop', async () => {
    const actRes = await fetch(`${API_BASE}/trip-activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        tripStopId: stopMumbaiId,
        customName: 'Marine Drive Sunset Promenade Walk',
        category: 'Sightseeing',
        scheduledDate: '2026-11-02',
        startTime: '17:00',
        endTime: '19:00',
        customCost: 1200,
      }),
    });
    return actRes.status === 201;
  });

  // 8. Stage 8: Itinerary View
  await assertStep(8, 'Itinerary View (Day-by-Day Visual Hierarchy)', async () => {
    const res = await fetch(`${API_BASE}/trips/${createdTripId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data: any = await res.json();
    return res.status === 200 && data.trip.stops.length === 3;
  });

  // 9. Stage 9: Calendar Timeline
  await assertStep(9, 'Calendar Timeline Verification', async () => {
    const res = await fetch(`${API_BASE}/trips/${createdTripId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    return res.status === 200;
  });

  // 10. Stage 10: Budget Engine & Over-Budget Warning Alert
  await assertStep(10, 'Budget Engine & Over-Budget Alert Calculation (Log Stay ₹80,000)', async () => {
    // Log expense to trigger over-budget alert (Budget: ₹75,000, Total Spend: ₹81,200)
    await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        tripId: createdTripId,
        category: 'Stay',
        amount: 80000,
        currency: 'INR',
        description: 'Luxury Seafront Resort (5 Nights)',
        date: '2026-11-02',
      }),
    });

    const summaryRes = await fetch(`${API_BASE}/expenses/trip/${createdTripId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data: any = await summaryRes.json();
    return (
      summaryRes.status === 200 &&
      data.summary.isOverBudget === true &&
      data.summary.overBudgetAmount === 6200 &&
      data.summary.topExcessCategory === 'Stay'
    );
  });

  // 11. Stage 11: Smart Intelligence Layer
  await assertStep(11, 'Smart Intelligence Layer (Budget Optimizer, Pacing & Flow Distance)', async () => {
    const res = await fetch(`${API_BASE}/trips/${createdTripId}/intelligence`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data: any = await res.json();
    return (
      res.status === 200 &&
      data.intelligence.travelFlow.totalDistanceKm > 0 &&
      Array.isArray(data.intelligence.personalizedRecommendations)
    );
  });

  // 12. Stage 12: Public Sharing & Copy Trip
  await assertStep(12, 'Public Sharing & Copy Trip (User B copies User A Public Trip)', async () => {
    // 1. Update trip visibility to PUBLIC
    await fetch(`${API_BASE}/trips/${createdTripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ visibility: 'PUBLIC' }),
    });

    // 2. User B calls copyTrip
    const copyRes = await fetch(`${API_BASE}/trips/copy/${shareToken}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const copyData: any = await copyRes.json();

    if (copyRes.status === 201 && copyData.trip) {
      const clonedTrip = await prisma.trip.findUnique({ where: { id: copyData.trip.id } });
      const origTrip = await prisma.trip.findUnique({ where: { id: createdTripId } });
      // Verify cloned trip belongs to User B and original trip remains User A
      return clonedTrip?.userId === userBObj.id && origTrip?.userId === userAObj.id;
    }
    return false;
  });

  // 13. Stage 13: Profile
  await assertStep(13, 'Profile Settings Update & Saved Destinations', async () => {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: 'Alex Rivera Verified',
        defaultCurrency: 'INR',
        language: 'hi',
      }),
    });
    return res.status === 200;
  });

  console.log(`\n📊 Complete E2E Journey Verification Summary: ${passedCount}/${totalCount} Stages PASSED.`);
}

runFullE2EJourneyTest()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
