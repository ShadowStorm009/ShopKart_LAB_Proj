import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, User, LogOut, Menu, X, ShieldCheck, ShoppingCart, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout, wishlistCount } = useAuth();
  const { totalCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }) =>
    `px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg flex items-center gap-1.5 ${
      isActive
        ? 'text-indigo-600 bg-indigo-50 font-semibold'
        : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link to={user ? "/home" : "/login"} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
                Shop<span className="text-indigo-600">Kart</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                Labs 1-6
              </span>
            </div>
          </Link>


          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {user && (
              <>
                <NavLink to="/home" className={navLinkClasses}>
                  Home
                </NavLink>
                <NavLink to="/products" className={navLinkClasses}>
                  Products
                </NavLink>
                <NavLink to="/wishlist" className={navLinkClasses}>
                  <Heart className={`w-4 h-4 ${wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-700 rounded-full animate-pulse">
                      {wishlistCount}
                    </span>
                  )}
                </NavLink>
                <NavLink to="/cart" className={navLinkClasses}>
                  <ShoppingCart className={`w-4 h-4 ${totalCount > 0 ? 'text-indigo-600' : ''}`} />
                  <span>Cart</span>
                  {totalCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-full animate-pulse">
                      {totalCount}
                    </span>
                  )}
                </NavLink>
                <NavLink to="/orders" className={navLinkClasses}>
                  <Package className="w-4 h-4" />
                  <span>Orders</span>
                </NavLink>
              </>

            )}
          </nav>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 pl-3 pr-4 py-1.5 bg-slate-100/80 rounded-full border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold uppercase">
                    {user.fullName ? user.fullName[0] : 'U'}
                  </div>
                  <span className="text-xs font-medium text-slate-700 max-w-[120px] truncate">
                    {user.fullName || user.email}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors shadow-sm"
                  title="Logout securely"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-colors"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          {user ? (
            <>
              <div className="px-3 py-2 bg-slate-50 rounded-lg mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-slate-800">{user.fullName} ({user.email})</span>
              </div>
              <Link
                to="/home"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Home
              </Link>
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Products
              </Link>
              <Link
                to="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <span>Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-700 rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link
                to="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-indigo-600" />
                  <span>Cart</span>
                </div>
                {totalCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-full">
                    {totalCount}
                  </span>
                )}
              </Link>
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Package className="w-4 h-4 text-indigo-600" />
                <span>My Orders</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>

            </>
          ) : (
            <div className="space-y-2 pt-1">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
