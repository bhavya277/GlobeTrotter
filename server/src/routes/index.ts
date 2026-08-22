import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import cityRoutes from './city.routes.js';
import activityRoutes from './activity.routes.js';
import tripRoutes from './trip.routes.js';
import tripActivityRoutes from './tripActivity.routes.js';
import expenseRoutes from './expense.routes.js';
import savedDestinationRoutes from './savedDestination.routes.js';
import intelligenceRoutes from './intelligence.routes.js';
import adminRoutes from './admin.routes.js';
import uploadRoutes from './upload.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/cities', cityRoutes);
router.use('/activities', activityRoutes);
router.use('/trips', tripRoutes);
router.use('/trip-activities', tripActivityRoutes);
router.use('/expenses', expenseRoutes);
router.use('/saved-destinations', savedDestinationRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/', intelligenceRoutes);

export default router;
