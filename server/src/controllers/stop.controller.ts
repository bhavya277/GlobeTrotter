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

    // Stop end date cannot be before stop start date
    if (stopEnd < stopStart) {
      return res.status(400).json({ error: 'Stop departure date cannot be before arrival date.' });
    }

    // Overlapping Date Conflict Validation across cities in the same trip
    const overlappingStop = await prisma.tripStop.findFirst({
      where: {
        tripId,
        AND: [
          { startDate: { lte: stopEnd } },
          { endDate: { gte: stopStart } },
        ],
      },
      include: { city: true },
    });

    if (overlappingStop) {
      return res.status(400).json({
        error: `Date Conflict: You already have a stop scheduled in ${overlappingStop.city.name} from ${new Date(overlappingStop.startDate).toLocaleDateString()} to ${new Date(overlappingStop.endDate).toLocaleDateString()}. Multiple city stops cannot have overlapping dates.`,
      });
    }

    // Dynamic Trip Dates Expansion: Automatically adjust parent trip dates to fit user selected stop dates
    let newTripStart = new Date(trip.startDate);
    let newTripEnd = new Date(trip.endDate);
    let tripNeedsUpdate = false;

    if (stopStart < newTripStart) {
      newTripStart = stopStart;
      tripNeedsUpdate = true;
    }

    if (stopEnd > newTripEnd) {
      newTripEnd = stopEnd;
      tripNeedsUpdate = true;
    }

    const stop = await prisma.$transaction(async (tx) => {
      if (tripNeedsUpdate) {
        await tx.trip.update({
          where: { id: tripId },
          data: {
            startDate: newTripStart,
            endDate: newTripEnd,
          },
        });
      }

      const existingStopsCount = await tx.tripStop.count({ where: { tripId } });

      return await tx.tripStop.create({
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

    if (stopEnd < stopStart) {
      return res.status(400).json({ error: 'Stop departure date cannot be before arrival date.' });
    }

    // Overlapping Date Conflict Validation (excluding current stop being edited)
    const overlappingStop = await prisma.tripStop.findFirst({
      where: {
        tripId,
        id: { not: stopId },
        AND: [
          { startDate: { lte: stopEnd } },
          { endDate: { gte: stopStart } },
        ],
      },
      include: { city: true },
    });

    if (overlappingStop) {
      return res.status(400).json({
        error: `Date Conflict: You already have a stop scheduled in ${overlappingStop.city.name} from ${new Date(overlappingStop.startDate).toLocaleDateString()} to ${new Date(overlappingStop.endDate).toLocaleDateString()}. Multiple city stops cannot have overlapping dates.`,
      });
    }

    // Dynamic Trip Dates Expansion
    let newTripStart = new Date(trip.startDate);
    let newTripEnd = new Date(trip.endDate);
    let tripNeedsUpdate = false;

    if (stopStart < newTripStart) {
      newTripStart = stopStart;
      tripNeedsUpdate = true;
    }

    if (stopEnd > newTripEnd) {
      newTripEnd = stopEnd;
      tripNeedsUpdate = true;
    }

    const updatedStop = await prisma.$transaction(async (tx) => {
      if (tripNeedsUpdate) {
        await tx.trip.update({
          where: { id: tripId },
          data: {
            startDate: newTripStart,
            endDate: newTripEnd,
          },
        });
      }

      return await tx.tripStop.update({
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
