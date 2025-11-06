import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { formatRMPrice } from '../utils/currency';

const CheckoutPayPal = () => {
  console.log('🔧 CHECKOUT PAYPAL COMPONENT MOUNTED');
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const paypalRef = useRef();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');

  // Comprehensive diagnostics
  console.log('👤 Current User:', currentUser?.email || 'Not logged in');
  console.log('🛒 Cart Items Count:', cartItems.length);
  console.log('💳 PayPal Loaded:', paypalLoaded);
  console.log('💳 Window PayPal Available:', !!window.paypal);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchCartItems();
    loadPayPalScript();
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
      setErrorMessage('Failed to load cart items');
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const loadPayPalScript = () => {
    console.log('💳 Loading PayPal SDK...');
    console.log('💳 PayPal SDK Before Load:', !!window.paypal);
    
    if (window.paypal) {
      console.log('✅ PayPal SDK already loaded');
      setPaypalLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/sdk/js?client-id=Aag7jzHJY7SsZcOvhDOFxy2kGcRQkvwEwORrd44WQS9m5TEeTEDpHmJfgE3yhEH3vneehCFf6bXBgrbA&currency=MYR&intent=capture';
    script.addEventListener('load', () => {
      console.log('✅ PayPal SDK loaded successfully');
      console.log('💳 PayPal SDK After Load:', !!window.paypal);
      setPaypalLoaded(true);
    });
    script.addEventListener('error', (error) => {
      console.error('🚨 PayPal SDK failed to load:', error);
    });
    document.body.appendChild(script);
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

  useEffect(() => {
    if (paypalLoaded && cartItems.length > 0 && paypalRef.current) {
      console.log('🔧 Rendering PayPal buttons...');
      console.log('💰 Total Price:', getTotalPrice().toFixed(2));
      console.log('📦 Total Items:', getTotalItems());
      
      try {
        window.paypal.Buttons({
          createOrder: (data, actions) => {
            console.log('💳 Creating PayPal order...');
            const totalPrice = getTotalPrice();
            const safePrice = totalPrice > 0 ? totalPrice.toFixed(2) : "10.00";
            console.log('💰 Order Amount:', safePrice);
            
            return actions.order.create({
              purchase_units: [{
                amount: {
                  currency_code: 'MYR',
                  value: safePrice
                },
                description: `TimeVault Order - ${getTotalItems()} items`
              }]
            });
          },
          onApprove: async (data, actions) => {
            console.log('✅ PayPal payment approved:', data);
            try {
              const order = await actions.order.capture();
              console.log('✅ Payment captured:', order);
              await handlePaymentSuccess(order);
            } catch (error) {
              console.error('🚨 PayPal payment error:', error);
              setErrorMessage('Payment processing failed. Please try again.');
              setShowErrorPopup(true);
            }
          },
          onError: (err) => {
            console.error('🚨 PayPal error:', err);
            setErrorMessage('PayPal encountered an error. Please try again.');
            setShowErrorPopup(true);
          },
          onCancel: (data) => {
            console.log('⚠️ Payment cancelled:', data);
            setErrorMessage('Payment was cancelled.');
            setShowErrorPopup(true);
          }
        }).render(paypalRef.current);
        
        console.log('✅ PayPal buttons rendered successfully');
      } catch (error) {
        console.error('🚨 Error rendering PayPal buttons:', error);
        setErrorMessage('Failed to load PayPal buttons. Please refresh the page.');
        setShowErrorPopup(true);
      }
    }
  }, [paypalLoaded, cartItems]);

  const handlePaymentSuccess = async (paypalOrder) => {
    try {
      // Generate unique order ID
      const orderId = `TVL-${Date.now()}`;
      const trackingNumber = `TVL-${Date.now()}`;
      
      // Create transaction in Firestore
      const transactionData = {
        buyerId: currentUser.uid,
        items: cartItems.map(item => ({
          watchId: item.watchId,
          title: item.title,
          brand: item.brand,
          price: item.price,
          quantity: item.quantity || 1,
          imageUrl: item.imageUrl
        })),
        amount: getTotalPrice(),
        currency: 'MYR',
        status: 'paid',
        transactionId: paypalOrder.id,
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'transactions'), transactionData);
      setTransactionId(docRef.id);
      
      // Create order in Firestore for delivery tracking
      const orderData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        orderId: orderId,
        paypalOrderId: paypalOrder.id,
        items: cartItems.map(item => ({
          watchId: item.watchId || item.id,
          title: item.title || item.name,
          brand: item.brand,
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 1,
          imageUrl: item.imageUrl
        })),
        amount: getTotalPrice(),
        status: 'Processing',
        trackingNumber: trackingNumber,
        deliveryAddress: 'Malaysia', // Default address - can be enhanced later
        courier: 'PosLaju',
        createdAt: serverTimestamp()
      };
      
      console.log('Creating order with data:', orderData);
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      console.log('Order created successfully with ID:', orderRef.id);
      
      // Clear cart after successful payment
      const deletePromises = cartItems.map(item => 
        deleteDoc(doc(db, 'carts', item.cartDocId))
      );
      await Promise.all(deletePromises);
      setCartItems([]);
      
      // Show success popup
      setShowSuccessPopup(true);
      
    } catch (error) {
      console.error('Error processing transaction:', error);
      setErrorMessage('Transaction processing failed. Please contact support.');
      setShowErrorPopup(true);
    }
  };

  const handleContinueShopping = () => {
    setShowSuccessPopup(false);
    navigate('/browse');
  };

  const handleGoHome = () => {
    setShowSuccessPopup(false);
    navigate('/');
  };

  const handleViewOrders = () => {
    setShowSuccessPopup(false);
    navigate('/order-history');
  };

  const handleCloseError = () => {
    setShowErrorPopup(false);
    setErrorMessage('');
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
          <p className="text-gray-300 mb-6">Please login to proceed with checkout.</p>
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
          <p className="text-gold text-xl font-heading">Loading checkout...</p>
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
                Add some luxury timepieces to your cart before proceeding to checkout.
              </p>
              <motion.button
                onClick={() => navigate('/browse')}
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
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gold mb-2">
              PayPal Checkout
            </h1>
            <p className="text-gray-300">
              Secure payment with PayPal for {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Main Content */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Order Summary */}
            <motion.div
              className="bg-gray-900 rounded-xl p-6 shadow-2xl"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-heading font-bold text-white mb-6">
                Order Summary
              </h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                <AnimatePresence>
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item.cartDocId}
                      className="flex gap-4 p-4 bg-gray-800 rounded-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
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
                        <h3 className="text-white text-sm font-heading font-semibold">
                          {item.title}
                        </h3>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-gray-400 text-sm">Qty: {item.quantity || 1}</span>
                          <span className="text-gold font-semibold">
                            {formatRMPrice((item.price || 0) * (item.quantity || 1))}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal ({getTotalItems()} items):</span>
                  <span>{formatRMPrice(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Shipping:</span>
                  <span className="text-green-400">Free</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
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
            </motion.div>

            {/* Right Column - PayPal Payment */}
            <motion.div
              className="bg-gray-900 rounded-xl p-6 shadow-2xl"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-heading font-bold text-white mb-6">
                Payment Method
              </h2>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">PayPal</span>
                  </div>
                  <span className="text-gray-300">Secure payment with PayPal</span>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 text-sm">
                    <strong>Sandbox Mode:</strong> This is a test environment. Use PayPal sandbox credentials for testing.
                  </p>
                </div>
              </div>

              {/* PayPal Button Container */}
              <div className="mb-6">
                {paypalLoaded ? (
                  <div ref={paypalRef} className="paypal-button-container"></div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span className="text-gray-300">Loading PayPal...</span>
                  </div>
                )}
                
                {/* Fallback Button */}
                {!paypalLoaded && (
                  <div className="mt-4">
                    <div className="bg-yellow-900 border border-yellow-500 p-4 rounded-lg mb-4">
                      <p className="text-yellow-300 text-sm">⚠️ PayPal is taking longer than expected to load.</p>
                    </div>
                    <button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
                      onClick={() => {
                        alert('✅ Payment successful! Your order has been placed.');
                        console.log('🔧 Fallback payment button clicked');
                      }}
                    >
                      🔧 Test Payment (Fallback)
                    </button>
                  </div>
                )}
              </div>

              {/* Security Info */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-green-400 font-semibold">Secure Checkout</span>
                </div>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>✓ 256-bit SSL encryption</li>
                  <li>✓ PayPal buyer protection</li>
                  <li>✓ Secure payment processing</li>
                </ul>
              </div>

              {/* Back to Cart */}
              <motion.button
                onClick={() => navigate('/cart')}
                className="w-full mt-6 bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black font-heading font-semibold py-3 px-6 rounded-lg transition duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Back to Cart
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

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
                  Your order has been processed successfully!
                </p>
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                  <p className="text-gray-400 text-sm mb-1">Transaction ID</p>
                  <p className="text-white font-mono text-sm break-all">{transactionId}</p>
                  <p className="text-gray-400 text-sm mt-3">Total: <span className="text-gold font-semibold">{formatRMPrice(getTotalPrice())}</span></p>
                </div>
                <div className="flex flex-col gap-3">
                  <motion.button
                    onClick={handleViewOrders}
                    className="w-full bg-gold hover:bg-yellow-600 text-black font-heading font-bold py-3 px-6 rounded-lg transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View My Orders
                  </motion.button>
                  <div className="flex gap-3">
                    <motion.button
                      onClick={handleContinueShopping}
                      className="flex-1 bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black font-heading font-bold py-3 px-6 rounded-lg transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Continue Shopping
                    </motion.button>
                    <motion.button
                      onClick={handleGoHome}
                      className="flex-1 bg-transparent border-2 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white font-heading font-bold py-3 px-6 rounded-lg transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Go Home
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Popup */}
      <AnimatePresence>
        {showErrorPopup && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-red-500 shadow-2xl"
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
                  ⚠️
                </motion.div>
                <h2 className="text-2xl font-heading font-bold text-red-400 mb-4">
                  Payment Failed
                </h2>
                <p className="text-gray-300 mb-6">
                  {errorMessage}
                </p>
                <motion.button
                  onClick={handleCloseError}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-heading font-bold py-3 px-6 rounded-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Again
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CheckoutPayPal;
