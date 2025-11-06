import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { formatRMPrice } from '../utils/currency';

const Wishlist = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const wlRef = collection(db, 'wishlist');
        const q = query(wlRef, where('userId', '==', currentUser.uid));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setItems(list);
      } catch (e) {
        console.error('Error loading wishlist:', e);
        setMessage('Failed to load wishlist.');
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [currentUser]);

  const handleRemove = async (docId) => {
    try {
      await deleteDoc(doc(db, 'wishlist', docId));
      setItems(prev => prev.filter(i => i.id !== docId));
    } catch (e) {
      console.error('Failed to remove item:', e);
      setMessage('Failed to remove item.');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-2xl font-heading font-bold text-white mb-4">Login Required</h2>
          <p className="text-gray-300 mb-6">Please log in to view your wishlist.</p>
          <button onClick={() => navigate('/login')} className="bg-gold hover:bg-yellow-600 text-black font-heading font-semibold px-6 py-3 rounded-lg transition duration-300">Go to Login</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black">
      <section className="pt-24 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-heading font-bold text-gold">My Wishlist</h1>
            <p className="text-gray-400 mt-2">Your curated list of timepieces</p>
          </motion.div>

          <AnimatePresence>
            {message && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 rounded-lg border-2 border-red-500 text-red-300 bg-red-900/20">
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24">
              <div className="text-7xl mb-6">🖤</div>
              <h3 className="text-2xl font-heading font-bold text-white mb-2">No items in wishlist</h3>
              <p className="text-gray-400 mb-6">Browse and add watches you love.</p>
              <Link to="/browse" className="bg-gold hover:bg-yellow-600 text-black font-heading font-semibold px-6 py-3 rounded-lg transition duration-300">Browse Watches</Link>
            </motion.div>
          ) : (
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              {items.map((item, index) => (
                <motion.div key={item.id} className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 hover:border-gold transition-all duration-500 group" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }} whileHover={{ y: -8, boxShadow: '0 25px 50px rgba(212, 175, 55, 0.25)' }}>
                  <Link to={`/watch/${item.watchId}`}>
                    <div className="aspect-square overflow-hidden bg-gray-800">
                      <img src={item.imageUrl || 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch'} alt={item.title || 'Luxury Watch'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch'; }} />
                    </div>
                  </Link>
                  <div className="p-6">
                    <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">{item.brand || 'Brand'}</p>
                    <h3 className="text-white text-lg font-heading font-semibold mb-2 line-clamp-2">{item.title || 'Luxury Timepiece'}</h3>
                    <p className="text-2xl font-heading font-bold text-gold mb-4">{formatRMPrice(item.price || 0)}</p>
                    <div className="flex gap-3">
                      <Link to={`/watch/${item.watchId}`} className="flex-1">
                        <motion.div className="w-full bg-gold text-black text-center font-heading font-bold py-3 rounded-lg" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          View Details
                        </motion.div>
                      </Link>
                      <motion.button onClick={() => handleRemove(item.id)} className="px-4 py-3 rounded-lg border border-red-500 text-red-300 hover:bg-red-500/10 transition" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        Remove
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

export default Wishlist;
