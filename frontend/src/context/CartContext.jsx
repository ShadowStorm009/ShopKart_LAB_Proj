import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getCart,
  addToCart as addToCartApi,
  updateCartQuantity as updateCartQuantityApi,
  removeFromCart as removeFromCartApi,
  clearCart as clearCartApi,
} from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Track granular per-item loading states (e.g. while updating quantity or removing)
  const [itemLoading, setItemLoading] = useState({});

  // Fetch authenticated user's cart from backend
  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getCart();
      setCart(data.cart || []);
    } catch (err) {
      if (err.status === 401) {
        setCart([]);
      } else {
        setError(err.message || 'Unable to load cart');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Sync cart when user authentication status changes
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart([]);
      setError(null);
    }
  }, [user, fetchCart]);

  // Set loading state for a single item
  const setSingleItemLoading = (productId, isLoading) => {
    setItemLoading((prev) => ({
      ...prev,
      [productId]: isLoading,
    }));
  };

  // Add product to cart (or increment quantity)
  const addToCart = async (productId) => {
    setSingleItemLoading(productId, true);
    try {
      const response = await addToCartApi(productId);
      if (response.cart) {
        setCart(response.cart);
      } else {
        await fetchCart();
      }
      return { success: true, message: response.message || 'Item added to cart' };
    } catch (err) {
      const message = err.message || 'Failed to add item to cart';
      return { success: false, message };
    } finally {
      setSingleItemLoading(productId, false);
    }
  };

  // Update quantity of a product in cart
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return { success: false, message: 'Quantity must be at least 1' };

    setSingleItemLoading(productId, true);
    try {
      const response = await updateCartQuantityApi(productId, newQuantity);
      if (response.cart) {
        setCart(response.cart);
      } else {
        await fetchCart();
      }
      return { success: true };
    } catch (err) {
      const message = err.message || 'Failed to update quantity';
      return { success: false, message };
    } finally {
      setSingleItemLoading(productId, false);
    }
  };

  // Remove a product entirely from cart
  const removeFromCart = async (productId) => {
    setSingleItemLoading(productId, true);
    try {
      const response = await removeFromCartApi(productId);
      if (response.cart) {
        setCart(response.cart);
      } else {
        // Fallback optimistic removal
        setCart((prev) => prev.filter((item) => (item.product?._id || item.product) !== productId));
      }
      return { success: true };
    } catch (err) {
      const message = err.message || 'Failed to remove item from cart';
      return { success: false, message };
    } finally {
      setSingleItemLoading(productId, false);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    setLoading(true);
    try {
      await clearCartApi();
      setCart([]);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to clear cart' };
    } finally {
      setLoading(false);
    }
  };

  // Locally clear cart state (e.g. immediately after confirmed order payment)
  const clearCartState = useCallback(() => {
    setCart([]);
  }, []);

  // Derived values computed from state without duplicate storage (Lab 05 Section 15)

  const totalCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [cart]);

  const itemCount = useMemo(() => {
    return cart.length;
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = Number(item.product?.price) || 0;
      const qty = Number(item.quantity) || 1;
      return sum + price * qty;
    }, 0);
  }, [cart]);

  const isInCart = useCallback(
    (productId) => {
      return cart.some((item) => (item.product?._id || item.product) === productId);
    },
    [cart]
  );

  const getItemQuantity = useCallback(
    (productId) => {
      const item = cart.find((item) => (item.product?._id || item.product) === productId);
      return item ? item.quantity : 0;
    },
    [cart]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        itemLoading,
        fetchCart,
        refreshCart: fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        clearCartState,
        resetCart: clearCartState,
        totalCount,
        itemCount,
        subtotal,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
