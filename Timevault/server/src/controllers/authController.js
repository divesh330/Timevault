import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { admin } from '../config/firebase.js';
const auth = admin.auth();
const db = admin.firestore();

import { DEMO_MODE } from '../config/demo.js';

export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, displayName } = req.body;

    // Hash password with bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    if (DEMO_MODE) {
      // DEMO MODE: Use mock database
      // Check if user already exists
      const existingUser = db.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create user in mock database
      const newUser = db.createUser({
        name: displayName,
        email,
        hashedPassword,
        role: 'buyer', // Default role
        profilePic: null,
        rating: 0,
      });

      // Generate JWT
      const token = jwt.sign(
        { uid: newUser.id, email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          uid: newUser.id,
          email: newUser.email,
          displayName: newUser.name,
        },
      });
    } else {
      // FIREBASE CODE - Original Firebase Auth registration
      // Create user in Firebase
      const userRecord = await auth.createUser({
        email,
        password,
        displayName,
      });

      // Store user data in Firestore with full schema
      await db.collection('users').doc(userRecord.uid).set({
        id: userRecord.uid,
        name: displayName,
        email,
        hashedPassword,
        role: 'buyer', // Default role
        profilePic: null,
        rating: 0,
        createdAt: new Date().toISOString(),
      });

      // Generate JWT
      const token = jwt.sign(
        { uid: userRecord.uid, email: userRecord.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    if (DEMO_MODE) {
      // DEMO MODE: Use mock database
      const user = db.findUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password with bcryptjs
      const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { uid: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          uid: user.id,
          email: user.email,
          displayName: user.name,
        },
      });
    } else {
      // FIREBASE CODE - Original Firebase Auth login
      // Get user from Firebase Auth
      const user = await auth.getUserByEmail(email);

      // Get user data from Firestore
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const userData = userDoc.data();

      // Verify password with bcryptjs
      const isPasswordValid = await bcrypt.compare(password, userData.hashedPassword);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { uid: user.uid, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const verifyToken = async (req, res) => {
  res.status(200).json({
    message: 'Token is valid',
    user: req.user,
  });
};
