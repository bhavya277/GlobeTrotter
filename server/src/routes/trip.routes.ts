import { Router } from 'express';
import {
  getMyTrips,
  getTripById,
  getTripByShareToken,
  createTrip,
  updateTrip,
  deleteTrip,
} from '../controllers/trip.controller.js';
import { addStop, deleteStop } from '../controllers/stop.controller.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, getMyTrips);
router.post('/', authenticateToken, createTrip);
router.get('/shared/:token', getTripByShareToken);
router.get('/:id', optionalAuthenticateToken, getTripById);
router.put('/:id', authenticateToken, updateTrip);
router.delete('/:id', authenticateToken, deleteTrip);

// Stops sub-routes
router.post('/:tripId/stops', authenticateToken, addStop);
router.delete('/:tripId/stops/:stopId', authenticateToken, deleteStop);

export default router;
