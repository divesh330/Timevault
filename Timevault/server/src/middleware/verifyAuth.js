import { admin } from '../config/firebase.js';

export const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header exists and has Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Check if DEMO_MODE is enabled
      if (process.env.DEMO_MODE === 'true') {
        // Attach demo user for demo mode
        req.user = {
          uid: 'demoUser',
          email: 'demo@timevault.local',
          role: 'admin' // Demo user is admin
        };
        return next();
      }
      
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No valid authorization token provided' 
      });
    }

    // Extract the token from Bearer <token>
    const idToken = authHeader.split(' ')[1];

    // If token is present and admin is initialized, verify the token
    if (idToken && admin.apps.length > 0) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        
        // Get user role from Firestore
        const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: userData.role || 'user', // Default to 'user' if no role found
          ...decodedToken
        };
        return next();
      } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(401).json({ 
          error: 'Invalid token',
          message: 'The provided authentication token is invalid or expired' 
        });
      }
    }

    // If admin is not initialized but DEMO_MODE is enabled
    if (process.env.DEMO_MODE === 'true') {
      req.user = {
        uid: 'demoUser',
        email: 'demo@timevault.local',
        role: 'admin'
      };
      return next();
    }

    // If no valid authentication method is available
    return res.status(401).json({ 
      error: 'Authentication unavailable',
      message: 'Firebase authentication is not properly configured' 
    });

  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'An error occurred during authentication' 
    });
  }
};

