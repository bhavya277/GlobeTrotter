import { prisma } from './db.js';
import crypto from 'crypto';

const API_BASE = 'http://localhost:5000/api';

async function runAuthTestSuite() {
  console.log('🧪 Starting Phase 2 — Database + Authentication Automated Security Test Suite...\n');
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

  // 1. Valid Signup Test
  let userAToken = '';
  let userAId = '';
  const emailA = `user_a_${Date.now()}@example.com`;
  const passwordA = 'securePassword123';

  await assertTest('1. Valid Signup', async () => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Alpha', email: emailA, password: passwordA }),
    });
    const data: any = await res.json();
    if (res.status === 201 && data.token && data.user && data.user.passwordHash === undefined) {
      userAToken = data.token;
      userAId = data.user.id;
      return true;
    }
    return false;
  });

  // 2. Duplicate Email Test
  await assertTest('2. Duplicate Account Handling', async () => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Alpha Copy', email: emailA, password: passwordA }),
    });
    const data : any = await res.json();
    return res.status === 400 && data.error.includes('already exists');
  });

  // 3. Invalid Email Format Test
  await assertTest('3. Invalid Email Input Validation', async () => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Invalid Email', email: 'not-an-email', password: 'password123' }),
    });
    return res.status === 400;
  });

  // 4. Weak Password Test
  await assertTest('4. Weak Password Input Validation', async () => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Weak Pass', email: `weak_${Date.now()}@example.com`, password: '123' }),
    });
    return res.status === 400;
  });

  // 5. Wrong Password Test
  await assertTest('5. Wrong Password Login Failure', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA, password: 'WrongPassword999' }),
    });
    const data : any = await res.json();
    return res.status === 401 && data.error === 'Invalid email or password';
  });

  // 6. Nonexistent Account Test
  await assertTest('6. Nonexistent Account Generic Error', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ghost_user_does_not_exist@example.com', password: 'somepassword' }),
    });
    const data : any = await res.json();
    return res.status === 401 && data.error === 'Invalid email or password';
  });

  // 7. Unauthenticated Protected Route Test
  await assertTest('7. Unauthenticated Protected Route Access Blocked', async () => {
    const res = await fetch(`${API_BASE}/trips`);
    return res.status === 401;
  });

  // 8. Authenticated Route Test
  await assertTest('8. Authenticated Route Access Allowed', async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const data : any = await res.json();
    return res.status === 200 && data.user.email === emailA;
  });

  // 9. Logout Test
  await assertTest('9. Logout Endpoint Handling', async () => {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    return res.status === 200;
  });

  // 10. User Isolation Test
  let userBToken = '';
  const emailB = `user_b_${Date.now()}@example.com`;

  await assertTest('10. User Isolation (User B cannot access User A private trip)', async () => {
    // Signup User B
    const resB = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Beta', email: emailB, password: 'securePassword123' }),
    });
    const dataB: any = await resB.json();
    userBToken = dataB.token;

    // User A creates a PRIVATE trip
    const tripRes = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        name: 'User A Secret Trip',
        startDate: '2026-09-01',
        endDate: '2026-09-07',
        visibility: 'PRIVATE',
      }),
    });
    const tripData: any = await tripRes.json();
    const privateTripId = tripData.trip.id;

    // User B attempts to access User A's private trip
    const accessRes = await fetch(`${API_BASE}/trips/${privateTripId}`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });

    return accessRes.status === 403;
  });

  // 11. Forgot-Password & Reset-Password Architecture Test
  await assertTest('11. Forgot-Password & Reset-Password Flow', async () => {
    // Request reset token (Secure API returns generic message without token leakage)
    const forgotRes = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA }),
    });

    if (forgotRes.status !== 200) return false;

    // Secure Test Setup: Create a test raw token and store its SHA-256 hash in DB
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    const userA = await prisma.user.findUnique({ where: { email: emailA } });
    if (!userA) return false;

    await prisma.passwordResetToken.deleteMany({ where: { userId: userA.id } });
    await prisma.passwordResetToken.create({
      data: {
        userId: userA.id,
        token: tokenHash,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    // Reset password with raw token
    const newPass = 'brandNewPassword99';
    const resetRes = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawResetToken, newPassword: newPass }),
    });

    if (resetRes.status !== 200) return false;

    // Login with new password
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA, password: newPass }),
    });

    return loginRes.status === 200;
  });

  console.log(`\n📊 Phase 2 Security & Authentication Test Summary: ${passedCount}/${totalCount} tests PASSED.`);
}

runAuthTestSuite()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
