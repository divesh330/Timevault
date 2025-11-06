/**
 * Mock Data for Demo Mode
 * This file contains mock data arrays to replace Firebase Firestore
 */

// Mock Users Data
export const mockUsers = [
  {
    id: 'demo-user-1',
    name: 'John Smith',
    email: 'john@demo.com',
    hashedPassword: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
    role: 'seller',
    profilePic: 'https://via.placeholder.com/150x150.png?text=JS',
    rating: 4.8,
    createdAt: '2024-01-15T10:30:00.000Z',
  },
  {
    id: 'demo-user-2',
    name: 'Sarah Johnson',
    email: 'sarah@demo.com',
    hashedPassword: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
    role: 'buyer',
    profilePic: 'https://via.placeholder.com/150x150.png?text=SJ',
    rating: 4.5,
    createdAt: '2024-02-20T14:15:00.000Z',
  },
  {
    id: 'demo-user-3',
    name: 'Michael Chen',
    email: 'michael@demo.com',
    hashedPassword: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
    role: 'seller',
    profilePic: 'https://via.placeholder.com/150x150.png?text=MC',
    rating: 4.9,
    createdAt: '2024-01-10T09:45:00.000Z',
  },
  {
    id: 'demo-user-4',
    name: 'Emma Wilson',
    email: 'emma@demo.com',
    hashedPassword: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
    role: 'buyer',
    profilePic: 'https://via.placeholder.com/150x150.png?text=EW',
    rating: 4.2,
    createdAt: '2024-03-05T16:20:00.000Z',
  }
];

// Mock Watches Data
export const mockWatches = [
  {
    id: 'watch-1',
    title: 'Rolex Submariner Date',
    brand: 'Rolex',
    price: 12500,
    condition: 'excellent',
    description: 'Classic Rolex Submariner in excellent condition. Black dial, ceramic bezel. Comes with original box and papers.',
    images: [
      'https://cdn.pixabay.com/photo/2016/11/29/05/08/analog-watch-1869931_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/01/18/17/14/watch-1999149_1280.jpg',
      'https://cdn.pixabay.com/photo/2016/11/21/16/49/clock-1840787_1280.jpg'
    ],
    serialNumber: 'R123456789',
    sellerId: 'demo-user-1',
    status: 'active',
    createdAt: '2024-03-01T10:00:00.000Z',
    updatedAt: '2024-03-01T10:00:00.000Z',
  },
  {
    id: 'watch-2',
    title: 'Omega Speedmaster Professional',
    brand: 'Omega',
    price: 4200,
    condition: 'good',
    description: 'Iconic Omega Speedmaster "Moonwatch". Manual wind movement, hesalite crystal. A true classic.',
    images: [
      'https://cdn.pixabay.com/photo/2017/08/06/22/01/wristwatch-2595616_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/03/14/13/42/time-2147074_1280.jpg'
    ],
    serialNumber: 'O987654321',
    sellerId: 'demo-user-3',
    status: 'active',
    createdAt: '2024-02-28T14:30:00.000Z',
    updatedAt: '2024-02-28T14:30:00.000Z',
  },
  {
    id: 'watch-3',
    title: 'Seiko Prospex Diver',
    brand: 'Seiko',
    price: 350,
    condition: 'new',
    description: 'Brand new Seiko Prospex automatic diver. 200m water resistance, unidirectional bezel.',
    images: [
      'https://cdn.pixabay.com/photo/2017/06/15/18/18/wristwatch-2408616_1280.jpg',
      'https://cdn.pixabay.com/photo/2016/11/29/05/08/analog-watch-1869931_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/01/18/17/14/watch-1999149_1280.jpg',
      'https://cdn.pixabay.com/photo/2016/11/21/16/49/clock-1840787_1280.jpg'
    ],
    serialNumber: 'S555666777',
    sellerId: 'demo-user-1',
    status: 'active',
    createdAt: '2024-03-10T11:15:00.000Z',
    updatedAt: '2024-03-10T11:15:00.000Z',
  },
  {
    id: 'watch-4',
    title: 'Casio G-Shock DW-5600',
    brand: 'Casio',
    price: 89,
    condition: 'excellent',
    description: 'Classic G-Shock square case. Shock resistant, 200m water resistance. Perfect daily beater.',
    images: [
      'https://cdn.pixabay.com/photo/2017/08/06/22/01/wristwatch-2595616_1280.jpg'
    ],
    serialNumber: 'C111222333',
    sellerId: 'demo-user-3',
    status: 'active',
    createdAt: '2024-03-05T09:20:00.000Z',
    updatedAt: '2024-03-05T09:20:00.000Z',
  },
  {
    id: 'watch-5',
    title: 'Rolex Datejust 36mm',
    brand: 'Rolex',
    price: 8900,
    condition: 'good',
    description: 'Timeless Rolex Datejust with jubilee bracelet. Silver dial, date function. Serviced recently.',
    images: [
      'https://cdn.pixabay.com/photo/2017/03/14/13/42/time-2147074_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/06/15/18/18/wristwatch-2408616_1280.jpg'
    ],
    serialNumber: 'R999888777',
    sellerId: 'demo-user-1',
    status: 'sold',
    createdAt: '2024-02-15T13:45:00.000Z',
    updatedAt: '2024-03-01T16:30:00.000Z',
  }
];

