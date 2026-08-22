import { Request, Response } from 'express';
import { prisma } from '../db.js';

export const getCities = async (req: Request, res: Response) => {
  try {
    const { search, region, minCost, maxCost, sortBy } = req.query;

    const whereClause: any = {};

    if (search && typeof search === 'string') {
      whereClause.OR = [
        { name: { contains: search } },
        { country: { contains: search } },
        { region: { contains: search } },
      ];
    }

    if (region && typeof region === 'string' && region !== 'all') {
      whereClause.region = { equals: region };
    }

    if (minCost || maxCost) {
      whereClause.costIndex = {
        gte: minCost ? parseFloat(minCost as string) : 1,
        lte: maxCost ? parseFloat(maxCost as string) : 5,
      };
    }

    let orderBy: any = { popularity: 'desc' };
    if (sortBy === 'cost_asc') orderBy = { costIndex: 'asc' };
    if (sortBy === 'cost_desc') orderBy = { costIndex: 'desc' };
    if (sortBy === 'name_asc') orderBy = { name: 'asc' };

    const cities = await prisma.city.findMany({
      where: whereClause,
      orderBy,
      include: {
        _count: {
          select: { activities: true, stops: true },
        },
      },
    });

    res.json({ cities });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
};

export const getCityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { rating: 'desc' },
        },
        _count: {
          select: { stops: true, savedByUsers: true },
        },
      },
    });

    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }

    res.json({ city });
  } catch (error) {
    console.error('Get city error:', error);
    res.status(500).json({ error: 'Failed to fetch city details' });
  }
};
