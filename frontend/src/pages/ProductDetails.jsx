import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Package,
} from 'lucide-react';
import { getProductById, toggleWishlist, getWishlist } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshWishlistCount } = useAuth();
  const { addToCart, isInCart, getItemQuantity, itemLoading } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Wishlist & Cart state
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isSavingWishlist, setIsSavingWishlist] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProductById(id);
        if (isMounted) {
          setProduct(data.product);

          // Check if product is in current user's wishlist
          if (user) {
            try {
              const wlData = await getWishlist();
              const hasItem = (wlData.wishlist || []).some(
                (item) => item._id === data.product._id
              );
              setIsWishlisted(hasItem);
            } catch (e) {
              // ignore
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Product not found');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  const handleWishlistToggle = async () => {
    if (!user) {
      setFeedback('Please login to save this product');
      setTimeout(() => navigate('/login'), 1200);
      return;
    }

    if (isSavingWishlist) return;

    setIsSavingWishlist(true);
    setFeedback(null);

    try {
      const response = await toggleWishlist(product._id);
      setIsWishlisted(response.saved);
      setFeedback(response.saved ? '♥ Added to your Wishlist' : 'Removed from Wishlist');
      await refreshWishlistCount();
    } catch (err) {
      setFeedback(err.message || 'Unable to update wishlist');
    } finally {
      setIsSavingWishlist(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      setFeedback('Please login to add this product to your cart');
      setTimeout(() => navigate('/login'), 1200);
      return;
    }

    const res = await addToCart(product._id);
    if (res.success) {
      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 3000);
    } else {
      setFeedback(res.message);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-slate-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-24 bg-slate-100 rounded" />
            <div className="h-12 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-16 text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">{error || "The product you requested does not exist."}</p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Back button */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Product Catalog</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left: Product Image */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
            }}
          />
          <span className="absolute top-4 left-4 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-slate-800 rounded-xl shadow-sm border border-slate-200/60">
            {product.category}
          </span>
        </div>

        {/* Right: Product Meta & Purchase Card */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                {product.category} Collection
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                {product.name}
              </h1>
            </div>

            {/* Price & Stock */}
            <div className="flex items-center gap-4 py-2 border-y border-slate-100">
              <div>
                <span className="text-xs text-slate-400 font-medium">Standard Price</span>
                <p className="text-3xl font-black text-slate-900 tracking-tight">
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div>
                <span className="text-xs text-slate-400 font-medium">Availability</span>
                <p
                  className={`text-sm font-bold ${
                    isOutOfStock
                      ? 'text-rose-600'
                      : product.stock < 10
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {isOutOfStock
                    ? 'Out of Stock'
                    : product.stock < 10
                    ? `Only ${product.stock} units left`
                    : `In Stock (${product.stock} units)`}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Product Description
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          </div>

          {/* Action Center */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            {/* Feedback alert */}
            {feedback && (
              <div className="p-3 rounded-xl bg-slate-900 text-white text-xs font-semibold text-center animate-fade-in shadow-md">
                {feedback}
              </div>
            )}
            {cartSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Product added to your cart!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Add to Cart button */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || Boolean(itemLoading[product._id])}
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200 transition-all hover:translate-y-[-1px]"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {isOutOfStock
                    ? 'Out of Stock'
                    : itemLoading[product._id]
                    ? 'Adding...'
                    : getItemQuantity(product._id) > 0
                    ? `In Cart (${getItemQuantity(product._id)}) - Add Another`
                    : 'Add to Cart'}
                </span>
              </button>

              {/* Wishlist button */}
              <button
                onClick={handleWishlistToggle}
                disabled={isSavingWishlist}
                className={`flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm border transition-all ${
                  isWishlisted
                    ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:text-rose-600 hover:border-rose-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                <span>
                  {isSavingWishlist
                    ? 'Saving...'
                    : isWishlisted
                    ? 'Saved in Wishlist'
                    : 'Add to Wishlist'}
                </span>
              </button>
            </div>

            {/* Value Guarantees */}
            <div className="pt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500 border-t border-slate-100">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>Free Express Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="w-4 h-4 text-indigo-600" />
                <span>7 Days Return</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Genuine Quality</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