// Mock Transactions Data
export const mockTransactions = [
  {
    id: 'transaction-1',
    buyerId: 'demo-user-2',
    sellerId: 'demo-user-1',
    watchId: 'watch-5',
    price: 8900,
    status: 'completed',
    trackingId: 'TRK1709316600ABC123DEF',
    shippingInfo: {
      fullName: 'Sarah Johnson',
      email: 'sarah@demo.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main Street, Apt 2B',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States'
    },
    createdAt: '2024-03-01T15:30:00.000Z',
    updatedAt: '2024-03-01T16:30:00.000Z',
    completedAt: '2024-03-01T16:30:00.000Z',
  },
  {
    id: 'transaction-2',
    buyerId: 'demo-user-4',
    sellerId: 'demo-user-3',
    watchId: 'watch-2',
    price: 4200,
    status: 'pending',
    trackingId: 'TRK1709402400XYZ789GHI',
    shippingInfo: {
      fullName: 'Emma Wilson',
      email: 'emma@demo.com',
      phone: '+1 (555) 987-6543',
      address: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'United States'
    },
    createdAt: '2024-03-02T10:00:00.000Z',
    updatedAt: '2024-03-02T10:00:00.000Z',
  }
];

// Helper functions for mock data operations
export class MockDatabase {
  constructor() {
    this.users = [...mockUsers];
    this.watches = [...mockWatches];
    this.transactions = [...mockTransactions];
  }

  // Generate unique ID
  generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Users operations
  findUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  findUserById(id) {
    return this.users.find(user => user.id === id);
  }

  createUser(userData) {
    const newUser = {
      id: this.generateId('user'),
      ...userData,
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(id, updates) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.users[userIndex], ...updates };
      return this.users[userIndex];
    }
    return null;
  }

  // Watches operations
  findWatches(filters = {}) {
    let result = [...this.watches];

    if (filters.status) {
      result = result.filter(watch => watch.status === filters.status);
    }
    if (filters.brand) {
      result = result.filter(watch => watch.brand === filters.brand);
    }
    if (filters.condition) {
      result = result.filter(watch => watch.condition === filters.condition);
    }
    if (filters.sellerId) {
      result = result.filter(watch => watch.sellerId === filters.sellerId);
    }
    if (filters.minPrice) {
      result = result.filter(watch => watch.price >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      result = result.filter(watch => watch.price <= parseFloat(filters.maxPrice));
    }

    // Sort by createdAt desc
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return result;
  }

  findWatchById(id) {
    return this.watches.find(watch => watch.id === id);
  }

  createWatch(watchData) {
    const newWatch = {
      id: this.generateId('watch'),
      ...watchData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.watches.push(newWatch);
    return newWatch;
  }

  updateWatch(id, updates) {
    const watchIndex = this.watches.findIndex(watch => watch.id === id);
    if (watchIndex !== -1) {
      this.watches[watchIndex] = { 
        ...this.watches[watchIndex], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      return this.watches[watchIndex];
    }
    return null;
  }

  // Transactions operations
  findTransactions(filters = {}) {
    let result = [...this.transactions];

    if (filters.buyerId) {
      result = result.filter(transaction => transaction.buyerId === filters.buyerId);
    }
    if (filters.sellerId) {
      result = result.filter(transaction => transaction.sellerId === filters.sellerId);
    }

    // Sort by createdAt desc
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return result;
  }

  findTransactionById(id) {
    return this.transactions.find(transaction => transaction.id === id);
  }

  createTransaction(transactionData) {
    const newTransaction = {
      id: this.generateId('transaction'),
      ...transactionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  updateTransaction(id, updates) {
    const transactionIndex = this.transactions.findIndex(transaction => transaction.id === id);
    if (transactionIndex !== -1) {
      this.transactions[transactionIndex] = { 
        ...this.transactions[transactionIndex], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      return this.transactions[transactionIndex];
    }
    return null;
  }

  // Check for duplicate serial numbers
  findWatchBySerial(serialNumber, excludeId = null) {
    return this.watches.find(watch => 
      watch.serialNumber === serialNumber && 
      watch.id !== excludeId
    );
  }
}

// Global mock database instance
export const mockDB = new MockDatabase();
