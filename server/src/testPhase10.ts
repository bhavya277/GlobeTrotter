import { prisma } from './db.js';

const API_BASE = 'http://localhost:5000/api';

async function runPhase10TestSuite() {
  console.log('🧪 Starting Phase 10 — Sharing, Copy Trip & Security Isolation Automated Test Suite...\n');
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
  const emailA = `phase10_usera_${Date.now()}@example.com`;
  const emailB = `phase10_userb_${Date.now()}@example.com`;

  const resA = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User A', email: emailA, password: 'password123' }),
  });
  const dataA: any = await resA.json();
  const tokenA = dataA.token;
  const userAObj = dataA.user;

  const resB = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User B', email: emailB, password: 'password123' }),
  });
  const dataB: any = await resB.json();
  const tokenB = dataB.token;
  const userBObj = dataB.user;

  // 1. User A Creates a PRIVATE Trip
  const privateTripRes = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'User A Secret Private Trip',
      startDate: '2026-12-15',
      endDate: '2026-12-20',
      visibility: 'PRIVATE',
      totalBudget: 40000,
    }),
  });
  const privateTripData: any = await privateTripRes.json();
  const privateTripId = privateTripData.trip.id;

  // Test 1: Private trip -> unauthorized public access blocked (HTTP 403)
  await assertTest('1. Private Trip -> Unauthorized Public Access Blocked (HTTP 403)', async () => {
    const res = await fetch(`${API_BASE}/trips/${privateTripId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    return res.status === 403;
  });

  // 2. User A Creates a PUBLIC Trip
  const publicTripRes = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'User A Public Shared Trip',
      startDate: '2026-12-21',
      endDate: '2026-12-28',
      visibility: 'PUBLIC',
      totalBudget: 60000,
    }),
  });
  const publicTripData: any = await publicTripRes.json();
  const publicShareToken = publicTripData.trip.shareToken;
  const publicTripId = publicTripData.trip.id;

  // Test 2: Public trip -> public access allowed (HTTP 200 via shareToken)
  await assertTest('2. Public Trip -> Unauthenticated Public Access Allowed (HTTP 200)', async () => {
    const res = await fetch(`${API_BASE}/trips/shared/${publicShareToken}`);
    const data: any = await res.json();
    return res.status === 200 && data.trip.name === 'User A Public Shared Trip';
  });

  // Test 3: Public trip -> original owner remains owner
  await assertTest('3. Public Trip -> Original Owner Protection (User A remains owner)', async () => {
    const dbTrip = await prisma.trip.findUnique({ where: { id: publicTripId } });
    return dbTrip !== null && dbTrip.userId === userAObj.id;
  });

  // Test 4: Copy trip -> copied trip belongs 100% to User B
  await assertTest('4. Copy Trip -> Copied Trip Belongs 100% to Current User B', async () => {
    const copyRes = await fetch(`${API_BASE}/trips/copy/${publicShareToken}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const copyData: any = await copyRes.json();
    if (copyRes.status === 201 && copyData.trip) {
      const copiedTripId = copyData.trip.id;
      const dbCopiedTrip = await prisma.trip.findUnique({ where: { id: copiedTripId } });
      const dbOriginalTrip = await prisma.trip.findUnique({ where: { id: publicTripId } });

      // Verify copied trip is owned by User B AND original trip is still owned by User A
      return (
        dbCopiedTrip !== null &&
        dbCopiedTrip.userId === userBObj.id &&
        dbOriginalTrip !== null &&
        dbOriginalTrip.userId === userAObj.id
      );
    }
    return false;
  });

  console.log(`\n📊 Phase 10 Sharing & Security Test Summary: ${passedCount}/${totalCount} tests PASSED.`);
}

runPhase10TestSuite()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
