import express from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public route - can view any user's profile with ?userId=xxx
// Or authenticated user's own profile without userId param
router.get('/profile', getProfile);

// Protected route - update own profile only
router.put('/profile', authenticate, updateProfile);

export default router;
