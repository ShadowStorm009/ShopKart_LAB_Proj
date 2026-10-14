import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Eye, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const WishlistCard = ({ product, onRemove }) => {
  const { addToCart, isInCart, itemLoading } = useCart();
  const [isRemoving, setIsRemoving] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState('');

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(product._id);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleAddToCart = async () => {
    const res = await addToCart(product._id);
    if (res.success) {
      setAddedFeedback('✓ Added to Cart');
    } else {
      setAddedFeedback(res.message || 'Failed to add');
    }
    setTimeout(() => setAddedFeedback(''), 2500);
  };

  const isOutOfStock = product.stock <= 0;
  const inCart = isInCart(product._id);
  const isAdding = Boolean(itemLoading[product._id]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
          }}
        />
        <span className="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase bg-white/90 backdrop-blur-md text-slate-800 rounded-lg shadow-sm border border-slate-200/60">
          {product.category}
        </span>
      </div>

      {/* Info & Actions */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 line-clamp-1">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs text-slate-400 font-medium">Price</span>
              <p className="text-lg font-extrabold text-slate-900">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </p>
            </div>
            <div>
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
                  ? `${product.stock} left`
                  : 'In Stock'}
              </span>
            </div>
          </div>

          {/* Feedback alert */}
          {addedFeedback && (
            <div className="mb-2 p-1.5 text-center bg-slate-900 text-white rounded-lg text-[11px] font-semibold">
              {addedFeedback}
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className="w-full mb-2 py-2 px-3 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>
              {isOutOfStock
                ? 'Out of Stock'
                : isAdding
                ? 'Adding...'
                : inCart
                ? 'Add Another (+1)'
                : 'Move to Cart'}
            </span>
          </button>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/products/${product._id}`}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View</span>
            </Link>

            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all disabled:opacity-60"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isRemoving ? 'Removing...' : 'Remove'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistCard;
