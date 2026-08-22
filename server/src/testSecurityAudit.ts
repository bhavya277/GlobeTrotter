import { prisma } from './db.js';

const API_BASE = 'http://localhost:5000/api';

async function runSecurityAuditSuite() {
  console.log('🛡️ Starting Phase 13 — Comprehensive System Security Audit Test Suite...\n');
  let passedCount = 0;
  let totalCount = 0;

  async function assertAudit(category: string, name: string, fn: () => Promise<boolean>) {
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

  // Register User A & User B
  const emailA = `audit_usera_${Date.now()}@example.com`;
  const emailB = `audit_userb_${Date.now()}@example.com`;

  const resA = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Audit User A', email: emailA, password: 'password123' }),
  });
  const dataA: any = await resA.json();
  const tokenA = dataA.token;

  const resB = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Audit User B', email: emailB, password: 'password123' }),
  });
  const dataB: any = await resB.json();
  const tokenB = dataB.token;

  // 1. Password Hashing & Payload Sanitization
  await assertAudit('Authentication', 'Password Hash Sanitization (passwordHash never exposed in response)', async () => {
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const meData: any = await meRes.json();
    return meRes.status === 200 && meData.user.passwordHash === undefined;
  });

  // 2. Protected Routes Token Requirement
  await assertAudit('Authentication', 'Unauthenticated Access Blocked (HTTP 401 on missing token)', async () => {
    const res = await fetch(`${API_BASE}/trips`);
    return res.status === 401;
  });

  // 3. User A creates a PRIVATE trip
  const tripRes = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'User A Top Secret Trip',
      startDate: '2026-11-01',
      endDate: '2026-11-10',
      visibility: 'PRIVATE',
    }),
  });
  const tripData: any = await tripRes.json();
  const tripIdA = tripData.trip.id;

  // 4. IDOR Protection: User B Reading User A's Private Trip
  await assertAudit('Authorization & IDOR', 'IDOR Prevention on GET /api/trips/:id (User B -> User A Trip = HTTP 403)', async () => {
    const res = await fetch(`${API_BASE}/trips/${tripIdA}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    return res.status === 403;
  });

  // 5. IDOR Protection: User B Modifying User A's Trip
  await assertAudit('Authorization & IDOR', 'IDOR Prevention on PUT /api/trips/:id (User B -> User A Trip = HTTP 403)', async () => {
    const res = await fetch(`${API_BASE}/trips/${tripIdA}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'Hacked Trip Name' }),
    });
    return res.status === 403;
  });

  // 6. IDOR Protection: User B Deleting User A's Trip
  await assertAudit('Authorization & IDOR', 'IDOR Prevention on DELETE /api/trips/:id (User B -> User A Trip = HTTP 403)', async () => {
    const res = await fetch(`${API_BASE}/trips/${tripIdA}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    return res.status === 403;
  });

  // 7. Server-Side Role-Based Access Control (RBAC)
  await assertAudit('Authorization & RBAC', 'Non-Admin Access Blocked on /api/admin/stats (HTTP 403)', async () => {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    return res.status === 403;
  });

  // 8. Input Validation & Zod Schema Safeguard
  await assertAudit('Input Validation', 'Zod Schema Validation Safeguard on Invalid Body (HTTP 400)', async () => {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'X', startDate: 'invalid-date', endDate: 'invalid-date' }),
    });
    return res.status === 400;
  });

  console.log(`\n📊 Security Audit Summary: ${passedCount}/${totalCount} security checks PASSED.`);
}

runSecurityAuditSuite()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
