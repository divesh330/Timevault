import { validationResult } from 'express-validator';
import { admin } from '../config/firebase.js';
const db = admin.firestore();
const { FieldValue } = admin.firestore;

import { validateSerialNumber, checkDuplicateSerial } from '../utils/serialValidation.js';
import { Collections } from '../models/collections.js';
import { DEMO_MODE, demoConfig } from '../config/demo.js';

/**
 * Helper function to check if serial number exists in serialValidation collection
 */
const checkSerialInValidation = async (serialNumber) => {
  try {
    const snapshot = await db
      .collection(Collections.SERIAL_VALIDATION)
      .where('serialNumber', '==', serialNumber)
      .limit(1)
      .get();
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking serial in validation collection:', error);
    return false;
  }
};

/**
 * Helper function to add serial number to serialValidation collection
 */
const addSerialToValidation = async (serialNumber, brand, model) => {
  try {
    const serialValidationData = {
      serialNumber,
      brand,
      model,
      timestamp: FieldValue.serverTimestamp()
    };
    
    await db.collection(Collections.SERIAL_VALIDATION).add(serialValidationData);
    return true;
  } catch (error) {
    console.error('Error adding serial to validation collection:', error);
    throw error;
  }
};

/**
 * Create a new watch listing
 */
export const createWatch = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, brand, price, serialNumber, condition, description } = req.body;
    const sellerId = req.user.uid;

    // Validate serial number format
    const serialValidation = validateSerialNumber(brand, serialNumber);
    if (!serialValidation.valid) {
      return res.status(400).json({
        error: 'Invalid serial number',
        message: serialValidation.message,
      });
    }

    if (DEMO_MODE) {
      // DEMO MODE: Use mock database
      // Check for duplicate serial number
      const existingWatch = db.findWatchBySerial(serialNumber);
      if (existingWatch) {
        return res.status(409).json({
          error: 'Duplicate serial number',
          message: 'A watch with this serial number already exists',
        });
      }

      // Create watch document
      const watchData = {
        title,
        brand,
        price: parseFloat(price),
        condition,
        description,
        serialNumber,
        sellerId,
        imageUrl: demoConfig.placeholderImages.watchImage,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const newWatch = db.createWatch(watchData);

      res.status(201).json({
        message: 'Watch listing created successfully',
        watch: newWatch,
      });
    } else {
      // FIREBASE CODE - Original Firestore watch creation
      // Check for duplicate serial number
      const duplicateCheck = await checkDuplicateSerial(db, serialNumber);
      if (duplicateCheck.exists) {
        return res.status(409).json({
          error: 'Duplicate serial number',
          message: duplicateCheck.message,
        });
      }

      // Create watch document
      const watchData = {
        title,
        brand,
        price: parseFloat(price),
        condition,
        description,
        serialNumber,
        sellerId,
        imageUrl: demoConfig.placeholderImages.watchImage,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        // Add watch to watches collection
        const watchRef = await db.collection(Collections.WATCHES).add(watchData);
        const watchDoc = await watchRef.get();

        // Add serial number to serialValidation collection
        const serialNumber = req.body.serialNumber;
        if (serialNumber) {
          try {
            const serialRef = db.collection("serialValidation");
            const existingSerial = await serialRef.where("serialNumber", "==", serialNumber).get();
            if (existingSerial.empty) {
              await serialRef.add({
                serialNumber,
                brand: req.body.brand || "Unknown",
                model: req.body.title || req.body.model || "Unknown",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              console.log("✅ Serial number added to serialValidation");
            }
          } catch (serialError) {
            console.error('Error adding serial to validation collection:', serialError);
            // Continue execution - don't fail the watch creation if serial validation fails
          }
        }

        res.status(200).json({ 
          success: true, 
          message: "Watch added successfully and serial number validated.",
          watch: {
            id: watchDoc.id,
            ...watchDoc.data(),
          }
        });
      } catch (error) {
        console.error('Error creating watch:', error);
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get all watches (with optional filters)
 */
export const getWatches = async (req, res, next) => {
  try {
    const { brand, condition, minPrice, maxPrice, status = 'active' } = req.query;

    if (DEMO_MODE) {
      // DEMO MODE: Use mock database
      const filters = {
        status,
        brand,
        condition,
        minPrice,
        maxPrice,
      };

      const watches = db.findWatches(filters);

      res.status(200).json({
        count: watches.length,
        watches,
      });
    } else {
      // FIREBASE CODE - Original Firestore query
      let query = db.collection(Collections.WATCHES);

      // Apply filters
      if (status) {
        query = query.where('status', '==', status);
      }
      if (brand) {
        query = query.where('brand', '==', brand);
      }
      if (condition) {
        query = query.where('condition', '==', condition);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();

      let watches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Apply price filters (Firestore doesn't support multiple range queries)
      if (minPrice) {
        watches = watches.filter(watch => watch.price >= parseFloat(minPrice));
      }
      if (maxPrice) {
        watches = watches.filter(watch => watch.price <= parseFloat(maxPrice));
      }

      res.status(200).json({
        count: watches.length,
        watches,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single watch by ID
 */
export const getWatchById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (DEMO_MODE) {
      // DEMO MODE: Use mock database
      const watch = db.findWatchById(id);

      if (!watch) {
        return res.status(404).json({
          error: 'Watch not found',
          message: `No watch found with ID: ${id}`,
        });
      }

      // Get seller information
      const seller = db.findUserById(watch.sellerId);

      res.status(200).json({
        watch: {
          ...watch,
          seller: seller ? {
            id: seller.id,
            name: seller.name,
            rating: seller.rating || 0,
            profilePic: seller.profilePic || null,
          } : null,
        },
      });
    } else {
      // FIREBASE CODE - Original Firestore watch retrieval
      const watchDoc = await db.collection(Collections.WATCHES).doc(id).get();

      if (!watchDoc.exists) {
        return res.status(404).json({
          error: 'Watch not found',
          message: `No watch found with ID: ${id}`,
        });
      }

      // Get seller information
      const watchData = watchDoc.data();
      const sellerDoc = await db.collection(Collections.USERS).doc(watchData.sellerId).get();
      const sellerData = sellerDoc.exists ? sellerDoc.data() : null;

      res.status(200).json({
        watch: {
          id: watchDoc.id,
          ...watchData,
          seller: sellerData ? {
            id: sellerDoc.id,
            name: sellerData.name || sellerData.displayName,
            rating: sellerData.rating || 0,
            profilePic: sellerData.profilePic || null,
          } : null,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update a watch listing
 */
export const updateWatch = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, brand, price, serialNumber } = req.body;
    const userId = req.user.uid;

    if (DEMO_MODE) {
      // DEMO MODE: Use mock database
      const watch = db.findWatchById(id);

      if (!watch) {
        return res.status(404).json({
          error: 'Watch not found',
          message: `No watch found with ID: ${id}`,
        });
      }

      // Check if user is the seller
      if (watch.sellerId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update your own listings',
        });
      }

      // If serial number is being updated, validate it
      if (serialNumber && serialNumber !== watch.serialNumber) {
        const serialValidation = validateSerialNumber(brand || watch.brand, serialNumber);
        if (!serialValidation.valid) {
          return res.status(400).json({
            error: 'Invalid serial number',
            message: serialValidation.message,
          });
        }

        // Check for duplicate serial number (excluding current watch)
        const existingWatch = db.findWatchBySerial(serialNumber, id);
        if (existingWatch) {
          return res.status(409).json({
            error: 'Duplicate serial number',
            message: 'A watch with this serial number already exists',
          });
        }
      }

      // Update watch document
      const updates = {
        ...(title && { title }),
        ...(brand && { brand }),
        ...(price && { price: parseFloat(price) }),
        ...(serialNumber && { serialNumber }),
        updatedAt: new Date().toISOString(),
      };

      const updatedWatch = db.updateWatch(id, updates);

      res.status(200).json({
        message: 'Watch listing updated successfully',
        watch: updatedWatch,
      });
    } else {
      // FIREBASE CODE - Original Firestore watch update
      const watchDoc = await db.collection(Collections.WATCHES).doc(id).get();

      if (!watchDoc.exists) {
        return res.status(404).json({
          error: 'Watch not found',
          message: `No watch found with ID: ${id}`,
        });
      }

      const watchData = watchDoc.data();

      // Check if user is the seller
      if (watchData.sellerId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update your own listings',
        });
      }

      // If serial number is being updated, validate it
      if (serialNumber && serialNumber !== watchData.serialNumber) {
        const serialValidation = validateSerialNumber(brand || watchData.brand, serialNumber);
        if (!serialValidation.valid) {
          return res.status(400).json({
            error: 'Invalid serial number',
            message: serialValidation.message,
          });
        }

        // Check for duplicate serial number (excluding current watch)
        const duplicateCheck = await checkDuplicateSerial(db, serialNumber, id);
        if (duplicateCheck.exists) {
          return res.status(409).json({
            error: 'Duplicate serial number',
            message: duplicateCheck.message,
          });
        }
      }

      // Update watch document
      const updates = {
        ...(title && { title }),
        ...(brand && { brand }),
        ...(price && { price: parseFloat(price) }),
        ...(serialNumber && { serialNumber }),
        updatedAt: new Date().toISOString(),
      };

      await db.collection(Collections.WATCHES).doc(id).update(updates);

      const updatedDoc = await db.collection(Collections.WATCHES).doc(id).get();

      res.status(200).json({
        message: 'Watch listing updated successfully',
        watch: {
          id: updatedDoc.id,
          ...updatedDoc.data(),
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a watch listing (soft delete - change status to 'removed')
 */
export const deleteWatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    if (DEMO_MODE) {
      // DEMO MODE: Use mock database
      const watch = db.findWatchById(id);

      if (!watch) {
        return res.status(404).json({
          error: 'Watch not found',
          message: `No watch found with ID: ${id}`,
        });
      }

      // Check if user is the seller or admin
      if (watch.sellerId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only delete your own listings',
        });
      }

      // Soft delete - update status to 'removed'
      db.updateWatch(id, { status: 'removed' });

      res.status(200).json({
        message: 'Watch listing deleted successfully',
      });
    } else {
      // FIREBASE CODE - Original Firestore watch deletion
      const watchDoc = await db.collection(Collections.WATCHES).doc(id).get();

      if (!watchDoc.exists) {
        return res.status(404).json({
          error: 'Watch not found',
          message: `No watch found with ID: ${id}`,
        });
      }

      const watchData = watchDoc.data();

      // Check if user is the seller or admin
      if (watchData.sellerId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only delete your own listings',
        });
      }

      // Soft delete - update status to 'removed'
      await db.collection(Collections.WATCHES).doc(id).update({
        status: 'removed',
        updatedAt: new Date().toISOString(),
      });

      res.status(200).json({
        message: 'Watch listing deleted successfully',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get watches by seller ID
 */
export const getWatchesBySeller = async (req, res, next) => {
  try {
    const { sellerId } = req.params;

    if (DEMO_MODE) {
      // DEMO MODE: Use mock database
      const watches = db.findWatches({ sellerId });

      res.status(200).json({
        count: watches.length,
        watches,
      });
    } else {
      // FIREBASE CODE - Original Firestore query by seller
      const snapshot = await db
        .collection(Collections.WATCHES)
        .where('sellerId', '==', sellerId)
        .orderBy('createdAt', 'desc')
        .get();

      const watches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({
        count: watches.length,
        watches,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get featured watches (top 6 newest)
 */
export const getFeaturedWatches = async (req, res, next) => {
  try {
    if (DEMO_MODE) {
      // DEMO MODE: Use mock database
      const watches = db.findWatches({ status: 'active' });
      
      // Get top 6 newest watches or return placeholder data if empty
      if (watches.length > 0) {
        const featuredWatches = watches
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 6)
          .map(watch => ({
            id: watch.id,
            title: watch.title,
            brand: watch.brand,
            price: watch.price,
            imageUrl: watch.imageUrl || watch.images?.[0] || demoConfig.placeholderImages.watchImage,
          }));

        res.status(200).json({
          success: true,
          data: featuredWatches,
        });
      } else {
        // Return hard-coded placeholder data
        const placeholderWatches = [
          {
            id: 'demo-1',
            title: 'Submariner Date',
            brand: 'Rolex',
            price: 12500,
            imageUrl: demoConfig.placeholderImages.watchImage,
          },
          {
            id: 'demo-2',
            title: 'Speedmaster Professional',
            brand: 'Omega',
            price: 6800,
            imageUrl: demoConfig.placeholderImages.watchImage,
          },
          {
            id: 'demo-3',
            title: 'Nautilus',
            brand: 'Patek Philippe',
            price: 85000,
            imageUrl: demoConfig.placeholderImages.watchImage,
          },
          {
            id: 'demo-4',
            title: 'Royal Oak',
            brand: 'Audemars Piguet',
            price: 45000,
            imageUrl: demoConfig.placeholderImages.watchImage,
          },
        ];

        res.status(200).json({
          success: true,
          data: placeholderWatches,
        });
      }
    } else {
      // FIREBASE CODE - Original Firestore query for featured watches
      const snapshot = await db
        .collection(Collections.WATCHES)
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .limit(6)
        .get();

      if (!snapshot.empty) {
        const featuredWatches = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            brand: data.brand,
            price: data.price,
            imageUrl: data.imageUrl || data.images?.[0] || demoConfig.placeholderImages.watchImage,
          };
        });

        res.status(200).json({
          success: true,
          data: featuredWatches,
        });
      } else {
        // Return hard-coded placeholder data if no watches exist
        const placeholderWatches = [
          {
            id: 'placeholder-1',
            title: 'Submariner Date',
            brand: 'Rolex',
            price: 12500,
            imageUrl: demoConfig.placeholderImages.watchImage,
          },
          {
            id: 'placeholder-2',
            title: 'Speedmaster Professional',
            brand: 'Omega',
            price: 6800,
            imageUrl: demoConfig.placeholderImages.watchImage,
          },
          {
            id: 'placeholder-3',
            title: 'Nautilus',
            brand: 'Patek Philippe',
            price: 85000,
            imageUrl: demoConfig.placeholderImages.watchImage,
          },
          {
            id: 'placeholder-4',
            title: 'Royal Oak',
            brand: 'Audemars Piguet',
            price: 45000,
            imageUrl: demoConfig.placeholderImages.watchImage,
          },
        ];

        res.status(200).json({
          success: true,
          data: placeholderWatches,
        });
      }
    }
  } catch (error) {
    next(error);
  }
};
