import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatRMPrice } from '../utils/currency';

const ThankYou = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state;

  useEffect(() => {
    // Redirect to home if no order data
    if (!orderData) {
      navigate('/');
    }
  }, [orderData, navigate]);

  const formatPrice = formatRMPrice;

  if (!orderData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Success Animation */}
      <motion.section
        className="pt-24 pb-20 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Success Icon with Animation */}
          <motion.div
            className="mb-8"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
          >
            <div className="w-32 h-32 mx-auto bg-green-500 rounded-full flex items-center justify-center shadow-2xl">
              <motion.svg
                className="w-16 h-16 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            </div>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4">
              Thank You!
            </h1>
            <p className="text-xl md:text-2xl text-gold mb-2 font-heading">
              Your Order Has Been Confirmed
            </p>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              We've received your order and will begin processing it immediately. 
              You'll receive a confirmation email shortly with tracking information.
            </p>
          </motion.div>

          {/* Order Details Card */}
          <motion.div
            className="bg-gray-900 rounded-xl p-8 shadow-2xl mb-8 text-left max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="border-b border-gray-700 pb-6 mb-6">
              <h2 className="text-2xl font-heading font-bold text-white mb-2">Order Details</h2>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <p className="text-gray-300">
                  Order ID: <span className="text-gold font-mono font-semibold">{orderData.orderId}</span>
                </p>
                <p className="text-gray-300">
                  Date: <span className="text-white">{new Date().toLocaleDateString()}</span>
                </p>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="mb-6">
              <h3 className="text-lg font-heading font-semibold text-white mb-3">Shipping Address</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-300">{orderData.shippingInfo.fullName}</p>
                <p className="text-gray-300">{orderData.shippingInfo.address}</p>
                <p className="text-gray-300">
                  {orderData.shippingInfo.city}, {orderData.shippingInfo.state} {orderData.shippingInfo.zipCode}
                </p>
                <p className="text-gray-300">{orderData.shippingInfo.country}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-lg font-heading font-semibold text-white mb-3">
                Items Ordered ({orderData.items.length})
              </h3>
              <div className="space-y-4">
                {orderData.items.map((item) => (
                  <motion.div
                    key={item.id}
                    className="flex gap-4 bg-gray-800 rounded-lg p-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch';
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-gold text-sm uppercase font-semibold">{item.brand}</p>
                      <p className="text-white font-semibold">{item.title}</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-gray-400">Quantity: {item.quantity}</p>
                        <p className="text-gold font-bold">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Order Total */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-heading font-semibold text-white">Total Paid:</span>
                <span className="text-2xl font-heading font-bold text-gold">
                  {formatPrice(orderData.total)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* What's Next Section */}
          <motion.div
            className="bg-gray-900 rounded-xl p-6 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <h3 className="text-xl font-heading font-bold text-white mb-4">What's Next?</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-black text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="text-white font-semibold">Order Confirmation</p>
                  <p className="text-gray-400 text-sm">You'll receive an email confirmation within 5 minutes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-black text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="text-white font-semibold">Processing & Authentication</p>
                  <p className="text-gray-400 text-sm">Our experts will authenticate and prepare your timepieces (1-2 business days)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-black text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="text-white font-semibold">Shipping & Tracking</p>
                  <p className="text-gray-400 text-sm">Free insured shipping with tracking information provided</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col md:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <motion.button
              onClick={() => navigate('/browse')}
              className="bg-gold hover:bg-yellow-600 text-black font-heading font-bold py-4 px-8 rounded-lg text-lg transition duration-300"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(212, 175, 55, 0.3)" }}
              whileTap={{ scale: 0.95 }}
            >
              Continue Shopping
            </motion.button>
            <motion.button
              onClick={() => navigate('/')}
              className="bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black font-heading font-semibold py-4 px-8 rounded-lg text-lg transition duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Return Home
            </motion.button>
          </motion.div>

          {/* Contact Support */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <p className="text-gray-400 mb-2">Questions about your order?</p>
            <a
              href="mailto:support@timevault.com"
              className="text-gold hover:text-yellow-400 font-semibold transition duration-200"
            >
              Contact Support
            </a>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default ThankYou;
