import { Request, Response } from 'express';
import { prisma } from '../db.js';

export const getCities = async (req: Request, res: Response) => {
  try {
    const { search, country, region, minPopularity, maxCost, sortBy } = req.query;

    const whereClause: any = {};

    if (search && typeof search === 'string' && search.trim() !== '') {
      whereClause.OR = [
        { name: { contains: search.trim() } },
        { country: { contains: search.trim() } },
        { region: { contains: search.trim() } },
      ];
    }

    if (country && typeof country === 'string' && country !== 'all' && country !== 'undefined' && country !== 'null') {
      whereClause.country = { equals: country };
    }

    if (region && typeof region === 'string' && region !== 'all' && region !== 'undefined' && region !== 'null') {
      whereClause.region = { equals: region };
    }

    if (minPopularity && minPopularity !== 'undefined' && minPopularity !== 'null') {
      const val = parseFloat(minPopularity as string);
      if (!isNaN(val)) whereClause.popularity = { gte: val };
    }

    if (maxCost && maxCost !== 'undefined' && maxCost !== 'null') {
      const val = parseFloat(maxCost as string);
      if (!isNaN(val)) whereClause.costIndex = { lte: val };
    }

    let orderBy: any = { popularity: 'desc' };
    if (sortBy === 'cost_asc') orderBy = { costIndex: 'asc' };
    if (sortBy === 'cost_desc') orderBy = { costIndex: 'desc' };
    if (sortBy === 'name_asc') orderBy = { name: 'asc' };
    if (sortBy === 'popularity') orderBy = { popularity: 'desc' };

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
