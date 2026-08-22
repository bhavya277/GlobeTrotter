import { Request, Response } from 'express';
import { prisma } from '../db.js';

export const getActivities = async (req: Request, res: Response) => {
  try {
    const { cityId, category, search, maxCost, maxDuration } = req.query;

    const whereClause: any = {};

    if (cityId && typeof cityId === 'string') {
      whereClause.cityId = cityId;
    }

    if (category && typeof category === 'string' && category !== 'all') {
      whereClause.category = category;
    }

    if (search && typeof search === 'string') {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (maxCost) {
      whereClause.estimatedCost = { lte: parseFloat(maxCost as string) };
    }

    if (maxDuration) {
      whereClause.durationMinutes = { lte: parseInt(maxDuration as string, 10) };
    }

    const activities = await prisma.activity.findMany({
      where: whereClause,
      include: {
        city: {
          select: { id: true, name: true, country: true },
        },
      },
      orderBy: { rating: 'desc' },
    });

    res.json({ activities });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

export const getActivityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        city: true,
      },
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ activity });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity details' });
  }
};
