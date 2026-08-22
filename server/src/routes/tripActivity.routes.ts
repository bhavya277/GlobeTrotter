import { Router } from 'express';
import {
  addTripActivity,
  updateTripActivity,
  deleteTripActivity,
  reorderTripActivities,
} from '../controllers/tripActivity.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticateToken, addTripActivity);
router.put('/reorder', authenticateToken, reorderTripActivities);
router.put('/:id', authenticateToken, updateTripActivity);
router.delete('/:id', authenticateToken, deleteTripActivity);

export default router;
