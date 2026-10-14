import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Calendar, ShoppingBag, Heart, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { getProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user: contextUser, setUser: setContextUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchCustomerProfile = async () => {
      try {
        setLoading(true);
        // Call GET /customers/me as mandated by Lab 02 Task 3
        const data = await getProfile();
        if (isMounted) {
          const customerData = data.customer || data;
          setProfile(customerData);
          if (setContextUser) setContextUser(customerData);
        }
      } catch (err) {
        if (isMounted) {
          setError('Session expired or unauthorized');
          // Automatically redirect to /login if not logged in
          navigate('/login');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCustomerProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate, setContextUser]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const joinDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent Member';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white p-8 sm:p-10 shadow-xl shadow-indigo-100 mb-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>Customer Dashboard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {profile.fullName}!
          </h1>
          <p className="mt-3 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Your ShopKart account is verified. You can browse our dynamic catalog, search by categories, or manage your personal wishlist.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 shadow-md shadow-indigo-900/10 transition-all hover:translate-x-0.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/wishlist"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500/40 hover:bg-indigo-500/60 border border-white/20 text-white font-semibold text-sm backdrop-blur-sm transition-all"
            >
              <Heart className="w-4 h-4" />
              <span>My Wishlist</span>
            </Link>
          </div>
        </div>

        {/* Decorative glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Grid Layout: Profile Card & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Customer Details Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold uppercase shadow-inner">
              {profile.fullName ? profile.fullName[0] : 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{profile.fullName}</h2>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Customer</span>
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-500 mt-0.5">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Account ID</p>
                <p className="text-xs font-mono text-slate-700 break-all">{profile._id}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-500 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Email Address</p>
                <p className="text-sm font-medium text-slate-800">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-500 mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Phone Number</p>
                <p className="text-sm font-medium text-slate-800">{profile.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-500 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Customer Since</p>
                <p className="text-sm font-medium text-slate-800">{joinDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Feature Highlights & Quick Links */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">ShopKart Labs Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                <div className="text-xs font-bold uppercase text-indigo-600 mb-1">Lab 01 & 02</div>
                <h4 className="text-sm font-semibold text-slate-800">Authentication & JWT</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Secure HttpOnly cookie session management and protected customer endpoints.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                <div className="text-xs font-bold uppercase text-indigo-600 mb-1">Lab 03</div>
                <h4 className="text-sm font-semibold text-slate-800">Product Discovery</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Dynamic MongoDB catalog with live search, category filtering, and product details.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                <div className="text-xs font-bold uppercase text-indigo-600 mb-1">Lab 04</div>
                <h4 className="text-sm font-semibold text-slate-800">Wishlist System</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Mongoose relationships with ObjectId references, duplicate prevention, and populated items.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                <div className="text-xs font-bold uppercase text-indigo-600 mb-1">Industry Standards</div>
                <h4 className="text-sm font-semibold text-slate-800">MVC Architecture</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Strict separation of concerns, robust error handling, and clean Axios API service.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Banner */}
          <div className="p-6 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-indigo-950">Ready to discover trending products?</h4>
              <p className="text-xs text-indigo-700 mt-0.5">Explore electronics, apparel, literature, and home items.</p>
            </div>
            <Link
              to="/products"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-200 transition-colors flex-shrink-0"
            >
              Explore Catalog &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
