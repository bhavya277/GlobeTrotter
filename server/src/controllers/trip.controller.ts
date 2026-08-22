import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../db.js';

const createTripSchema = z.object({
  name: z.string().min(2, 'Trip name must be at least 2 characters'),
  description: z.string().optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
  coverPhoto: z.string().optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC', 'UNLISTED']).default('PRIVATE'),
  totalBudget: z.number().nonnegative('Total budget must be non-negative').optional().default(0),
  currency: z.string().default('INR'),
  cityIds: z.array(z.string()).optional(),
});

const updateTripSchema = z.object({
  name: z.string().min(2, 'Trip name must be at least 2 characters').optional(),
  description: z.string().optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date').optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date').optional(),
  coverPhoto: z.string().optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC', 'UNLISTED']).optional(),
  totalBudget: z.number().nonnegative('Total budget must be non-negative').optional(),
  currency: z.string().optional(),
});

export const getMyTrips = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });

    const trips = await prisma.trip.findMany({
      where: { userId: req.user.userId },
      include: {
        stops: {
          include: {
            city: true,
            tripActivities: true,
          },
          orderBy: { order: 'asc' },
        },
        expenses: true,
      },
      orderBy: { startDate: 'asc' },
    });

    res.json({ trips });
  } catch (error) {
    console.error('Get my trips error:', error);
    res.status(500).json({ error: 'Failed to fetch user trips' });
  }
};

export const getTripById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, profilePhoto: true },
        },
        stops: {
          include: {
            city: true,
            tripActivities: {
              include: {
                activity: true,
              },
              orderBy: { order: 'asc' },
            },
            expenses: true,
          },
          orderBy: { order: 'asc' },
        },
        expenses: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Security Check: Rule 3 & Phase 10 User Isolation
    const isOwner = currentUserId === trip.userId;
    const isPublic = trip.visibility === 'PUBLIC';

    if (!isOwner && !isPublic) {
      return res.status(403).json({ error: 'Access denied. Private trips are accessible only to their creator.' });
    }

    res.json({ trip, isOwner });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ error: 'Failed to fetch trip details' });
  }
};

export const getTripByShareToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { shareToken: token },
      include: {
        user: {
          select: { id: true, name: true, profilePhoto: true },
        },
        stops: {
          include: {
            city: true,
            tripActivities: {
              include: {
                activity: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        expenses: true,
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Shared itinerary not found or link has expired.' });
    }

    // Security: Ensure private trips cannot be accessed via share token if visibility is explicitly PRIVATE
    if (trip.visibility === 'PRIVATE' && req.user?.userId !== trip.userId) {
      return res.status(403).json({ error: 'Access denied. This trip is set to Private.' });
    }

    res.json({ trip, isShared: true });
  } catch (error) {
    console.error('Get shared trip error:', error);
    res.status(500).json({ error: 'Failed to fetch shared trip' });
  }
};

export const createTrip = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });

    const validated = createTripSchema.parse(req.body);

    const start = new Date(validated.startDate);
    const end = new Date(validated.endDate);

    if (end < start) {
      return res.status(400).json({ error: 'End date cannot be before start date.' });
    }

    const shareToken = crypto.randomBytes(16).toString('hex');
    const defaultCover = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';

    const trip = await prisma.$transaction(async (tx) => {
      const createdTrip = await tx.trip.create({
        data: {
          userId: req.user!.userId,
          name: validated.name.trim(),
          description: validated.description?.trim(),
          startDate: start,
          endDate: end,
          coverPhoto: validated.coverPhoto || defaultCover,
          visibility: validated.visibility,
          totalBudget: validated.totalBudget,
          currency: validated.currency,
          shareToken,
        },
      });

      if (validated.cityIds && validated.cityIds.length > 0) {
        const totalCities = validated.cityIds.length;
        const totalDurationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        const daysPerCity = Math.max(1, Math.floor(totalDurationDays / totalCities));

        for (let i = 0; i < validated.cityIds.length; i++) {
          const stopStart = new Date(start);
          stopStart.setDate(stopStart.getDate() + i * daysPerCity);

          const stopEnd = new Date(stopStart);
          stopEnd.setDate(stopEnd.getDate() + (i === totalCities - 1 ? totalDurationDays - i * daysPerCity : daysPerCity));

          await tx.tripStop.create({
            data: {
              tripId: createdTrip.id,
              cityId: validated.cityIds[i],
              startDate: stopStart,
              endDate: stopEnd,
              order: i + 1,
            },
          });
        }
      }

      return createdTrip;
    });

    const fullTrip = await prisma.trip.findUnique({
      where: { id: trip.id },
      include: {
        stops: {
          include: { city: true },
        },
      },
    });

    res.status(201).json({ trip: fullTrip });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
};

