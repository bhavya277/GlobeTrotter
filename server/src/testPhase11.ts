import { prisma } from './db.js';

const API_BASE = 'http://localhost:5000/api';

async function runPhase11TestSuite() {
  console.log('🧪 Starting Phase 11 — Profile Settings & Account Deletion Policy Automated Test Suite...\n');
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
  const emailA = `phase11_usera_${Date.now()}@example.com`;
  const emailB = `phase11_userb_${Date.now()}@example.com`;

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
  const userBObj = dataB.user;

  // 1. Valid Profile Update & Sensitive Field Sanitization
  await assertTest('1. Valid Profile Update & Password Hash Sanitization', async () => {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: 'User A Updated Name',
        defaultCurrency: 'INR',
        language: 'hi',
        profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      }),
    });
    const data: any = await res.json();
    return res.status === 200 && data.user.name === 'User A Updated Name' && data.user.passwordHash === undefined;
  });

  // 2. Email Conflict Protection (User B attempts to use User A email)
  await assertTest('2. Email Conflict Protection (Duplicate email update blocked)', async () => {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ email: emailA }), // User A email
    });
    const data: any = await res.json();
    return res.status === 400 && data.error.includes('already in use');
  });

  // 3. Password Change Verification
  await assertTest('3. Password Change & Re-authentication', async () => {
    const changeRes = await fetch(`${API_BASE}/users/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        currentPassword: 'password123',
        newPassword: 'brandNewPassword99',
      }),
    });
    if (changeRes.status === 200) {
      // Attempt login with new password
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailA, password: 'brandNewPassword99' }),
      });
      return loginRes.status === 200;
    }
    return false;
  });

  // 4. User B creates a trip before deleting account to test Cascade Deletion Policy
  await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({
      name: 'User B Trip to Delete',
      startDate: '2026-12-10',
      endDate: '2026-12-15',
    }),
  });

  // 5. Deliberate Account Deletion Policy Test
  await assertTest('5. Deliberate Account Deletion & Cascade Database Cleanup', async () => {
    const deleteRes = await fetch(`${API_BASE}/users/account`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ confirmText: 'DELETE' }),
    });

    if (deleteRes.status === 200) {
      // Verify User B no longer exists in DB
      const dbUser = await prisma.user.findUnique({ where: { id: userBObj.id } });
      const dbTripsCount = await prisma.trip.count({ where: { userId: userBObj.id } });
      return dbUser === null && dbTripsCount === 0;
    }
    return false;
  });

  console.log(`\n📊 Phase 11 Profile & Account Deletion Test Summary: ${passedCount}/${totalCount} tests PASSED.`);
}

runPhase11TestSuite()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
