import admin from 'firebase-admin';
import path from 'path';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn('GOOGLE_APPLICATION_CREDENTIALS not set - ensure serviceAccountKey.json exists for production.');
}

const serviceAccountPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json');
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (err) {
  // If file missing, initialize without cert for demo fallback
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

export { admin };
