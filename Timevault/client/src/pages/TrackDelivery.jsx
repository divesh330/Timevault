import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatRMPrice } from '../utils/currency';

const TrackDelivery = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    setLoading(true);
    setError('');
    setOrderData(null);

    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('trackingNumber', '==', trackingNumber.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No order found with this tracking number. Please check and try again.');
      } else {
        const orderDoc = querySnapshot.docs[0];
        const order = {
          id: orderDoc.id,
          ...orderDoc.data()
        };
        setOrderData(order);
      }
    } catch (error) {
      console.error('Error tracking order:', error);
      setError('Failed to track order. Please try again.');
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered':
        return '✅';
      case 'Shipped':
        return '🚚';
      case 'Processing':
        return '📦';
      default:
        return '📋';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeliverySteps = (status) => {
    const steps = [
      { label: 'Order Placed', status: 'completed', icon: '📋' },
      { label: 'Processing', status: status === 'Processing' ? 'current' : status === 'Shipped' || status === 'Delivered' ? 'completed' : 'pending', icon: '📦' },
      { label: 'Shipped', status: status === 'Shipped' ? 'current' : status === 'Delivered' ? 'completed' : 'pending', icon: '🚚' },
      { label: 'Delivered', status: status === 'Delivered' ? 'completed' : 'pending', icon: '✅' }
    ];
    return steps;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black">
      {/* Header */}
      <motion.section
        className="pt-24 pb-8 px-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <motion.div
              className="text-6xl mb-4"
              animate={{ 
                rotate: [0, 10, -10, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              🔍
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gold mb-2">
              Track Your Delivery
            </h1>
            <p className="text-gray-300">
              Enter your tracking number to check the status of your luxury timepiece order
            </p>
          </div>
        </div>
      </motion.section>

      {/* Tracking Form */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <form onSubmit={handleTrackOrder} className="space-y-6">
              <div>
                <label htmlFor="trackingNumber" className="block text-gray-300 text-sm font-semibold mb-2">
                  Tracking Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="trackingNumber"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number (e.g., TVL-1730928742)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full bg-gold hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-heading font-bold py-4 px-6 rounded-lg transition duration-300"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    Tracking Order...
                  </div>
                ) : (
                  'Track Order'
                )}
              </motion.button>
            </form>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="mt-6 p-4 bg-red-900/50 border border-red-500 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⚠️</span>
                    <p className="text-red-300">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Order Results */}
          <AnimatePresence>
            {orderData && (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {/* Order Summary */}
                <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-heading font-bold text-white mb-2">
                        Order #{orderData.orderId}
                      </h2>
                      <p className="text-gray-400">
                        Placed on {formatDate(orderData.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-heading font-bold text-gold mb-1">
                        {formatRMPrice(orderData.amount)}
                      </p>
                      <p className="text-gray-400">
                        {orderData.items?.length || 0} {orderData.items?.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div className="flex items-center justify-center mb-8">
                    <div className={`flex items-center gap-3 px-6 py-3 rounded-full border ${getStatusColor(orderData.status)}`}>
                      <span className="text-2xl">{getStatusIcon(orderData.status)}</span>
                      <span className="font-heading font-bold text-lg">{orderData.status}</span>
                    </div>
                  </div>

                  {/* Delivery Progress */}
                  <div className="mb-8">
                    <h3 className="text-lg font-heading font-semibold text-white mb-6 text-center">
                      Delivery Progress
                    </h3>
                    <div className="flex justify-between items-center relative">
                      {/* Progress Line */}
                      <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-700 z-0"></div>
                      <div 
                        className="absolute top-6 left-0 h-0.5 bg-gold z-10 transition-all duration-1000"
                        style={{ 
                          width: orderData.status === 'Processing' ? '25%' : 
                                 orderData.status === 'Shipped' ? '75%' : 
                                 orderData.status === 'Delivered' ? '100%' : '0%' 
                        }}
                      ></div>

                      {getDeliverySteps(orderData.status).map((step, index) => (
                        <motion.div
                          key={index}
                          className="flex flex-col items-center relative z-20"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-2 border-2 ${
                            step.status === 'completed' ? 'bg-gold border-gold text-black' :
                            step.status === 'current' ? 'bg-gold/20 border-gold text-gold' :
                            'bg-gray-800 border-gray-600 text-gray-400'
                          }`}>
                            {step.icon}
                          </div>
                          <span className={`text-sm font-semibold ${
                            step.status === 'completed' || step.status === 'current' ? 'text-gold' : 'text-gray-400'
                          }`}>
                            {step.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">Tracking Number</h4>
                      <p className="text-gold font-mono">{orderData.trackingNumber}</p>
                    </div>
                    {orderData.courier && (
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">Courier</h4>
                        <p className="text-gray-300">{orderData.courier}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800">
                  <h3 className="text-xl font-heading font-bold text-white mb-6">
                    Order Items
                  </h3>
                  <div className="space-y-4">
                    {orderData.items?.map((item, index) => (
                      <motion.div
                        key={index}
                        className="flex gap-4 p-4 bg-gray-800 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
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
                          <h4 className="text-white font-heading font-semibold">
                            {item.title}
                          </h4>
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};

export default TrackDelivery;
