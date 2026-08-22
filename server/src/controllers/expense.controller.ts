import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

const createExpenseSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  tripStopId: z.string().optional(),
  category: z.enum(['Transport', 'Stay', 'Activities', 'Meals', 'Shopping', 'Other']).default('Other'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('INR'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
});

export const getTripExpenseSummary = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        stops: {
          include: {
            city: true,
            tripActivities: {
              include: { activity: true },
            },
          },
        },
        expenses: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    const isOwner = !!(req.user && trip.userId === req.user.userId);
    if (!isOwner && trip.visibility !== 'PUBLIC') {
      return res.status(403).json({ error: 'Forbidden. Access denied to trip expenses.' });
    }

    // 1. Calculate Logged Expenses (ONLY for trip owner!)
    const loggedExpenses = isOwner ? trip.expenses : [];

    // 2. Calculate Scheduled Activity Costs from TripActivities
    let activityTotalCost = 0;
    const activityCategoryBreakdown: Record<string, number> = {};

    trip.stops.forEach((stop) => {
      stop.tripActivities.forEach((act) => {
        const cost = act.customCost ?? act.activity?.estimatedCost ?? 0;
        activityTotalCost += cost;
        const cat = act.category || act.activity?.category || 'Activities';
        activityCategoryBreakdown[cat] = (activityCategoryBreakdown[cat] || 0) + cost;
      });
    });

    // 3. Category Breakdown (Combining Logged Expenses + Activity Costs)
    const categoryTotals: Record<string, number> = {
      Transport: 0,
      Stay: 0,
      Activities: activityTotalCost,
      Meals: 0,
      Shopping: 0,
      Other: 0,
    };

    loggedExpenses.forEach((e) => {
      const catKey = e.category === 'Accommodation' ? 'Stay' : e.category;
      categoryTotals[catKey] = (categoryTotals[catKey] || 0) + e.amount;
    });

    const totalLoggedCost = loggedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalTripCost = totalLoggedCost + activityTotalCost;
    const totalBudget = trip.totalBudget || 0;
    const remainingBudget = Math.max(0, totalBudget - totalTripCost);
    const isOverBudget = totalTripCost > totalBudget && totalBudget > 0;
    const overBudgetAmount = isOverBudget ? totalTripCost - totalBudget : 0;

    // Identify primary category driving budget excess
    let topExcessCategory = 'Activities';
    let maxCategoryCost = 0;
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      if (amt > maxCategoryCost) {
        maxCategoryCost = amt;
        topExcessCategory = cat;
      }
    });

    // 4. Daily Cost Breakdown & Over-Budget Days Calculation
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const targetDailyBudget = totalBudget > 0 ? totalBudget / totalDays : 0;
    const averageDailyCost = totalTripCost / totalDays;

    const dailyBreakdown: Array<{
      dateStr: string;
      cost: number;
      isOverBudget: boolean;
      targetBudget: number;
    }> = [];

    let overBudgetDaysCount = 0;

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      // Sum expenses on date
      const dayLogged = loggedExpenses
        .filter((e) => new Date(e.date).toISOString().split('T')[0] === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);

      // Sum activities on date
      let dayActivitiesCost = 0;
      trip.stops.forEach((stop) => {
        stop.tripActivities.forEach((act) => {
          if (new Date(act.scheduledDate).toISOString().split('T')[0] === dateStr) {
            dayActivitiesCost += act.customCost ?? act.activity?.estimatedCost ?? 0;
          }
        });
      });

      const dayTotalCost = dayLogged + dayActivitiesCost;
      const isDayOver = targetDailyBudget > 0 && dayTotalCost > targetDailyBudget;
      if (isDayOver) overBudgetDaysCount++;

      dailyBreakdown.push({
        dateStr,
        cost: dayTotalCost,
        isOverBudget: isDayOver,
        targetBudget: targetDailyBudget,
      });
    }

    // 5. City Stop Cost Breakdown
    const cityBreakdown = trip.stops.map((stop) => {
      const stopActivitiesCost = stop.tripActivities.reduce(
        (sum, act) => sum + (act.customCost ?? act.activity?.estimatedCost ?? 0),
        0
      );
      const stopExpensesCost = loggedExpenses
        .filter((e) => e.tripStopId === stop.id)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        stopId: stop.id,
        cityName: stop.city.name,
        activitiesCost: stopActivitiesCost,
        loggedExpensesCost: stopExpensesCost,
        totalCost: stopActivitiesCost + stopExpensesCost,
      };
    });

    // 6. Automatic Pre-Trip Budget Estimation Engine (P0 PS Fix 12)
    let estimatedStayCost = 0;
    let estimatedMealsCost = 0;
    let estimatedTransportCost = 0;
    let estimatedActivitiesCost = 0;

    trip.stops.forEach((stop) => {
      const stopDays = Math.max(1, Math.ceil((new Date(stop.endDate).getTime() - new Date(stop.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const costFactor = stop.city.costIndex || 3.0;

      estimatedStayCost += Math.round(costFactor * 1500 * stopDays);
      estimatedMealsCost += Math.round(costFactor * 800 * stopDays);
      estimatedTransportCost += Math.round(costFactor * 400 * stopDays);

      const stopActCost = stop.tripActivities.reduce((s, a) => s + (a.customCost ?? a.activity?.estimatedCost ?? 0), 0);
      estimatedActivitiesCost += stopActCost > 0 ? stopActCost : Math.round(costFactor * 600 * stopDays);
    });

    const estimatedTotalCost = estimatedStayCost + estimatedMealsCost + estimatedTransportCost + estimatedActivitiesCost;
    const isEstimateOverBudget = totalBudget > 0 && estimatedTotalCost > totalBudget;

    res.json({
      summary: {
        currency: trip.currency || 'INR',
        totalBudget,
        totalTripCost,
        totalLoggedCost,
        activityTotalCost,
        remainingBudget,
        isOverBudget,
        overBudgetAmount,
        topExcessCategory,
        totalDays,
        averageDailyCost,
        targetDailyBudget,
        overBudgetDaysCount,
      },
      estimation: {
        estimatedTotalCost,
        estimatedStayCost,
        estimatedMealsCost,
        estimatedTransportCost,
        estimatedActivitiesCost,
        isEstimateOverBudget,
        estimatedOverrun: isEstimateOverBudget ? estimatedTotalCost - totalBudget : 0,
        averageDailyEstimate: totalDays > 0 ? Math.round(estimatedTotalCost / totalDays) : 0,
      },
      categoryTotals,
      dailyBreakdown,
      cityBreakdown,
      expenses: loggedExpenses,
    });
  } catch (error) {
    console.error('Get trip expense summary error:', error);
    res.status(500).json({ error: 'Failed to compute trip budget calculations' });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });

    const validated = createExpenseSchema.parse(req.body);

    const trip = await prisma.trip.findUnique({ where: { id: validated.tripId } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden. You do not own this trip.' });
    }

    if (validated.tripStopId) {
      const stop = await prisma.tripStop.findUnique({ where: { id: validated.tripStopId } });
      if (!stop) return res.status(404).json({ error: 'Trip stop not found' });
      if (stop.tripId !== validated.tripId) {
        return res.status(400).json({ error: 'Trip stop does not belong to the specified trip.' });
      }
    }

    const expense = await prisma.expense.create({
      data: {
        tripId: validated.tripId,
        tripStopId: validated.tripStopId || null,
        category: validated.category,
        amount: validated.amount,
        currency: validated.currency,
        description: validated.description.trim(),
        date: new Date(validated.date),
      },
    });

    res.status(201).json({ expense });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to log expense' });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });
    const { id } = req.params;

    const existing = await prisma.expense.findUnique({
      where: { id },
      include: { trip: true },
    });

    if (!existing) return res.status(404).json({ error: 'Expense log not found' });
    if (existing.trip.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden. You do not own this trip.' });
    }

    await prisma.expense.delete({ where: { id } });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};
