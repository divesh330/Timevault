import { admin } from '../config/firebase.js';
const auth = admin.auth();
const db = admin.firestore();

import { DEMO_MODE } from '../config/demo.js';

export const getProfile = async (req, res, next) => {
  try {
    // Check if userId is provided in query params (for viewing other users)
    // Otherwise use authenticated user's uid
    const userId = req.query.userId || (req.user ? req.user.uid : null);

    if (!userId) {
      return res.status(400).json({
        error: 'User ID required',
        message: 'Please provide userId parameter or authenticate',
      });
    }

    if (DEMO_MODE) {
      // DEMO MODE: Use mock database
      const user = db.findUserById(userId);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: `No user found with ID: ${userId}`,
        });
      }

      res.status(200).json({
        user: {
          uid: user.id,
          email: user.email,
          displayName: user.name,
          photoURL: user.profilePic,
          ...user,
        },
      });
    } else {
      // FIREBASE CODE - Original Firebase user profile retrieval
      const userRecord = await auth.getUser(userId);
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({
          error: 'User not found',
          message: `No user found with ID: ${userId}`,
        });
      }

      res.status(200).json({
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
          ...userDoc.data(),
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const updates = req.body;

    if (DEMO_MODE) {
      // DEMO MODE: Use mock database
      const updatedUser = db.updateUser(uid, updates);

      if (!updatedUser) {
        return res.status(404).json({
          error: 'User not found',
          message: `No user found with ID: ${uid}`,
        });
      }

      res.status(200).json({
        message: 'Profile updated successfully',
      });
    } else {
      // FIREBASE CODE - Original Firebase profile update
      // Update Firebase Auth profile
      if (updates.displayName || updates.photoURL) {
        await auth.updateUser(uid, {
          displayName: updates.displayName,
          photoURL: updates.photoURL,
        });
      }

      // Update Firestore document
      await db.collection('users').doc(uid).set(updates, { merge: true });

      res.status(200).json({
        message: 'Profile updated successfully',
      });
    }
  } catch (error) {
    next(error);
  }
};