export const copyTrip = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });
    const { token } = req.params;

    // Find original trip by shareToken or id
    const originalTrip = await prisma.trip.findFirst({
      where: {
        OR: [{ shareToken: token }, { id: token }],
      },
      include: {
        stops: {
          include: {
            tripActivities: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!originalTrip) {
      return res.status(404).json({ error: 'Source trip to copy not found.' });
    }

    // Security Check: Verify source trip is PUBLIC or owned by requester
    if (originalTrip.visibility === 'PRIVATE' && originalTrip.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden. Cannot copy a private trip.' });
    }

    const newShareToken = crypto.randomBytes(16).toString('hex');

    // Create cloned trip owned 100% by requesting user (Phase 10 Rule)
    const clonedTrip = await prisma.$transaction(async (tx) => {
      const created = await tx.trip.create({
        data: {
          userId: req.user!.userId, // New owner!
          name: `${originalTrip.name} (Copy)`,
          description: originalTrip.description,
          startDate: originalTrip.startDate,
          endDate: originalTrip.endDate,
          coverPhoto: originalTrip.coverPhoto,
          visibility: 'PRIVATE', // Default copied trip to PRIVATE for requester
          totalBudget: originalTrip.totalBudget,
          currency: originalTrip.currency,
          shareToken: newShareToken,
        },
      });

      // Clone Stops and Activities
      for (const stop of originalTrip.stops) {
        const createdStop = await tx.tripStop.create({
          data: {
            tripId: created.id,
            cityId: stop.cityId,
            startDate: stop.startDate,
            endDate: stop.endDate,
            order: stop.order,
            notes: stop.notes,
          },
        });

        for (const act of stop.tripActivities) {
          await tx.tripActivity.create({
            data: {
              tripStopId: createdStop.id,
              activityId: act.activityId,
              customName: act.customName,
              category: act.category,
              scheduledDate: act.scheduledDate,
              startTime: act.startTime,
              endTime: act.endTime,
              customCost: act.customCost,
              order: act.order,
              notes: act.notes,
              isCompleted: false,
            },
          });
        }
      }

      return created;
    });

    const fullCopiedTrip = await prisma.trip.findUnique({
      where: { id: clonedTrip.id },
      include: {
        stops: {
          include: { city: true, tripActivities: true },
        },
      },
    });

    res.status(201).json({ trip: fullCopiedTrip, message: 'Trip successfully copied to your account!' });
  } catch (error) {
    console.error('Copy trip error:', error);
    res.status(500).json({ error: 'Failed to copy trip itinerary' });
  }
};

export const updateTrip = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });
    const { id } = req.params;

    const existingTrip = await prisma.trip.findUnique({ where: { id } });
    if (!existingTrip) return res.status(404).json({ error: 'Trip not found' });

    if (existingTrip.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden. You do not own this trip.' });
    }

    const validated = updateTripSchema.parse(req.body);

    const start = validated.startDate ? new Date(validated.startDate) : existingTrip.startDate;
    const end = validated.endDate ? new Date(validated.endDate) : existingTrip.endDate;

    if (end < start) {
      return res.status(400).json({ error: 'End date cannot be before start date.' });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name.trim() }),
        ...(validated.description !== undefined && { description: validated.description.trim() }),
        ...(validated.startDate && { startDate: start }),
        ...(validated.endDate && { endDate: end }),
        ...(validated.coverPhoto !== undefined && { coverPhoto: validated.coverPhoto }),
        ...(validated.visibility && { visibility: validated.visibility }),
        ...(validated.totalBudget !== undefined && { totalBudget: validated.totalBudget }),
        ...(validated.currency && { currency: validated.currency }),
      },
      include: {
        stops: {
          include: { city: true },
        },
      },
    });

    res.json({ trip: updatedTrip });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update trip error:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  }
};

export const deleteTrip = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });
    const { id } = req.params;

    const existingTrip = await prisma.trip.findUnique({ where: { id } });
    if (!existingTrip) return res.status(404).json({ error: 'Trip not found' });

    if (existingTrip.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden. You do not own this trip.' });
    }

    await prisma.trip.delete({ where: { id } });

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
};
