/**
 * Demo Mode Configuration
 * Set DEMO_MODE=true in environment variables to enable demo mode
 */

export const DEMO_MODE = process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'demo';

export const demoConfig = {
  // Demo mode settings
  enabled: DEMO_MODE,
  
  // Mock authentication settings
  mockAuth: {
    defaultPassword: 'password', // All demo users use this password
    jwtSecret: process.env.JWT_SECRET || 'demo-jwt-secret-key',
  },
  
  // Mock data settings
  mockData: {
    enableMockUsers: true,
    enableMockWatches: true,
    enableMockTransactions: true,
  },
  
  // Placeholder image settings
  placeholderImages: {
    watchImage: 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch',
    userAvatar: 'https://via.placeholder.com/150x150.png?text=User',
  },
  
  // Mock payment settings
  mockPayment: {
    enabled: true,
    processingDelay: 2000, // 2 seconds delay to simulate payment processing
    successRate: 0.95, // 95% success rate for demo payments
  }
};

export default demoConfig;
