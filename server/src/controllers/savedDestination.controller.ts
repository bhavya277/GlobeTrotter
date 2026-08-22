import { Request, Response } from 'express';
import { prisma } from '../db.js';

export const getSavedDestinations = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const saved = await prisma.savedDestination.findMany({
      where: { userId: req.user.userId },
      include: {
        city: {
          include: {
            _count: { select: { activities: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ savedDestinations: saved.map((s) => s.city) });
  } catch (error) {
    console.error('Get saved destinations error:', error);
    res.status(500).json({ error: 'Failed to fetch saved destinations' });
  }
};

export const toggleSaveDestination = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { cityId } = req.body;
    if (!cityId) return res.status(400).json({ error: 'cityId is required' });

    const existing = await prisma.savedDestination.findUnique({
      where: {
        userId_cityId: {
          userId: req.user.userId,
          cityId,
        },
      },
    });

    if (existing) {
      await prisma.savedDestination.delete({
        where: { id: existing.id },
      });
      return res.json({ saved: false, message: 'Destination removed from saved' });
    } else {
      await prisma.savedDestination.create({
        data: {
          userId: req.user.userId,
          cityId,
        },
      });
      return res.json({ saved: true, message: 'Destination saved successfully' });
    }
  } catch (error) {
    console.error('Toggle save destination error:', error);
    res.status(500).json({ error: 'Failed to save/unsave destination' });
  }
};
