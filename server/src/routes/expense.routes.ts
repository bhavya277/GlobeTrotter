import { Router } from 'express';
import {
  getExpensesByTrip,
  createExpense,
  deleteExpense,
} from '../controllers/expense.controller.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/trip/:tripId', optionalAuthenticateToken, getExpensesByTrip);
router.post('/', authenticateToken, createExpense);
router.delete('/:id', authenticateToken, deleteExpense);

export default router;
