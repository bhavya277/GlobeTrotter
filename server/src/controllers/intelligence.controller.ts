import { Request, Response } from 'express';
import { prisma } from '../db.js';

// Haversine formula to compute distance between 2 geographical points (lat/lng) in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const getTripIntelligence = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId;

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
          orderBy: { order: 'asc' },
        },
        expenses: true,
      },
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    // Security Authorization Rule (P0 Security Fix 1):
    const isOwner = Boolean(userId && userId === trip.userId);
    const isPublic = trip.visibility === 'PUBLIC';

    if (!isOwner && !isPublic) {
      return res.status(403).json({ error: 'Access denied. Private trip intelligence is accessible only to its creator.' });
    }

    // User preferences & saved destinations
    let savedCityIds: string[] = [];
    if (userId) {
      const saved = await prisma.savedDestination.findMany({
        where: { userId },
        select: { cityId: true },
      });
      savedCityIds = saved.map((s) => s.cityId);
    }

    // 1. Smart Budget Optimizer
    const budgetOptimizer: Array<{
      title: string;
      percentageShare: number;
      insight: string;
      suggestion: string;
      type: 'warning' | 'info';
    }> = [];

    const effectiveExpenses = isOwner ? trip.expenses : [];
    const totalExpensesCost = effectiveExpenses.reduce((sum, e) => sum + e.amount, 0);

    let totalActivitiesCost = 0;
    const cityCostMap: Record<string, { name: string; cost: number }> = {};
    const categoryCostMap: Record<string, number> = {};

    trip.stops.forEach((stop) => {
      let stopCost = 0;
      stop.tripActivities.forEach((act) => {
        const cost = act.customCost ?? act.activity?.estimatedCost ?? 0;
        totalActivitiesCost += cost;
        stopCost += cost;

        const cat = act.category || act.activity?.category || 'General';
        categoryCostMap[cat] = (categoryCostMap[cat] || 0) + cost;
      });

      // Add logged expenses for stop
      const stopExpenses = trip.expenses
        .filter((e) => e.tripStopId === stop.id)
        .reduce((sum, e) => sum + e.amount, 0);

      const totalStopCost = stopCost + stopExpenses;
      cityCostMap[stop.city.name] = {
        name: stop.city.name,
        cost: totalStopCost,
      };
    });

    const totalTripCost = totalExpensesCost + totalActivitiesCost;

    if (totalTripCost > 0) {
      // Analyze city cost concentration
      Object.values(cityCostMap).forEach((city) => {
        const share = Math.round((city.cost / totalTripCost) * 100);
        if (share >= 30) {
          budgetOptimizer.push({
            title: `High Cost Concentration in ${city.name}`,
            percentageShare: share,
            insight: `Your ${city.name} stay accounts for ${share}% (₹${city.cost.toLocaleString()}) of the total trip cost.`,
            suggestion: `Consider exploring budget-friendly dining or free walking tours in ${city.name} to balance expenses.`,
            type: 'warning',
          });
        }
      });

      // Analyze category cost concentration
      Object.entries(categoryCostMap).forEach(([cat, cost]) => {
        const share = Math.round((cost / totalTripCost) * 100);
        if (share >= 35) {
          budgetOptimizer.push({
            title: `${cat} Expenses Dominating Budget`,
            percentageShare: share,
            insight: `${cat} activities consume ${share}% (₹${cost.toLocaleString()}) of your planned expenditure.`,
            suggestion: `Swapping 1-2 premium ${cat.toLowerCase()} activities with free scenic spots can save up to ₹${Math.round(cost * 0.25).toLocaleString()}.`,
            type: 'info',
          });
        }
      });
    }

    // 2. Smart Daily Balance
    const dailyBalance: Array<{
      dateStr: string;
      activityCount: number;
      estimatedHours: number;
      insight: string;
      recommendation: string;
      isOverloaded: boolean;
    }> = [];

    const dateActivityMap: Record<string, { count: number; durationMins: number; names: string[] }> = {};

    trip.stops.forEach((stop) => {
      stop.tripActivities.forEach((act) => {
        const dateStr = new Date(act.scheduledDate).toISOString().split('T')[0];
        const duration = act.activity?.durationMinutes || 90;

        if (!dateActivityMap[dateStr]) {
          dateActivityMap[dateStr] = { count: 0, durationMins: 0, names: [] };
        }

        dateActivityMap[dateStr].count += 1;
        dateActivityMap[dateStr].durationMins += duration;
        dateActivityMap[dateStr].names.push(act.activity?.name || act.customName || 'Activity');
      });
    });

    Object.entries(dateActivityMap).forEach(([dateStr, data]) => {
      const estimatedHours = Math.round((data.durationMins / 60) * 10) / 10;
      const isOverloaded = data.count >= 4 || estimatedHours >= 7;

      if (isOverloaded) {
        dailyBalance.push({
          dateStr,
          activityCount: data.count,
          estimatedHours,
          insight: `${new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} contains ${data.count} activities totaling ~${estimatedHours} hours of active travel.`,
          recommendation: `Heavy schedule detected. Consider moving 1 activity to a lighter day to prevent travel exhaustion.`,
          isOverloaded: true,
        });
      }
    });

    // 3. Travel Flow Intelligence (City Sequencing & Route Efficiency)
    const stops = trip.stops;
    let totalDistanceKm = 0;
    const routeLegs: Array<{ from: string; to: string; distanceKm: number }> = [];

    for (let i = 0; i < stops.length - 1; i++) {
      const fromCity = stops[i].city;
      const toCity = stops[i + 1].city;

      const dist = calculateDistanceKm(
        fromCity.latitude,
        fromCity.longitude,
        toCity.latitude,
        toCity.longitude
      );

      totalDistanceKm += dist;
      routeLegs.push({
        from: fromCity.name,
        to: toCity.name,
        distanceKm: dist,
      });
    }

    // Check for inefficient travel flow (e.g. Leg 1 > 800km and Leg 2 backtracks)
    let flowInsight = '';
    let isFlowEfficient = true;
    if (routeLegs.length >= 2) {
      if (routeLegs[0].distanceKm > routeLegs[1].distanceKm * 2) {
        isFlowEfficient = false;
        flowInsight = `Current sequence (${routeLegs.map((l) => l.from).join(' → ')} → ${routeLegs[routeLegs.length - 1].to}) involves long-distance jumps (${totalDistanceKm} km total). Reordering stops chronologically could optimize transit times.`;
      }
    }

    const travelFlow = {
      totalDistanceKm,
      stopsCount: stops.length,
      routeLegs,
      isFlowEfficient,
      flowInsight: flowInsight || `Optimal sequential travel sequence connecting ${stops.map((s) => s.city.name).join(' → ')} (${totalDistanceKm} km total transit distance).`,
    };

    // 4. Personalized Recommendations (With VISIBLE EXPLICIT REASONS)
    const tripCityIds = stops.map((s) => s.cityId);

    // Fetch activities matching user's trip cities or saved destinations
    const candidateActivities = await prisma.activity.findMany({
      where: {
        cityId: { in: [...tripCityIds, ...savedCityIds] },
      },
      include: { city: true },
      take: 6,
    });

    const personalizedRecommendations = candidateActivities.map((act) => {
      let reason = `Recommended because you are visiting ${act.city.name}.`;
      if (savedCityIds.includes(act.cityId)) {
        reason = `Recommended because you saved ${act.city.name} to your bookmarked destinations.`;
      } else if (categoryCostMap[act.category] && categoryCostMap[act.category] > 0) {
        reason = `Recommended based on your interest in ${act.category} experiences during this trip.`;
      }

      return {
        id: act.id,
        name: act.name,
        cityName: act.city.name,
        category: act.category,
        estimatedCost: act.estimatedCost,
        rating: act.rating,
        image: act.image,
        reason, // Mandatory Visible Rationale!
      };
    });

    res.json({
      intelligence: {
        budgetOptimizer,
        dailyBalance,
        travelFlow,
        personalizedRecommendations,
      },
    });
  } catch (error) {
    console.error('Get trip intelligence error:', error);
    res.status(500).json({ error: 'Failed to compute trip intelligence layer' });
  }
};
