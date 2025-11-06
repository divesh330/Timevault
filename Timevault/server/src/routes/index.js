import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './user.js';
import watchRoutes from './watch.js';
import transactionRoutes from './transaction.js';
import featuredRoutes from './featured.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/watches', watchRoutes);
router.use('/transactions', transactionRoutes);
router.use('/', featuredRoutes);

export default router;
