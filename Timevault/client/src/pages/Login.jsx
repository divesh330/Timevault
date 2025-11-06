import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import toast from 'react-hot-toast';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleResendVerification = async () => {
    try {
      setResendingVerification(true);
      
      // Sign in temporarily to get user object
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      // Send verification email with redirect URL
      await sendEmailVerification(userCredential.user, {
        url: "http://localhost:5173/login",
        handleCodeInApp: true
      });
      
      // Sign out immediately
      await auth.signOut();
      
      toast.success('✅ Verification email resent! Check your inbox or spam folder.');
      setShowResendVerification(false);
    } catch (err) {
      console.error('Resend verification error:', err);
      toast.error('Failed to send verification email. Please try again.');
    } finally {
      setResendingVerification(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowResendVerification(false);

    try {
      setLoading(true);
      
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      const user = userCredential.user;
      
      // Check if email is verified
      if (!user.emailVerified) {
        await auth.signOut();
        setShowResendVerification(true);
        setError('Please verify your email before logging in. Check your inbox for the verification link.');
        toast.error('⚠️ Please verify your email before logging in.');
        return;
      }
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const userRole = userData?.role || 'user';
      
      // Update email verification status in Firestore if needed
      if (!userData?.emailVerified) {
        await updateDoc(doc(db, 'users', user.uid), {
          emailVerified: true
        });
      }

      // Store user in localStorage for persistence
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        name: userData?.name || user.displayName,
        role: userRole
      }));
      
      toast.success(`Welcome back, ${userData?.name || user.email}!`);

      // Redirect based on user role
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Failed to log in';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format. Please enter a valid email.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid credentials. Please check your email and password.';
      }
      
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-heading font-bold text-gold mb-2">TimeVault</h1>
          <p className="text-offWhite text-lg font-body">Welcome back to luxury</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-heading font-semibold text-navy mb-6">Log In</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6">
              {error}
              {showResendVerification && (
                <div className="mt-3">
                  <button
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                    className="text-sm bg-gold hover:bg-yellow-600 text-black px-3 py-1 rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-darkGray mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-silver rounded-xl focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-200"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-darkGray mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-silver rounded-xl focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-gold hover:bg-black text-navy hover:text-gold font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </form>

          {/* Resend Verification Email Button */}
          <div className="mt-6 text-center">
            <button
              onClick={handleResendVerification}
              disabled={resendingVerification}
              className="text-sm bg-transparent border border-gold text-gold hover:bg-gold hover:text-black px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Haven't received the verification email? Check your spam folder or click above to resend.
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-darkGray">
              Don't have an account?{' '}
              <Link to="/signup" className="text-gold hover:text-navy font-semibold transition-colors duration-200">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
