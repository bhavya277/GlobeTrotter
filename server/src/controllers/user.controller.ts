import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address format').optional(),
  profilePhoto: z.string().optional(),
  bio: z.string().optional(),
  language: z.string().optional(),
  defaultCurrency: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

const deleteAccountSchema = z.object({
  confirmText: z.string().refine((val) => val === 'DELETE', 'You must type DELETE to confirm account deletion'),
  password: z.string().optional(),
});

export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });

    const validated = updateProfileSchema.parse(req.body);

    // If email update requested, check for duplicate email conflicts
    if (validated.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: validated.email.toLowerCase().trim() } });
      if (existingUser && existingUser.id !== req.user.userId) {
        return res.status(400).json({ error: 'This email address is already in use by another account.' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(validated.name && { name: validated.name.trim() }),
        ...(validated.email && { email: validated.email.toLowerCase().trim() }),
        ...(validated.profilePhoto !== undefined && { profilePhoto: validated.profilePhoto }),
        ...(validated.bio !== undefined && { bio: validated.bio.trim() }),
        ...(validated.language && { language: validated.language }),
        ...(validated.defaultCurrency && { defaultCurrency: validated.defaultCurrency }),
      },
    });

    // Sanitize user object (never return passwordHash)
    const { passwordHash, ...sanitizedUser } = updatedUser;

    res.json({ user: sanitizedUser, message: 'Profile updated successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });

    const validated = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User account not found' });

    const isValidPassword = await bcrypt.compare(validated.currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password entered is incorrect.' });
    }

    const newPasswordHash = await bcrypt.hash(validated.newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized access' });

    const validated = deleteAccountSchema.parse(req.body);

    const userId = req.user.userId;

    // Clear user and cascade related records according to deletion policy
    await prisma.$transaction(async (tx) => {
      // 1. Delete reset tokens
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      // 2. Delete saved destinations
      await tx.savedDestination.deleteMany({ where: { userId } });
      // 3. Delete expenses for user's trips
      const userTrips = await tx.trip.findMany({ where: { userId }, select: { id: true } });
      const tripIds = userTrips.map((t) => t.id);

      if (tripIds.length > 0) {
        await tx.expense.deleteMany({ where: { tripId: { in: tripIds } } });
        // Delete trip stops and trip activities
        const stops = await tx.tripStop.findMany({ where: { tripId: { in: tripIds } }, select: { id: true } });
        const stopIds = stops.map((s) => s.id);
        if (stopIds.length > 0) {
          await tx.tripActivity.deleteMany({ where: { tripStopId: { in: stopIds } } });
          await tx.tripStop.deleteMany({ where: { tripId: { in: tripIds } } });
        }
        await tx.trip.deleteMany({ where: { userId } });
      }

      // 4. Delete User entity
      await tx.user.delete({ where: { id: userId } });
    });

    res.json({ message: 'Account and all associated records permanently deleted.' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
};
