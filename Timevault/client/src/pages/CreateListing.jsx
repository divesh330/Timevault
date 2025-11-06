import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axios';
import { validateSerialNumber, getSupportedBrands } from '../utils/serialValidation';

function CreateListing() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [serialError, setSerialError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    price: '',
    condition: '',
    description: '',
    serialNumber: '',
  });

  const brands = getSupportedBrands();
  const conditions = ['new', 'excellent', 'good', 'fair', 'poor'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Validate serial number on change
    if (name === 'serialNumber' && value && formData.brand) {
      const validation = validateSerialNumber(formData.brand, value);
      setSerialError(validation.valid ? '' : validation.message);
    }
  };

  const handleBrandChange = (e) => {
    const brand = e.target.value;
    setFormData({
      ...formData,
      brand,
    });

    // Re-validate serial number with new brand
    if (formData.serialNumber) {
      const validation = validateSerialNumber(brand, formData.serialNumber);
      setSerialError(validation.valid ? '' : validation.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      brand: '',
      price: '',
      condition: '',
      description: '',
      serialNumber: '',
    });
    setSerialError('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate serial number before submission
    const serialValidation = validateSerialNumber(formData.brand, formData.serialNumber);
    if (!serialValidation.valid) {
      setSerialError(serialValidation.message);
      return;
    }

    try {
      setLoading(true);

      const response = await axiosInstance.post('/api/watches', {
        title: formData.title,
        brand: formData.brand,
        price: parseFloat(formData.price),
        condition: formData.condition,
        description: formData.description,
        serialNumber: formData.serialNumber,
      });

      setSuccess('Watch listing created successfully!');
      resetForm();
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (err) {
      console.error('Error creating listing:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        'Failed to create listing'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-navy">
      <nav className="bg-darkGray shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-heading font-bold text-gold cursor-pointer" onClick={() => navigate('/dashboard')}>
              TimeVault
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/marketplace')}
                className="text-offWhite hover:text-gold transition"
              >
                Marketplace
              </button>
              <span className="text-offWhite">{currentUser?.displayName || currentUser?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-gold hover:bg-yellow-600 text-navy font-heading font-semibold px-4 py-2 rounded-md transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-offWhite rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-heading font-bold text-navy mb-6">Create Watch Listing</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-darkGray mb-1">
                Watch Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-silver rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="e.g., Rolex Submariner Date 116610LN"
              />
            </div>

            {/* Brand */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-darkGray mb-1">
                Brand *
              </label>
              <select
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleBrandChange}
                required
                className="w-full px-4 py-2 border border-silver rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              >
                <option value="">Select a brand</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Serial Number */}
            <div>
              <label htmlFor="serialNumber" className="block text-sm font-medium text-darkGray mb-1">
                Serial Number *
              </label>
              <input
                type="text"
                id="serialNumber"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent ${
                  serialError ? 'border-red-500' : 'border-silver'
                }`}
                placeholder="Enter serial number"
              />
              {serialError && (
                <p className="text-red-600 text-sm mt-1">{serialError}</p>
              )}
              {formData.brand && (
                <p className="text-silver text-xs mt-1">
                  {formData.brand === 'Rolex' && '8 alphanumeric characters (e.g., A1B2C3D4)'}
                  {formData.brand === 'Omega' && '7-8 digits (e.g., 12345678)'}
                  {formData.brand === 'Seiko' && '6-7 digits (e.g., 123456)'}
                  {formData.brand === 'Casio' && '6-10 alphanumeric characters (e.g., ABC123)'}
                </p>
              )}
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-darkGray mb-1">
                Price (USD) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-silver rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            {/* Condition */}
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-darkGray mb-1">
                Condition *
              </label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-silver rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              >
                <option value="">Select condition</option>
                {conditions.map(condition => (
                  <option key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-darkGray mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-4 py-2 border border-silver rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="Describe the watch condition, included items, history, etc."
              />
            </div>


            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !!serialError}
              className="w-full bg-gold hover:bg-yellow-600 text-navy font-heading font-semibold py-3 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Listing...' : 'Create Listing'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateListing;
