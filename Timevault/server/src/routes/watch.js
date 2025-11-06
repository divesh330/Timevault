import express from 'express';
import { body } from 'express-validator';
import {
  createWatch,
  getWatches,
  getWatchById,
  updateWatch,
  deleteWatch,
  getWatchesBySeller,
} from '../controllers/watchController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getWatches);
router.get('/seller/:sellerId', getWatchesBySeller);
router.get('/:id', getWatchById);

// Protected routes
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().trim().withMessage('Title is required'),
    body('brand').notEmpty().trim().withMessage('Brand is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('serialNumber').notEmpty().trim().withMessage('Serial number is required'),
  ],
  createWatch
);

router.put(
  '/:id', 
  authenticate,
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('brand').optional().trim().notEmpty().withMessage('Brand cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('serialNumber').optional().trim().notEmpty().withMessage('Serial number cannot be empty'),
  ],
  updateWatch
);
router.delete('/:id', authenticate, deleteWatch);

export default router;
