import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
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
              <button
                onClick={() => navigate('/create-listing')}
                className="text-offWhite hover:text-gold transition"
              >
                Sell Watch
              </button>
              <span className="text-offWhite">
                <span className="font-semibold">{currentUser?.displayName || currentUser?.email}</span>
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
          <h2 className="text-3xl font-heading font-bold text-navy mb-4">Dashboard</h2>
          <p className="text-darkGray mb-6">
            This is your protected dashboard. Only authenticated users can see this page.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              onClick={() => navigate('/marketplace')}
              className="bg-navy p-6 rounded-lg cursor-pointer hover:bg-opacity-90 transition"
            >
              <h3 className="text-xl font-heading font-semibold text-gold mb-2">Browse Marketplace</h3>
              <p className="text-offWhite text-sm">Discover luxury watches from verified sellers</p>
            </div>

            <div 
              onClick={() => navigate('/create-listing')}
              className="bg-navy p-6 rounded-lg cursor-pointer hover:bg-opacity-90 transition"
            >
              <h3 className="text-xl font-heading font-semibold text-gold mb-2">Sell Your Watch</h3>
              <p className="text-offWhite text-sm">Create a new listing and reach buyers</p>
            </div>

            <div className="bg-navy p-6 rounded-lg">
              <h3 className="text-xl font-heading font-semibold text-gold mb-2">Your Profile</h3>
              <p className="text-offWhite text-sm">Manage your account settings</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
