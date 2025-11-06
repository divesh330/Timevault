import express from 'express';
import { admin } from '../config/firebase.js';
import { verifyAuth } from '../middleware/verifyAuth.js';

const router = express.Router();
const db = admin.firestore();

// POST /api/watches - Create a new watch (Admin only)
router.post('/watches', verifyAuth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  
  try {
    const { title, brand, price, serialNumber, imageUrl } = req.body;

    // Validate required fields
    if (!title || !brand || !price || !serialNumber || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, brand, price, serialNumber, imageUrl'
      });
    }

    // Serial number validation - check for duplicates
    const existing = await db.collection('watches').where('serialNumber', '==', serialNumber).get();
    if (!existing.empty) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate serial number'
      });
    }

    // Create new watch document
    const watchData = {
      title,
      brand,
      price: parseFloat(price),
      serialNumber,
      imageUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('watches').add(watchData);

    res.status(201).json({
      success: true,
      id: docRef.id,
      message: 'Watch created successfully'
    });

  } catch (error) {
    console.error('Error creating watch:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/watches - Get all watches
router.get('/watches', async (req, res) => {
  try {
    const snapshot = await db.collection('watches')
      .orderBy('createdAt', 'desc')
      .get();

    const watches = [];
    snapshot.forEach(doc => {
      watches.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: watches,
      count: watches.length
    });

  } catch (error) {
    console.error('Error fetching watches:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/watches/:id - Get a single watch by ID
router.get('/watches/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection('watches').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Watch not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      }
    });

  } catch (error) {
    console.error('Error fetching watch:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// PUT /api/watches/:id - Update a watch (Admin only)
router.put('/watches/:id', verifyAuth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  try {
    const { id } = req.params;
    const { title, brand, price, imageUrl } = req.body;

    // Check if watch exists
    const doc = await db.collection('watches').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Watch not found'
      });
    }

    // Prepare update data (only include provided fields)
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (title !== undefined) updateData.title = title;
    if (brand !== undefined) updateData.brand = brand;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    // Update the document
    await db.collection('watches').doc(id).update(updateData);

    res.json({
      success: true,
      message: 'Watch updated successfully'
    });

  } catch (error) {
    console.error('Error updating watch:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// DELETE /api/watches/:id - Delete a watch (Admin only)
router.delete('/watches/:id', verifyAuth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  try {
    const { id } = req.params;

    // Check if watch exists
    const doc = await db.collection('watches').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Watch not found'
      });
    }

    // Delete the document
    await db.collection('watches').doc(id).delete();

    res.json({
      success: true,
      message: 'Watch deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting watch:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
