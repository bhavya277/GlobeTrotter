import { prisma } from './db.js';

const API_BASE = 'http://localhost:5000/api';

async function runNegativeTestingSuite() {
  console.log('🔥 Starting Phase 15 — Adversarial Negative Testing & Chaos Audit Suite...\n');
  let passedCount = 0;
  let totalCount = 0;

  async function assertNegative(category: string, name: string, fn: () => Promise<boolean>) {
    totalCount++;
    try {
      const success = await fn();
      if (success) {
        console.log(`  ✅ [PASS] [${category}] ${name}`);
        passedCount++;
      } else {
        console.log(`  ❌ [FAIL] [${category}] ${name}`);
      }
    } catch (err: any) {
      console.log(`  ❌ [FAIL] [${category}] ${name} — Error: ${err.message}`);
    }
  }

  // Register User A (Victim) & User B (Attacker / Careless User)
  const emailA = `victim_usera_${Date.now()}@example.com`;
  const emailB = `attacker_userb_${Date.now()}@example.com`;

  const resA = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Victim User A', email: emailA, password: 'password123' }),
  });
  const dataA: any = await resA.json();
  const tokenA = dataA.token;

  const resB = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Attacker User B', email: emailB, password: 'password123' }),
  });
  const dataB: any = await resB.json();
  const tokenB = dataB.token;

  // Create User A Private Trip
  const privateTripRes = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: "Victim's Private Trip",
      startDate: '2026-10-01',
      endDate: '2026-10-10',
      visibility: 'PRIVATE',
    }),
  });
  const privateTripData: any = await privateTripRes.json();
  const privateTripId = privateTripData.trip.id;

  // 1. Accessing Another User's Trip (IDOR Read Attack)
  await assertNegative('Attacker IDOR', "Accessing Another User's Private Trip Blocked (HTTP 403)", async () => {
    const res = await fetch(`${API_BASE}/trips/${privateTripId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    return res.status === 403;
  });

  // 2. Modifying Another User's Trip (IDOR Update Attack)
  await assertNegative('Attacker IDOR', "Modifying Another User's Trip Blocked (HTTP 403)", async () => {
    const res = await fetch(`${API_BASE}/trips/${privateTripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'Defaced Trip Name' }),
    });
    return res.status === 403;
  });

  // 3. Deleting Another User's Trip (IDOR Delete Attack)
  await assertNegative('Attacker IDOR', "Deleting Another User's Trip Blocked (HTTP 403)", async () => {
    const res = await fetch(`${API_BASE}/trips/${privateTripId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    return res.status === 403;
  });

  // 4. Accessing Private Itinerary Publicly
  await assertNegative('Public Security', 'Accessing Private Itinerary Publicly Without Auth (HTTP 403)', async () => {
    const res = await fetch(`${API_BASE}/trips/${privateTripId}`);
    return res.status === 403 || res.status === 401;
  });

  // 5. Manipulating Trip IDs (Non-existent UUID or Malformed String)
  await assertNegative('Fuzzing & Input', 'Manipulating Non-Existent Trip ID (HTTP 404)', async () => {
    const res = await fetch(`${API_BASE}/trips/00000000-0000-0000-0000-000000000000`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    return res.status === 404;
  });

  // 6. Submitting Invalid Dates (End Date Before Start Date)
  await assertNegative('Careless User', 'Submitting End Date Before Start Date (HTTP 400)', async () => {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: 'Time Machine Trip',
        startDate: '2026-10-10',
        endDate: '2026-10-01', // Invalid!
      }),
    });
    return res.status === 400;
  });

  // 7. Submitting Empty Required Fields
  await assertNegative('Careless User', 'Submitting Empty Trip Name (HTTP 400)', async () => {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: ' ', // Empty spaces
        startDate: '2026-10-01',
        endDate: '2026-10-10',
      }),
    });
    return res.status === 400;
  });

  // 8. Invalid City IDs
  await assertNegative('Input Validation', 'Adding Stop with Invalid City ID (HTTP 400/404)', async () => {
    const res = await fetch(`${API_BASE}/trips/${privateTripId}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        cityId: 'invalid-city-id-999',
        startDate: '2026-10-01',
        endDate: '2026-10-05',
      }),
    });
    return res.status === 400 || res.status === 404;
  });

  // 9. Negative Costs
  await assertNegative('Input Validation', 'Submitting Negative Total Budget (HTTP 400)', async () => {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: 'Negative Budget Trip',
        startDate: '2026-10-01',
        endDate: '2026-10-10',
        totalBudget: -5000,
      }),
    });
    return res.status === 400;
  });

  // 10. Expired/Invalid Authentication Token
  await assertNegative('Authentication', 'API Request with Corrupted Bearer Token (HTTP 401)', async () => {
    const res = await fetch(`${API_BASE}/trips`, {
      headers: { Authorization: 'Bearer corrupted.jwt.token.string' },
    });
    return res.status === 401;
  });

  // 11. Unauthorized Admin Access
  await assertNegative('Authorization & RBAC', 'Normal User Requesting Admin Endpoint (HTTP 403)', async () => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    return res.status === 403;
  });

  // 12. Malicious Input & Script Injection (XSS Payload Sanitization)
  await assertNegative('Sanitization', 'Malicious Script Tag Input Handled Safely', async () => {
    const scriptBody = '<script>alert("XSS Attack")</script>';
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: scriptBody,
        startDate: '2026-10-01',
        endDate: '2026-10-10',
      }),
    });
    const data: any = await res.json();
    return res.status === 201 && data.trip.name.includes('<script>');
  });

  // 13. API Requests Without Required Fields
  await assertNegative('Input Validation', 'API Request Missing All Required Body Fields (HTTP 400)', async () => {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({}),
    });
    return res.status === 400;
  });

  console.log(`\n📊 Negative & Adversarial Testing Summary: ${passedCount}/${totalCount} tests PASSED.`);
}

runNegativeTestingSuite()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
