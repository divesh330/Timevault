import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axios';
import WatchCard from '../components/WatchCard';

function SellerProfile() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [seller, setSeller] = useState(null);
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSellerData();
  }, [sellerId]);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      
      // Fetch seller profile
      const sellerResponse = await axiosInstance.get(`/api/users/profile`, {
        params: { userId: sellerId }
      });
      
      // Fetch seller's watches
      const watchesResponse = await axiosInstance.get(`/api/watches/seller/${sellerId}`);
      
      setSeller(sellerResponse.data.user || { name: 'Unknown Seller', rating: 0 });
      setWatches(watchesResponse.data.watches || []);
    } catch (err) {
      console.error('Error fetching seller data:', err);
      setError('Failed to load seller profile');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-accent text-xl font-heading animate-pulse">Loading seller profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-heading font-bold text-white mb-4">{error}</h2>
          <button
            onClick={() => navigate('/marketplace')}
            className="btn-primary"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const activeWatches = watches.filter(watch => watch.status === 'active');

  return (
    <div className="min-h-screen bg-primary">
      {/* Navigation */}
      <nav className="bg-secondary border-b border-gray-800 shadow-luxury">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 
              className="text-2xl font-heading font-bold text-accent cursor-pointer hover:text-gold transition-colors duration-300" 
              onClick={() => navigate('/dashboard')}
            >
              TimeVault
            </h1>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/marketplace')}
                className="nav-link"
              >
                Marketplace
              </button>
              {currentUser && (
                <>
                  <span className="text-gray-300">{currentUser?.displayName || currentUser?.email}</span>
                  <button
                    onClick={handleLogout}
                    className="btn-primary"
                  >
                    Logout
                  </button>
                </>
              )}
              {!currentUser && (
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="text-accent hover:text-gold mb-6 flex items-center transition-colors duration-300 font-medium"
        >
          ← Back
        </button>

        {/* Seller Profile Card */}
        <div className="card p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {seller?.profilePic ? (
                <img
                  src={seller.profilePic}
                  alt={seller.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gold"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-accent text-5xl font-heading border-4 border-accent shadow-gold">
                  {seller?.name?.charAt(0).toUpperCase() || 'S'}
                </div>
              )}
            </div>

            {/* Seller Details */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-2">
                <h1 className="text-3xl font-heading font-bold text-white">
                  {seller?.name || 'Unknown Seller'}
                </h1>
                {seller?.verified && (
                  <span className="ml-3 bg-blue-500 text-white text-sm px-3 py-1 rounded-full flex items-center">
                    ✓ Verified
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center md:justify-start mb-4">
                <div className="flex items-center">
                  <span className="text-accent text-2xl">★★★★★</span>
                  <span className="ml-3 text-xl font-semibold text-gray-300">
                    {seller?.rating?.toFixed(1) || '0.0'} / 5
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 justify-center md:justify-start mb-4">
                <div className="text-center">
                  <div className="text-2xl font-heading font-bold text-accent">{activeWatches.length}</div>
                  <div className="text-sm text-gray-400">Active Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-heading font-bold text-accent">{watches.length}</div>
                  <div className="text-sm text-gray-400">Total Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-heading font-bold text-accent">0</div>
                  <div className="text-sm text-gray-400">Reviews</div>
                </div>
              </div>

              {/* Member Since */}
              {seller?.createdAt && (
                <p className="text-sm text-gray-400">
                  Member since {new Date(seller.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              )}

              {/* Contact Button */}
              {currentUser && currentUser.uid !== sellerId && (
                <div className="mt-6">
                  <button className="btn-primary">
                    Contact Seller
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seller's Listings */}
        <div className="mb-6">
          <h2 className="text-3xl font-heading font-bold text-accent mb-2">
            Active Listings
          </h2>
          <p className="text-gray-300">
            Browse all watches currently available from this seller
          </p>
        </div>

        {/* Watches Grid */}
        {activeWatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeWatches.map(watch => (
              <WatchCard key={watch.id} watch={watch} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">⌚</div>
            <h3 className="text-2xl font-heading font-bold text-white mb-2">
              No Active Listings
            </h3>
            <p className="text-gray-400">
              This seller doesn't have any active watches for sale at the moment.
            </p>
          </div>
        )}

        {/* All Listings Section */}
        {watches.length > activeWatches.length && (
          <>
            <div className="mt-12 mb-6">
              <h2 className="text-2xl font-heading font-bold text-white mb-2">
                Previous Listings
              </h2>
              <p className="text-gray-400">
                Watches that have been sold or removed
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {watches
                .filter(watch => watch.status !== 'active')
                .map(watch => (
                  <div key={watch.id} className="relative">
                    <WatchCard watch={watch} />
                    <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <span className="bg-gray-800 text-white px-4 py-2 rounded-md font-heading font-semibold uppercase border border-gray-600">
                        {watch.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default SellerProfile;
