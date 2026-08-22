import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

const addStopSchema = z.object({
  cityId: z.string().min(1, 'City is required'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
  order: z.number().optional(),
  notes: z.string().optional(),
});

export const addStop = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    const validated = addStopSchema.parse(req.body);

    const existingStopsCount = await prisma.tripStop.count({ where: { tripId } });

    const stop = await prisma.tripStop.create({
      data: {
        tripId,
        cityId: validated.cityId,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        order: validated.order ?? (existingStopsCount + 1),
        notes: validated.notes,
      },
      include: {
        city: true,
      },
    });

    res.status(201).json({ stop });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Add stop error:', error);
    res.status(500).json({ error: 'Failed to add stop' });
  }
};

export const deleteStop = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { tripId, stopId } = req.params;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    await prisma.tripStop.delete({ where: { id: stopId } });

    res.json({ message: 'Stop removed successfully' });
  } catch (error) {
    console.error('Delete stop error:', error);
    res.status(500).json({ error: 'Failed to remove stop' });
  }
};
