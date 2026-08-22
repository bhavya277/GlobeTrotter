import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Secure Image Upload (Authenticated Users Only)
router.post('/image', authenticateToken, uploadImage);

export default router;
