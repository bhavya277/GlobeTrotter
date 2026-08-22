import { Router } from 'express';
import { getTripIntelligence } from '../controllers/intelligence.controller.js';
import { optionalAuthenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/trips/:tripId/intelligence', optionalAuthenticateToken, getTripIntelligence);

export default router;
