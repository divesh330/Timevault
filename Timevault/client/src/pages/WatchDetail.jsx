import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axios';

function WatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [watch, setWatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchWatchDetails();
  }, [id]);

  const fetchWatchDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/watches/${id}`);
      setWatch(response.data.watch);
    } catch (err) {
      console.error('Error fetching watch details:', err);
      setError('Failed to load watch details');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    navigate(`/checkout/${id}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getConditionColor = (condition) => {
    const colors = {
      new: 'text-green-600',
      excellent: 'text-blue-600',
      good: 'text-yellow-600',
      fair: 'text-orange-600',
      poor: 'text-red-600',
    };
    return colors[condition] || 'text-gray-600';
  };

  const nextImage = () => {
    if (watch?.images && watch.images.length > 0) {
      setSelectedImage((prev) => (prev + 1) % watch.images.length);
    }
  };

  const prevImage = () => {
    if (watch?.images && watch.images.length > 0) {
      setSelectedImage((prev) => (prev - 1 + watch.images.length) % watch.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-gold text-xl font-heading">Loading...</div>
      </div>
    );
  }

  if (error || !watch) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-heading font-bold text-offWhite mb-4">{error || 'Watch not found'}</h2>
          <button
            onClick={() => navigate('/marketplace')}
            className="bg-gold hover:bg-yellow-600 text-navy font-heading font-semibold px-6 py-3 rounded-md transition duration-200"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.uid === watch.sellerId;

  return (
    <div className="min-h-screen bg-navy">
      {/* Navigation */}
      <nav className="bg-darkGray shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 
              className="text-2xl font-heading font-bold text-gold cursor-pointer" 
              onClick={() => navigate('/dashboard')}
            >
              TimeVault
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/marketplace')}
                className="text-offWhite hover:text-gold transition"
              >
                Marketplace
              </button>
              {currentUser && (
                <>
                  <span className="text-offWhite">{currentUser?.displayName || currentUser?.email}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-gold hover:bg-yellow-600 text-navy font-heading font-semibold px-4 py-2 rounded-md transition duration-200"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/marketplace')}
          className="text-gold hover:text-yellow-600 mb-6 flex items-center"
        >
          ← Back to Marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image Carousel */}
          <div className="lg:col-span-2">
            <div className="bg-offWhite rounded-lg overflow-hidden shadow-xl">
              {/* Main Image */}
              <div className="relative h-96 lg:h-[500px] bg-gray-200">
                {watch.images && watch.images.length > 0 ? (
                  <>
                    <img
                      src={watch.images[selectedImage]}
                      alt={watch.title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch';
                      }}
                    />
                    
                    {/* Carousel Controls */}
                    {watch.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-navy bg-opacity-75 hover:bg-opacity-100 text-gold p-3 rounded-full transition"
                        >
                          ←
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-navy bg-opacity-75 hover:bg-opacity-100 text-gold p-3 rounded-full transition"
                        >
                          →
                        </button>
                        
                        {/* Image Counter */}
                        <div className="absolute bottom-4 right-4 bg-navy bg-opacity-75 text-offWhite px-3 py-1 rounded-full text-sm">
                          {selectedImage + 1} / {watch.images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl">⌚</span>
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {watch.images && watch.images.length > 1 && (
                <div className="p-4 grid grid-cols-5 gap-2">
                  {watch.images.map((image, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                        selectedImage === index ? 'border-gold' : 'border-transparent hover:border-silver'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${watch.title} ${index + 1}`}
                        className="w-full h-20 object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Watch Info Card */}
            <div className="bg-offWhite rounded-lg p-6 shadow-xl">
              <div className="mb-4">
                <p className="text-sm font-semibold text-silver uppercase tracking-wide">
                  {watch.brand}
                </p>
                <h1 className="text-3xl font-heading font-bold text-navy mt-2">
                  {watch.title}
                </h1>
              </div>

              <div className="mb-6">
                <p className="text-4xl font-heading font-bold text-gold">
                  {formatPrice(watch.price)}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-silver">
                  <span className="text-darkGray font-medium">Condition</span>
                  <span className={`font-semibold capitalize ${getConditionColor(watch.condition)}`}>
                    {watch.condition}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-silver">
                  <span className="text-darkGray font-medium">Serial Number</span>
                  <span className="text-navy font-semibold font-mono">{watch.serialNumber}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-silver">
                  <span className="text-darkGray font-medium">Status</span>
                  <span className="text-navy font-semibold capitalize">{watch.status}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-heading font-semibold text-navy mb-2">Description</h3>
                <p className="text-darkGray whitespace-pre-line leading-relaxed">{watch.description}</p>
              </div>

              {/* Action Buttons */}
              {!isOwner && watch.status === 'active' && (
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-gold hover:bg-yellow-600 text-navy font-heading font-semibold py-3 px-4 rounded-md transition duration-200"
                >
                  Buy Now
                </button>
              )}

              {isOwner && (
                <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded text-center">
                  This is your listing
                </div>
              )}

              {watch.status !== 'active' && !isOwner && (
                <div className="bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded text-center">
                  This watch is no longer available
                </div>
              )}
            </div>

            {/* Seller Profile Card */}
            {watch.seller && (
              <div className="bg-offWhite rounded-lg p-6 shadow-xl">
                <h3 className="text-lg font-heading font-semibold text-navy mb-4">Seller Information</h3>
                
                <div className="flex items-center mb-4">
                  {watch.seller.profilePic ? (
                    <img
                      src={watch.seller.profilePic}
                      alt={watch.seller.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gold"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center text-gold text-2xl font-heading">
                      {watch.seller.name?.charAt(0).toUpperCase() || 'S'}
                    </div>
                  )}
                  
                  <div className="ml-4 flex-1">
                    <div className="flex items-center">
                      <h4 className="text-lg font-heading font-semibold text-navy">
                        {watch.seller.name}
                      </h4>
                      {watch.seller.verified && (
                        <span className="ml-2 text-blue-500" title="Verified Seller">✓</span>
                      )}
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="text-gold text-sm">★★★★★</span>
                      <span className="ml-2 text-sm text-silver">
                        {watch.seller.rating || 0} / 5
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/seller/${watch.sellerId}`)}
                  className="w-full bg-navy hover:bg-opacity-90 text-gold font-heading font-semibold py-2 px-4 rounded-md transition duration-200 mb-2"
                >
                  View Seller Profile
                </button>

                {!isOwner && currentUser && (
                  <button
                    className="w-full bg-transparent border-2 border-navy hover:bg-navy hover:text-gold text-navy font-heading font-semibold py-2 px-4 rounded-md transition duration-200"
                  >
                    Contact Seller
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

    </div>
  );
}

export default WatchDetail;
