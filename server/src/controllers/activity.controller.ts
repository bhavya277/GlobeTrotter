import { Request, Response } from 'express';
import { prisma } from '../db.js';

export const getActivities = async (req: Request, res: Response) => {
  try {
    const { cityId, category, search, maxCost, maxDuration } = req.query;

    const whereClause: any = {};

    if (cityId && typeof cityId === 'string' && cityId !== 'all' && cityId !== 'undefined' && cityId !== 'null') {
      whereClause.cityId = cityId;
    }

    if (category && typeof category === 'string' && category !== 'all' && category !== 'undefined' && category !== 'null') {
      whereClause.category = category;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      whereClause.OR = [
        { name: { contains: search.trim() } },
        { description: { contains: search.trim() } },
        { category: { contains: search.trim() } },
      ];
    }

    if (maxCost && maxCost !== 'undefined' && maxCost !== 'null') {
      const val = parseFloat(maxCost as string);
      if (!isNaN(val)) whereClause.estimatedCost = { lte: val };
    }

    if (maxDuration && maxDuration !== 'undefined' && maxDuration !== 'null') {
      const val = parseInt(maxDuration as string);
      if (!isNaN(val)) whereClause.durationMinutes = { lte: val };
    }

    const activities = await prisma.activity.findMany({
      where: whereClause,
      include: {
        city: true,
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
