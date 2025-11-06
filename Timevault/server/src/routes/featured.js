import express from 'express';
import { admin } from '../config/firebase.js';

const router = express.Router();

// GET /api/featured-watches
router.get('/featured-watches', async (req, res) => {
  try {
    let watches = [];

    // Try to fetch from Firestore
    try {
      if (admin.apps.length > 0) {
        const snaps = await admin.firestore()
          .collection('watches')
          .orderBy('createdAt', 'desc')
          .limit(6)
          .get();

        if (!snaps.empty) {
          watches = snaps.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title,
              brand: data.brand,
              price: data.price,
              imageUrl: data.imageUrl
            };
          });
        }
      }
    } catch (firestoreError) {
      console.warn('Firestore query failed:', firestoreError.message);
    }

    // If no watches from Firestore or error occurred, use fallback data
    if (watches.length === 0) {
      watches = [
        {
          id: 'demo-1',
          title: 'Classic Timepiece',
          brand: 'TimeVault',
          price: 2500,
          imageUrl: 'https://cdn.pixabay.com/photo/2016/11/29/05/08/analog-watch-1869931_1280.jpg'
        },
        {
          id: 'demo-2',
          title: 'Luxury Heritage',
          brand: 'Premium',
          price: 4200,
          imageUrl: 'https://cdn.pixabay.com/photo/2017/01/18/17/14/watch-1999149_1280.jpg'
        },
        {
          id: 'demo-3',
          title: 'Modern Elite',
          brand: 'Contemporary',
          price: 3800,
          imageUrl: 'https://cdn.pixabay.com/photo/2016/11/21/16/49/clock-1840787_1280.jpg'
        },
        {
          id: 'demo-4',
          title: 'Vintage Collection',
          brand: 'Heritage',
          price: 5500,
          imageUrl: 'https://cdn.pixabay.com/photo/2017/08/06/22/01/wristwatch-2595616_1280.jpg'
        }
      ];
    }

    res.json({
      success: true,
      data: watches
    });

  } catch (error) {
    console.error('Featured watches route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch featured watches'
    });
  }
});

export default router;
