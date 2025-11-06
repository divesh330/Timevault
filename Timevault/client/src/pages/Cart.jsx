import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { formatRMPrice } from '../utils/currency';

const Cart = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    fetchCartItems();
  }, [currentUser]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const cartsRef = collection(db, 'carts');
      const q = query(cartsRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      const items = querySnapshot.docs.map(doc => ({
        cartDocId: doc.id,
        ...doc.data()
      }));
      
      setCartItems(items);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (cartDocId) => {
    try {
      await deleteDoc(doc(db, 'carts', cartDocId));
      setCartItems(prev => prev.filter(item => item.cartDocId !== cartDocId));
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;
    
    try {
      const deletePromises = cartItems.map(item => 
        deleteDoc(doc(db, 'carts', item.cartDocId))
      );
      await Promise.all(deletePromises);
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert('Failed to clear cart. Please try again.');
    }
  };

  const handleQuantityChange = async (cartDocId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(cartDocId);
      return;
    }

    try {
      await updateDoc(doc(db, 'carts', cartDocId), {
        quantity: newQuantity
      });
      
      setCartItems(prev => prev.map(item => 
        item.cartDocId === cartDocId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity. Please try again.');
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return total + (price * quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0);
  };

  const handleProceedToCheckout = () => {
    navigate('/checkout');
  };

  const handleMockPayment = async () => {
    setProcessingPayment(true);
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create transaction in Firestore
      const transactionData = {
        userId: currentUser.uid,
        items: cartItems.map(item => ({
          watchId: item.watchId,
          title: item.title,
          brand: item.brand,
          price: item.price,
          quantity: item.quantity || 1,
          imageUrl: item.imageUrl
        })),
        totalPrice: getTotalPrice(),
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'transactions'), transactionData);
      setTransactionId(docRef.id);
      
      // Clear cart after successful checkout
      const deletePromises = cartItems.map(item => 
        deleteDoc(doc(db, 'carts', item.cartDocId))
      );
      await Promise.all(deletePromises);
      setCartItems([]);
      
      // Show success popup
      setShowCheckoutModal(false);
      setShowSuccessPopup(true);
      
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleContinueShopping = () => {
    navigate('/browse');
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
          <p className="text-gray-300 mb-6">Please login to view your cart.</p>
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gold text-xl font-heading">Loading your cart...</p>
        </motion.div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <motion.section
          className="pt-24 pb-20 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-8xl mb-8">🛒</div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
                Your Cart is Empty
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Discover our exquisite collection of luxury timepieces and add your favorites to your cart.
              </p>
              <motion.button
                onClick={handleContinueShopping}
                className="bg-gold hover:bg-yellow-600 text-black font-heading font-bold py-4 px-8 rounded-lg text-lg transition duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Browse Watches
              </motion.button>
            </motion.div>
          </div>
        </motion.section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <motion.section
        className="pt-24 pb-8 px-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-gold mb-2">
                Shopping Cart
              </h1>
              <p className="text-gray-300">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            <motion.button
              onClick={handleClearCart}
              className="mt-4 md:mt-0 text-gray-400 hover:text-red-400 transition duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear Cart
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Cart Items */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence>
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.cartDocId}
                    className="bg-gray-900 rounded-xl p-6 shadow-2xl"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    layout
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Image */}
                      <div className="w-full md:w-32 h-32 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch';
                          }}
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-gold text-sm font-semibold uppercase tracking-wider">
                            {item.brand}
                          </p>
                          <h3 className="text-white text-lg font-heading font-semibold">
                            {item.title}
                          </h3>
                        </div>

                        <div className="space-y-4">
                          {/* Price and Quantity Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            {/* Individual Price */}
                            <div>
                              <p className="text-gray-400 text-sm">Price per item</p>
                              <div className="text-xl font-heading font-bold text-gold">
                                {formatRMPrice(item.price)}
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-3">
                              <span className="text-gray-300 text-sm font-medium">Quantity:</span>
                              <div className="flex items-center bg-gray-800 rounded-lg border border-gray-700">
                                <motion.button
                                  onClick={() => handleQuantityChange(item.cartDocId, (item.quantity || 1) - 1)}
                                  className="px-3 py-2 text-gold hover:bg-gray-700 transition duration-200 font-bold text-lg"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  −
                                </motion.button>
                                <span className="px-4 py-2 text-white font-semibold min-w-[3rem] text-center text-lg">
                                  {item.quantity || 1}
                                </span>
                                <motion.button
                                  onClick={() => handleQuantityChange(item.cartDocId, (item.quantity || 1) + 1)}
                                  className="px-3 py-2 text-gold hover:bg-gray-700 transition duration-200 font-bold text-lg"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  +
                                </motion.button>
                              </div>
                            </div>
                          </div>

                          {/* Total Price and Remove Button Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-gray-800">
                            {/* Total Price for this item */}
                            <div>
                              <p className="text-gray-400 text-sm">Total</p>
                              <motion.div 
                                className="text-2xl font-heading font-bold text-white"
                                key={`${item.cartDocId}-${item.quantity}`}
                                initial={{ scale: 1.2, color: '#D4AF37' }}
                                animate={{ scale: 1, color: '#FFFFFF' }}
                                transition={{ duration: 0.3 }}
                              >
                                {formatRMPrice((item.price || 0) * (item.quantity || 1))}
                              </motion.div>
                            </div>

                            {/* Remove Button */}
                            <motion.button
                              onClick={() => handleRemoveItem(item.cartDocId)}
                              className="text-red-400 hover:text-red-300 px-4 py-2 rounded-lg hover:bg-red-400/10 transition duration-200 flex items-center gap-2 border border-red-400/20 hover:border-red-400"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Remove
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                className="bg-gray-900 rounded-xl p-6 shadow-2xl sticky top-24"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h2 className="text-2xl font-heading font-bold text-white mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-300">
                    <span>Items ({getTotalItems()}):</span>
                    <span>{formatRMPrice(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Shipping:</span>
                    <span className="text-green-400">Free</span>
                  </div>
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-heading font-semibold text-white">Total:</span>
                      <motion.span 
                        className="text-2xl font-heading font-bold text-gold"
                        key={getTotalPrice()}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {formatRMPrice(getTotalPrice())}
                      </motion.span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <motion.button
                    onClick={handleProceedToCheckout}
                    className="w-full bg-gold hover:bg-yellow-600 text-black font-heading font-bold py-4 px-6 rounded-lg text-lg transition duration-300"
                    whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(212, 175, 55, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Proceed to PayPal Checkout
                  </motion.button>
                  
                  <motion.button
                    onClick={handleContinueShopping}
                    className="w-full bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black font-heading font-semibold py-3 px-6 rounded-lg transition duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue Shopping
                  </motion.button>
                </div>

                {/* Security Badge */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="flex items-center justify-center text-gray-400 text-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secure Checkout
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gold shadow-2xl"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="text-center">
                <motion.div
                  className="text-6xl mb-4"
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  💳
                </motion.div>
                <h2 className="text-2xl font-heading font-bold text-gold mb-4">
                  Mock Payment
                </h2>
                <p className="text-gray-300 mb-6">
                  This is a simulated payment process. Click confirm to complete your order.
                </p>
                
                <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
                  <div className="flex justify-between text-gray-300 mb-2">
                    <span>Items:</span>
                    <span>{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-gold">{formatRMPrice(getTotalPrice())}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setShowCheckoutModal(false)}
                    disabled={processingPayment}
                    className="flex-1 bg-transparent border-2 border-gray-600 text-gray-300 hover:border-gold hover:text-gold font-heading font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleMockPayment}
                    disabled={processingPayment}
                    className="flex-1 bg-gold hover:bg-yellow-600 text-black font-heading font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {processingPayment ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      'Confirm Payment'
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gold shadow-2xl"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="text-center">
                <motion.div
                  className="text-6xl mb-4"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  ✅
                </motion.div>
                <h2 className="text-2xl font-heading font-bold text-gold mb-4">
                  Payment Successful!
                </h2>
                <p className="text-gray-300 mb-4">
                  Order placed successfully!
                </p>
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                  <p className="text-gray-400 text-sm mb-1">Transaction ID</p>
                  <p className="text-white font-mono text-sm break-all">{transactionId}</p>
                  <p className="text-gray-400 text-sm mt-3">Total: <span className="text-gold font-semibold">{formatRMPrice(getTotalPrice())}</span></p>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => {
                      setShowSuccessPopup(false);
                      navigate('/browse');
                    }}
                    className="flex-1 bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black font-heading font-bold py-3 px-6 rounded-lg transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Continue Shopping
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowSuccessPopup(false);
                      navigate('/');
                    }}
                    className="flex-1 bg-gold hover:bg-yellow-600 text-black font-heading font-bold py-3 px-6 rounded-lg transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Go Home
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart;
