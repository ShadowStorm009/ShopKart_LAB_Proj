import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';

const Cart = () => {
  const navigate = useNavigate();
  const {
    cart,
    loading,
    error,
    refreshCart,
    clearCart,
    totalCount,
    itemCount,
    subtotal,
  } = useCart();

  const [checkoutInitiated, setCheckoutInitiated] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to remove all items from your cart?')) {
      setClearing(true);
      await clearCart();
      setClearing(false);
    }
  };

  const handleProceedToCheckout = () => {
    navigate('/checkout');
  };

  // State 1: Loading State (Lab 05 Section 17)
  if (loading && cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">Loading your cart...</h2>
        <p className="text-xs text-slate-400 mt-1">Synchronizing your saved items from server</p>
      </div>
    );
  }

  // State 2: Error State (Lab 05 Section 17)
  if (error && cart.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 text-center p-8 bg-white rounded-3xl border border-rose-200 shadow-sm">
        <div className="text-3xl mb-3">⚠️</div>
        <h2 className="text-lg font-bold text-slate-900">Unable to load your cart.</h2>
        <p className="text-xs text-slate-500 mt-2">{error}</p>
        <button
          onClick={refreshCart}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // State 3: Empty State (Lab 05 Section 17)
  if (!loading && cart.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 text-center p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-slate-900">Your cart is empty 🛒</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Looks like you haven't added anything yet.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all"
        >
          Browse Products →
        </Link>
      </div>
    );
  }

  // State 4: Populated Shopping Cart
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>🛒 Shopping Cart</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Cart
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review your selected items, adjust quantities, and proceed to checkout
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClearCart}
            disabled={clearing}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-colors shadow-xs"
          >
            {clearing ? 'Clearing...' : 'Clear Cart'}
          </button>
        </div>
      </div>

      {/* Main Grid Layout: Items List (Left) & Order Summary (Right) */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>
              Showing <strong className="text-slate-800">{itemCount}</strong> distinct {itemCount === 1 ? 'product' : 'products'} ({totalCount} total units)
            </span>
            <Link
              to="/products"
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              ← Continue Shopping
            </Link>
          </div>

          {/* List of items */}
          <div className="space-y-3">
            {cart.map((item) => (
              <CartItem
                key={item.product?._id || item._id}
                item={item}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Order Summary (Task 8 & Task 13) */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24">
          <h2 className="text-lg font-bold text-slate-900 pb-4 border-b border-slate-100">
            Order Summary
          </h2>

          <div className="py-4 space-y-3 border-b border-slate-100 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Items: {totalCount}</span>
              <span className="font-semibold text-slate-900">
                ₹{Number(subtotal).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Delivery</span>
              <span className="font-semibold text-emerald-600 uppercase text-xs tracking-wider">
                FREE
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-900">
                ₹{Number(subtotal).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Total Amount */}
          <div className="py-4 flex justify-between items-baseline">
            <div>
              <p className="text-sm font-bold text-slate-900">Total Amount</p>
              <p className="text-[11px] text-slate-400">Inclusive of all taxes</p>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{Number(subtotal).toLocaleString('en-IN')}
            </p>
          </div>

          {/* Checkout CTA Button */}
          <button
            onClick={handleProceedToCheckout}
            disabled={checkoutInitiated}
            className="w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 hover:translate-y-[-1px] disabled:opacity-75"
          >
            {checkoutInitiated ? 'Verifying Stock...' : 'Proceed to Checkout →'}
          </button>

          {/* Trust Guarantees */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            <p>✓ Safe and secure 256-bit encrypted checkout</p>
            <p>✓ Free returns within 7 days of delivery</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
