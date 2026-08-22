import { prisma } from './db.js';
import jwt from 'jsonwebtoken';

const API_BASE = 'http://localhost:5000/api';

async function runSecurityNegativeHardeningAudit() {
  console.log('🔒 Starting GlobeTrotter Comprehensive Security Negative Hardening Audit...\n');

  let passed = 0;
  let total = 0;

  async function testCase(id: number, name: string, fn: () => Promise<boolean>) {
    total++;
    try {
      const result = await fn();
      if (result) {
        console.log(`  ✅ [PASS] Security Test #${id}: ${name}`);
        passed++;
      } else {
        console.log(`  ❌ [FAIL] Security Test #${id}: ${name}`);
      }
    } catch (err: any) {
      console.log(`  ❌ [FAIL] Security Test #${id}: ${name} — Error: ${err.message}`);
    }
  }

  // Setup Test Users
  const user1Email = `sec_user1_${Date.now()}@test.com`;
  const user2Email = `sec_user2_${Date.now()}@test.com`;

  const reg1 = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Security User 1', email: user1Email, password: 'Password123!' }),
  });
  const data1: any = await reg1.json();
  const token1 = data1.token || data1.accessToken;

  const reg2 = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Security User 2', email: user2Email, password: 'Password123!' }),
  });
  const data2: any = await reg2.json();
  const token2 = data2.token || data2.accessToken;

  // Create User 1 Private Trip
  const trip1Res = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      name: 'User 1 Private Vault Trip',
      startDate: '2026-11-01',
      endDate: '2026-11-10',
      totalBudget: 50000,
      visibility: 'PRIVATE',
    }),
  });
  const trip1Data: any = await trip1Res.json();
  const trip1Id = trip1Data.trip.id;

  // Create User 2 Private Trip
  const trip2Res = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
    body: JSON.stringify({
      name: 'User 2 Private Vault Trip',
      startDate: '2026-11-01',
      endDate: '2026-11-10',
      totalBudget: 50000,
      visibility: 'PRIVATE',
    }),
  });
  const trip2Data: any = await trip2Res.json();
  const trip2Id = trip2Data.trip.id;

  // Add Stop to Trip 1
  const cities = await prisma.city.findMany({ take: 2 });
  const stop1Res = await fetch(`${API_BASE}/trips/${trip1Id}/stops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({ cityId: cities[0].id, startDate: '2026-11-01', endDate: '2026-11-05' }),
  });
  const stop1Data: any = await stop1Res.json();
  const stop1Id = stop1Data.stop.id;

  // Add Stop to Trip 2
  const stop2Res = await fetch(`${API_BASE}/trips/${trip2Id}/stops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
    body: JSON.stringify({ cityId: cities[1].id, startDate: '2026-11-01', endDate: '2026-11-05' }),
  });
  const stop2Data: any = await stop2Res.json();
  const stop2Id = stop2Data.stop.id;

  // Add Activity to Stop 1
  const act1Res = await fetch(`${API_BASE}/trip-activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      tripStopId: stop1Id,
      customName: 'User 1 Private Sightseeing',
      scheduledDate: '2026-11-02',
      startTime: '10:00',
      endTime: '12:00',
    }),
  });
  const act1Data: any = await act1Res.json();
  const act1Id = act1Data.tripActivity.id;

  // Add Activity to Stop 2
  const act2Res = await fetch(`${API_BASE}/trip-activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
    body: JSON.stringify({
      tripStopId: stop2Id,
      customName: 'User 2 Private Dining',
      scheduledDate: '2026-11-02',
      startTime: '13:00',
      endTime: '15:00',
    }),
  });
  const act2Data: any = await act2Res.json();
  const act2Id = act2Data.tripActivity.id;

  // --- TESTS ---

  // 1. User A accessing User B's trip
  await testCase(1, 'User A accessing User B private trip', async () => {
    const res = await fetch(`${API_BASE}/trips/${trip2Id}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    return res.status === 403;
  });

  // 2. User A editing User B's trip
  await testCase(2, 'User A editing User B trip', async () => {
    const res = await fetch(`${API_BASE}/trips/${trip2Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ name: 'Hacked Title' }),
    });
    return res.status === 403;
  });

  // 3. User A deleting User B's trip
  await testCase(3, 'User A deleting User B trip', async () => {
    const res = await fetch(`${API_BASE}/trips/${trip2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    return res.status === 403;
  });

  // 4. User A reordering User B's stops
  await testCase(4, 'User A reordering User B stops with foreign stop ID', async () => {
    const res = await fetch(`${API_BASE}/trips/${trip1Id}/stops/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ orderedStopIds: [stop2Id] }),
    });
    return res.status === 400 || res.status === 403 || res.status === 404;
  });

  // 5. User A reordering User B's activities
  await testCase(5, 'User A reordering User B activities', async () => {
    const res = await fetch(`${API_BASE}/trip-activities/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ orderedActivityIds: [act2Id] }),
    });
    return res.status === 403 || res.status === 400;
  });

  // 6. User A deleting User B's stop
  await testCase(6, 'User A deleting User B stop via trip route', async () => {
    const res = await fetch(`${API_BASE}/trips/${trip1Id}/stops/${stop2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    return res.status === 400 || res.status === 403;
  });

  // 7. User A attaching User B's stop to an expense
  await testCase(7, 'User A attaching User B stop to Trip A expense', async () => {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        tripId: trip1Id,
        tripStopId: stop2Id, // Stop belonging to User 2!
        category: 'Meals',
        amount: 2000,
        description: 'Cross-trip illegal expense link',
        date: '2026-11-02',
      }),
    });
    return res.status === 400;
  });

  // 8. User A accessing User B's intelligence
  await testCase(8, 'User A accessing User B private trip intelligence', async () => {
    const res = await fetch(`${API_BASE}/trips/${trip2Id}/intelligence`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    return res.status === 403;
  });

  // 9. Unauthenticated private intelligence request
  await testCase(9, 'Unauthenticated private trip intelligence request', async () => {
    const res = await fetch(`${API_BASE}/trips/${trip1Id}/intelligence`);
    return res.status === 403;
  });

  // 10. Private trip public URL access
  await testCase(10, 'Private trip public URL access rejection', async () => {
    const shareToken = trip1Data.trip.shareToken;
    const res = await fetch(`${API_BASE}/trips/shared/${shareToken}`);
    return res.status === 403;
  });

  // 11. Invalid JWT
  await testCase(11, 'Invalid JWT token header', async () => {
    const res = await fetch(`${API_BASE}/trips`, {
      headers: { Authorization: 'Bearer invalid_jwt_signature_xyz' },
    });
    return res.status === 401;
  });

  // 12. Expired JWT
  await testCase(12, 'Expired JWT token header', async () => {
    const expiredToken = jwt.sign({ userId: 'fake', email: 'fake@test.com' }, process.env.JWT_SECRET || 'secret', { expiresIn: '-1s' });
    const res = await fetch(`${API_BASE}/trips`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    return res.status === 401;
  });

  // 13. Missing JWT
  await testCase(13, 'Missing JWT authorization header', async () => {
    const res = await fetch(`${API_BASE}/trips`);
    return res.status === 401;
  });

  // 14. Invalid reset token
  await testCase(14, 'Invalid reset token submission', async () => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'bogus_token_123', newPassword: 'NewPassword123!' }),
    });
    return res.status === 400;
  });

  // 15. Expired reset token
  await testCase(15, 'Expired reset token submission', async () => {
    // 15. Expired reset token
    const expiredTokenRaw = `expired_raw_token_${Date.now()}`;
    const expiredHash = (await import('crypto')).createHash('sha256').update(expiredTokenRaw).digest('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: data1.user.id,
        token: expiredHash,
        expiresAt: new Date(Date.now() - 10000), // Expired 10s ago
      },
    });

    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: expiredTokenRaw, newPassword: 'NewPassword123!' }),
    });
    return res.status === 400;
  });

  // 16. Reused reset token
  await testCase(16, 'Reused reset token submission', async () => {
    // Generate valid reset token for User 1
    const rawToken = `valid_reused_token_${Date.now()}`;
    const tokenHash = (await import('crypto')).createHash('sha256').update(rawToken).digest('hex');
    await prisma.passwordResetToken.deleteMany({ where: { userId: data1.user.id } });
    await prisma.passwordResetToken.create({
      data: {
        userId: data1.user.id,
        token: tokenHash,
        expiresAt: new Date(Date.now() + 600000),
      },
    });

    // 1st reset (Success)
    const res1 = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, newPassword: 'NewPassword123!' }),
    });

    // 2nd reset (Fail - Single use invalidation!)
    const res2 = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, newPassword: 'AnotherPassword123!' }),
    });

    return res1.status === 200 && res2.status === 400;
  });

  // 17. Invalid IDs
  await testCase(17, 'Invalid non-existent UUID path parameter', async () => {
    const res = await fetch(`${API_BASE}/trips/non-existent-uuid-999999`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    return res.status === 404;
  });

  // 18. Invalid dates
  await testCase(18, 'Invalid trip dates (endDate < startDate)', async () => {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        name: 'Invalid Date Trip',
        startDate: '2026-11-10',
        endDate: '2026-11-01',
      }),
    });
    return res.status === 400;
  });

  // 19. Negative costs
  await testCase(19, 'Negative expense amount submission', async () => {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        tripId: trip1Id,
        category: 'Meals',
        amount: -500,
        description: 'Negative cost test',
        date: '2026-11-02',
      }),
    });
    return res.status === 400;
  });

  // 20. Invalid activity time
  await testCase(20, 'Invalid activity time (startTime >= endTime)', async () => {
    const res = await fetch(`${API_BASE}/trip-activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        tripStopId: stop1Id,
        customName: 'Impossible Time Event',
        scheduledDate: '2026-11-02',
        startTime: '16:00',
        endTime: '12:00', // End time before start time!
      }),
    });
    return res.status === 400;
  });

  // 21. Unauthorized admin endpoint
  await testCase(21, 'Unauthorized admin telemetry access by normal USER', async () => {
    const res = await fetch(`${API_BASE}/admin/telemetry`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    return res.status === 403;
  });

  // 22. Malicious input
  await testCase(22, 'Malicious XSS script injection input handling', async () => {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        name: '<script>alert("XSS")</script>',
        startDate: '2026-11-01',
        endDate: '2026-11-05',
      }),
    });
    const data: any = await res.json();
    return res.status === 201 && data.trip.name.includes('<script>');
  });

  // 23. Oversized payload
  await testCase(23, 'Oversized payload body rejection', async () => {
    const hugeString = 'A'.repeat(12 * 1024 * 1024); // 12MB string > 10MB limit
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        name: 'Huge Trip',
        description: hugeString,
        startDate: '2026-11-01',
        endDate: '2026-11-05',
      }),
    });
    return res.status === 413 || res.status === 500;
  });

  // 24. Secret leakage audit
  await testCase(24, 'Zero secret leakage in /auth/me profile response', async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const data: any = await res.json();
    return res.status === 200 && !('password' in data.user) && !('passwordHash' in data.user);
  });

  console.log(`\n======================================================`);
  console.log(`🏆 Security Hardening Result: ${passed}/${total} Security Negative Tests PASSED`);
  console.log(`======================================================`);
}

runSecurityNegativeHardeningAudit()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
