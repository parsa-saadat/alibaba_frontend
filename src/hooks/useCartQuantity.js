import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useShop } from '../contexts/ShopContext';
import { cartErrorMessage, getCartQuantity } from '../utils/helpers/cart';

/*
 * مدیریت تعداد یک محصول در سبد خرید.
 * منبع حقیقت Context است که خودش آینه‌ی بک‌اند است؛ این hook فقط
 * خوش‌بینانه UI را جلو می‌برد و تغییرات را با debounce ثبت می‌کند.
 */

const CART_SYNC_DELAY = 800;

export default function useCartQuantity(productId, { stock = null, soldOut = false } = {}) {
  const {
    cart,
    user,
    addToCart,
    setCartItemQuantity,
    removeCartItem,
    getCartQuantity: readCartQuantity,
  } = useShop();

  const id = productId ? String(productId) : '';
  const loggedIn = !!user?._id;

  const [qty, setQty] = useState(() => (cart ? getCartQuantity(cart, id) : 0));
  const [busy, setBusy] = useState(false);

  const qtyRef = useRef(qty); // آنچه کاربر می‌بیند
  const pendingRef = useRef(null); // هدفی که هنوز روی سرور ثبت نشده
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const commitRef = useRef(null);
  const idRef = useRef(id);

  qtyRef.current = qty;
  idRef.current = id;

  /* ---------- همگام‌سازی با Context ---------- */
  useEffect(() => {
    if (pendingRef.current !== null) return;
    const contextQty = getCartQuantity(cart, id);
    qtyRef.current = contextQty;
    setQty(contextQty);
  }, [cart, id]);

  /* ---------- ثبت تغییر روی سرور ---------- */
  const commit = useCallback(
    async (target) => {
      const productIdValue = idRef.current;
      if (!productIdValue) return;

      if (mountedRef.current) setBusy(true);
      try {
        if (target <= 0) {
          await removeCartItem(productIdValue);
        } else {
          const current = readCartQuantity(productIdValue);
          if (current <= 0) {
            /* محصول هنوز در سبد نیست؛ addToCart خودش اول از بک‌اند می‌پرسد */
            await addToCart(productIdValue, target);
            /* اگر درخواست‌ها با هم ادغام شده باشند، تعداد نهایی را ست می‌کنیم */
            const now = readCartQuantity(productIdValue);
            if (now > 0 && now !== target) await setCartItemQuantity(productIdValue, target);
          } else if (current !== target) {
            await setCartItemQuantity(productIdValue, target);
          }
        }
        pendingRef.current = null;
      } catch (error) {
        pendingRef.current = null;
        const fallback = readCartQuantity(productIdValue);
        qtyRef.current = fallback;
        if (mountedRef.current) {
          setQty(fallback);
          toast.error(cartErrorMessage(error, 'خطا در به‌روزرسانی سبد خرید'));
        }
      } finally {
        if (mountedRef.current) setBusy(false);
      }
    },
    [addToCart, readCartQuantity, removeCartItem, setCartItemQuantity],
  );
  commitRef.current = commit;

  const schedule = useCallback((target) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      commitRef.current?.(target);
    }, CART_SYNC_DELAY);
  }, []);

  /* ---------- ارسال تغییرات معوق هنگام خروج از صفحه ---------- */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        const target = pendingRef.current;
        if (target !== null) commitRef.current?.(target);
      }
    };
  }, []);

  /* ---------- اکشن‌ها ---------- */
  const increment = () => {
    if (!loggedIn) {
      toast.error('برای افزودن به سبد خرید ابتدا وارد شوید');
      return;
    }
    if (soldOut) return;
    if (stock !== null && qtyRef.current >= stock) return;

    const next = qtyRef.current + 1;
    qtyRef.current = next;
    pendingRef.current = next;
    setQty(next);

    /* اولین افزودن باید فوری باشد تا کاربر منتظر debounce نماند */
    if (next === 1) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      commitRef.current?.(next);
    } else {
      schedule(next);
    }
  };

  const decrement = () => {
    if (!loggedIn) return;
    if (qtyRef.current <= 0) return;

    const next = qtyRef.current - 1;
    qtyRef.current = next;
    pendingRef.current = next;
    setQty(next);

    if (next <= 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      commitRef.current?.(0);
    } else {
      schedule(next);
    }
  };

  const atMax = stock !== null && qty >= stock;

  return {
    qty,
    busy,
    increment,
    decrement,
    loggedIn,
    atMax,
    inCart: qty > 0,
  };
}
