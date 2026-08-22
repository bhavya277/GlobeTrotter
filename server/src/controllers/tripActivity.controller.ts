import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

const addTripActivitySchema = z.object({
  tripStopId: z.string().min(1, 'Trip stop ID is required'),
  activityId: z.string().optional(),
  customName: z.string().optional(),
  category: z.string().optional(),
  scheduledDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  startTime: z.string().optional().default('10:00'),
  endTime: z.string().optional().default('12:00'),
  customCost: z.number().nonnegative('Cost must be non-negative').optional(),
  notes: z.string().optional(),
});

const updateTripActivitySchema = z.object({
  scheduledDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format').optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  customCost: z.number().nonnegative('Cost must be non-negative').optional(),
  notes: z.string().optional(),
  isCompleted: z.boolean().optional(),
  order: z.number().optional(),
  customName: z.string().optional(),
  category: z.string().optional(),
});

export const addTripActivity = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });

    const validated = addTripActivitySchema.parse(req.body);

    const stop = await prisma.tripStop.findUnique({
      where: { id: validated.tripStopId },
      include: { trip: true, city: true },
    });

    if (!stop) return res.status(404).json({ error: 'Trip stop not found' });

    // Security Check: Rule 3 Ownership
    if (stop.trip.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden. You do not own this trip.' });
    }

    // Cross-City Activity Mismatch Protection (Phase 5 Rule)
    if (validated.activityId) {
      const catalogActivity = await prisma.activity.findUnique({
        where: { id: validated.activityId },
        include: { city: true },
      });

      if (!catalogActivity) {
        return res.status(404).json({ error: 'Catalog activity not found' });
      }

      if (catalogActivity.cityId !== stop.cityId) {
        return res.status(400).json({
          error: `Activity City Mismatch: Activity "${catalogActivity.name}" belongs to ${catalogActivity.city.name}, but this trip stop is in ${stop.city.name}. You cannot assign an activity from a different city.`,
        });
      }
    }

    const scheduledDateObj = new Date(validated.scheduledDate);
    const stopStart = new Date(stop.startDate);
    const stopEnd = new Date(stop.endDate);

    // Date Validation: scheduledDate should fall within trip stop dates
    if (scheduledDateObj < stopStart || scheduledDateObj > stopEnd) {
      return res.status(400).json({
        error: `Activity Date Mismatch: Scheduled date (${scheduledDateObj.toLocaleDateString()}) must be within the stop's dates (${stopStart.toLocaleDateString()} - ${stopEnd.toLocaleDateString()}).`,
      });
    }

    const existingCount = await prisma.tripActivity.count({
      where: { tripStopId: validated.tripStopId },
    });

    const tripActivity = await prisma.tripActivity.create({
      data: {
        tripStopId: validated.tripStopId,
        activityId: validated.activityId || null,
        customName: validated.customName?.trim() || null,
        category: validated.category || null,
        scheduledDate: scheduledDateObj,
        startTime: validated.startTime || '10:00',
        endTime: validated.endTime || '12:00',
        customCost: validated.customCost ?? 0,
        order: existingCount + 1,
        notes: validated.notes?.trim() || null,
      },
      include: {
        activity: {
          include: { city: true },
        },
      },
    });

    res.status(201).json({ tripActivity });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Add trip activity error:', error);
    res.status(500).json({ error: 'Failed to add activity to trip stop' });
  }
};

export const updateTripActivity = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });
    const { id } = req.params;

    const existing = await prisma.tripActivity.findUnique({
      where: { id },
      include: { tripStop: { include: { trip: true } } },
    });

    if (!existing) return res.status(404).json({ error: 'Scheduled activity not found' });
    if (existing.tripStop.trip.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden. You do not own this trip.' });
    }

    const validated = updateTripActivitySchema.parse(req.body);

    const updated = await prisma.tripActivity.update({
      where: { id },
      data: {
        ...(validated.scheduledDate && { scheduledDate: new Date(validated.scheduledDate) }),
        ...(validated.startTime !== undefined && { startTime: validated.startTime }),
        ...(validated.endTime !== undefined && { endTime: validated.endTime }),
        ...(validated.customCost !== undefined && { customCost: validated.customCost }),
        ...(validated.notes !== undefined && { notes: validated.notes.trim() || null }),
        ...(validated.isCompleted !== undefined && { isCompleted: validated.isCompleted }),
        ...(validated.order !== undefined && { order: validated.order }),
        ...(validated.customName !== undefined && { customName: validated.customName.trim() || null }),
        ...(validated.category !== undefined && { category: validated.category }),
      },
      include: {
        activity: {
          include: { city: true },
        },
      },
    });

    res.json({ tripActivity: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update trip activity error:', error);
    res.status(500).json({ error: 'Failed to update scheduled activity' });
  }
};

export const deleteTripActivity = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });
    const { id } = req.params;

    const existing = await prisma.tripActivity.findUnique({
      where: { id },
      include: { tripStop: { include: { trip: true } } },
    });

    if (!existing) return res.status(404).json({ error: 'Scheduled activity not found' });
    if (existing.tripStop.trip.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden. You do not own this trip.' });
    }

    await prisma.tripActivity.delete({ where: { id } });

    res.json({ message: 'Activity removed from itinerary stop' });
  } catch (error) {
    console.error('Delete trip activity error:', error);
    res.status(500).json({ error: 'Failed to remove activity' });
  }
};
