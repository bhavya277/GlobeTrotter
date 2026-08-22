import { prisma } from './db.js';

const API_BASE = 'http://localhost:5000/api';

async function runPhase8TestSuite() {
  console.log('🧪 Starting Phase 8 — Budget Engine & Over-Budget Alert Automated Test Suite...\n');
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
  const emailA = `phase8_usera_${Date.now()}@example.com`;
  const emailB = `phase8_userb_${Date.now()}@example.com`;

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

  // Create User A Trip with Budget = ₹40,000 (3 Days: 2026-12-10 to 2026-12-12)
  const tripRes = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'Jaipur & Delhi Budget Trip',
      startDate: '2026-12-10',
      endDate: '2026-12-12',
      totalBudget: 40000,
      currency: 'INR',
    }),
  });
  const tripData: any = await tripRes.json();
  const tripId = tripData.trip.id;

  // 1. Log Expenses Totaling ₹43,500 (Exceeding Budget ₹40,000 by ₹3,500)
  // Stay: ₹25,000, Transport: ₹12,000, Meals: ₹6,500 -> Total ₹43,500
  let expense1Id = '';
  await assertTest('1. Log Expenses (Stay ₹25,000, Transport ₹12,000, Meals ₹6,500)', async () => {
    const e1 = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        tripId,
        category: 'Stay',
        amount: 25000,
        currency: 'INR',
        description: 'Heritage Haveli Hotel (2 Nights)',
        date: '2026-12-10',
      }),
    });
    const data1: any = await e1.json();
    expense1Id = data1.expense.id;

    await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        tripId,
        category: 'Transport',
        amount: 12000,
        currency: 'INR',
        description: 'Train & Private Cab',
        date: '2026-12-10',
      }),
    });

    await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        tripId,
        category: 'Meals',
        amount: 6500,
        currency: 'INR',
        description: 'Traditional Rajasthani Thali Dinners',
        date: '2026-12-11',
      }),
    });

    return e1.status === 201;
  });

  // 2. Over-Budget Alert Calculation Verification (Budget ₹40,000, Total ₹43,500 -> Over Budget ₹3,500)
  await assertTest('2. Over-Budget Alert Verification (⚠️ ₹3,500 over budget)', async () => {
    const res = await fetch(`${API_BASE}/expenses/trip/${tripId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data: any = await res.json();
    if (res.status === 200 && data.summary) {
      const s = data.summary;
      return (
        s.totalBudget === 40000 &&
        s.totalTripCost === 43500 &&
        s.isOverBudget === true &&
        s.overBudgetAmount === 3500 &&
        s.topExcessCategory === 'Stay'
      );
    }
    return false;
  });

  // 3. Category Breakdown Aggregation Check
  await assertTest('3. Category Totals Aggregation (Stay: ₹25,000, Transport: ₹12,000, Meals: ₹6,500)', async () => {
    const res = await fetch(`${API_BASE}/expenses/trip/${tripId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data: any = await res.json();
    if (res.status === 200 && data.categoryTotals) {
      const c = data.categoryTotals;
      return c.Stay === 25000 && c.Transport === 12000 && c.Meals === 6500;
    }
    return false;
  });

  // 4. Daily Breakdown & Over-Budget Days Count
  await assertTest('4. Daily Breakdown & Over-Budget Days Calculation', async () => {
    const res = await fetch(`${API_BASE}/expenses/trip/${tripId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data: any = await res.json();
    return (
      res.status === 200 &&
      Array.isArray(data.dailyBreakdown) &&
      data.dailyBreakdown.length === 3 &&
      data.summary.overBudgetDaysCount > 0
    );
  });

  // 5. Unauthorized Expense Access Blocked
  await assertTest('5. Unauthorized Expense Access Blocked (User B -> User A Trip)', async () => {
    const res = await fetch(`${API_BASE}/expenses/trip/${tripId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    return res.status === 403;
  });

  // 6. Delete Expense & Recalculate Budget
  await assertTest('6. Delete Expense & Dynamic Budget Recalculation', async () => {
    const delRes = await fetch(`${API_BASE}/expenses/${expense1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    if (delRes.status === 200) {
      const summaryRes = await fetch(`${API_BASE}/expenses/trip/${tripId}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const data: any = await summaryRes.json();
      return data.summary.totalTripCost === 18500 && data.summary.isOverBudget === false;
    }
    return false;
  });

  console.log(`\n📊 Phase 8 Budget Engine Test Summary: ${passedCount}/${totalCount} tests PASSED.`);
}

runPhase8TestSuite()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
