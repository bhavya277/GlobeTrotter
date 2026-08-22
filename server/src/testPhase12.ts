import { prisma } from './db.js';

const API_BASE = 'http://localhost:5000/api';

async function runPhase12TestSuite() {
  console.log('🧪 Starting Phase 12 — Admin Dashboard & Server-Side RBAC Automated Test Suite...\n');
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

  // Register Normal User (role === 'USER')
  const emailUser = `normal_user_${Date.now()}@example.com`;
  const resUser = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Normal User', email: emailUser, password: 'password123' }),
  });
  const dataUser: any = await resUser.json();
  const tokenUser = dataUser.token;

  // Register Admin User (promoted to role === 'ADMIN' directly in DB)
  const emailAdmin = `admin_user_${Date.now()}@example.com`;
  const resAdmin = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Admin User', email: emailAdmin, password: 'password123' }),
  });
  const dataAdmin: any = await resAdmin.json();
  const tokenAdmin = dataAdmin.token;
  const adminId = dataAdmin.user.id;

  // Promote Admin User role to ADMIN in DB
  await prisma.user.update({
    where: { id: adminId },
    data: { role: 'ADMIN' },
  });

  // 1. Normal User Accessing Admin Endpoints Blocked (Server-side RBAC Rule)
  await assertTest('1. Normal User Accessing Admin Endpoints Blocked (HTTP 403)', async () => {
    const statsRes = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${tokenUser}` },
    });
    const usersRes = await fetch(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${tokenUser}` },
    });
    return statsRes.status === 403 && usersRes.status === 403;
  });

  // 2. Admin User Authorization Allowed
  await assertTest('2. Admin User Authorization Allowed (HTTP 200)', async () => {
    const statsRes = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const data: any = await statsRes.json();
    return statsRes.status === 200 && data.stats && typeof data.stats.totalUsers === 'number';
  });

  // 3. User Role Promotion / Demotion (Admin -> Promote Normal User to ADMIN)
  await assertTest('3. User Role Promotion (Admin promotes Normal User to ADMIN)', async () => {
    const res = await fetch(`${API_BASE}/admin/users/${dataUser.user.id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ role: 'ADMIN' }),
    });
    const data: any = await res.json();
    if (res.status === 200 && data.user.role === 'ADMIN') {
      const dbUser = await prisma.user.findUnique({ where: { id: dataUser.user.id } });
      return dbUser?.role === 'ADMIN';
    }
    return false;
  });

  // 4. Admin User Deletion (Admin deletes a user account)
  await assertTest('4. Admin User Deletion (Admin deletes a target user)', async () => {
    const res = await fetch(`${API_BASE}/admin/users/${dataUser.user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    if (res.status === 200) {
      const dbUser = await prisma.user.findUnique({ where: { id: dataUser.user.id } });
      return dbUser === null;
    }
    return false;
  });

  console.log(`\n📊 Phase 12 Admin Dashboard & RBAC Test Summary: ${passedCount}/${totalCount} tests PASSED.`);
}

runPhase12TestSuite()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
