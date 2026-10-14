import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, CreditCard, Truck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createPaymentOrder, verifyPayment } from '../services/api';

/**
 * Dynamically loads Razorpay checkout script if not already present
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, subtotal, totalCount, clearCartState } = useCart();

  // Shipping Form State
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [serverError, setServerError] = useState('');

  // Pre-fill user data if available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Client-side Validation (Task 3)
  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      // Must be at least 10 digits
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        errors.phone = 'Please enter a valid 10-digit phone number';
      }
    }

    if (!formData.addressLine1.trim()) {
      errors.addressLine1 = 'Street address is required';
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      errors.state = 'State is required';
    }

    if (!formData.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      errors.pincode = 'Pincode must contain exactly 6 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  // Razorpay Checkout Trigger
  const handleRazorpayPayment = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setServerError('');
    setProcessingStatus('Initializing Razorpay Checkout...');

    try {
      // 1. Ensure Razorpay script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay payment SDK. Please check your internet connection.');
      }

      setProcessingStatus('Creating secure order with server...');

      // 2. Call backend to validate cart, stock, calculate price and create Razorpay order
      const orderResponse = await createPaymentOrder(formData);

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Unable to create order');
      }

      setProcessingStatus('Awaiting payment completion...');

      // 3. Configure Razorpay Standard Checkout options
      const options = {
        key: orderResponse.key,
        amount: orderResponse.amount,
        currency: orderResponse.currency || 'INR',
        name: 'ShopKart',
        description: 'Complete Your Purchase',
        image: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png',
        order_id: orderResponse.razorpayOrderId,
        handler: async function (response) {
          try {
            setProcessingStatus('Verifying payment signature securely...');
            setIsProcessing(true);

            // 4. Send payment details to backend for HMAC SHA256 signature verification
            const verifyRes = await verifyPayment({
              shopKartOrderId: orderResponse.shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              // 5. Update global cart state immediately (cart = [])
              clearCartState();
              // 6. Navigate to Order Confirmation page
              navigate(`/order-success/${orderResponse.shopKartOrderId}`);
            } else {
              throw new Error(verifyRes.message || 'Payment verification failed');
            }
          } catch (err) {
            setServerError(
              err.message || 'Payment signature verification failed. Your cart has been retained.'
            );
            setIsProcessing(false);
          }
        },
        prefill: {
          name: formData.fullName,
          contact: formData.phone,
          email: user?.email || '',
        },
        notes: {
          shopKartOrderId: orderResponse.shopKartOrderId,
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setProcessingStatus('');
          },
        },
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on('payment.failed', function (failureResponse) {
        console.error('Payment Failed:', failureResponse.error);
        setServerError(
          `Payment failed: ${failureResponse.error?.description || 'Transaction cancelled'}. Your cart has not been cleared. Please try again.`
        );
        setIsProcessing(false);
        setProcessingStatus('');
      });

      paymentObject.open();
    } catch (err) {
      console.error('Checkout Error:', err);
      setServerError(err.message || 'Something went wrong while initiating checkout. Please try again.');
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // If cart is empty, show empty state
  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4 text-center">
        <div className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-5xl mb-4">🛍️</div>
          <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            There are no items in your cart to checkout. Please explore our products and add them to your cart first.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/products"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all"
            >
              Browse Products →
            </Link>
            <Link
              to="/orders"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
            >
              View Past Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
        <Link to="/cart" className="hover:text-indigo-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">Secure Checkout</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Lab 06 Checkout</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Checkout & Order Finalization
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provide shipping information and complete payment via Razorpay Test Mode
          </p>
        </div>

        {/* Test Mode Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Razorpay Test Mode Active</span>
        </div>
      </div>

      {/* Server Error Alert Banner */}
      {serverError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-900">Checkout Issue</h4>
            <p className="text-xs text-rose-700 mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Shipping Form (Left) & Order Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Shipping Address (Task 2 & 3) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                1. Shipping Address
              </h2>
              <p className="text-xs text-slate-400">
                Where should we deliver your order?
              </p>
            </div>
          </div>

          <form onSubmit={handleRazorpayPayment} className="mt-6 space-y-4">
            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g. Aarav Sharma"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                    formErrors.fullName
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                {formErrors.fullName && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. 9876543210"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                    formErrors.phone
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                {formErrors.phone && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street Address / House / Flat <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleInputChange}
                placeholder="e.g. Flat 402, Green Glen Layout, Outer Ring Road"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                  formErrors.addressLine1
                    ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {formErrors.addressLine1 && (
                <p className="text-[11px] text-rose-600 mt-1">{formErrors.addressLine1}</p>
              )}
            </div>

            {/* City, State, Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="e.g. Bengaluru"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                    formErrors.city
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                {formErrors.city && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="e.g. Karnataka"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                    formErrors.state
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                {formErrors.state && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.state}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pincode <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={handleInputChange}
                  placeholder="e.g. 560103"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                    formErrors.pincode
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                {formErrors.pincode && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.pincode}</p>
                )}
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs sm:text-sm cursor-not-allowed"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Payment Method
              </label>
              <div className="p-3.5 rounded-2xl border-2 border-indigo-600 bg-indigo-50/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    ₹
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Razorpay Checkout (UPI, Cards, NetBanking, Wallets)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Test Mode Sandbox — Secure Instant Payment
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              </div>
            </div>

            {/* Desktop / Primary Submit Button inside form */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 px-6 rounded-2xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{processingStatus || 'Processing Payment...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Place Order & Pay ₹{Number(subtotal).toLocaleString('en-IN')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Summary: Cart Review (Task 2 & 7) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Order Review
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {totalCount} {totalCount === 1 ? 'unit' : 'units'}
              </span>
            </div>

            {/* Items list */}
            <div className="py-4 space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => {
                const p = item.product || {};
                return (
                  <div
                    key={p._id || item._id}
                    className="flex items-center gap-3 py-1.5"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {p.name || 'Product'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Qty: {item.quantity} × ₹{Number(p.price || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <p className="text-xs font-extrabold text-slate-900 shrink-0">
                      ₹{Number((p.price || 0) * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Price Calculations */}
            <div className="pt-4 pb-4 border-t border-b border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({totalCount} items)</span>
                <span className="font-semibold text-slate-900">
                  ₹{Number(subtotal).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Standard Delivery</span>
                <span className="font-bold text-emerald-600 uppercase text-[11px] tracking-wider">
                  FREE
                </span>
              </div>
            </div>

            {/* Total Amount */}
            <div className="py-4 flex justify-between items-baseline">
              <div>
                <p className="text-sm font-bold text-slate-900">Total Payable</p>
                <p className="text-[10px] text-slate-400">Calculated & verified by server</p>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                ₹{Number(subtotal).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Trust and Verification Notes */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>256-bit SSL encrypted Test Mode Checkout</span>
              </div>
              <p className="text-slate-400 text-center text-[10px] mt-2">
                Cart is cleared only upon verified payment confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
