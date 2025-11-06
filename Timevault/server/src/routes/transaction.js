import express from 'express';
import { body } from 'express-validator';
import {
  createTransaction,
  getUserTransactions,
  getTransactionById,
  updateTransactionStatus,
} from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All transaction routes require authentication
router.use(authenticate);

router.post(
  '/',
  [body('watchId').notEmpty().withMessage('Watch ID is required')],
  createTransaction
);

router.get('/', getUserTransactions);
router.get('/:id', getTransactionById);

router.patch(
  '/:id/status',
  [
    body('status')
      .isIn(['pending', 'completed', 'cancelled', 'refunded'])
      .withMessage('Invalid status'),
  ],
  updateTransactionStatus
);

export default router;
