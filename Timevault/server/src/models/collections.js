/**
 * Firestore Collection Schemas
 * 
 * This file documents the structure of Firestore collections
 */

/**
 * Users Collection
 * Collection: 'users'
 * Document ID: Firebase Auth UID
 */
export const UserSchema = {
  id: 'string', // Firebase Auth UID
  name: 'string',
  email: 'string',
  hashedPassword: 'string', // bcrypt hashed password
  role: 'string', // 'buyer', 'seller', 'admin'
  profilePic: 'string', // URL to profile picture
  rating: 'number', // Average rating (0-5)
  createdAt: 'string', // ISO timestamp
};

/**
 * Watches Collection
 * Collection: 'watches'
 * Document ID: Auto-generated
 */
export const WatchSchema = {
  id: 'string', // Document ID
  title: 'string',
  brand: 'string', // Rolex, Omega, Seiko, Casio
  price: 'number',
  condition: 'string', // 'new', 'excellent', 'good', 'fair', 'poor'
  description: 'string',
  images: 'array', // Array of image URLs
  serialNumber: 'string', // Validated based on brand
  sellerId: 'string', // Reference to Users collection
  status: 'string', // 'active', 'sold', 'pending', 'removed'
  createdAt: 'string', // ISO timestamp
  updatedAt: 'string', // ISO timestamp
};

/**
 * Transactions Collection
 * Collection: 'transactions'
 * Document ID: Auto-generated
 */
export const TransactionSchema = {
  id: 'string', // Document ID
  buyerId: 'string', // Reference to Users collection
  sellerId: 'string', // Reference to Users collection
  watchId: 'string', // Reference to Watches collection
  price: 'number',
  status: 'string', // 'pending', 'completed', 'cancelled', 'refunded'
  trackingId: 'string', // Shipping tracking ID (nullable)
  shippingInfo: 'object', // Shipping address and contact details (nullable)
  createdAt: 'string', // ISO timestamp
  updatedAt: 'string', // ISO timestamp
  completedAt: 'string', // ISO timestamp (nullable)
};

/**
 * Serial Validation Collection
 * Collection: 'serialValidation'
 * Document ID: Auto-generated
 */
export const SerialValidationSchema = {
  id: 'string', // Document ID
  serialNumber: 'string', // Watch serial number
  brand: 'string', // Watch brand
  model: 'string', // Watch model/title
  timestamp: 'timestamp', // Firestore timestamp
};

/**
 * Collection names
 */
export const Collections = {
  USERS: 'users',
  WATCHES: 'watches',
  TRANSACTIONS: 'transactions',
  SERIAL_VALIDATION: 'serialValidation',
};
