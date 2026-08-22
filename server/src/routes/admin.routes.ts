import { Router } from 'express';
import {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  deleteUserByAdmin,
} from '../controllers/admin.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Strictly Enforced Server-Side RBAC
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUserByAdmin);

export default router;
