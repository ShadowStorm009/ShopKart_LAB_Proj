import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { getWishlist, removeFromWishlist } from '../services/api';
import WishlistCard from '../components/WishlistCard';
import { useAuth } from '../context/AuthContext';

const Wishlist = () => {
  const navigate = useNavigate();
  const { user, refreshWishlistCount } = useAuth();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWishlistItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWishlist();
      setWishlistItems(data.wishlist || []);
      await refreshWishlistCount();
    } catch (err) {
      if (err.status === 401) {
        // Not authenticated -> redirect to login
        navigate('/login');
      } else {
        setError(err.message || "We couldn't load your wishlist.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, refreshWishlistCount]);

  useEffect(() => {
    fetchWishlistItems();
  }, [fetchWishlistItems]);

  const handleRemoveItem = async (productId) => {
    try {
      await removeFromWishlist(productId);
      // Remove immediately from local state without full reload
      setWishlistItems((prev) => prev.filter((item) => item._id !== productId));
      await refreshWishlistCount();
    } catch (err) {
      alert(err.message || 'Failed to remove product from wishlist');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>Saved Items</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Wishlist
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Keep track of products you're interested in and return anytime to purchase
          </p>
        </div>

        {!loading && !error && (
          <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'product' : 'products'} saved
          </div>
        )}
      </div>

      {/* State 1: Loading State */}
      {loading && (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-600">Loading your wishlist...</p>
        </div>
      )}

      {/* State 2: Error State */}
      {!loading && error && (
        <div className="my-16 text-center max-w-md mx-auto p-8 bg-white rounded-3xl border border-rose-200 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Something went wrong</h2>
          <p className="text-xs text-slate-500 mt-2">{error}</p>
          <button
            onClick={fetchWishlistItems}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* State 3: Empty State */}
      {!loading && !error && wishlistItems.length === 0 && (
        <div className="my-16 text-center max-w-md mx-auto p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Heart className="w-8 h-8 fill-rose-500/20 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Your wishlist is empty ❤️</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Start saving products you love and find them here later for quick checkout.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all hover:translate-x-0.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* State 4: Populated Wishlist Grid */}
      {!loading && !error && wishlistItems.length > 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((product) => (
            <WishlistCard
              key={product._id}
              product={product}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
