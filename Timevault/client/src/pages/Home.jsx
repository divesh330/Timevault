import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-navy">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-6xl font-heading font-bold text-gold mb-4">TimeVault</h1>
        <p className="text-xl text-offWhite mb-4">Your Premium Watch Marketplace</p>
        <p className="text-md text-silver mb-8">Buy and sell luxury timepieces with confidence</p>
        
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            to="/marketplace"
            className="bg-gold hover:bg-yellow-600 text-navy font-heading font-semibold px-8 py-3 rounded-md transition duration-200"
          >
            Browse Watches
          </Link>
          
          {currentUser ? (
            <Link
              to="/dashboard"
              className="bg-transparent border-2 border-gold hover:bg-gold hover:text-navy text-gold font-heading font-semibold px-8 py-3 rounded-md transition duration-200"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="bg-transparent border-2 border-gold hover:bg-gold hover:text-navy text-gold font-heading font-semibold px-8 py-3 rounded-md transition duration-200"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="bg-transparent border-2 border-offWhite hover:bg-offWhite hover:text-navy text-offWhite font-heading font-semibold px-8 py-3 rounded-md transition duration-200"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
