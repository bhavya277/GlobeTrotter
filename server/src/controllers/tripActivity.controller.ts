import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

const addTripActivitySchema = z.object({
  tripStopId: z.string().min(1, 'Trip stop ID is required'),
  activityId: z.string().optional(),
  customName: z.string().optional(),
  category: z.string().optional(),
  scheduledDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  customCost: z.number().optional(),
  notes: z.string().optional(),
});

export const addTripActivity = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const validated = addTripActivitySchema.parse(req.body);

    const stop = await prisma.tripStop.findUnique({
      where: { id: validated.tripStopId },
      include: { trip: true },
    });

    if (!stop) return res.status(404).json({ error: 'Trip stop not found' });
    if (stop.trip.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    const existingCount = await prisma.tripActivity.count({
      where: { tripStopId: validated.tripStopId },
    });

    const tripActivity = await prisma.tripActivity.create({
      data: {
        tripStopId: validated.tripStopId,
        activityId: validated.activityId || null,
        customName: validated.customName || null,
        category: validated.category || null,
        scheduledDate: new Date(validated.scheduledDate),
        startTime: validated.startTime || '10:00',
        endTime: validated.endTime || '12:00',
        customCost: validated.customCost ?? 0,
        order: existingCount + 1,
        notes: validated.notes || null,
      },
      include: {
        activity: true,
      },
    });

    res.status(201).json({ tripActivity });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Add trip activity error:', error);
    res.status(500).json({ error: 'Failed to add activity to trip' });
  }
};

export const updateTripActivity = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    const existing = await prisma.tripActivity.findUnique({
      where: { id },
      include: { tripStop: { include: { trip: true } } },
    });

    if (!existing) return res.status(404).json({ error: 'Scheduled activity not found' });
    if (existing.tripStop.trip.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    const { scheduledDate, startTime, endTime, customCost, notes, isCompleted, order, customName } = req.body;

    const updated = await prisma.tripActivity.update({
      where: { id },
      data: {
        ...(scheduledDate && { scheduledDate: new Date(scheduledDate) }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(customCost !== undefined && { customCost: parseFloat(customCost) }),
        ...(notes !== undefined && { notes }),
        ...(isCompleted !== undefined && { isCompleted: Boolean(isCompleted) }),
        ...(order !== undefined && { order: parseInt(order, 10) }),
        ...(customName !== undefined && { customName }),
      },
      include: { activity: true },
    });

    res.json({ tripActivity: updated });
  } catch (error) {
    console.error('Update trip activity error:', error);
    res.status(500).json({ error: 'Failed to update scheduled activity' });
  }
};

export const deleteTripActivity = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    const existing = await prisma.tripActivity.findUnique({
      where: { id },
      include: { tripStop: { include: { trip: true } } },
    });

    if (!existing) return res.status(404).json({ error: 'Scheduled activity not found' });
    if (existing.tripStop.trip.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    await prisma.tripActivity.delete({ where: { id } });

    res.json({ message: 'Activity removed from itinerary' });
  } catch (error) {
    console.error('Delete trip activity error:', error);
    res.status(500).json({ error: 'Failed to remove activity' });
  }
};
