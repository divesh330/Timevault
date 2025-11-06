import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  updateEmail, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

const EditProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthday: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [pendingUpdates, setPendingUpdates] = useState(null);

  // Fetch user data on component mount
  useEffect(() => {
    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

  const fetchUserData = async () => {
    try {
      setInitialLoading(true);
      
      // Get user data from Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setFormData({
          username: userData.name || '',
          email: currentUser.email || '',
          password: '',
          confirmPassword: '',
          birthday: userData.birthday || ''
        });
      } else {
        // If no Firestore document, use Firebase Auth data
        setFormData({
          username: currentUser.displayName || '',
          email: currentUser.email || '',
          password: '',
          confirmPassword: '',
          birthday: ''
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 2) {
      newErrors.username = 'Username must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation (only if password is being changed)
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Birthday validation (optional)
    if (formData.birthday) {
      const birthDate = new Date(formData.birthday);
      const today = new Date();
      if (birthDate > today) {
        newErrors.birthday = 'Birthday cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const requiresReauth = () => {
    // Check if email or password is being changed
    return formData.email !== currentUser.email || formData.password;
  };

  const reauthenticateUser = async () => {
    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      return true;
    } catch (error) {
      console.error('Reauthentication failed:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect current password');
      } else {
        toast.error('Authentication failed. Please try again.');
      }
      return false;
    }
  };

  const updateFirebaseAuth = async () => {
    const updates = [];

    // Update email if changed
    if (formData.email !== currentUser.email) {
      updates.push(updateEmail(currentUser, formData.email));
    }

    // Update password if provided
    if (formData.password) {
      updates.push(updatePassword(currentUser, formData.password));
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }
  };

  const updateFirestoreData = async () => {
    const userDocRef = doc(db, 'users', currentUser.uid);
    
    const updateData = {
      name: formData.username.trim(),
    };

    // Add birthday if provided
    if (formData.birthday) {
      updateData.birthday = formData.birthday;
    }

    // Update email in Firestore to match Auth
    if (formData.email !== currentUser.email) {
      updateData.email = formData.email;
    }

    await updateDoc(userDocRef, updateData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Check if reauthentication is needed
    if (requiresReauth()) {
      setPendingUpdates({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        birthday: formData.birthday
      });
      setShowReauthModal(true);
      return;
    }

    await performUpdate();
  };

  const performUpdate = async () => {
    try {
      setLoading(true);

      // If reauthentication was required, use pending updates
      const dataToUpdate = pendingUpdates || formData;

      // Update Firebase Auth (email/password)
      if (dataToUpdate.email !== currentUser.email || dataToUpdate.password) {
        await updateFirebaseAuth();
      }

      // Update Firestore data (username, birthday)
      await updateFirestoreData();

      toast.success('✅ Profile updated successfully!');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));

      // Clear pending updates and close modal
      setPendingUpdates(null);
      setShowReauthModal(false);
      setCurrentPassword('');

    } catch (error) {
      console.error('Error updating profile:', error);
      
      let errorMessage = '❌ Failed to update profile. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '❌ This email is already in use by another account.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '❌ Please enter a valid email address.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = '❌ Please log out and log back in to change sensitive information.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReauthSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    const reauthSuccess = await reauthenticateUser();
    if (reauthSuccess) {
      await performUpdate();
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gold mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please log in to edit your profile.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-gold text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-300">Loading profile data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black py-12">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gold mb-2">Edit Profile</h1>
          <p className="text-gray-300">Update your personal information</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900 rounded-xl p-8 border border-gray-800"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold focus:border-gold transition-all ${
                  errors.username ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="Enter your username"
              />
              {errors.username && (
                <p className="text-red-400 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold focus:border-gold transition-all ${
                  errors.email ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold focus:border-gold transition-all ${
                  errors.password ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="Enter new password"
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            {formData.password && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold focus:border-gold transition-all ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Birthday Field */}
            <div>
              <label htmlFor="birthday" className="block text-sm font-medium text-gray-300 mb-2">
                Birthday (optional)
              </label>
              <input
                type="date"
                id="birthday"
                name="birthday"
                value={formData.birthday}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold focus:border-gold transition-all ${
                  errors.birthday ? 'border-red-500' : 'border-gray-700'
                }`}
              />
              {errors.birthday && (
                <p className="text-red-400 text-sm mt-1">{errors.birthday}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gold text-black py-3 px-6 rounded-lg font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving Changes...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-transparent border border-gray-600 text-gray-300 py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>

        {/* Reauthentication Modal */}
        {showReauthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-xl p-6 border border-gray-800 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-gold mb-4">Confirm Your Identity</h3>
              <p className="text-gray-300 mb-4">
                To update your email or password, please enter your current password to confirm your identity.
              </p>
              
              <form onSubmit={handleReauthSubmit}>
                <div className="mb-4">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                    placeholder="Enter your current password"
                    required
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gold text-black py-2 px-4 rounded-lg font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReauthModal(false);
                      setCurrentPassword('');
                      setPendingUpdates(null);
                    }}
                    className="flex-1 bg-gray-700 text-gray-300 py-2 px-4 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EditProfile;
