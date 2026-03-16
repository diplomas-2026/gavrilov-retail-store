import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const canUseCart = Boolean(user);

  const syncFromResponse = (response) => {
    setItems(response?.items || []);
  };

  useEffect(() => {
    if (!token || !canUseCart) {
      setItems([]);
      return;
    }

    setLoading(true);
    api
      .getCart()
      .then(syncFromResponse)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [token, canUseCart]);

  const addToCart = async (product) => {
    if (!canUseCart) {
      return;
    }
    const existing = items.find((item) => item.productId === product.id);
    const nextQty = (existing?.qty || 0) + 1;
    const maxQty = Number(product.stockQty ?? Number.MAX_SAFE_INTEGER);
    if (nextQty > maxQty) {
      return;
    }

    const response = await api.upsertCartItem(product.id, nextQty);
    syncFromResponse(response);
  };

  const updateQty = async (productId, qty) => {
    if (!canUseCart) {
      return;
    }
    const numericQty = Number(qty);
    if (Number.isNaN(numericQty)) {
      return;
    }
    if (numericQty <= 0) {
      const response = await api.removeCartItem(productId);
      syncFromResponse(response);
      return;
    }

    const response = await api.upsertCartItem(productId, numericQty);
    syncFromResponse(response);
  };

  const removeItem = async (productId) => {
    if (!canUseCart) {
      return;
    }
    const response = await api.removeCartItem(productId);
    syncFromResponse(response);
  };

  const clear = async () => {
    if (!canUseCart) {
      setItems([]);
      return;
    }
    await api.clearCart();
    setItems([]);
  };

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price) * item.qty, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, total, loading, addToCart, updateQty, removeItem, clear }),
    [items, total, loading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart должен использоваться внутри CartProvider');
  }
  return context;
}
