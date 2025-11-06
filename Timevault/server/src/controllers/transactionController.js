import { validationResult } from 'express-validator';
import { admin } from '../config/firebase.js';
const db = admin.firestore();

import { Collections } from '../models/collections.js';
import { DEMO_MODE, demoConfig } from '../config/demo.js';

/**
 * Create a new transaction
 */
export const createTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { watchId, shippingInfo, trackingId } = req.body;
    const buyerId = req.user.uid;

    if (DEMO_MODE) {
      // DEMO MODE: Use mock database and simulate payment
      // Get watch details
      const watch = db.findWatchById(watchId);

      if (!watch) {
        return res.status(404).json({
          error: 'Watch not found',
          message: `No watch found with ID: ${watchId}`,
        });
      }

      // Check if watch is available
      if (watch.status !== 'active') {
        return res.status(400).json({
          error: 'Watch not available',
          message: 'This watch is no longer available for purchase',
        });
      }

      // Check if buyer is not the seller
      if (watch.sellerId === buyerId) {
        return res.status(400).json({
          error: 'Invalid transaction',
          message: 'You cannot purchase your own listing',
        });
      }

      // Simulate payment processing delay
      if (demoConfig.mockPayment.enabled) {
        await new Promise(resolve => setTimeout(resolve, demoConfig.mockPayment.processingDelay));
        
        // Simulate payment failure (5% chance)
        if (Math.random() > demoConfig.mockPayment.successRate) {
          return res.status(400).json({
            error: 'Payment failed',
            message: 'Demo payment simulation failed. Please try again.',
          });
        }
      }

      // Create transaction
      const transactionData = {
        buyerId,
        sellerId: watch.sellerId,
        watchId,
        price: watch.price,
        status: 'pending',
        trackingId: trackingId || null,
        shippingInfo: shippingInfo || null,
      };

      const newTransaction = db.createTransaction(transactionData);

      // Update watch status to pending
      db.updateWatch(watchId, { status: 'pending' });

      res.status(201).json({
        message: 'Transaction created successfully (Demo Mode)',
        transaction: newTransaction,
      });
    } else {
      // FIREBASE CODE - Original Firestore transaction creation
      // Get watch details
      const watchDoc = await db.collection(Collections.WATCHES).doc(watchId).get();

      if (!watchDoc.exists) {
        return res.status(404).json({
          error: 'Watch not found',
          message: `No watch found with ID: ${watchId}`,
        });
      }

      const watchData = watchDoc.data();

      // Check if watch is available
      if (watchData.status !== 'active') {
        return res.status(400).json({
          error: 'Watch not available',
          message: 'This watch is no longer available for purchase',
        });
      }

      // Check if buyer is not the seller
      if (watchData.sellerId === buyerId) {
        return res.status(400).json({
          error: 'Invalid transaction',
          message: 'You cannot purchase your own listing',
        });
      }

      // Create transaction
      const transactionData = {
        buyerId,
        sellerId: watchData.sellerId,
        watchId,
        price: watchData.price,
        status: 'pending',
        trackingId: trackingId || null,
        shippingInfo: shippingInfo || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const transactionRef = await db.collection(Collections.TRANSACTIONS).add(transactionData);

      // Update watch status to pending
      await db.collection(Collections.WATCHES).doc(watchId).update({
        status: 'pending',
        updatedAt: new Date().toISOString(),
      });

      const transactionDoc = await transactionRef.get();

      res.status(201).json({
        message: 'Transaction created successfully',
        transaction: {
          id: transactionDoc.id,
          ...transactionDoc.data(),
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get all transactions for a user (buyer or seller)
 */
export const getUserTransactions = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { type = 'all' } = req.query; // 'all', 'purchases', 'sales'

    if (DEMO_MODE) {
      // DEMO MODE: Use mock database
      let transactions = [];

      if (type === 'all' || type === 'purchases') {
        const buyerTransactions = db.findTransactions({ buyerId: userId }).map(transaction => ({
          ...transaction,
          type: 'purchase',
        }));
        transactions = [...transactions, ...buyerTransactions];
      }

      if (type === 'all' || type === 'sales') {
        const sellerTransactions = db.findTransactions({ sellerId: userId }).map(transaction => ({
          ...transaction,
          type: 'sale',
        }));
        transactions = [...transactions, ...sellerTransactions];
      }

      // Sort by createdAt
      transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.status(200).json({
        count: transactions.length,
        transactions,
      });
    } else {
      // FIREBASE CODE - Original Firestore transaction queries
      let transactions = [];

      if (type === 'all' || type === 'purchases') {
        const buyerSnapshot = await db
          .collection(Collections.TRANSACTIONS)
          .where('buyerId', '==', userId)
          .orderBy('createdAt', 'desc')
          .get();

        const buyerTransactions = buyerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'purchase',
        }));

        transactions = [...transactions, ...buyerTransactions];
      }

      if (type === 'all' || type === 'sales') {
        const sellerSnapshot = await db
          .collection(Collections.TRANSACTIONS)
          .where('sellerId', '==', userId)
          .orderBy('createdAt', 'desc')
          .get();

        const sellerTransactions = sellerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'sale',
        }));

        transactions = [...transactions, ...sellerTransactions];
      }

      // Sort by createdAt
      transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.status(200).json({
        count: transactions.length,
        transactions,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get transaction by ID
 */
export const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    if (DEMO_MODE) {
      // DEMO MODE: Use mock database
      const transaction = db.findTransactionById(id);

      if (!transaction) {
        return res.status(404).json({
          error: 'Transaction not found',
          message: `No transaction found with ID: ${id}`,
        });
      }

      // Check if user is involved in the transaction
      if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this transaction',
        });
      }

      // Get watch details
      const watch = db.findWatchById(transaction.watchId);

      // Get buyer details
      const buyer = db.findUserById(transaction.buyerId);

      // Get seller details
      const seller = db.findUserById(transaction.sellerId);

      res.status(200).json({
        transaction: {
          ...transaction,
          watch: watch ? {
            ...watch,
          } : null,
          buyer: buyer ? {
            id: buyer.id,
            name: buyer.name,
            email: buyer.email,
          } : null,
          seller: seller ? {
            id: seller.id,
            name: seller.name,
            email: seller.email,
          } : null,
        },
      });
    } else {
      // FIREBASE CODE - Original Firestore transaction retrieval
      const transactionDoc = await db.collection(Collections.TRANSACTIONS).doc(id).get();

      if (!transactionDoc.exists) {
        return res.status(404).json({
          error: 'Transaction not found',
          message: `No transaction found with ID: ${id}`,
        });
      }

      const transactionData = transactionDoc.data();

      // Check if user is involved in the transaction
      if (transactionData.buyerId !== userId && transactionData.sellerId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this transaction',
        });
      }

      // Get watch details
      const watchDoc = await db.collection(Collections.WATCHES).doc(transactionData.watchId).get();
      const watchData = watchDoc.exists ? watchDoc.data() : null;

      // Get buyer details
      const buyerDoc = await db.collection(Collections.USERS).doc(transactionData.buyerId).get();
      const buyerData = buyerDoc.exists ? buyerDoc.data() : null;

      // Get seller details
      const sellerDoc = await db.collection(Collections.USERS).doc(transactionData.sellerId).get();
      const sellerData = sellerDoc.exists ? sellerDoc.data() : null;

      res.status(200).json({
        transaction: {
          id: transactionDoc.id,
          ...transactionData,
          watch: watchData ? {
            id: watchDoc.id,
            ...watchData,
          } : null,
          buyer: buyerData ? {
            id: buyerDoc.id,
            name: buyerData.name || buyerData.displayName,
            email: buyerData.email,
          } : null,
          seller: sellerData ? {
            id: sellerDoc.id,
            name: sellerData.name || sellerData.displayName,
            email: sellerData.email,
          } : null,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update transaction status
 */
export const updateTransactionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.uid;

    const validStatuses = ['pending', 'completed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const transactionDoc = await db.collection(Collections.TRANSACTIONS).doc(id).get();

    if (!transactionDoc.exists) {
      return res.status(404).json({
        error: 'Transaction not found',
        message: `No transaction found with ID: ${id}`,
      });
    }

    const transactionData = transactionDoc.data();

    // Check if user is the seller (only seller can update status)
    if (transactionData.sellerId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the seller can update transaction status',
      });
    }

    const updates = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'completed') {
      updates.completedAt = new Date().toISOString();
      
      // Update watch status to sold
      await db.collection(Collections.WATCHES).doc(transactionData.watchId).update({
        status: 'sold',
        updatedAt: new Date().toISOString(),
      });
    } else if (status === 'cancelled') {
      // Update watch status back to active
      await db.collection(Collections.WATCHES).doc(transactionData.watchId).update({
        status: 'active',
        updatedAt: new Date().toISOString(),
      });
    }

    await db.collection(Collections.TRANSACTIONS).doc(id).update(updates);

    const updatedDoc = await db.collection(Collections.TRANSACTIONS).doc(id).get();

    res.status(200).json({
      message: 'Transaction status updated successfully',
      transaction: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    next(error);
  }
};
