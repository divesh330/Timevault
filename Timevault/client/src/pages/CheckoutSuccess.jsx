import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axios';

function CheckoutSuccess() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchTransactionDetails();
  }, [transactionId, currentUser]);

  const fetchTransactionDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/transactions/${transactionId}`);
      setTransaction(response.data.transaction);
    } catch (err) {
      console.error('Error fetching transaction:', err);
      setError('Failed to load order details');
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-gold text-xl font-heading">Loading order details...</div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-heading font-bold text-offWhite mb-4">{error || 'Order not found'}</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gold hover:bg-yellow-600 text-navy font-heading font-semibold px-6 py-3 rounded-md transition duration-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-heading font-bold text-gold mb-2">Order Confirmed!</h1>
          <p className="text-xl text-offWhite">Thank you for your purchase</p>
        </div>

        {/* Order Details Card */}
        <div className="bg-offWhite rounded-lg shadow-xl p-8 mb-6">
          <div className="border-b border-silver pb-4 mb-6">
            <h2 className="text-2xl font-heading font-bold text-navy mb-2">Order Details</h2>
            <p className="text-sm text-silver">Order placed on {formatDate(transaction.createdAt)}</p>
          </div>

          {/* Watch Info */}
          {transaction.watch && (
            <div className="flex gap-6 mb-6 pb-6 border-b border-silver">
              {transaction.watch.images && transaction.watch.images[0] ? (
                <img
                  src={transaction.watch.images[0]}
                  alt={transaction.watch.title}
                  className="w-32 h-32 object-cover rounded-md"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="text-4xl">⌚</span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm text-silver uppercase mb-1">{transaction.watch.brand}</p>
                <h3 className="text-xl font-heading font-semibold text-navy mb-2">{transaction.watch.title}</h3>
                <p className="text-sm text-darkGray mb-2">Serial: {transaction.watch.serialNumber}</p>
                <p className="text-2xl font-heading font-bold text-gold">{formatPrice(transaction.price)}</p>
              </div>
            </div>
          )}

          {/* Transaction Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-heading font-semibold text-navy mb-3">Transaction Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-darkGray">Transaction ID:</span>
                  <span className="font-semibold text-navy font-mono text-sm">{transaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-darkGray">Tracking ID:</span>
                  <span className="font-semibold text-gold font-mono text-sm">{transaction.trackingId || 'Pending'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-darkGray">Status:</span>
                  <span className="font-semibold text-green-600 capitalize">{transaction.status}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-heading font-semibold text-navy mb-3">Seller Information</h3>
              {transaction.seller && (
                <div className="space-y-2">
                  <p className="text-darkGray">
                    <span className="font-semibold">Name:</span> {transaction.seller.name}
                  </p>
                  <p className="text-darkGray">
                    <span className="font-semibold">Email:</span> {transaction.seller.email}
                  </p>
                  <button
                    onClick={() => navigate(`/seller/${transaction.sellerId}`)}
                    className="text-gold hover:text-yellow-600 font-semibold text-sm"
                  >
                    View Seller Profile →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Info */}
          {transaction.shippingInfo && (
            <div className="mb-6">
              <h3 className="text-lg font-heading font-semibold text-navy mb-3">Shipping Address</h3>
              <div className="bg-gray-50 rounded-md p-4">
                <p className="text-darkGray">{transaction.shippingInfo.fullName}</p>
                <p className="text-darkGray">{transaction.shippingInfo.address}</p>
                <p className="text-darkGray">
                  {transaction.shippingInfo.city}, {transaction.shippingInfo.state} {transaction.shippingInfo.zipCode}
                </p>
                <p className="text-darkGray">{transaction.shippingInfo.country}</p>
                <p className="text-darkGray mt-2">{transaction.shippingInfo.email}</p>
                <p className="text-darkGray">{transaction.shippingInfo.phone}</p>
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="bg-gray-50 rounded-md p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-darkGray">Subtotal</span>
                <span className="font-semibold text-navy">{formatPrice(transaction.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-darkGray">Shipping</span>
                <span className="font-semibold text-green-600">FREE</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-gold">
                <span className="text-lg font-heading font-bold text-navy">Total Paid</span>
                <span className="text-xl font-heading font-bold text-gold">{formatPrice(transaction.price)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-offWhite rounded-lg shadow-xl p-6 mb-6">
          <h3 className="text-xl font-heading font-bold text-navy mb-4">What's Next?</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <span className="text-gold text-xl mr-3">1.</span>
              <p className="text-darkGray">The seller has been notified of your purchase and will prepare the watch for shipping.</p>
            </div>
            <div className="flex items-start">
              <span className="text-gold text-xl mr-3">2.</span>
              <p className="text-darkGray">You will receive a confirmation email with your order details and tracking information.</p>
            </div>
            <div className="flex items-start">
              <span className="text-gold text-xl mr-3">3.</span>
              <p className="text-darkGray">Once shipped, you can track your package using the tracking ID provided.</p>
            </div>
            <div className="flex items-start">
              <span className="text-gold text-xl mr-3">4.</span>
              <p className="text-darkGray">The seller will contact you directly to coordinate delivery and authentication.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gold hover:bg-yellow-600 text-navy font-heading font-semibold px-8 py-3 rounded-md transition duration-200"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            className="bg-transparent border-2 border-gold hover:bg-gold hover:text-navy text-gold font-heading font-semibold px-8 py-3 rounded-md transition duration-200"
          >
            Continue Shopping
          </button>
        </div>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-offWhite text-sm">
            Need help? Contact us at{' '}
            <a href="mailto:support@timevault.com" className="text-gold hover:text-yellow-600">
              support@timevault.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default CheckoutSuccess;
