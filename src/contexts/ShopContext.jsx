import axios from 'axios';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  getToken,
  getUser,
  setAuth,
  clearAuth,
  authHeaders,
  readList,
  writeList,
} from '../utils/helpers/storage';
import { setupMockBackendFallback } from '../utils/helpers/mockBackend';

setupMockBackendFallback();

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DEFAULT_DEMO_USER = {
  _id: 'user-admin-1',
  username: 'parsa_admin',
  firstname: 'پارسا',
  lastname: 'سعادت',
  phone: '09120000001',
  email: 'parsa@alibazar.ir',
  role: 'admin',
  is_seller: true,
};

const ShopContext = createContext(null);

export const ShopProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const existing = getUser();
    if (existing) return existing;
    if (!localStorage.getItem('alibazar_init_auth')) {
      localStorage.setItem('alibazar_init_auth', '1');
      setAuth('demo-jwt-token-user-admin-1', DEFAULT_DEMO_USER);
      return DEFAULT_DEMO_USER;
    }
    return null;
  });
  const [cartCount, setCartCount] = useState(0);
  const [favorites, setFavorites] = useState(readList('favorites'));
  const [compare, setCompare] = useState(readList('compare'));
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const refreshCart = useCallback(async () => {
    const u = getUser();
    if (!getToken() || !u) {
      setCartCount(0);
      return;
    }
    try {
      const res = await axios.get(`${API}/user/${u._id}/cart?limit=100`, authHeaders());
      const data = res.data.body?.data || [];
      setCartCount(data.reduce((s, c) => s + (c.quantity || 1), 0));
    } catch {
      setCartCount(0);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const u = getUser();
    if (!getToken() || !u) return;
    try {
      const res = await axios.get(`${API}/user/${u._id}`, authHeaders());
      if (res.data.success) {
        const merged = { ...u, ...res.data.body };
        localStorage.setItem('user', JSON.stringify(merged));
        setUser(merged);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  useEffect(() => {
    refreshCart();
    refreshUser();
  }, [refreshCart, refreshUser]);

  const login = (token, userData) => {
    setAuth(token, userData);
    setUser(userData);
    refreshCart();
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    setCartCount(0);
  };

  const toggleFavorite = (id) => {
    const next = favorites.includes(id)
      ? favorites.filter((x) => x !== id)
      : [...favorites, id];
    setFavorites(next);
    writeList('favorites', next);
    toast.success(next.includes(id) ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد');
  };

  const isFavorite = (id) => favorites.includes(id);

  const toggleCompare = (id) => {
    if (compare.includes(id)) {
      const next = compare.filter((x) => x !== id);
      setCompare(next);
      writeList('compare', next);
      return;
    }
    if (compare.length >= 4) {
      toast.error('حداکثر ۴ محصول برای مقایسه');
      return;
    }
    const next = [...compare, id];
    setCompare(next);
    writeList('compare', next);
    toast.success('به مقایسه اضافه شد');
  };

  const clearCompare = () => {
    setCompare([]);
    writeList('compare', []);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      refreshUser,
      cartCount,
      setCartCount,
      refreshCart,
      favorites,
      toggleFavorite,
      isFavorite,
      compare,
      toggleCompare,
      clearCompare,
      theme,
      toggleTheme,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, cartCount, favorites, compare, theme],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => useContext(ShopContext);
