import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { formatRMPrice } from '../utils/currency';

const WatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [watch, setWatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [cartQuantity, setCartQuantity] = useState(0);

  useEffect(() => {
    if (id) {
      fetchWatchDetails();
      checkIfInCart();
    }
  }, [id, currentUser]);

  const fetchWatchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const watchDoc = await getDoc(doc(db, 'watches', id));
      
      if (watchDoc.exists()) {
        setWatch({
          id: watchDoc.id,
          ...watchDoc.data()
        });
      } else {
        setError('⚠️ Watch not found or has been removed.');
      }
    } catch (err) {
      console.error('Error fetching watch details:', err);
      setError('Failed to load watch details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!watch) return;
    if (!currentUser) {
      showToastMessage('Please log in to continue.');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    try {
      const wlRef = collection(db, 'wishlist');
      // Prevent duplicates per user per watch
      const qExist = query(wlRef, where('userId', '==', currentUser.uid), where('watchId', '==', watch.id));
      const existSnap = await getDocs(qExist);
      if (!existSnap.empty) {
        showToastMessage('Already in your wishlist.');
        return;
      }

      const imageUrl = watch.imageUrl || (watch.images && watch.images[0]) || 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch';
      await addDoc(wlRef, {
        userId: currentUser.uid,
        watchId: watch.id,
        title: watch.title || 'Luxury Watch',
        brand: watch.brand || '',
        imageUrl,
        price: watch.price || 0,
        addedAt: serverTimestamp()
      });
      showToastMessage('❤️ Added to wishlist!');
    } catch (e) {
      console.error('Error adding to wishlist:', e);
      showToastMessage('Failed to add to wishlist. Please try again.');
    }
  };

  const checkIfInCart = async () => {
    if (!currentUser || !id) return;
    
    try {
      const cartsRef = collection(db, 'carts');
      const q = query(cartsRef, where('userId', '==', currentUser.uid), where('watchId', '==', id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const cartDoc = querySnapshot.docs[0];
        setCartQuantity(cartDoc.data().quantity || 0);
      } else {
        setCartQuantity(0);
      }
    } catch (error) {
      console.error('Error checking cart:', error);
    }
  };

  const formatPrice = (price) => {
    if (typeof price === 'number' || (typeof price === 'string' && !isNaN(parseFloat(price)))) {
      return formatRMPrice(price);
    }
    return 'Price not available';
  };

  const getImages = (watch) => {
    if (!watch) return [];
    
    // Handle different image property structures
    if (watch.images && Array.isArray(watch.images)) return watch.images;
    if (watch.imageUrl) return [watch.imageUrl];
    if (watch.image) return [watch.image];
    return ['https://via.placeholder.com/400x400.png?text=TimeVault+Watch'];
  };

  const getConditionColor = (condition) => {
    const colors = {
      new: 'text-green-400',
      excellent: 'text-blue-400',
      good: 'text-yellow-400',
      fair: 'text-orange-400',
      poor: 'text-red-400',
    };
    return colors[condition?.toLowerCase()] || 'text-gray-400';
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleAddToCart = async () => {
    if (!watch) return;
    
    // Check if user is logged in
    if (!currentUser) {
      showToastMessage('Please log in to add items to cart.');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    
    setAddingToCart(true);
    try {
      const cartsRef = collection(db, 'carts');
      const q = query(cartsRef, where('userId', '==', currentUser.uid), where('watchId', '==', watch.id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Item exists - increment quantity
        const cartDoc = querySnapshot.docs[0];
        const currentQuantity = cartDoc.data().quantity || 1;
        await updateDoc(doc(db, 'carts', cartDoc.id), {
          quantity: currentQuantity + 1,
          addedAt: serverTimestamp()
        });
        setCartQuantity(currentQuantity + 1);
      } else {
        // Item doesn't exist - create new cart entry
        await addDoc(cartsRef, {
          userId: currentUser.uid,
          watchId: watch.id,
          title: watch.title || 'Luxury Watch',
          brand: watch.brand || 'Luxury Brand',
          price: watch.price || 0,
          imageUrl: watch.imageUrl || watch.images?.[0] || 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch',
          quantity: 1,
          addedAt: serverTimestamp()
        });
        setCartQuantity(1);
      }
      
      // Show success toast with checkmark animation
      showToastMessage('✅ Added to cart!');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToastMessage('Failed to add to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!watch) return;
    
    if (!currentUser) {
      showToastMessage('Please log in to continue.');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    
    // Add to cart first if not already in cart
    if (cartQuantity === 0) {
      await handleAddToCart();
    }
    
    // Navigate to checkout
    navigate('/checkout');
  };

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
          <p className="text-gold text-xl font-heading">Fetching watch details…</p>
        </motion.div>
      </div>
    );
  }

  if (error || !watch) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-heading font-bold text-white mb-4">Watch Not Found</h2>
          <p className="text-gray-300 mb-6">{error || '⚠️ Watch not found or has been removed.'}</p>
          <div className="space-x-4">
            <button
              onClick={fetchWatchDetails}
              className="bg-gold hover:bg-yellow-600 text-black font-heading font-semibold px-6 py-3 rounded-lg transition duration-300 mr-4"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/browse')}
              className="bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black font-heading font-semibold px-6 py-3 rounded-lg transition duration-300"
            >
              Browse Watches
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const images = getImages(watch);

  return (
    <div className="min-h-screen bg-black">
      {/* Back Button */}
      <motion.div
        className="pt-24 pb-8 px-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/browse')}
            className="flex items-center text-gold hover:text-yellow-400 transition duration-300 group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Browse
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Section */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Main Image */}
              <div className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden">
                <motion.img
                  key={selectedImageIndex}
                  src={images[selectedImageIndex]}
                  alt={watch.title || watch.name || 'Luxury Watch'}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch';
                  }}
                />
                
                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-gold p-3 rounded-full transition duration-300"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-gold p-3 rounded-full transition duration-300"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Images */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square bg-gray-900 rounded-lg overflow-hidden border-2 transition duration-300 ${
                        selectedImageIndex === index ? 'border-gold' : 'border-transparent hover:border-gray-600'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <img
                        src={image}
                        alt={`${watch.title || 'Watch'} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch';
                        }}
                      />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Details Section */}
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Header */}
              <div>
                <p className="text-gold text-sm font-semibold uppercase tracking-wider mb-2">
                  {watch.brand || 'Luxury Brand'}
                </p>
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
                  {watch.title || watch.name || 'Luxury Timepiece'}
                </h1>
                <p className="text-3xl md:text-4xl font-heading font-bold text-gold">
                  {formatPrice(watch.price)}
                </p>
              </div>

              {/* Watch Details */}
              <div className="space-y-4">
                {watch.category && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="text-gray-400 font-medium">Category</span>
                    <span className="text-white font-semibold">{watch.category}</span>
                  </div>
                )}
                
                {watch.gender && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="text-gray-400 font-medium">Gender</span>
                    <span className="text-white font-semibold">{watch.gender}</span>
                  </div>
                )}
                
                {watch.serialNumber && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="text-gray-400 font-medium">Serial Number</span>
                    <span className="text-white font-mono font-semibold">{watch.serialNumber}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {watch.description && (
                <div>
                  <h3 className="text-xl font-heading font-semibold text-white mb-4">Description</h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {watch.description}
                  </p>
                </div>
              )}

              {/* Contact Seller */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <h3 className="text-xl font-heading font-semibold text-white mb-4">Contact Seller</h3>
                {(watch.sellerEmail || watch.sellerPhone) ? (
                  <div className="space-y-3">
                    {watch.sellerName && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Seller</span>
                        <span className="text-white font-semibold">{watch.sellerName}</span>
                      </div>
                    )}
                    {watch.sellerEmail && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Email</span>
                        <a href={`mailto:${watch.sellerEmail}`} className="text-gold hover:underline">{watch.sellerEmail}</a>
                      </div>
                    )}
                    {watch.sellerPhone && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Phone</span>
                        <span className="text-white font-semibold">{watch.sellerPhone}</span>
                      </div>
                    )}
                    {watch.sellerEmail && (
                      <motion.a
                        href={`mailto:${watch.sellerEmail}?subject=${encodeURIComponent('Inquiry about ' + (watch.title || 'your watch'))}`}
                        className="inline-flex items-center gap-2 bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black font-heading font-semibold py-2.5 px-5 rounded-lg transition duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Send Email
                      </motion.a>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400">Seller contact unavailable</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                {/* Add to Cart Button */}
                <motion.button
                  onClick={handleAddToCart}
                  disabled={watch.status === 'sold' || addingToCart}
                  className={`w-full font-heading font-bold py-4 px-8 rounded-lg text-lg transition duration-300 shadow-lg ${
                    cartQuantity > 0
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gold hover:bg-yellow-600 text-black'
                  } ${(watch.status === 'sold' || addingToCart) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  whileHover={!(watch.status === 'sold' || addingToCart) ? { scale: 1.02, boxShadow: "0 10px 30px rgba(212, 175, 55, 0.3)" } : {}}
                  whileTap={!(watch.status === 'sold' || addingToCart) ? { scale: 0.98 } : {}}
                >
                  {watch.status === 'sold' ? 'Sold Out' : 
                   addingToCart ? (
                     <div className="flex items-center justify-center">
                       <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                       Adding...
                     </div>
                   ) : cartQuantity > 0 ? 
                     `In Cart (${cartQuantity})` : 
                     '🛒 Add to Cart'
                  }
                </motion.button>

                {/* Buy Now Button */}
                <motion.button
                  onClick={handleBuyNow}
                  disabled={watch.status === 'sold'}
                  className={`w-full bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black font-heading font-semibold py-3 px-8 rounded-lg text-lg transition duration-300 ${
                    watch.status === 'sold' ? 'opacity-50 cursor-not-allowed border-gray-600 text-gray-400' : ''
                  }`}
                  whileHover={watch.status !== 'sold' ? { scale: 1.02 } : {}}
                  whileTap={watch.status !== 'sold' ? { scale: 0.98 } : {}}
                >
                  {watch.status === 'sold' ? 'Sold Out' : 'Buy Now'}
                </motion.button>
              </div>

              {/* Additional Actions */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <motion.button
                  onClick={handleAddToWishlist}
                  className="bg-transparent border-2 border-gray-600 text-gray-400 hover:border-gold hover:text-gold font-heading font-semibold py-3 px-6 rounded-lg transition duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  💖 Add to Wishlist
                </motion.button>
                <motion.button
                  onClick={() => {
                    if (watch.sellerEmail) {
                      window.location.href = `mailto:${watch.sellerEmail}?subject=${encodeURIComponent('Inquiry about ' + (watch.title || 'your watch'))}`;
                    } else {
                      showToastMessage('Seller contact information not available.');
                    }
                  }}
                  className="bg-transparent border-2 border-gray-600 text-gray-400 hover:border-white hover:text-white font-heading font-semibold py-3 px-6 rounded-lg transition duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Contact Seller
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="fixed top-24 right-6 z-50"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
          >
            <div className="bg-gray-900 border-2 border-gold rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 min-w-[300px]">
              <motion.div
                className="text-3xl"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
              >
                {toastMessage.includes('success') ? '✅' : toastMessage.includes('log in') ? '🔒' : '⚠️'}
              </motion.div>
              <p className="text-white font-medium">{toastMessage}</p>
            </div>
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
                  Success!
                </h2>
                <p className="text-gray-300 mb-6">
                  Added to cart successfully!
                </p>
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setShowSuccessPopup(false)}
                    className="flex-1 bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black font-heading font-bold py-3 px-6 rounded-lg transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Continue Shopping
                  </motion.button>
                  <motion.button
                    onClick={() => navigate('/cart')}
                    className="flex-1 bg-gold hover:bg-yellow-600 text-black font-heading font-bold py-3 px-6 rounded-lg transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Cart
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

export default WatchDetails;
