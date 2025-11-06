import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, storage, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { formatRMPrice } from '../utils/currency';

const AddWatch = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    category: '',
    gender: '',
    price: '',
    serialNumber: '',
    description: '',
    sellerName: '',
    sellerEmail: '',
    sellerPhone: ''
  });
  const [imageInputType, setImageInputType] = useState('url'); // 'url' or 'file'
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [imageUploaded, setImageUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    if (url) {
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type - only allow specific image formats
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        showError('Please select a valid image file (.jpg, .jpeg, or .png only).');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image size must be less than 5MB.');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToFirebase = async (file) => {
    try {
      setUploadProgress('Uploading image...');
      
      // Create a unique filename with user-specific path
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `watch-images/${fileName}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploadProgress('');
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadProgress('');
      throw new Error('❌ Upload failed. Please try again.');
    }
  };

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowErrorModal(false);
    }, 3000);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      showError('Please enter a watch title.');
      return false;
    }
    if (!formData.brand.trim()) {
      showError('Please enter a brand name.');
      return false;
    }
    if (!formData.category.trim()) {
      showError('Please select a category.');
      return false;
    }
    if (!formData.gender.trim()) {
      showError('Please select a gender.');
      return false;
    }
    if (!formData.serialNumber.trim()) {
      showError('Please enter a serial number.');
      return false;
    }
    if (!formData.description.trim()) {
      showError('Please enter a description.');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      showError('Please enter a valid price.');
      return false;
    }
    if (imageInputType === 'url' && !imageUrl.trim()) {
      showError('Please enter an image URL.');
      return false;
    }
    if (imageInputType === 'file' && !imageUploaded) {
      showError('Please upload an image first.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      showError('Please login to add a watch.');
      return;
    }

    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      let finalImageUrl = '';
      
      if (imageInputType === 'url') {
        finalImageUrl = imageUrl;
      } else {
        // Use the already uploaded image URL
        finalImageUrl = uploadedImageUrl;
      }
      
      setUploadProgress('Saving watch...');
      
      // Prepare data for Firestore
      const watchData = {
        title: formData.title.trim(),
        brand: formData.brand.trim(),
        category: formData.category.trim(),
        gender: formData.gender.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim(),
        serialNumber: formData.serialNumber.trim(),
        imageUrl: finalImageUrl,
        sellerId: currentUser.uid,
        sellerName: formData.sellerName?.trim() || currentUser.email || 'Anonymous',
        sellerEmail: currentUser.email || '',
        sellerPhone: formData.sellerPhone?.trim() || '',
        createdAt: serverTimestamp()
      };

      // Save to Firestore
      console.log('🔧 Adding watch to Firestore:', watchData);
      const watchRef = await addDoc(collection(db, 'watches'), watchData);
      console.log('✅ Watch added successfully with ID:', watchRef.id);
      
      // Add serial number to serialValidation collection
      try {
        console.log('🔧 Adding serial number to serialValidation:', formData.serialNumber);
        
        // Check if serial already exists in serialValidation
        const serialValidationRef = collection(db, 'serialValidation');
        const serialQuery = query(serialValidationRef, where('serialNumber', '==', formData.serialNumber.trim()));
        const existingSerial = await getDocs(serialQuery);
        
        if (existingSerial.empty) {
          // Add new serial validation entry
          const serialValidationData = {
            serialNumber: formData.serialNumber.trim(),
            brand: formData.brand.trim(),
            model: formData.title.trim(),
            verified: true,
            createdAt: serverTimestamp()
          };
          
          await addDoc(serialValidationRef, serialValidationData);
          console.log('✅ Serial number added to serialValidation collection');
        } else {
          console.log('ℹ️ Serial number already exists in serialValidation collection');
        }
      } catch (serialError) {
        console.error('🚨 Error adding serial to validation collection:', serialError);
        // Don't fail the entire operation if serial validation fails
      }
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Reset form
      setFormData({
        title: '',
        brand: '',
        category: '',
        gender: '',
        price: '',
        serialNumber: '',
        description: '',
        sellerName: '',
        sellerEmail: '',
        sellerPhone: ''
      });
      setImageUrl('');
      setSelectedImage(null);
      setImagePreview(null);
      setUploadedImageUrl('');
      setImageUploaded(false);
      
      // Reset file input
      const fileInput = document.getElementById('imageFile');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error adding watch:', error);
      if (error.message.includes('Firestore')) {
        showError('⚠️ Failed to save watch details.');
      } else {
        showError(error.message || 'Failed to add watch. Please try again.');
      }
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
  };

  const handleUploadImage = async () => {
    if (!selectedImage) {
      showError('Please select an image file first.');
      return;
    }

    if (!currentUser) {
      showError('Please login to upload images.');
      return;
    }

    setIsUploading(true);
    try {
      const downloadURL = await uploadImageToFirebase(selectedImage);
      setUploadedImageUrl(downloadURL);
      setImageUploaded(true);
      
      // Show success message
      setErrorMessage('✅ Image uploaded successfully!');
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      showError(error.message || '❌ Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4">
        <motion.div 
          className="max-w-2xl w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800">
            <motion.h1 
              className="text-4xl font-heading font-bold text-gold mb-8 text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Add New Watch
            </motion.h1>

            {/* Upload Progress */}
            <AnimatePresence>
              {uploadProgress && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 rounded-lg bg-blue-900/20 text-blue-300 border border-blue-500/50"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300 mr-3"></div>
                    {uploadProgress}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Watch Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300 text-white placeholder-gray-400 hover:border-gray-600"
                  placeholder="e.g., Submariner Date"
                />
              </motion.div>

              {/* Brand */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <label htmlFor="brand" className="block text-sm font-medium text-gray-300 mb-2">
                  Brand *
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300 text-white placeholder-gray-400 hover:border-gray-600"
                  placeholder="e.g., Rolex"
                />
              </motion.div>

              {/* Category */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
              >
                <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300 text-white hover:border-gray-600"
                >
                  <option value="">Select Category</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Sport">Sport</option>
                  <option value="Dress">Dress</option>
                  <option value="Casual">Casual</option>
                  <option value="Dive">Dive</option>
                  <option value="Pilot">Pilot</option>
                  <option value="Chronograph">Chronograph</option>
                  <option value="Smart">Smart</option>
                </select>
              </motion.div>

              {/* Gender */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.475 }}
              >
                <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-2">
                  Gender *
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300 text-white hover:border-gray-600"
                >
                  <option value="">Select Gender</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </motion.div>

              {/* Serial Number */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-300 mb-2">
                  Serial Number *
                </label>
                <input
                  type="text"
                  id="serialNumber"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300 text-white placeholder-gray-400 hover:border-gray-600"
                  placeholder="e.g., 126610LN"
                />
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300 text-white placeholder-gray-400 hover:border-gray-600 resize-none"
                  placeholder="Describe the watch condition, features, and any notable details..."
                />
              </motion.div>

              {/* Price */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
                  Price (RM) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gold font-semibold">
                    RM
                  </span>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300 text-white placeholder-gray-400 hover:border-gray-600"
                    placeholder="12500.00"
                  />
                </div>
                {formData.price && (
                  <motion.p 
                    className="mt-1 text-sm text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    Formatted: {formatRMPrice(formData.price)}
                  </motion.p>
                )}
              </motion.div>

              {/* Seller Contact (Optional) */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.75 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Seller Name (optional)
                  </label>
                  <input
                    type="text"
                    name="sellerName"
                    value={formData.sellerName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300 text-white placeholder-gray-400 hover:border-gray-600"
                    placeholder="e.g., John Tan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Seller Email (optional)
                  </label>
                  <input
                    type="email"
                    name="sellerEmail"
                    value={formData.sellerEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300 text-white placeholder-gray-400 hover:border-gray-600"
                    placeholder="e.g., john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Seller Phone (optional)
                  </label>
                  <input
                    type="tel"
                    name="sellerPhone"
                    value={formData.sellerPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300 text-white placeholder-gray-400 hover:border-gray-600"
                    placeholder="e.g., +60 12-345 6789"
                  />
                </div>
              </motion.div>

              {/* Image Input Type Selection */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Watch Image *
                </label>
                <div className="flex space-x-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setImageInputType('url')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      imageInputType === 'url'
                        ? 'bg-gold text-black shadow-lg'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputType('file')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      imageInputType === 'file'
                        ? 'bg-gold text-black shadow-lg'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Upload File
                  </button>
                </div>

                {/* Image URL Input */}
                {imageInputType === 'url' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <input
                      type="url"
                      id="imageUrl"
                      value={imageUrl}
                      onChange={handleImageUrlChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300 text-white placeholder-gray-400 hover:border-gray-600"
                      placeholder="https://example.com/watch-image.jpg"
                    />
                  </motion.div>
                )}

                {/* File Upload */}
                {imageInputType === 'file' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div
                      className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gold transition-colors duration-300 cursor-pointer"
                      onClick={() => document.getElementById('imageFile').click()}
                    >
                      <input
                        type="file"
                        id="imageFile"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                      <motion.div 
                        className="flex flex-col items-center"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-gray-300 font-medium">
                          {selectedImage ? selectedImage.name : 'Click to select image'}
                        </span>
                        <span className="text-gray-500 text-sm mt-1">
                          .jpg, .jpeg, .png up to 5MB
                        </span>
                      </motion.div>
                    </div>

                    {/* Upload Image Button */}
                    {selectedImage && !imageUploaded && (
                      <motion.button
                        type="button"
                        onClick={handleUploadImage}
                        disabled={isUploading}
                        className={`w-full py-3 px-6 rounded-lg font-heading font-semibold transition-all duration-300 ${
                          isUploading
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                        }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        whileHover={!isUploading ? { scale: 1.02 } : {}}
                        whileTap={!isUploading ? { scale: 0.98 } : {}}
                      >
                        {isUploading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Uploading...
                          </div>
                        ) : (
                          'Upload Image'
                        )}
                      </motion.button>
                    )}

                    {/* Upload Success Indicator */}
                    {imageUploaded && (
                      <motion.div
                        className="flex items-center justify-center p-3 bg-green-900/20 border border-green-500/50 rounded-lg"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-400 font-medium">Image uploaded successfully!</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </motion.div>

              {/* Image Preview */}
              <AnimatePresence>
                {imagePreview && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Image Preview
                    </label>
                    <div className="w-48 h-48 border border-gray-700 rounded-lg overflow-hidden mx-auto shadow-lg">
                      <img
                        src={imagePreview}
                        alt="Watch preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch';
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading || (imageInputType === 'file' && !imageUploaded)}
                className={`w-full py-4 px-6 rounded-lg font-heading font-bold text-lg transition-all duration-300 ${
                  loading || (imageInputType === 'file' && !imageUploaded)
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gold hover:bg-yellow-600 text-black hover:shadow-2xl hover:shadow-gold/25 transform hover:-translate-y-1'
                }`}
                whileHover={!loading && (imageInputType === 'url' || imageUploaded) ? { scale: 1.02 } : {}}
                whileTap={!loading && (imageInputType === 'url' || imageUploaded) ? { scale: 0.98 } : {}}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-3"></div>
                    {uploadProgress || 'Adding Watch...'}
                  </div>
                ) : imageInputType === 'file' && !imageUploaded ? (
                  'Upload Image First'
                ) : (
                  'Add Watch'
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
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
                  🎉
                </motion.div>
                <h2 className="text-2xl font-heading font-bold text-gold mb-4">
                  Success!
                </h2>
                <p className="text-gray-300 mb-6">
                  ✅ Watch successfully added to marketplace
                </p>
                <motion.button
                  onClick={() => {
                    closeSuccessModal();
                    navigate('/browse');
                  }}
                  className="bg-gold hover:bg-yellow-600 text-black font-heading font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View in Marketplace
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <AnimatePresence>
        {showErrorModal && (
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
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  ⚠️
                </motion.div>
                <h2 className="text-2xl font-heading font-bold text-red-400 mb-4">
                  Upload Failed
                </h2>
                <p className="text-gray-300 mb-6">
                  ❌ {errorMessage || 'Failed to add watch. Please try again.'}
                </p>
                <motion.button
                  onClick={closeErrorModal}
                  className="bg-red-600 hover:bg-red-700 text-white font-heading font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:shadow-lg"
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
    </>
  );
};

export default AddWatch;
