import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart, itemLoading } = useCart();
  const product = item.product || {};
  const quantity = item.quantity || 1;
  const productId = product._id;

  const [localError, setLocalError] = useState('');
  const isLoading = Boolean(itemLoading[productId]);

  const handleDecrease = async () => {
    if (quantity <= 1 || isLoading) return;
    setLocalError('');
    const res = await updateQuantity(productId, quantity - 1);
    if (!res.success) {
      setLocalError(res.message);
      setTimeout(() => setLocalError(''), 3000);
    }
  };

  const handleIncrease = async () => {
    if (isLoading) return;
    if (product.stock && quantity >= product.stock) {
      setLocalError(`Only ${product.stock} units available in stock`);
      setTimeout(() => setLocalError(''), 3000);
      return;
    }
    setLocalError('');
    const res = await updateQuantity(productId, quantity + 1);
    if (!res.success) {
      setLocalError(res.message);
      setTimeout(() => setLocalError(''), 3000);
    }
  };

  const handleRemove = async () => {
    if (isLoading) return;
    setLocalError('');
    const res = await removeFromCart(productId);
    if (!res.success) {
      setLocalError(res.message);
      setTimeout(() => setLocalError(''), 3000);
    }
  };

  const lineTotal = (Number(product.price) || 0) * quantity;
  const isMaxStock = product.stock ? quantity >= product.stock : false;

  return (
    <div className={`p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm transition-all ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Product Image */}
        <Link
          to={`/products/${productId}`}
          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
            }}
          />
        </Link>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
              {product.category || 'General'}
            </span>
            {isMaxStock && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Max Stock
              </span>
            )}
          </div>

          <Link
            to={`/products/${productId}`}
            className="text-sm sm:text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
          >
            {product.name}
          </Link>

          <p className="text-xs text-slate-500 mt-0.5">
            Unit Price: <span className="font-semibold text-slate-700">₹{Number(product.price || 0).toLocaleString('en-IN')}</span>
          </p>

          {/* Inline Error Toast */}
          {localError && (
            <div className="mt-2 text-xs font-semibold text-rose-600 flex items-center gap-1.5">
              <span>⚠ {localError}</span>
            </div>
          )}
        </div>

        {/* Quantity Controls & Line Subtotal */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          {/* Stepper [-] [qty] [+] */}
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handleDecrease}
              disabled={quantity <= 1 || isLoading}
              className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-bold flex items-center justify-center text-sm shadow-xs transition-colors"
              aria-label="Decrease quantity"
              title={quantity <= 1 ? "Minimum quantity is 1 (use remove to delete)" : "Decrease quantity"}
            >
              -
            </button>

            <span className="w-8 text-center text-xs sm:text-sm font-bold text-slate-800">
              {quantity}
            </span>

            <button
              onClick={handleIncrease}
              disabled={isMaxStock || isLoading}
              className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-bold flex items-center justify-center text-sm shadow-xs transition-colors"
              aria-label="Increase quantity"
              title={isMaxStock ? "Maximum available stock reached" : "Increase quantity"}
            >
              +
            </button>
          </div>

          {/* Line Subtotal */}
          <div className="text-right min-w-[90px]">
            <p className="text-xs text-slate-400 font-medium">Subtotal</p>
            <p className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              ₹{Number(lineTotal).toLocaleString('en-IN')}
            </p>
          </div>

          {/* Remove Button */}
          <button
            onClick={handleRemove}
            disabled={isLoading}
            className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors disabled:opacity-40"
            aria-label="Remove item from cart"
            title="Remove from cart"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
