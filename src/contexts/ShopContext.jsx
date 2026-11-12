import axios from 'axios';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import {
  cartCountOf,
  cartErrorMessage,
  findInCart,
  getCartQuantity,
  getCartRows,
  getItemQuantity,
  removeCartRow,
  upsertCartRow,
} from '../utils/helpers/cart';
import { setupMockBackendFallback } from '../utils/helpers/mockBackend';
import { API } from '../config/api';

setupMockBackendFallback();

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
  /* سبد خرید: منبع واحد حقیقت، همیشه آینه‌ی بک‌اند */
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartReady, setCartReady] = useState(false);
  const [favorites, setFavorites] = useState(readList('favorites'));
  const [compare, setCompare] = useState(readList('compare'));
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  const cartRef = useRef([]);
  const userRef = useRef(user);
  /* قفل به ازای هر محصول تا کلیک‌های پشت‌سرهم درخواست تکراری به بک‌اند نفرستند */
  const pendingRef = useRef(new Map());

  userRef.current = user;
  cartRef.current = cart;

  const cartCount = useMemo(() => cartCountOf(cart), [cart]);

  /* ---------- تم ---------- */
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    root.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  /* ---------- کاربر ---------- */
  const applyCart = useCallback((next) => {
    const rows = getCartRows(next);
    cartRef.current = rows;
    setCart(rows);
    return rows;
  }, []);

  const currentUser = useCallback(() => {
    const stored = getUser();
    return stored?._id ? stored : userRef.current;
  }, []);

  /* ---------- سبد خرید ---------- */

  /* خواندن سبد کامل کاربر از بک‌اند */
  const refreshCart = useCallback(async () => {
    const u = currentUser();
    if (!getToken() || !u?._id) {
      applyCart([]);
      setCartReady(true);
      return [];
    }
    setCartLoading(true);
    try {
      const res = await axios.get(`${API}/user/${u._id}/cart`, {
        params: { limit: 100 },
        ...authHeaders(),
      });
      if (res.data?.success === false) throw new Error(res.data?.message);
      return applyCart(res.data?.body?.data ?? res.data?.body ?? []);
    } catch {
      /* سبد قبلی حفظ می‌شود؛ نوار بالای صفحه صفر نمی‌شود */
      return cartRef.current;
    } finally {
      setCartLoading(false);
      setCartReady(true);
    }
  }, [applyCart, currentUser]);

  /*
   * بررسی تک‌محصول در سبد از روی بک‌اند.
   * اگر محصول در سبد نباشد بک‌اند 404 برمی‌گرداند و این‌جا null می‌شود.
   */
  const fetchCartItem = useCallback(
    async (productId) => {
      const u = currentUser();
      if (!getToken() || !u?._id || !productId) return null;
      try {
        const res = await axios.get(
          `${API}/user/${u._id}/cart/${productId}`,
          authHeaders(),
        );
        if (res.data?.success === false) return null;
        const body = res.data?.body;
        return body && typeof body === 'object' ? body : null;
      } catch (error) {
        if (error?.response?.status === 404) return null;
        return null;
      }
    },
    [currentUser],
  );

  const isInCart = useCallback((productId) => !!findInCart(cartRef.current, productId), []);

  const getCartItem = useCallback((productId) => findInCart(cartRef.current, productId), []);

  const getCartItemQuantity = useCallback(
    (productId) => getCartQuantity(cartRef.current, productId),
    [],
  );

  /* افزودن به سبد: اول از بک‌اند می‌پرسیم، بعد POST یا PUT می‌زنیم */
  const addToCart = useCallback(
    (productId, quantity = 1) => {
      const u = currentUser();
      if (!getToken() || !u?._id) {
        const error = new Error('برای افزودن به سبد خرید ابتدا وارد شوید');
        error.cause = { code: 401 };
        return Promise.reject(error);
      }
      const id = String(productId || '');
      if (!id) return Promise.reject(new Error('شناسه محصول نامعتبر است'));

      const running = pendingRef.current.get(id);
      if (running) return running;

      const amount = Math.max(1, Math.floor(Number(quantity) || 1));

      const task = (async () => {
        /* ۱) وضعیت فعلی محصول در سبد، از بک‌اند */
        const current = await fetchCartItem(id);
        const currentQty = getItemQuantity(current);

        /* ۲) اگر از قبل در سبد بود → فقط تعداد را زیاد می‌کنیم */
        if (currentQty > 0) {
          const nextQty = currentQty + amount;
          const res = await axios.put(
            `${API}/user/${u._id}/cart/${id}`,
            { quantity: nextQty },
            authHeaders(),
          );
          if (res.data?.success === false) throw new Error(res.data?.message);
          applyCart(upsertCartRow(cartRef.current, { ...current, product_id: id, quantity: nextQty }));
          refreshCart();
          return { status: 'updated', quantity: nextQty };
        }

        /* ۳) محصول جدید است → POST */
        try {
          const res = await axios.post(
            `${API}/user/${u._id}/cart`,
            { product_id: id, quantity: amount },
            authHeaders(),
          );
          if (res.data?.success === false) throw new Error(res.data?.message);
          const created = res.data?.body;
          applyCart(
            upsertCartRow(cartRef.current, {
              ...(created?._id ? created : {}),
              product_id: id,
              quantity: amount,
            }),
          );
          refreshCart();
          return { status: 'created', quantity: amount };
        } catch (error) {
          /* اگر هم‌زمان در جای دیگری اضافه شده بود، به‌جای خطا تعداد را ست می‌کنیم */
          if (/already exists/i.test(error?.message || '')) {
            const again = await fetchCartItem(id);
            const againQty = getItemQuantity(again) + amount;
            const res = await axios.put(
              `${API}/user/${u._id}/cart/${id}`,
              { quantity: againQty },
              authHeaders(),
            );
            if (res.data?.success === false) throw new Error(res.data?.message);
            applyCart(
              upsertCartRow(cartRef.current, { ...again, product_id: id, quantity: againQty }),
            );
            refreshCart();
            return { status: 'updated', quantity: againQty };
          }
          throw error;
        }
      })()
        .catch((error) => {
          const wrapped = new Error(cartErrorMessage(error));
          wrapped.cause = error;
          throw wrapped;
        })
        .finally(() => {
          pendingRef.current.delete(id);
        });

      pendingRef.current.set(id, task);
      return task;
    },
    [applyCart, currentUser, fetchCartItem, refreshCart],
  );

  const removeCartItem = useCallback(
    async (productId) => {
      const u = currentUser();
      const id = String(productId || '');
      if (!getToken() || !u?._id) throw new Error('برای حذف از سبد خرید ابتدا وارد شوید');

      /* اگر از قبل در سبد نیست، خطا نده و فقط استیت را تمیز کن */
      if (!isInCart(id)) {
        applyCart(removeCartRow(cartRef.current, id));
        return { status: 'removed' };
      }

      try {
        const res = await axios.delete(
          `${API}/user/${u._id}/cart/${id}`,
          authHeaders(),
        );
        if (res.data?.success === false && res.data?.status !== 404) {
          throw new Error(res.data?.message);
        }
      } catch (error) {
        /* 404 یعنی همین حالا حذف شده است؛ بقیه‌ی خطاها باید بالا بروند */
        if (error?.response?.status !== 404) {
          throw new Error(cartErrorMessage(error));
        }
      }

      applyCart(removeCartRow(cartRef.current, id));
      refreshCart();
      return { status: 'removed' };
    },
    [applyCart, currentUser, isInCart, refreshCart],
  );

  /* تعیین تعداد یک محصول در سبد (۰ = حذف) */
  const setCartItemQuantity = useCallback(
    async (productId, quantity) => {
      const u = currentUser();
      if (!getToken() || !u?._id) throw new Error('برای ویرایش سبد خرید ابتدا وارد شوید');

      const id = String(productId || '');
      const next = Math.floor(Number(quantity) || 0);

      if (next <= 0) return removeCartItem(id);

      if (!isInCart(id)) return addToCart(id, next);

      const res = await axios.put(
        `${API}/user/${u._id}/cart/${id}`,
        { quantity: next },
        authHeaders(),
      );
      if (res.data?.success === false) {
        const error = new Error(cartErrorMessage({ message: res.data?.message }));
        throw error;
      }
      applyCart(upsertCartRow(cartRef.current, { product_id: id, quantity: next }));
      refreshCart();
      return { status: 'updated', quantity: next };
    },
    [addToCart, applyCart, currentUser, isInCart, refreshCart],
  );

  /* ---------- پروفایل ---------- */
  const refreshUser = useCallback(async () => {
    const u = getUser();
    if (!getToken() || !u?._id) return;
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
    cartRef.current = [];
    setCart([]);
    refreshCart();
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    applyCart([]);
  };

  /* ---------- علاقه‌مندی و مقایسه ---------- */
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
      /* سبد */
      cart,
      cartCount,
      cartLoading,
      cartReady,
      refreshCart,
      fetchCartItem,
      isInCart,
      getCartItem,
      getCartQuantity: getCartItemQuantity,
      addToCart,
      setCartItemQuantity,
      removeCartItem,
      /* بقیه */
      favorites,
      toggleFavorite,
      isFavorite,
      compare,
      toggleCompare,
      clearCompare,
      theme,
      setTheme,
      toggleTheme,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      user,
      cart,
      cartCount,
      cartLoading,
      cartReady,
      favorites,
      compare,
      theme,
      refreshCart,
      fetchCartItem,
      isInCart,
      getCartItem,
      getCartItemQuantity,
      addToCart,
      setCartItemQuantity,
      removeCartItem,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => useContext(ShopContext);
