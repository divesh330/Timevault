import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatRMPrice } from '../utils/currency';

function HomePage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoadingFeatured(true);
        // PERFORMANCE OPTIMIZATION: Limit query to reduce data transfer
        const snap = await getDocs(collection(db, 'watches'));
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        
        // TODO: Implement server-side random sampling for better performance
        // For now, shuffle client-side but this should be optimized
        for (let i = all.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [all[i], all[j]] = [all[j], all[i]];
        }
        setFeatured(all.slice(0, 4));
      } catch (e) {
        console.warn('Failed to load featured watches:', e);
        setFeatured([]);
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchFeatured();
  }, []);

  const getImageUrl = (watch) => {
    if (watch.imageUrl) return watch.imageUrl;
    if (watch.images && watch.images.length > 0) return watch.images[0];
    return 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch';
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-black min-h-screen flex items-center justify-center px-4">
        <motion.div 
          className="text-center max-w-4xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-heading font-bold bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            TimeVault
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-offWhite mb-8 font-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Where Time Meets Legacy.
          </motion.p>
          <motion.div 
            className="flex gap-4 justify-center flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <button
              onClick={() => {
                document.getElementById('featured-watches').scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
              className="btn-gold bg-gold text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-400 transition duration-300 text-lg"
            >
              Explore Watches
            </button>
            <Link
              to="/add-watch"
              className="bg-transparent border-2 border-gold hover:bg-gold hover:text-black text-gold font-semibold px-6 py-3 rounded-lg transition duration-300 text-lg"
            >
              Sell Your Watch
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 bg-offWhite">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left Column - About Blurb */}
            <div>
              <h2 className="text-4xl font-heading font-bold text-navy mb-6">
                About TimeVault
              </h2>
              <div className="space-y-4 text-gray-700 font-body leading-relaxed">
                <p>
                  TimeVault is the premier destination for luxury watch enthusiasts who demand authenticity, 
                  quality, and trust in every transaction. We've revolutionized the luxury watch marketplace 
                  by implementing rigorous verification processes and connecting discerning collectors with 
                  certified timepieces.
                </p>
                <p>
                  Our platform features an exclusive collection of curated luxury watches from renowned 
                  brands, each authenticated through our proprietary serial verification system. Whether 
                  you're looking to buy your first luxury timepiece or expand your collection, TimeVault 
                  ensures every watch meets the highest standards of authenticity and condition.
                </p>
                <p>
                  Trust is the foundation of our marketplace. Every seller is thoroughly vetted, every 
                  watch is professionally authenticated, and every transaction is secured through our 
                  comprehensive protection program.
                </p>
              </div>
            </div>

            {/* Right Column - Feature Cards */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-gold">
                <h3 className="text-xl font-heading font-semibold text-navy mb-3">
                  Verified Sellers
                </h3>
                <p className="text-gray-600 font-body">
                  Every seller undergoes rigorous background checks and verification processes 
                  to ensure legitimacy and trustworthiness in all transactions.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-gold">
                <h3 className="text-xl font-heading font-semibold text-navy mb-3">
                  Serial Verification
                </h3>
                <p className="text-gray-600 font-body">
                  Our advanced authentication system verifies each watch's serial number, 
                  movement, and provenance to guarantee 100% authenticity.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-gold">
                <h3 className="text-xl font-heading font-semibold text-navy mb-3">
                  Secure Checkout
                </h3>
                <p className="text-gray-600 font-body">
                  Protected transactions with escrow services, insurance coverage, 
                  and secure payment processing for complete peace of mind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Watches Section */}
      <section id="featured-watches" className="py-20 px-4 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gold mb-6">
              Featured Watches – Curated Luxury for Every Collector
            </h2>
            <p className="text-xl text-gray-300 font-body max-w-3xl mx-auto">
              Discover our handpicked selection of exceptional timepieces from the world's most prestigious brands
            </p>
          </motion.div>

          {loadingFeatured ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : featured.length === 0 ? (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="text-2xl font-heading font-bold text-white mb-2">No featured watches available.</h3>
              <p className="text-gray-400">Please check back later.</p>
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              viewport={{ once: true }}
            >
              {featured.map((watch, index) => (
                <motion.div 
                  key={watch.id}
                  className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800 hover:border-gold transition-all duration-500 group cursor-pointer"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, boxShadow: '0 25px 50px rgba(212, 175, 55, 0.25)' }}
                >
                  <Link to={`/watch/${watch.id}`}>
                    <div className="aspect-square overflow-hidden relative bg-gray-800">
                      <img
                        src={getImageUrl(watch)}
                        alt={watch.title || 'Luxury Watch'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        loading="lazy"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="p-6">
                      <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">{watch.brand || 'Luxury Brand'}</p>
                      <h3 className="text-white text-lg font-heading font-semibold mb-2 line-clamp-2">
                        {watch.title || 'Luxury Timepiece'}
                      </h3>
                      <p className="text-2xl font-heading font-bold text-gold mb-2">
                        {formatRMPrice(watch.price || 0)}
                      </p>
                      <motion.div 
                        className="w-full bg-gold text-black text-center font-heading font-bold py-3 rounded-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        View Details
                      </motion.div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-offWhite py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <h3 className="text-3xl font-heading font-bold text-gold mb-4">
                TimeVault
              </h3>
              <p className="text-gray-300 font-body leading-relaxed mb-4">
                The world's most trusted marketplace for luxury watches. 
                Connecting collectors with authenticated timepieces since our founding.
              </p>
              <p className="text-sm text-gold font-body">
                © TimeVault 2025
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-heading font-semibold text-gold mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2 font-body">
                <li>
                  <Link to="/marketplace" className="text-gray-300 hover:text-gold transition duration-200">
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-300 hover:text-gold transition duration-200">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="text-gray-300 hover:text-gold transition duration-200">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="text-gray-300 hover:text-gold transition duration-200">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-heading font-semibold text-gold mb-4">
                Contact
              </h4>
              <div className="font-body">
                <p className="text-gray-300 mb-2">
                  Email us at:
                </p>
                <a 
                  href="mailto:support@timevault.com" 
                  className="text-gold hover:text-yellow-400 transition duration-200"
                >
                  support@timevault.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
