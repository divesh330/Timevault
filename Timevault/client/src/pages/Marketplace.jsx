import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axios';
import WatchCard from '../components/WatchCard';

function Marketplace() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [watches, setWatches] = useState([]);
  const [filteredWatches, setFilteredWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    brand: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
  });

  // Sort state
  const [sortBy, setSortBy] = useState('newest');

  const brands = ['Rolex', 'Omega', 'Seiko', 'Casio'];
  const conditions = ['new', 'excellent', 'good', 'fair', 'poor'];

  useEffect(() => {
    fetchWatches();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [watches, filters, sortBy]);

  const fetchWatches = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/watches', {
        params: { status: 'active' },
      });
      setWatches(response.data.watches || []);
    } catch (err) {
      console.error('Error fetching watches:', err);
      setError('Failed to load watches');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...watches];

    // Apply filters
    if (filters.brand) {
      result = result.filter(watch => watch.brand === filters.brand);
    }

    if (filters.condition) {
      result = result.filter(watch => watch.condition === filters.condition);
    }

    if (filters.minPrice) {
      result = result.filter(watch => watch.price >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      result = result.filter(watch => watch.price <= parseFloat(filters.maxPrice));
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'priceLowHigh':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'priceHighLow':
        result.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    setFilteredWatches(result);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const clearFilters = () => {
    setFilters({
      brand: '',
      condition: '',
      minPrice: '',
      maxPrice: '',
    });
    setSortBy('newest');
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
                className="text-gold font-semibold"
              >
                Marketplace
              </button>
              <button
                onClick={() => navigate('/create-listing')}
                className="text-offWhite hover:text-gold transition"
              >
                Sell Watch
              </button>
              {currentUser && (
                <>
                  <span className="text-offWhite">
                    {currentUser?.displayName || currentUser?.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-gold hover:bg-yellow-600 text-navy font-heading font-semibold px-4 py-2 rounded-md transition duration-200"
                  >
                    Logout
                  </button>
                </>
              )}
              {!currentUser && (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-gold hover:bg-yellow-600 text-navy font-heading font-semibold px-4 py-2 rounded-md transition duration-200"
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
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-heading font-bold text-gold mb-2">Watch Marketplace</h2>
          <p className="text-offWhite">Discover luxury timepieces from verified sellers</p>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-offWhite rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium text-darkGray mb-1">Brand</label>
              <select
                name="brand"
                value={filters.brand}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-silver rounded-md focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Condition Filter */}
            <div>
              <label className="block text-sm font-medium text-darkGray mb-1">Condition</label>
              <select
                name="condition"
                value={filters.condition}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-silver rounded-md focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="">All Conditions</option>
                {conditions.map(condition => (
                  <option key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-sm font-medium text-darkGray mb-1">Min Price</label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="$0"
                className="w-full px-3 py-2 border border-silver rounded-md focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-sm font-medium text-darkGray mb-1">Max Price</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Any"
                className="w-full px-3 py-2 border border-silver rounded-md focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-darkGray mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-silver rounded-md focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="newest">Newest First</option>
                <option value="priceLowHigh">Price: Low to High</option>
                <option value="priceHighLow">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="text-gold hover:text-yellow-600 font-semibold text-sm"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-offWhite">
            Showing <span className="font-semibold text-gold">{filteredWatches.length}</span> watches
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-gold text-xl font-heading">Loading watches...</div>
          </div>
        )}

        {/* Watch Grid */}
        {!loading && filteredWatches.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWatches.map(watch => (
              <WatchCard key={watch.id} watch={watch} />
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredWatches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⌚</div>
            <h3 className="text-2xl font-heading font-bold text-offWhite mb-2">No watches found</h3>
            <p className="text-silver mb-6">Try adjusting your filters or check back later</p>
            <button
              onClick={clearFilters}
              className="bg-gold hover:bg-yellow-600 text-navy font-heading font-semibold px-6 py-3 rounded-md transition duration-200"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Marketplace;
