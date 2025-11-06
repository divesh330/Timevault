import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Listings() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

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
            <h1 className="text-2xl font-heading font-bold text-gold">TimeVault</h1>
            <div className="flex items-center space-x-4">
              <span className="text-offWhite">
                {currentUser?.displayName || currentUser?.email}
              </span>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-offWhite rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-heading font-bold text-navy mb-4">Listings</h2>
          <p className="text-darkGray mb-6">
            This is a protected listings page. Only authenticated users can access this.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-silver rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-heading font-semibold text-navy mb-2">Listing 1</h3>
              <p className="text-darkGray text-sm">Sample listing content</p>
            </div>

            <div className="border border-silver rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-heading font-semibold text-navy mb-2">Listing 2</h3>
              <p className="text-darkGray text-sm">Sample listing content</p>
            </div>

            <div className="border border-silver rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-heading font-semibold text-navy mb-2">Listing 3</h3>
              <p className="text-darkGray text-sm">Sample listing content</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Listings;
