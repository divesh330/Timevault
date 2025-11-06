import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { formatRMPrice } from '../utils/currency';

function WatchCard({ watch }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [addingToCart, setAddingToCart] = useState(false);

  const handleClick = () => {
    navigate(`/watch/${watch.id}`);
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!watch) return;
    
    // Check if user is logged in
    if (!currentUser) {
      alert('Please log in to add items to cart.');
      navigate('/login');
      return;
    }
    
    setAddingToCart(true);
    
    try {
      const cartsRef = collection(db, 'carts');
      const q = query(cartsRef, where('userId', '==', currentUser.uid), where('watchId', '==', watch.id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Item exists - increment quantity
        const cartDoc = querySnapshot.docs[0];
        const currentQuantity = cartDoc.data().quantity || 1;
        await updateDoc(doc(db, 'carts', cartDoc.id), {
          quantity: currentQuantity + 1,
          addedAt: serverTimestamp()
        });
      } else {
        // Item doesn't exist - create new cart entry
        await addDoc(cartsRef, {
          userId: currentUser.uid,
          watchId: watch.id,
          title: watch.title || 'Luxury Watch',
          brand: watch.brand || 'Luxury Brand',
          price: watch.price || 0,
          imageUrl: watch.imageUrl || watch.images?.[0] || 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch',
          quantity: 1,
          addedAt: serverTimestamp()
        });
      }
      
      alert('Added to cart successfully!');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  const getConditionBadgeColor = (condition) => {
    const colors = {
      new: 'bg-green-100 text-green-800',
      excellent: 'bg-blue-100 text-blue-800',
      good: 'bg-yellow-100 text-yellow-800',
      fair: 'bg-orange-100 text-orange-800',
      poor: 'bg-red-100 text-red-800',
    };
    return colors[condition] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div
      onClick={handleClick}
      className="bg-offWhite rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:border-2 hover:border-gold"
    >
      {/* Image */}
      <div className="relative h-64 bg-gray-200">
        {(watch.images && watch.images.length > 0) || watch.imageUrl ? (
          <img
            src={watch.imageUrl || watch.images[0] || 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch'}
            alt={watch.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x400.png?text=TimeVault+Watch';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-silver">
            <span className="text-4xl">⌚</span>
          </div>
        )}
        
        {/* Condition Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getConditionBadgeColor(watch.condition)}`}>
            {watch.condition.charAt(0).toUpperCase() + watch.condition.slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Brand */}
        <p className="text-sm font-semibold text-silver uppercase tracking-wide mb-1">
          {watch.brand}
        </p>

        {/* Title */}
        <h3 className="text-lg font-heading font-semibold text-navy mb-2 line-clamp-2">
          {watch.title}
        </h3>

        {/* Price */}
        <p className="text-2xl font-heading font-bold text-gold">
          {formatRMPrice(watch.price)}
        </p>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={addingToCart}
          className="w-full mt-3 bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black font-heading font-semibold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addingToCart ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
              Adding...
            </div>
          ) : (
            'Add to Cart'
          )}
        </button>

        {/* Description Preview */}
        {watch.description && (
          <p className="text-sm text-darkGray mt-2 line-clamp-2">
            {watch.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default WatchCard;
