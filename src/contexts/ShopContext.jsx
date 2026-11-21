import { t as translateText } from '../i18n/runtime.js';
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
import { API } from '../config/api';

/*
 * دسترسی امن به حافظه‌ی مرورگر؛ در آی‌فریم sandbox یا حالت ناشناس، خواندن
 * localStorage استثنا می‌دهد. این‌جا اگر مرورگر اجازه نداد، از حافظه‌ی رم
 * استفاده می‌کنیم تا اپ سفید نشود. (بدون ایمپورت تازه؛ وابستگی اضافه نمی‌خواهد)
 */
const memoryStore = new Map();
const storeGet = (key) => {
  try {
    const value = window.localStorage.getItem(key);
    return value ?? memoryStore.get(key) ?? null;
  } catch {
    return memoryStore.get(key) ?? null;
  }
};
const storeSet = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    memoryStore.set(key, value);
  }
};

/* بررسی دوره‌ای توکن با سرور: هر ۶ ساعت */
const SESSION_CHECK_MS = 6 * 60 * 60 * 1000;
const LAST_CHECK_KEY = 'session_checked_at';

/* خواندن بخش payload توکن JWT (بدون اعتبارسنجی؛ فقط برای مقایسه‌ی نقش) */
const decodeJwt = (token) => {
  try {
    const part = String(token || '').split('.')[1];
    if (!part) return null;
    const json = decodeURIComponent(
      atob(part.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const ShopContext = createContext(null);

export const ShopProvider = ({ children }) => {
  /*
   * کاربر فقط از نشست واقعی خوانده می‌شود (بدون ورود خودکار با اکانت تست).
   * اگر از نسخه‌های قبلی یک نشست آزمایشی در مرورگر مانده باشد، پاک می‌شود.
   */
  const [user, setUser] = useState(() => {
    const token = getToken();
    if (typeof token === 'string' && token.startsWith('demo-jwt-token')) {
      clearAuth();
      return null;
    }
    const stored = getUser();
    const claims = decodeJwt(token);
    return claims?._id && String(claims._id) === String(stored?._id) ? stored : null;
  });
  /* سبد خرید: منبع واحد حقیقت، همیشه آینه‌ی بک‌اند */
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartReady, setCartReady] = useState(false);
  /* تا وقتی نشست ذخیره‌شده با بک‌اند بررسی نشده، اپ صفحه‌ی لودینگ نشان می‌دهد (نه خطا) */
  const [authReady, setAuthReady] = useState(() => !getToken());
  const [favorites, setFavorites] = useState(readList('favorites'));
  const [compare, setCompare] = useState(readList('compare'));
  const [theme, setTheme] = useState(() => storeGet('theme') || 'light');

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
    storeSet('theme', theme);
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
    const claims = decodeJwt(getToken());
    if (claims?._id && String(stored?._id) !== String(claims._id)) return { _id: claims._id };
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
        const res = await axios.get(`${API}/user/${u._id}/cart/${productId}`, authHeaders());
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
        const error = new Error(translateText('برای افزودن به سبد خرید ابتدا وارد شوید'));
        error.cause = { code: 401 };
        return Promise.reject(error);
      }
      const id = String(productId || '');
      if (!id) return Promise.reject(new Error(translateText('شناسه محصول نامعتبر است')));

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
          applyCart(
            upsertCartRow(cartRef.current, { ...current, product_id: id, quantity: nextQty }),
          );
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
      if (!getToken() || !u?._id)
        throw new Error(translateText('برای حذف از سبد خرید ابتدا وارد شوید'));

      /* اگر از قبل در سبد نیست، خطا نده و فقط استیت را تمیز کن */
      if (!isInCart(id)) {
        applyCart(removeCartRow(cartRef.current, id));
        return { status: 'removed' };
      }

      try {
        const res = await axios.delete(`${API}/user/${u._id}/cart/${id}`, authHeaders());
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
      if (!getToken() || !u?._id)
        throw new Error(translateText('برای ویرایش سبد خرید ابتدا وارد شوید'));

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

  /*
   * همگام‌سازی نشست با سرور (GET /auth/session):
   *  - توکن را در سرور بررسی می‌کند؛ اگر منقضی/نامعتبر یا کاربر حذف شده بود، خروج می‌دهد.
   *  - توکن و پروفایل تازه (نقش، is_seller، تأیید فروشندگی) را جایگزین می‌کند؛
   *    پس فروشنده‌ی تازه‌تأییدشده بدون خروج و ورود دوباره کار می‌کند.
   */
  const syncSession = useCallback(async () => {
    if (!getToken()) return false;
    try {
      const res = await axios.get(`${API}/auth/session`, { ...authHeaders(), timeout: 12000 });
      const body = res.data?.body;
      if (res.data?.success && body?.token && body?.user) {
        setAuth(body.token, body.user);
        storeSet(LAST_CHECK_KEY, String(Date.now()));
        setUser(body.user);
        return true;
      }
      return false;
    } catch (err) {
      const code = err?.response?.status;
      if (code === 401 || code === 403) {
        clearAuth();
        setUser(null);
        cartRef.current = [];
        setCart([]);
        toast.info(translateText('نشست شما منقضی شده است؛ دوباره وارد شوید'));
      }
      /* خطای شبکه: نشست دست‌نخورده می‌ماند و بار بعد دوباره امتحان می‌شود */
      return false;
    }
  }, []);

  /* ---------- پروفایل ---------- */
  const refreshUser = useCallback(async () => {
    try {
      if (getToken()) await syncSession();
    } finally {
      setAuthReady(true);
    }
  }, [syncSession]);

  useEffect(() => {
    refreshUser().then(() => refreshCart());
  }, [refreshCart, refreshUser]);

  /* چک ۶ ساعته‌ی توکن: با تایمر، و هنگام برگشت به تب اگر ۶ ساعت گذشته باشد */
  useEffect(() => {
    const due = () => {
      const last = Number(storeGet(LAST_CHECK_KEY)) || 0;
      return Date.now() - last >= SESSION_CHECK_MS;
    };
    const check = () => {
      if (getToken() && due()) syncSession();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    check();
    const timer = window.setInterval(check, 15 * 60 * 1000);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [syncSession]);

  const login = (token, userData) => {
    setAuth(token, userData);
    storeSet(LAST_CHECK_KEY, String(Date.now()));
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
    const next = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id];
    setFavorites(next);
    writeList('favorites', next);
    toast.success(
      next.includes(id)
        ? translateText('به علاقه‌مندی‌ها اضافه شد')
        : translateText('از علاقه‌مندی‌ها حذف شد'),
    );
  };

  const isFavorite = (id) => favorites.includes(id);

  /* پاک کردن یک‌جای لیست علاقه‌مندی‌ها (یک بار نوشتن، بدون حلقه روی toggleFavorite) */
  const clearFavorites = () => {
    if (!favorites.length) return;
    setFavorites([]);
    writeList('favorites', []);
    toast.success(translateText('لیست علاقه‌مندی‌ها پاک شد'));
  };

  const toggleCompare = (id) => {
    if (compare.includes(id)) {
      const next = compare.filter((x) => x !== id);
      setCompare(next);
      writeList('compare', next);
      return;
    }
    if (compare.length >= 4) {
      toast.error(translateText('حداکثر ۴ محصول برای مقایسه'));
      return;
    }
    const next = [...compare, id];
    setCompare(next);
    writeList('compare', next);
    toast.success(translateText('به مقایسه اضافه شد'));
  };

  const clearCompare = () => {
    setCompare([]);
    writeList('compare', []);
  };

  const value = useMemo(
    () => ({
      user,
      authReady,
      login,
      logout,
      refreshUser,
      syncSession,
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
      clearFavorites,
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
      authReady,
      cart,
      cartCount,
      cartLoading,
      cartReady,
      favorites,
      compare,
      theme,
      syncSession,
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
