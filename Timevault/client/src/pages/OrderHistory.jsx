import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { formatRMPrice } from '../utils/currency';
import { useNavigate } from 'react-router-dom';

const OrderHistory = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [copiedTracking, setCopiedTracking] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [currentUser]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching orders for user:', currentUser.uid);
      
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Found orders:', ordersData.length, ordersData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Try without orderBy in case there's an index issue
      try {
        console.log('Retrying without orderBy...');
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort manually by createdAt
        ordersData.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime - aTime;
        });
        
        console.log('Found orders (retry):', ordersData.length, ordersData);
        setOrders(ordersData);
      } catch (retryError) {
        console.error('Retry also failed:', retryError);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'text-gold bg-gold/10 border-gold/30';
      case 'Shipped':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'Processing':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const copyTrackingNumber = async (trackingNumber) => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopiedTracking(trackingNumber);
      setTimeout(() => setCopiedTracking(''), 2000);
    } catch (error) {
      console.error('Failed to copy tracking number:', error);
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-2xl font-heading font-bold text-white mb-4">Login Required</h2>
          <p className="text-gray-300 mb-6">Please login to view your order history.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-gold hover:bg-yellow-600 text-black font-heading font-semibold px-6 py-3 rounded-lg transition duration-300"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gold text-xl font-heading">Loading order history...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black">
      {/* Header */}
      <motion.section
        className="pt-24 pb-8 px-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <motion.div
              className="text-6xl mb-4"
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              📦
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gold mb-2">
              Order History
            </h1>
            <p className="text-gray-300">
              Track your luxury timepiece orders and delivery status
            </p>
          </div>
        </div>
      </motion.section>

      {/* Orders List */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {orders.length === 0 ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-8xl mb-8">⌚</div>
              <h2 className="text-3xl font-heading font-bold text-white mb-4">
                No Orders Yet
              </h2>
              <p className="text-gray-300 mb-4 max-w-md mx-auto">
                You haven't placed any orders yet. Start shopping for luxury timepieces!
              </p>
              <p className="text-gray-500 text-sm mb-8">
                User ID: {currentUser?.uid?.substring(0, 8)}...
              </p>
              <div className="flex gap-4 justify-center">
                <motion.button
                  onClick={() => navigate('/browse')}
                  className="bg-gold hover:bg-yellow-600 text-black font-heading font-bold py-4 px-8 rounded-lg text-lg transition duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Browse Watches
                </motion.button>
                <motion.button
                  onClick={fetchOrders}
                  className="bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black font-heading font-bold py-4 px-8 rounded-lg text-lg transition duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Refresh
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {orders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-2xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    {/* Order Header */}
                    <div className="p-6 border-b border-gray-800">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-xl font-heading font-bold text-white">
                              Order #{order.orderId}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm">
                            Placed on {formatDate(order.createdAt)}
                          </p>
                        </div>
                        
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-heading font-bold text-gold">
                              {formatRMPrice(order.amount)}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            className="bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black font-heading font-semibold py-2 px-4 rounded-lg transition duration-300"
                          >
                            {expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                          </button>
                        </div>
                      </div>
                      
                      {/* Tracking Info */}
                      {order.trackingNumber && (
                        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="text-gray-400 text-sm">Tracking Number</p>
                              <p className="text-white font-mono text-sm">{order.trackingNumber}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {order.courier && (
                                <span className="text-gray-400 text-sm">via {order.courier}</span>
                              )}
                              <button
                                onClick={() => copyTrackingNumber(order.trackingNumber)}
                                className="bg-gold hover:bg-yellow-600 text-black text-sm font-semibold px-3 py-1 rounded transition duration-300"
                              >
                                {copiedTracking === order.trackingNumber ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Order Details */}
                    <AnimatePresence>
                      {expandedOrder === order.id && (
                        <motion.div
                          className="p-6 bg-gray-800/50"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <h4 className="text-lg font-heading font-semibold text-white mb-4">
                            Order Items
                          </h4>
                          <div className="space-y-4">
                            {order.items?.map((item, itemIndex) => (
                              <motion.div
                                key={itemIndex}
                                className="flex gap-4 p-4 bg-gray-900 rounded-lg"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: itemIndex * 0.1 }}
                              >
                                <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch';
                                    }}
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="text-gold text-sm font-semibold uppercase tracking-wider">
                                    {item.brand}
                                  </p>
                                  <h5 className="text-white font-heading font-semibold">
                                    {item.title}
                                  </h5>
                                  <div className="flex justify-between items-center mt-2">
                                    <span className="text-gray-400 text-sm">
                                      Qty: {item.quantity || 1}
                                    </span>
                                    <span className="text-gold font-semibold">
                                      {formatRMPrice((item.price || 0) * (item.quantity || 1))}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          
                          {/* Delivery Address */}
                          {order.deliveryAddress && (
                            <div className="mt-6 p-4 bg-gray-900 rounded-lg">
                              <h5 className="text-white font-semibold mb-2">Delivery Address</h5>
                              <p className="text-gray-300">{order.deliveryAddress}</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default OrderHistory;
