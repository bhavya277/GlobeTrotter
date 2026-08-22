import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import cityRoutes from './city.routes.js';
import activityRoutes from './activity.routes.js';
import tripRoutes from './trip.routes.js';
import tripActivityRoutes from './tripActivity.routes.js';
import expenseRoutes from './expense.routes.js';
import savedDestinationRoutes from './savedDestination.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/cities', cityRoutes);
router.use('/activities', activityRoutes);
router.use('/trips', tripRoutes);
router.use('/trip-activities', tripActivityRoutes);
router.use('/expenses', expenseRoutes);
router.use('/saved-destinations', savedDestinationRoutes);

export default router;
