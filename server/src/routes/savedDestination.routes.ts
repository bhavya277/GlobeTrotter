import { Router } from 'express';
import { getSavedDestinations, toggleSaveDestination } from '../controllers/savedDestination.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, getSavedDestinations);
router.post('/toggle', authenticateToken, toggleSaveDestination);

export default router;
