import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { formatRMPrice } from '../utils/currency';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const [watches, setWatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWatches: 0,
    totalTransactions: 0,
    totalOrders: 0
  });
  const [loaded, setLoaded] = useState({ users: false, watches: false, transactions: false, orders: false });
  const [activeTab, setActiveTab] = useState('watches');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editModal, setEditModal] = useState({ isOpen: false, watch: null });
  const [editForm, setEditForm] = useState({ title: '', brand: '', price: '', category: '', gender: '' });

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    let unsubWatches = null;
    let unsubUsers = null;
    let unsubTransactions = null;
    let unsubOrders = null;
    setLoading(true);

    try {
      unsubWatches = onSnapshot(
        collection(db, 'watches'),
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setWatches(list);
          setStats((prev) => ({ ...prev, totalWatches: snapshot.size }));
          setLoaded((prev) => ({ ...prev, watches: true }));
        },
        (error) => {
          console.warn('watches onSnapshot error:', error);
          setLoaded((prev) => ({ ...prev, watches: true }));
        }
      );

      unsubUsers = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          setStats((prev) => ({ ...prev, totalUsers: snapshot.size }));
          setLoaded((prev) => ({ ...prev, users: true }));
        },
        (error) => {
          console.warn('users onSnapshot error:', error);
          setLoaded((prev) => ({ ...prev, users: true }));
        }
      );

      unsubTransactions = onSnapshot(
        collection(db, 'transactions'),
        (snapshot) => {
          setStats((prev) => ({ ...prev, totalTransactions: snapshot.size }));
          setLoaded((prev) => ({ ...prev, transactions: true }));
        },
        (error) => {
          console.warn('transactions onSnapshot error:', error);
          setLoaded((prev) => ({ ...prev, transactions: true }));
        }
      );

      unsubOrders = onSnapshot(
        collection(db, 'orders'),
        (snapshot) => {
          const ordersList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          console.log('Admin: Loaded orders:', ordersList.length, ordersList);
          setOrders(ordersList);
          setStats((prev) => ({ ...prev, totalOrders: snapshot.size }));
          setLoaded((prev) => ({ ...prev, orders: true }));
        },
        (error) => {
          console.warn('orders onSnapshot error:', error);
          setLoaded((prev) => ({ ...prev, orders: true }));
        }
      );
    } catch (err) {
      console.warn('Error setting up dashboard listeners:', err);
      setLoaded({ users: true, watches: true, transactions: true, orders: true });
    }

    return () => {
      try { unsubWatches && unsubWatches(); } catch (e) { /* noop */ }
      try { unsubUsers && unsubUsers(); } catch (e) { /* noop */ }
      try { unsubTransactions && unsubTransactions(); } catch (e) { /* noop */ }
      try { unsubOrders && unsubOrders(); } catch (e) { /* noop */ }
    };
  }, [isAdmin]);

  useEffect(() => {
    if (loaded.users && loaded.watches && loaded.transactions && loaded.orders) {
      setLoading(false);
    }
  }, [loaded]);

  const openEditModal = (watch) => {
    setEditModal({ isOpen: true, watch });
    setEditForm({
      title: watch.title || '',
      brand: watch.brand || '',
      price: watch.price?.toString() || '',
      category: watch.category || '',
      gender: watch.gender || ''
    });
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, watch: null });
    setEditForm({ title: '', brand: '', price: '', category: '', gender: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editForm.title || !editForm.brand || !editForm.price) {
      setMessage({ type: 'error', text: 'Title, Brand, and Price are required' });
      return;
    }

    try {
      const watchRef = doc(db, 'watches', editModal.watch.id);
      const updateData = {
        title: editForm.title,
        brand: editForm.brand,
        price: parseFloat(editForm.price),
        category: editForm.category,
        gender: editForm.gender
      };
      
      await updateDoc(watchRef, updateData);

      // Update local state
      setWatches(watches.map(watch => 
        watch.id === editModal.watch.id 
          ? { ...watch, ...updateData }
          : watch
      ));
      
      setMessage({ type: 'success', text: 'Watch updated successfully!' });
      closeEditModal();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating watch:', error);
      setMessage({ type: 'error', text: 'Failed to update watch in Firestore' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const deleteWatch = async (id) => {
    if (!window.confirm('Are you sure you want to delete this watch? This action cannot be undone.')) {
      return;
    }

    try {
      const watchRef = doc(db, 'watches', id);
      await deleteDoc(watchRef);
      
      setWatches(watches.filter(watch => watch.id !== id));
      setMessage({ type: 'success', text: 'Watch deleted successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error deleting watch:', error);
      setMessage({ type: 'error', text: 'Failed to delete watch from Firestore' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      setMessage({ type: 'success', text: `Order status updated to ${newStatus}!` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating order status:', error);
      setMessage({ type: 'error', text: 'Failed to update order status' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const updateOrderCourier = async (orderId, courier) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { courier });
      
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, courier } : order
      ));
      
      setMessage({ type: 'success', text: 'Courier updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating courier:', error);
      setMessage({ type: 'error', text: 'Failed to update courier' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-gold/20 text-gold border-gold/30';
      case 'Shipped':
        return 'bg-blue-400/20 text-blue-400 border-blue-400/30';
      case 'Processing':
        return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
      default:
        return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl mb-6">🚫</div>
          <h2 className="text-2xl font-heading font-bold text-white mb-4">Access Denied</h2>
          <p className="text-gray-300 mb-6">You need admin privileges to access this page.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gold hover:bg-yellow-600 text-black font-heading font-semibold px-6 py-3 rounded-lg transition duration-300"
          >
            Go Home
          </button>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gold text-xl font-heading">Loading watches...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gold mb-2">Admin Dashboard</h1>
          <p className="text-gray-300 text-lg">Manage TimeVault watches and inventory</p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Users Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gold/20 shadow-xl hover:border-gold/50 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Users</p>
                <motion.p 
                  className="text-4xl font-heading font-bold text-white"
                  key={loaded.users ? stats.totalUsers : 'users-loading'}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {loaded.users ? stats.totalUsers.toLocaleString() : '—'}
                </motion.p>
              </div>
              <div className="bg-gold/10 p-4 rounded-full">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Total Watches Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gold/20 shadow-xl hover:border-gold/50 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Watches</p>
                <motion.p 
                  className="text-4xl font-heading font-bold text-white"
                  key={loaded.watches ? stats.totalWatches : 'watches-loading'}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {loaded.watches ? stats.totalWatches.toLocaleString() : '—'}
                </motion.p>
              </div>
              <div className="bg-gold/10 p-4 rounded-full">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Total Transactions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gold/20 shadow-xl hover:border-gold/50 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Transactions</p>
                <motion.p 
                  className="text-4xl font-heading font-bold text-white"
                  key={loaded.transactions ? stats.totalTransactions : 'transactions-loading'}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {loaded.transactions ? stats.totalTransactions.toLocaleString() : '—'}
                </motion.p>
              </div>
              <div className="bg-gold/10 p-4 rounded-full">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Total Orders Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gold/20 shadow-xl hover:border-gold/50 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Orders</p>
                <motion.p 
                  className="text-4xl font-heading font-bold text-white"
                  key={loaded.orders ? stats.totalOrders : 'orders-loading'}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {loaded.orders ? stats.totalOrders.toLocaleString() : '—'}
                </motion.p>
              </div>
              <div className="bg-gold/10 p-4 rounded-full">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Message Alert */}
        <AnimatePresence>
          {message.text && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-900/20 text-green-300 border-2 border-green-500' 
                  : 'bg-red-900/20 text-red-300 border-2 border-red-500'
              }`}
            >
              <span className="text-2xl">{message.type === 'success' ? '✅' : '⚠️'}</span>
              <span className="font-medium">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('watches')}
            className={`px-6 py-3 rounded-lg font-heading font-semibold transition duration-300 ${
              activeTab === 'watches'
                ? 'bg-gold text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Watch Inventory
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-lg font-heading font-semibold transition duration-300 ${
              activeTab === 'orders'
                ? 'bg-gold text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Order Management
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'watches' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black border border-gold/20 rounded-lg overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gold/20">
              <h2 className="text-2xl font-bold text-gold">Watch Inventory</h2>
            </div>

          {watches.length === 0 ? (
            <motion.div 
              className="p-12 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-6xl mb-4">⌚</div>
              <h3 className="text-2xl font-heading font-bold text-white mb-2">No Watches Found</h3>
              <p className="text-gray-400 text-lg">Your inventory is empty. Add watches to get started.</p>
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900">
                    <th className="px-6 py-4 text-left text-gold font-semibold">Image</th>
                    <th className="px-6 py-4 text-left text-gold font-semibold">Name</th>
                    <th className="px-6 py-4 text-left text-gold font-semibold">Brand</th>
                    <th className="px-6 py-4 text-left text-gold font-semibold">Price (RM)</th>
                    <th className="px-6 py-4 text-left text-gold font-semibold">Stock</th>
                    <th className="px-6 py-4 text-left text-gold font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {watches.map((watch, index) => (
                    <motion.tr 
                      key={watch.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border-b border-gray-700 transition-all duration-200 hover:bg-gold/10 ${
                        index % 2 === 0 ? 'bg-gray-900/50' : 'bg-white/5'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <img 
                          src={watch.imageUrl || watch.images?.[0] || 'https://via.placeholder.com/100x100.png?text=No+Image'}
                          alt={watch.title}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-700"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/100x100.png?text=No+Image';
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{watch.title || 'Untitled'}</div>
                        <div className="text-gray-400 text-sm">{watch.category || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{watch.brand || 'Unknown'}</td>
                      <td className="px-6 py-4 text-gold font-semibold">
                        {formatRMPrice(watch.price || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          watch.status === 'sold' 
                            ? 'bg-red-900/20 text-red-400 border border-red-500' 
                            : 'bg-green-900/20 text-green-400 border border-green-500'
                        }`}>
                          {watch.status === 'sold' ? 'Sold' : 'Available'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <motion.button
                            onClick={() => openEditModal(watch)}
                            className="bg-gold text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Edit
                          </motion.button>
                          <motion.button
                            onClick={() => deleteWatch(watch.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Delete
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </motion.div>
        )}

        {/* Orders Management */}
        {activeTab === 'orders' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black border border-gold/20 rounded-lg overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gold/20">
              <h2 className="text-2xl font-bold text-gold">Order Management</h2>
            </div>

            {orders.length === 0 ? (
              <motion.div 
                className="p-12 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-heading font-bold text-white mb-2">No Orders Found</h3>
                <p className="text-gray-400 text-lg">No orders have been placed yet.</p>
              </motion.div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-900">
                      <th className="px-6 py-4 text-left text-gold font-semibold">Order ID</th>
                      <th className="px-6 py-4 text-left text-gold font-semibold">Date</th>
                      <th className="px-6 py-4 text-left text-gold font-semibold">Customer</th>
                      <th className="px-6 py-4 text-left text-gold font-semibold">Amount</th>
                      <th className="px-6 py-4 text-left text-gold font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-gold font-semibold">Tracking</th>
                      <th className="px-6 py-4 text-left text-gold font-semibold">Courier</th>
                      <th className="px-6 py-4 text-left text-gold font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, index) => (
                      <motion.tr 
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`border-b border-gray-700 transition-all duration-200 hover:bg-gold/10 ${
                          index % 2 === 0 ? 'bg-gray-900/50' : 'bg-white/5'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="text-white font-mono text-sm">{order.orderId}</div>
                          <div className="text-gray-400 text-xs">{order.items?.length || 0} items</div>
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {order.userId?.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-gold font-semibold">
                          {formatRMPrice(order.amount || 0)}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={order.status || 'Processing'}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border bg-gray-800 ${getStatusColor(order.status)}`}
                          >
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-mono text-xs">
                            {order.trackingNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={order.courier || ''}
                            onChange={(e) => updateOrderCourier(order.id, e.target.value)}
                            placeholder="Enter courier"
                            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-24"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <motion.button
                              onClick={() => {
                                const nextStatus = order.status === 'Processing' ? 'Shipped' : 
                                                 order.status === 'Shipped' ? 'Delivered' : 'Processing';
                                updateOrderStatus(order.id, nextStatus);
                              }}
                              className="bg-gold text-black px-3 py-1 rounded text-xs font-semibold hover:bg-yellow-600 transition duration-200"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Next Status
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModal.isOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gray-900 border-2 border-gold rounded-2xl p-8 w-full max-w-lg shadow-2xl"
            >
              <h3 className="text-2xl font-heading font-bold text-gold mb-6">Edit Watch</h3>
              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Brand *
                    </label>
                    <input
                      type="text"
                      value={editForm.brand}
                      onChange={(e) => setEditForm({...editForm, brand: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Category
                      </label>
                      <input
                        type="text"
                        value={editForm.category}
                        onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                        placeholder="e.g., Luxury"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Gender
                      </label>
                      <input
                        type="text"
                        value={editForm.gender}
                        onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                        placeholder="e.g., Men"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Price (RM) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-8">
                  <motion.button
                    type="submit"
                    className="flex-1 bg-gold text-black py-3 rounded-lg font-heading font-bold hover:bg-yellow-600 transition duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Update Watch
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 bg-transparent border-2 border-gray-600 text-gray-300 hover:border-gold hover:text-gold py-3 rounded-lg font-heading font-semibold transition duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
