import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getProfile, logoutCustomer, getWishlist } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Fetch logged in profile from GET /customers/me
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setUser(data.customer || data);
      
      // Also fetch wishlist count
      try {
        const wl = await getWishlist();
        setWishlistCount(wl.count || wl.wishlist?.length || 0);
      } catch (e) {
        // Wishlist might be empty or unauthenticated
        setWishlistCount(0);
      }
    } catch (error) {
      setUser(null);
      setWishlistCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Update wishlist count directly
  const refreshWishlistCount = useCallback(async () => {
    try {
      const data = await getWishlist();
      setWishlistCount(data.count || data.wishlist?.length || 0);
    } catch (e) {
      setWishlistCount(0);
    }
  }, []);

  const logout = async () => {
    try {
      await logoutCustomer();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setWishlistCount(0);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        checkAuth,
        logout,
        wishlistCount,
        setWishlistCount,
        refreshWishlistCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
