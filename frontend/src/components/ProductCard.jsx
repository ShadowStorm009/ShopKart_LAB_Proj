import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Eye, Check, AlertCircle } from 'lucide-react';
import { toggleWishlist } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product, initialWishlisted = false, onWishlistChange }) => {
  const { user, refreshWishlistCount } = useAuth();
  const { addToCart, isInCart, itemLoading } = useCart();
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // If not logged in, prompt to login
    if (!user) {
      setFeedback({ type: 'error', text: 'Please sign in to save items' });
      setTimeout(() => navigate('/login'), 1200);
      return;
    }

    if (isSaving) return; // Prevent duplicate clicks while saving

    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await toggleWishlist(product._id);
      setIsWishlisted(response.saved);
      setFeedback({
        type: 'success',
        text: response.saved ? '♥ Added to Wishlist' : 'Removed from Wishlist',
      });
      await refreshWishlistCount();
      if (onWishlistChange) onWishlistChange(product._id, response.saved);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Unable to update wishlist',
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setFeedback({ type: 'error', text: 'Please sign in to add to cart' });
      setTimeout(() => navigate('/login'), 1200);
      return;
    }

    const res = await addToCart(product._id);
    if (res.success) {
      setFeedback({ type: 'success', text: '🛒 Added to Cart!' });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setTimeout(() => setFeedback(null), 2500);
  };

  const isOutOfStock = product.stock <= 0;
  const inCart = isInCart(product._id);
  const isAdding = Boolean(itemLoading[product._id]);

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Top Media Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            // Fallback image if broken
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
          }}
        />

        {/* Category Pill */}
        <span className="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase bg-white/90 backdrop-blur-md text-slate-800 rounded-lg shadow-sm border border-slate-200/60">
          {product.category}
        </span>

        {/* Wishlist Heart Action (Lab 04) */}
        <button
          onClick={handleWishlistToggle}
          disabled={isSaving}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-200 shadow-sm ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-rose-100'
              : 'bg-white/80 text-slate-600 hover:text-rose-600 hover:bg-white'
          } ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
        >
          <Heart
            className={`w-4 h-4 transition-transform duration-200 ${
              isWishlisted ? 'fill-rose-500 scale-110' : 'group-hover:scale-110'
            }`}
          />
        </button>

        {/* Temporary Feedback Notification */}
        {feedback && (
          <div
            className={`absolute bottom-3 inset-x-3 text-center py-1.5 px-2 rounded-lg text-xs font-semibold backdrop-blur-md transition-all shadow-md ${
              feedback.type === 'success'
                ? 'bg-emerald-900/90 text-white'
                : 'bg-rose-900/90 text-white'
            }`}
          >
            {feedback.text}
          </div>
        )}
      </div>

      {/* Body Information */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          {/* Price & Stock info */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs text-slate-400 font-medium">Price</span>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isOutOfStock
                    ? 'bg-rose-100 text-rose-700'
                    : product.stock < 10
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {isOutOfStock
                  ? 'Out of stock'
                  : product.stock < 10
                  ? `${product.stock} units left`
                  : 'In Stock'}
              </span>
            </div>
          </div>

          {/* Primary Add to Cart Button (Lab 05 Task 7) */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className="w-full mb-2.5 py-2.5 px-3 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>
              {isOutOfStock
                ? 'Out of Stock'
                : isAdding
                ? 'Adding...'
                : inCart
                ? 'Add Another (+1)'
                : 'Add to Cart'}
            </span>
          </button>

          {/* Secondary Action Row */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/products/${product._id}`}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Details</span>
            </Link>

            <button
              onClick={handleWishlistToggle}
              disabled={isSaving}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all border ${
                isWishlisted
                  ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:text-rose-600 hover:border-rose-200'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
              <span>{isSaving ? 'Saving...' : isWishlisted ? 'Saved' : 'Wishlist'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
