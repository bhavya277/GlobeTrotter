import { Request, Response } from 'express';
import { prisma } from '../db.js';

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalTrips,
      totalCities,
      totalActivities,
      totalExpenses,
      popularCitiesRaw,
      popularActivitiesRaw,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.trip.count(),
      prisma.city.count(),
      prisma.activity.count(),
      prisma.expense.count(),
      prisma.tripStop.groupBy({
        by: ['cityId'],
        _count: { cityId: true },
        orderBy: { _count: { cityId: 'desc' } },
        take: 5,
      }),
      prisma.tripActivity.groupBy({
        by: ['activityId'],
        where: { activityId: { not: null } },
        _count: { activityId: true },
        orderBy: { _count: { activityId: 'desc' } },
        take: 5,
      }),
    ]);

    // Populate popular city names
    const cityIds = popularCitiesRaw.map((c) => c.cityId);
    const citiesMap = await prisma.city.findMany({
      where: { id: { in: cityIds } },
      select: { id: true, name: true, country: true },
    });

    const popularCities = popularCitiesRaw.map((item) => {
      const city = citiesMap.find((c) => c.id === item.cityId);
      return {
        cityName: city?.name || 'Unknown',
        country: city?.country || '',
        stopCount: item._count.cityId,
      };
    });

    // Populate popular activity names
    const actIds = popularActivitiesRaw.map((a) => a.activityId!).filter(Boolean);
    const activitiesMap = await prisma.activity.findMany({
      where: { id: { in: actIds } },
      select: { id: true, name: true, category: true },
    });

    const popularActivities = popularActivitiesRaw.map((item) => {
      const act = activitiesMap.find((a) => a.id === item.activityId);
      return {
        name: act?.name || 'Unknown',
        category: act?.category || 'General',
        scheduledCount: item._count.activityId,
      };
    });

    res.json({
      stats: {
        totalUsers,
        totalTrips,
        totalCities,
        totalActivities,
        totalExpenses,
      },
      popularCities,
      popularActivities,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin analytics' });
  }
};

export const getAdminUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePhoto: true,
        createdAt: true,
        _count: {
          select: { trips: true, savedDestinations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be USER or ADMIN.' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ user: updated, message: `User role updated to ${role}` });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

export const deleteUserByAdmin = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (userId === req.user?.userId) {
      return res.status(400).json({ error: 'Admins cannot delete their own account via admin management.' });
    }

    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: 'User account and associated records deleted by admin.' });
  } catch (error) {
    console.error('Delete user by admin error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
