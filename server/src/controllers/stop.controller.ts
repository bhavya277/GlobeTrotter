import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

const addStopSchema = z.object({
  cityId: z.string().min(1, 'City ID is required'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
  order: z.number().optional(),
  notes: z.string().optional(),
});

const updateStopSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date').optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date').optional(),
  order: z.number().optional(),
  notes: z.string().optional(),
});

const reorderStopsSchema = z.object({
  orderedStopIds: z.array(z.string()).min(1, 'Ordered stop IDs required'),
});

export const addStop = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden. You do not own this trip.' });
    }

    const validated = addStopSchema.parse(req.body);

    // City Existence Check
    const city = await prisma.city.findUnique({ where: { id: validated.cityId } });
    if (!city) return res.status(404).json({ error: 'Selected city does not exist' });

    const stopStart = new Date(validated.startDate);
    const stopEnd = new Date(validated.endDate);

    // Validation 1: Stop start <= stop end
    if (stopEnd < stopStart) {
      return res.status(400).json({ error: 'Stop end date cannot be before stop start date.' });
    }

    // Validation 2: Stop dates within overall parent trip dates
    const tripStart = new Date(trip.startDate);
    const tripEnd = new Date(trip.endDate);

    if (stopStart < tripStart || stopEnd > tripEnd) {
      return res.status(400).json({
        error: `Stop dates (${stopStart.toLocaleDateString()} - ${stopEnd.toLocaleDateString()}) must be within the overall trip dates (${tripStart.toLocaleDateString()} - ${tripEnd.toLocaleDateString()}).`,
      });
    }

    const existingStopsCount = await prisma.tripStop.count({ where: { tripId } });

    const stop = await prisma.tripStop.create({
      data: {
        tripId,
        cityId: validated.cityId,
        startDate: stopStart,
        endDate: stopEnd,
        order: validated.order ?? (existingStopsCount + 1),
        notes: validated.notes?.trim() || null,
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
    res.status(500).json({ error: 'Failed to add city stop to trip' });
  }
};

export const updateStop = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });
    const { tripId, stopId } = req.params;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden. You do not own this trip.' });
    }

    const existingStop = await prisma.tripStop.findUnique({ where: { id: stopId } });
    if (!existingStop || existingStop.tripId !== tripId) {
      return res.status(404).json({ error: 'Stop not found in this trip' });
    }

    const validated = updateStopSchema.parse(req.body);

    const stopStart = validated.startDate ? new Date(validated.startDate) : existingStop.startDate;
    const stopEnd = validated.endDate ? new Date(validated.endDate) : existingStop.endDate;

    // Validation: stopEnd >= stopStart
    if (stopEnd < stopStart) {
      return res.status(400).json({ error: 'Stop end date cannot be before stop start date.' });
    }

    // Validation: Stop dates within parent trip bounds
    const tripStart = new Date(trip.startDate);
    const tripEnd = new Date(trip.endDate);

    if (stopStart < tripStart || stopEnd > tripEnd) {
      return res.status(400).json({
        error: `Stop dates must be within overall trip dates (${tripStart.toLocaleDateString()} - ${tripEnd.toLocaleDateString()}).`,
      });
    }

    const updatedStop = await prisma.tripStop.update({
      where: { id: stopId },
      data: {
        ...(validated.startDate && { startDate: stopStart }),
        ...(validated.endDate && { endDate: stopEnd }),
        ...(validated.order !== undefined && { order: validated.order }),
        ...(validated.notes !== undefined && { notes: validated.notes.trim() || null }),
      },
      include: {
        city: true,
      },
    });

    res.json({ stop: updatedStop });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update stop error:', error);
    res.status(500).json({ error: 'Failed to update trip stop' });
  }
};

export const reorderStops = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden. You do not own this trip.' });
    }

    const validated = reorderStopsSchema.parse(req.body);

    await prisma.$transaction(
      validated.orderedStopIds.map((id, index) =>
        prisma.tripStop.update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    );

    const updatedStops = await prisma.tripStop.findMany({
      where: { tripId },
      include: { city: true },
      orderBy: { order: 'asc' },
    });

    res.json({ stops: updatedStops });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Reorder stops error:', error);
    res.status(500).json({ error: 'Failed to reorder trip stops' });
  }
};

export const deleteStop = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });
    const { tripId, stopId } = req.params;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden. You do not own this trip.' });
    }

    await prisma.tripStop.delete({ where: { id: stopId } });

    res.json({ message: 'City stop removed from itinerary' });
  } catch (error) {
    console.error('Delete stop error:', error);
    res.status(500).json({ error: 'Failed to remove city stop' });
  }
};
