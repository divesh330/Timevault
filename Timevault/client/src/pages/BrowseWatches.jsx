import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, addDoc, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { formatRMPrice } from '../utils/currency';

const BrowseWatches = () => {
  const [watches, setWatches] = useState([]);
  const [filteredWatches, setFilteredWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    gender: '',
    minPrice: 0,
    maxPrice: 500000
  });

  // Get unique values for filter dropdowns
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [genders, setGenders] = useState([]);

  useEffect(() => {
    fetchWatches();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [watches, filters]);

  const fetchWatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const querySnapshot = await getDocs(collection(db, 'watches'));
      const watchList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setWatches(watchList);
      
      // Extract unique values for filters
      const uniqueCategories = [...new Set(watchList.map(w => w.category).filter(Boolean))];
      const uniqueBrands = [...new Set(watchList.map(w => w.brand).filter(Boolean))];
      const uniqueGenders = [...new Set(watchList.map(w => w.gender).filter(Boolean))];
      
      setCategories(uniqueCategories.sort());
      setBrands(uniqueBrands.sort());
      setGenders(uniqueGenders.sort());
      
    } catch (err) {
      console.error('Error fetching watches:', err);
      setError('Failed to load watches. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...watches];

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(w => w.category === filters.category);
    }

    // Brand filter
    if (filters.brand) {
      filtered = filtered.filter(w => w.brand === filters.brand);
    }

    // Gender filter
    if (filters.gender) {
      filtered = filtered.filter(w => w.gender === filters.gender);
    }

    // Price range filter
    filtered = filtered.filter(w => {
      const price = parseFloat(w.price) || 0;
      return price >= filters.minPrice && price <= filters.maxPrice;
    });

    setFilteredWatches(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      brand: '',
      gender: '',
      minPrice: 0,
      maxPrice: 500000
    });
  };

  const handleWatchClick = (watchId) => {
    navigate(`/watch/${watchId}`);
  };

  const handleAddToCart = async (watch) => {
    if (!watch) return;
    
    // Check if user is logged in
    if (!currentUser) {
      alert('Please log in to add items to cart.');
      navigate('/login');
      return;
    }
    
    setAddingToCart(prev => ({ ...prev, [watch.id]: true }));
    
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
      } else {
        // Item doesn't exist - create new cart entry
        await addDoc(cartsRef, {
          userId: currentUser.uid,
          watchId: watch.id,
          title: watch.title || 'Luxury Watch',
          brand: watch.brand || 'Luxury Brand',
          price: watch.price || 0,
          imageUrl: getImageUrl(watch),
          quantity: 1,
          addedAt: serverTimestamp()
        });
      }
      
      alert('Added to cart successfully!');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart.');
    } finally {
      setAddingToCart(prev => ({ ...prev, [watch.id]: false }));
    }
  };

  const formatPrice = (price) => {
    if (typeof price === 'number' || (typeof price === 'string' && !isNaN(parseFloat(price)))) {
      return formatRMPrice(price);
    }
    return 'Price not available';
  };

  const getImageUrl = (watch) => {
    // Handle different image property structures
    if (watch.imageUrl) return watch.imageUrl;
    if (watch.images && watch.images.length > 0) return watch.images[0];
    if (watch.image) return watch.image;
    return 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch';
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
          <p className="text-gold text-xl font-heading">Loading luxury timepieces...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-heading font-bold text-white mb-4">Unable to Load Watches</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={fetchWatches}
            className="bg-gold hover:bg-yellow-600 text-black font-heading font-semibold px-6 py-3 rounded-lg transition duration-300"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black">
      {/* Header Section */}
      <motion.section
        className="pt-24 pb-8 px-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-gold mb-4">
            Luxury Marketplace
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover our curated collection of luxury timepieces from the world's most prestigious brands
          </p>
        </div>
      </motion.section>

      {/* Filter Section */}
      <motion.section
        className="sticky top-16 z-40 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 shadow-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between bg-gray-800 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span className="font-heading font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </span>
              <svg 
                className={`w-5 h-5 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Filter Controls */}
          <AnimatePresence>
            {(showFilters || window.innerWidth >= 1024) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Brand Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Brand
                    </label>
                    <select
                      value={filters.brand}
                      onChange={(e) => handleFilterChange('brand', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                    >
                      <option value="">All Brands</option>
                      {brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>

                  {/* Gender Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Gender
                    </label>
                    <select
                      value={filters.gender}
                      onChange={(e) => handleFilterChange('gender', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                    >
                      <option value="">All</option>
                      {genders.map(gender => (
                        <option key={gender} value={gender}>{gender}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Min Price (RM)
                    </label>
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Price (RM)
                    </label>
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', parseFloat(e.target.value) || 500000)}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                      placeholder="500000"
                      min="0"
                    />
                  </div>
                </div>

                {/* Clear Filters & Results Count */}
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-gray-800">
                  <div className="text-gray-400 mb-3 sm:mb-0">
                    <span className="text-gold font-semibold text-lg">{filteredWatches.length}</span>
                    <span className="ml-1">of {watches.length} watches</span>
                  </div>
                  <motion.button
                    onClick={clearFilters}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-heading font-semibold transition-all border border-gray-700 hover:border-gold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Clear Filters
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* Watches Grid */}
      <section className="pb-20 px-6 pt-12">
        <div className="max-w-7xl mx-auto">
          {filteredWatches.length === 0 ? (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className="text-8xl mb-6"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              >
                ⌚
              </motion.div>
              <h3 className="text-3xl font-heading font-bold text-white mb-4">No Watches Found</h3>
              <p className="text-gray-400 mb-8 text-lg">Try adjusting your filters or check back soon for new arrivals</p>
              <motion.button
                onClick={clearFilters}
                className="bg-gold hover:bg-yellow-600 text-black font-heading font-semibold px-8 py-3 rounded-lg transition duration-300 shadow-lg"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(212, 175, 55, 0.4)" }}
                whileTap={{ scale: 0.95 }}
              >
                Clear All Filters
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {filteredWatches.map((watch, index) => (
                <motion.div
                  key={watch.id || index}
                  className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl group border border-gray-800 hover:border-gold"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5) }}
                  whileHover={{ 
                    y: -8,
                    boxShadow: "0 25px 50px rgba(212, 175, 55, 0.25)",
                    transition: { duration: 0.3 }
                  }}
                >
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-gray-800">
                    <img
                      src={getImageUrl(watch)}
                      alt={watch.title || 'Luxury Watch'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch';
                      }}
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Category Badge */}
                    {watch.category && (
                      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-gold px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                        {watch.category}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Brand */}
                    <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">
                      {watch.brand || 'Luxury Brand'}
                    </p>
                    
                    {/* Title */}
                    <h3 className="text-white text-lg font-heading font-semibold mb-2 line-clamp-2 min-h-[3.5rem]">
                      {watch.title || 'Luxury Timepiece'}
                    </h3>
                    
                    {/* Gender */}
                    {watch.gender && (
                      <p className="text-gray-400 text-sm mb-3">
                        {watch.gender}
                      </p>
                    )}
                    
                    {/* Price */}
                    <p className="text-2xl font-heading font-bold text-gold mb-4">
                      {formatPrice(watch.price)}
                    </p>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(watch);
                        }}
                        disabled={addingToCart[watch.id]}
                        className="w-full bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black font-heading font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: addingToCart[watch.id] ? 1 : 1.02 }}
                        whileTap={{ scale: addingToCart[watch.id] ? 1 : 0.98 }}
                      >
                        {addingToCart[watch.id] ? (
                          <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                            Adding...
                          </div>
                        ) : (
                          'Add to Cart'
                        )}
                      </motion.button>
                      
                      <motion.button
                        onClick={() => handleWatchClick(watch.id)}
                        className="w-full bg-gold text-black hover:bg-yellow-600 font-heading font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg"
                        whileHover={{ scale: 1.02, boxShadow: "0 8px 20px rgba(212, 175, 55, 0.4)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        View Details
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BrowseWatches;
