import { Router } from 'express';
import {
  getMyTrips,
  getTripById,
  getTripByShareToken,
  createTrip,
  copyTrip,
  updateTrip,
  deleteTrip,
} from '../controllers/trip.controller.js';
import { addStop, updateStop, reorderStops, deleteStop } from '../controllers/stop.controller.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, getMyTrips);
router.post('/', authenticateToken, createTrip);
router.post('/copy/:token', authenticateToken, copyTrip);
router.get('/shared/:token', optionalAuthenticateToken, getTripByShareToken);
router.get('/:id', optionalAuthenticateToken, getTripById);
router.put('/:id', authenticateToken, updateTrip);
router.delete('/:id', authenticateToken, deleteTrip);

// Stops sub-routes for Multi-City Itinerary
router.post('/:tripId/stops', authenticateToken, addStop);
router.put('/:tripId/stops/reorder', authenticateToken, reorderStops);
router.put('/:tripId/stops/:stopId', authenticateToken, updateStop);
router.delete('/:tripId/stops/:stopId', authenticateToken, deleteStop);

export default router;
