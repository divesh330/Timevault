import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const SerialValidation = () => {
  const [serialNumber, setSerialNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!serialNumber.trim()) {
      setError('Please enter a serial number');
      return;
    }

    setLoading(true);
    setResult(null);
    setError('');

    try {
      console.log('🔧 Validating serial number:', serialNumber.trim());
      
      // Query Firestore for serial number
      const serialRef = collection(db, 'serialValidation');
      const q = query(serialRef, where('serialNumber', '==', serialNumber.trim()));
      const querySnapshot = await getDocs(q);

      console.log('📊 Firestore query result:', {
        empty: querySnapshot.empty,
        size: querySnapshot.size
      });

      if (!querySnapshot.empty) {
        // Serial number found - get the first matching document
        const watchData = querySnapshot.docs[0].data();
        console.log('✅ Serial number found in database:', watchData);
        
        setResult({
          isValid: true,
          brand: watchData.brand || 'Unknown Brand',
          model: watchData.model || 'Unknown Model',
          verified: watchData.verified || false,
          additionalInfo: 'This serial belongs to a verified TimeVault watch.'
        });
      } else {
        // Serial number not found
        console.log('❌ Serial number not found in database');
        setResult({
          isValid: false
        });
      }
    } catch (err) {
      console.error('🚨 Error validating serial number:', err);
      setError('Failed to validate serial number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSerialNumber('');
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black">
      {/* Header Section */}
      <motion.section
        className="pt-24 pb-12 px-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="text-6xl mb-6"
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            🔍
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-gold mb-4">
            Serial Number Validation
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Verify the authenticity of your luxury timepiece by entering its serial number
          </p>
        </div>
      </motion.section>

      {/* Validation Form */}
      <section className="pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Serial Number Input */}
              <div>
                <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-300 mb-2">
                  Enter Serial Number
                </label>
                <input
                  type="text"
                  id="serialNumber"
                  value={serialNumber}
                  onChange={(e) => {
                    setSerialNumber(e.target.value);
                    setError('');
                    setResult(null);
                  }}
                  className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300 text-white placeholder-gray-400 hover:border-gray-600 text-lg font-mono"
                  placeholder="e.g., 126610LN"
                  disabled={loading}
                />
                {error && (
                  <motion.p
                    className="mt-2 text-red-400 text-sm"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <motion.button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 font-heading font-bold py-4 px-6 rounded-lg text-lg transition duration-300 shadow-lg ${
                    loading
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gold hover:bg-yellow-600 text-black'
                  }`}
                  whileHover={!loading ? { scale: 1.02, boxShadow: "0 10px 30px rgba(212, 175, 55, 0.3)" } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                      Validating...
                    </div>
                  ) : (
                    'Validate Serial Number'
                  )}
                </motion.button>

                {(result || serialNumber) && !loading && (
                  <motion.button
                    type="button"
                    onClick={handleReset}
                    className="bg-transparent border-2 border-gray-600 text-gray-300 hover:border-gold hover:text-gold font-heading font-semibold py-4 px-6 rounded-lg transition duration-300"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Reset
                  </motion.button>
                )}
              </div>
            </form>

            {/* Result Display */}
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  className="mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  {result.isValid ? (
                    // Valid Serial Number
                    <motion.div
                      className="bg-green-900/20 border-2 border-green-500 rounded-xl p-6"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <div className="flex items-start gap-4">
                        <motion.div
                          className="text-5xl"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
                        >
                          ✅
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-heading font-bold text-green-400 mb-2">
                            ✅ Valid Serial – Watch Verified in Marketplace
                          </h3>
                          <div className="space-y-2">
                            <p className="text-white text-lg">
                              <span className="text-gray-400">Brand:</span>{' '}
                              <span className="font-semibold text-gold">{result.brand}</span>
                            </p>
                            <p className="text-white text-lg">
                              <span className="text-gray-400">Model:</span>{' '}
                              <span className="font-semibold">{result.model}</span>
                            </p>
                            <div className="mt-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
                              <p className="text-green-300 text-sm font-semibold">
                                🎉 This serial belongs to a verified TimeVault watch.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    // Invalid Serial Number
                    <motion.div
                      className="bg-red-900/20 border-2 border-red-500 rounded-xl p-6"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <div className="flex items-start gap-4">
                        <motion.div
                          className="text-5xl"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.4 }}
                        >
                          ❌
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-heading font-bold text-red-400 mb-2">
                            ❌ Invalid Serial – No Record Found
                          </h3>
                          <p className="text-gray-300 text-lg">
                            This serial number is not registered in our marketplace database.
                          </p>
                          <p className="text-gray-400 text-sm mt-3">
                            Please verify the number and try again, or contact support for assistance.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Information Section */}
          <motion.div
            className="mt-12 bg-gray-900/50 rounded-xl p-6 border border-gray-800"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-xl font-heading font-bold text-gold mb-4">
              How It Works
            </h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3">
                <span className="text-gold font-bold">1.</span>
                <p>Enter the serial number found on your watch (usually on the case back or between the lugs)</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gold font-bold">2.</span>
                <p>Our system checks the number against our verified database of authentic timepieces</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gold font-bold">3.</span>
                <p>Receive instant verification with brand and model information</p>
              </div>
            </div>
          </motion.div>

          {/* Security Notice */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex items-center justify-center text-gray-400 text-sm gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Your data is secure and encrypted</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default SerialValidation;
