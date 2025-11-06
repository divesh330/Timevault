import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  
  // User data state
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    birthday: ''
  });
  
  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    name: '',
    birthday: ''
  });
  
  // Password reset state
  const [sendingReset, setSendingReset] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
    } else {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData({
          name: data.name || currentUser.displayName || 'N/A',
          email: currentUser.email || 'N/A',
          birthday: data.birthday || ''
        });
        setEditedData({
          name: data.name || currentUser.displayName || '',
          birthday: data.birthday || ''
        });
      } else {
        // If no Firestore doc, use Firebase Auth data
        setUserData({
          name: currentUser.displayName || 'N/A',
          email: currentUser.email || 'N/A',
          birthday: ''
        });
        setEditedData({
          name: currentUser.displayName || '',
          birthday: ''
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!editedData.name.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      // Update Firebase Auth displayName
      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: editedData.name.trim()
        });
      }

      // Update Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: editedData.name.trim(),
        birthday: editedData.birthday
      });

      // Update local state
      setUserData({
        ...userData,
        name: editedData.name.trim(),
        birthday: editedData.birthday
      });

      setIsEditing(false);
      showSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!currentUser?.email) {
      setError('No email address found.');
      return;
    }

    setSendingReset(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      showSuccess('Reset link sent to your email');
    } catch (err) {
      console.error('Error sending password reset email:', err);
      if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
    } finally {
      setSendingReset(false);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessPopup(true);
    setTimeout(() => {
      setShowSuccessPopup(false);
    }, 3000);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
      setError('Failed to logout. Please try again.');
    }
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
          <p className="text-gold text-xl font-heading">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

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
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            👤
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-gold mb-4">
            My Profile
          </h1>
          <p className="text-xl text-gray-300">
            Manage your account settings and preferences
          </p>
        </div>
      </motion.section>

      {/* Profile Content */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Error Message */}
            {error && (
              <motion.div
                className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editedData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300 text-white"
                    placeholder="Enter your name"
                  />
                ) : (
                  <div className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    {userData.name}
                  </div>
                )}
              </div>

              {/* Email Field (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-400">
                  {userData.email}
                </div>
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>

              {/* Birthday Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Birthday
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    name="birthday"
                    value={editedData.birthday}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300 text-white"
                  />
                ) : (
                  <div className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    {userData.birthday || 'Not set'}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {isEditing ? (
                  <>
                    <motion.button
                      type="submit"
                      disabled={updating}
                      className="flex-1 bg-gold hover:bg-yellow-600 text-black font-heading font-bold py-3 px-6 rounded-lg transition duration-300 disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {updating ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </div>
                      ) : (
                        'Save Changes'
                      )}
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleEditProfile}
                      disabled={updating}
                      className="flex-1 bg-transparent border-2 border-gray-600 text-gray-300 hover:border-gold hover:text-gold font-heading font-semibold py-3 px-6 rounded-lg transition duration-300"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    type="button"
                    onClick={handleEditProfile}
                    className="w-full bg-gold hover:bg-yellow-600 text-black font-heading font-bold py-3 px-6 rounded-lg transition duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Edit Profile
                  </motion.button>
                )}
              </div>
            </form>

            {/* Divider */}
            <div className="my-8 border-t border-gray-800"></div>

            {/* Additional Actions */}
            <div className="space-y-4">
              {/* Change Password Button */}
              <motion.button
                onClick={handlePasswordReset}
                disabled={sendingReset}
                className="w-full bg-transparent border-2 border-gray-700 text-white hover:border-gold hover:text-gold font-heading font-semibold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!sendingReset ? { scale: 1.02 } : {}}
                whileTap={!sendingReset ? { scale: 0.98 } : {}}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {sendingReset ? 'Sending...' : 'Send Password Reset Email'}
              </motion.button>

              {/* Logout Button */}
              <motion.button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-heading font-bold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </motion.button>
            </div>
          </motion.div>
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
                  Success!
                </h2>
                <p className="text-gray-300 mb-6">
                  {successMessage}
                </p>
                <motion.button
                  onClick={() => setShowSuccessPopup(false)}
                  className="bg-gold hover:bg-yellow-600 text-black font-heading font-bold py-3 px-8 rounded-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  OK
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
