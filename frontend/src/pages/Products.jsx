import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, ArrowUpDown, RefreshCw, AlertTriangle, PackageOpen, Layers } from 'lucide-react';
import { getProducts, getWishlist } from '../services/api';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Books', 'Home'];

const Products = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Controlled search and filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '');

  // Products and Request Lifecycle states
  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products based on search, category, and sort parameters
  const fetchProductsList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Call GET /products with query parameters
      const data = await getProducts({
        search: searchTerm,
        category: selectedCategory,
        sort: sortBy,
      });

      setProducts(data.products || []);

      // If user is authenticated, fetch their current wishlist IDs to render heart state
      if (user) {
        try {
          const wlData = await getWishlist();
          const ids = new Set((wlData.wishlist || []).map((item) => item._id));
          setWishlistIds(ids);
        } catch (e) {
          // ignore wishlist fetch error
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong while loading products.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, sortBy, user]);

  // Sync state when filters change with slight debounce for typing
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductsList();
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchProductsList]);

  // Update URL search params
  useEffect(() => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
    if (sortBy) params.sort = sortBy;
    setSearchParams(params, { replace: true });
  }, [searchTerm, selectedCategory, sortBy, setSearchParams]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSortBy('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Product Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore All Products
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse our curated high-performance electronics, apparel, literature, and home items
          </p>
        </div>

        {/* Live count badge */}
        {!loading && !error && (
          <div className="text-xs font-medium text-slate-500">
            Showing <span className="font-bold text-slate-900">{products.length}</span> products
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="my-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search input */}
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Search products by title or brand..."
        />

        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              <option value="">Sort by: Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>

          {/* Reset Filters button if any filter applied */}
          {(searchTerm || selectedCategory !== 'All' || sortBy) && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* State 1: Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse flex flex-col"
            >
              <div className="aspect-square bg-slate-200" />
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                </div>
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-8 bg-slate-100 rounded-xl" />
                    <div className="h-8 bg-slate-100 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* State 2: Error State */}
      {!loading && error && (
        <div className="my-12 text-center max-w-md mx-auto p-8 bg-white rounded-3xl border border-rose-200 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Something went wrong while loading products</h3>
          <p className="text-xs text-slate-500 mt-2">{error}</p>
          <button
            onClick={fetchProductsList}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm shadow-indigo-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* State 3: Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="my-16 text-center max-w-md mx-auto p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <PackageOpen className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No products found</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            We couldn't find any products matching your current search or category filter.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm"
          >
            <span>Reset All Filters</span>
          </button>
        </div>
      )}

      {/* State 4: Dynamic Products Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              initialWishlisted={wishlistIds.has(product._id)}
              onWishlistChange={(id, saved) => {
                setWishlistIds((prev) => {
                  const next = new Set(prev);
                  if (saved) next.add(id);
                  else next.delete(id);
                  return next;
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
