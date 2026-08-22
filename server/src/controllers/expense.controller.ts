import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

const createExpenseSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  tripStopId: z.string().optional(),
  category: z.enum(['Accommodation', 'Transport', 'Food', 'Activities', 'Shopping', 'Miscellaneous']),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('USD'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
});

export const getExpensesByTrip = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const currentUserId = req.user?.userId;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    if (trip.userId !== currentUserId && trip.visibility !== 'PUBLIC') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const expenses = await prisma.expense.findMany({
      where: { tripId },
      include: { tripStop: { include: { city: true } } },
      orderBy: { date: 'desc' },
    });

    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const categoryBreakdown = expenses.reduce((acc: any, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

    res.json({
      expenses,
      summary: {
        totalBudget: trip.totalBudget,
        totalExpense,
        remainingBudget: trip.totalBudget - totalExpense,
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const validated = createExpenseSchema.parse(req.body);

    const trip = await prisma.trip.findUnique({ where: { id: validated.tripId } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    const expense = await prisma.expense.create({
      data: {
        tripId: validated.tripId,
        tripStopId: validated.tripStopId || null,
        category: validated.category,
        amount: validated.amount,
        currency: validated.currency,
        description: validated.description,
        date: new Date(validated.date),
      },
      include: {
        tripStop: { include: { city: true } },
      },
    });

    res.status(201).json({ expense });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    const existing = await prisma.expense.findUnique({
      where: { id },
      include: { trip: true },
    });

    if (!existing) return res.status(404).json({ error: 'Expense not found' });
    if (existing.trip.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

    await prisma.expense.delete({ where: { id } });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};
