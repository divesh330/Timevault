import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatRMPrice } from '../utils/currency';

const CheckoutCart = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { items, getTotalPrice, getFormattedTotal, clearCart, isEmpty } = useCart();
  
  const [currentStep, setCurrentStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const [shippingInfo, setShippingInfo] = useState({
    fullName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  // Redirect if not logged in or cart is empty
  React.useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (isEmpty) {
      navigate('/cart');
      return;
    }
  }, [currentUser, isEmpty, navigate]);

  const handleShippingChange = (e) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handlePaymentChange = (e) => {
    let value = e.target.value;
    const name = e.target.name;

    // Format card number with spaces
    if (name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (value.length > 19) return;
    }

    // Format expiry date
    if (name === 'expiryDate') {
      value = value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
      }
      if (value.length > 5) return;
    }

    // Limit CVV to 4 digits
    if (name === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }

    setPaymentInfo({
      ...paymentInfo,
      [name]: value,
    });
  };

  const validateShipping = () => {
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    for (const field of required) {
      if (!shippingInfo[field]) {
        setError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingInfo.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const validatePayment = () => {
    if (!paymentInfo.cardNumber || paymentInfo.cardNumber.replace(/\s/g, '').length < 13) {
      setError('Please enter a valid card number');
      return false;
    }
    if (!paymentInfo.cardName) {
      setError('Please enter cardholder name');
      return false;
    }
    if (!paymentInfo.expiryDate || paymentInfo.expiryDate.length < 5) {
      setError('Please enter expiry date (MM/YY)');
      return false;
    }
    if (!paymentInfo.cvv || paymentInfo.cvv.length < 3) {
      setError('Please enter CVV');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError('');
    
    if (currentStep === 1) {
      if (validateShipping()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validatePayment()) {
        setCurrentStep(3);
      }
    }
  };

  const handlePreviousStep = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handlePlaceOrder = async () => {
    try {
      setProcessing(true);
      setError('');

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate order ID
      const orderId = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();

      // Clear cart and redirect to success page
      clearCart();
      navigate('/thank-you', { 
        state: { 
          orderId, 
          shippingInfo, 
          items: [...items],
          total: getTotalPrice()
        } 
      });
    } catch (err) {
      console.error('Error processing order:', err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = formatRMPrice;

  if (isEmpty) {
    return null; // Will redirect in useEffect
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
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gold mb-2">
            Checkout
          </h1>
          <p className="text-gray-300">
            Complete your purchase of {items.length} luxury timepiece{items.length !== 1 ? 's' : ''}
          </p>
        </div>
      </motion.section>

      {/* Progress Tracker */}
      <section className="pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <motion.div 
                  className={`flex items-center justify-center w-12 h-12 rounded-full font-heading font-bold transition-all duration-300 ${
                    currentStep >= step ? 'bg-gold text-black' : 'bg-gray-800 text-gray-400'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  {step}
                </motion.div>
                <div className={`text-sm font-heading ml-3 transition-colors duration-300 ${
                  currentStep >= step ? 'text-gold' : 'text-gray-400'
                }`}>
                  {step === 1 && 'Shipping'}
                  {step === 2 && 'Payment'}
                  {step === 3 && 'Review'}
                </div>
                {step < 3 && (
                  <div className={`w-20 h-0.5 mx-6 transition-colors duration-300 ${
                    currentStep > step ? 'bg-gold' : 'bg-gray-800'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="max-w-6xl mx-auto px-6 mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg backdrop-blur-sm">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2">
              <motion.div
                className="bg-gray-900 rounded-xl p-8 shadow-2xl"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <AnimatePresence mode="wait">
                  {/* Step 1: Shipping Information */}
                  {currentStep === 1 && (
                    <motion.div
                      key="shipping"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-2xl font-heading font-bold text-white mb-6">Shipping Information</h2>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                          <input
                            type="text"
                            name="fullName"
                            value={shippingInfo.fullName}
                            onChange={handleShippingChange}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold text-white transition duration-200"
                            placeholder="John Doe"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                            <input
                              type="email"
                              name="email"
                              value={shippingInfo.email}
                              onChange={handleShippingChange}
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold text-white transition duration-200"
                              placeholder="john@example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                            <input
                              type="tel"
                              name="phone"
                              value={shippingInfo.phone}
                              onChange={handleShippingChange}
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold text-white transition duration-200"
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Address *</label>
                          <input
                            type="text"
                            name="address"
                            value={shippingInfo.address}
                            onChange={handleShippingChange}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold text-white transition duration-200"
                            placeholder="123 Main Street, Apt 4B"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
                            <input
                              type="text"
                              name="city"
                              value={shippingInfo.city}
                              onChange={handleShippingChange}
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold text-white transition duration-200"
                              placeholder="New York"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">State *</label>
                            <input
                              type="text"
                              name="state"
                              value={shippingInfo.state}
                              onChange={handleShippingChange}
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold text-white transition duration-200"
                              placeholder="NY"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">ZIP Code *</label>
                            <input
                              type="text"
                              name="zipCode"
                              value={shippingInfo.zipCode}
                              onChange={handleShippingChange}
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold text-white transition duration-200"
                              placeholder="10001"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Country *</label>
                          <input
                            type="text"
                            name="country"
                            value={shippingInfo.country}
                            onChange={handleShippingChange}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold text-white transition duration-200"
                          />
                        </div>
                      </div>

                      <div className="mt-8 flex justify-end">
                        <motion.button
                          onClick={handleNextStep}
                          className="bg-gold hover:bg-yellow-600 text-black font-heading font-bold py-3 px-8 rounded-lg transition duration-300"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Continue to Payment
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Payment Information */}
                  {currentStep === 2 && (
                    <motion.div
                      key="payment"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-2xl font-heading font-bold text-white mb-2">Payment Information</h2>
                      <p className="text-sm text-gray-400 mb-6">Test Mode: Use card 4242 4242 4242 4242</p>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Card Number *</label>
                          <input
                            type="text"
                            name="cardNumber"
                            value={paymentInfo.cardNumber}
                            onChange={handlePaymentChange}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold text-white font-mono transition duration-200"
                            placeholder="4242 4242 4242 4242"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Cardholder Name *</label>
                          <input
                            type="text"
                            name="cardName"
                            value={paymentInfo.cardName}
                            onChange={handlePaymentChange}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold text-white transition duration-200"
                            placeholder="John Doe"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Expiry Date *</label>
                            <input
                              type="text"
                              name="expiryDate"
                              value={paymentInfo.expiryDate}
                              onChange={handlePaymentChange}
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold text-white font-mono transition duration-200"
                              placeholder="MM/YY"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">CVV *</label>
                            <input
                              type="text"
                              name="cvv"
                              value={paymentInfo.cvv}
                              onChange={handlePaymentChange}
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold text-white font-mono transition duration-200"
                              placeholder="123"
                            />
                          </div>
                        </div>

                        <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                          <p className="text-sm text-blue-300">
                            <strong>Test Mode:</strong> This is a simulated payment. Use test card 4242 4242 4242 4242 with any future expiry date and any 3-digit CVV.
                          </p>
                        </div>
                      </div>

                      <div className="mt-8 flex justify-between">
                        <motion.button
                          onClick={handlePreviousStep}
                          className="bg-gray-700 hover:bg-gray-600 text-white font-heading font-semibold py-3 px-8 rounded-lg transition duration-300"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Back
                        </motion.button>
                        <motion.button
                          onClick={handleNextStep}
                          className="bg-gold hover:bg-yellow-600 text-black font-heading font-bold py-3 px-8 rounded-lg transition duration-300"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Review Order
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Review Order */}
                  {currentStep === 3 && (
                    <motion.div
                      key="review"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-2xl font-heading font-bold text-white mb-6">Review Your Order</h2>
                      
                      {/* Shipping Info Review */}
                      <div className="mb-6">
                        <h3 className="text-lg font-heading font-semibold text-white mb-3">Shipping Address</h3>
                        <div className="bg-gray-800 rounded-lg p-4">
                          <p className="text-gray-300">{shippingInfo.fullName}</p>
                          <p className="text-gray-300">{shippingInfo.address}</p>
                          <p className="text-gray-300">{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}</p>
                          <p className="text-gray-300">{shippingInfo.country}</p>
                          <p className="text-gray-300 mt-2">{shippingInfo.email}</p>
                          <p className="text-gray-300">{shippingInfo.phone}</p>
                        </div>
                      </div>

                      {/* Payment Info Review */}
                      <div className="mb-6">
                        <h3 className="text-lg font-heading font-semibold text-white mb-3">Payment Method</h3>
                        <div className="bg-gray-800 rounded-lg p-4">
                          <p className="text-gray-300">Card ending in {paymentInfo.cardNumber.slice(-4)}</p>
                          <p className="text-gray-300">{paymentInfo.cardName}</p>
                        </div>
                      </div>

                      <div className="mt-8 flex justify-between">
                        <motion.button
                          onClick={handlePreviousStep}
                          className="bg-gray-700 hover:bg-gray-600 text-white font-heading font-semibold py-3 px-8 rounded-lg transition duration-300"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Back
                        </motion.button>
                        <motion.button
                          onClick={handlePlaceOrder}
                          disabled={processing}
                          className="bg-gold hover:bg-yellow-600 text-black font-heading font-bold py-4 px-8 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={!processing ? { scale: 1.02, boxShadow: "0 10px 30px rgba(212, 175, 55, 0.3)" } : {}}
                          whileTap={!processing ? { scale: 0.98 } : {}}
                        >
                          {processing ? (
                            <div className="flex items-center">
                              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                              Processing...
                            </div>
                          ) : (
                            'Confirm Purchase'
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                className="bg-gray-900 rounded-xl p-6 shadow-2xl sticky top-24"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h3 className="text-xl font-heading font-bold text-white mb-6">Order Summary</h3>
                
                {/* Items */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch';
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-gold text-xs uppercase">{item.brand}</p>
                        <p className="text-white text-sm font-semibold line-clamp-2">{item.title}</p>
                        <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                        <p className="text-gold font-semibold">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 mb-6 border-t border-gray-700 pt-4">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal:</span>
                    <span>{getFormattedTotal()}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Shipping:</span>
                    <span className="text-green-400">Free</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Tax:</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-heading font-semibold text-white">Total:</span>
                      <span className="text-2xl font-heading font-bold text-gold">{getFormattedTotal()}</span>
                    </div>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="border-t border-gray-700 pt-4">
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
    </div>
  );
};

export default CheckoutCart;
