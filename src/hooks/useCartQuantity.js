import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useShop } from '../contexts/ShopContext';
import { authHeaders } from '../utils/helpers/storage';
import { getId } from '../utils/helpers/response';

const API =
  import.meta.env.VITE_APP_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

const CART_SYNC_DELAY = 1000;

/* ---------- helperهای سبد (همان ProductPage) ---------- */

export function getItemQuantity(item) {
  if (!item) return 0;
  const raw = item.quantity ?? item.qty ?? item.count;
  if (raw == null || raw === '') return 1;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 1;
}

export function findInCart(cart, productId) {
  if (!cart || !productId) return null;
  const items = Array.isArray(cart) ? cart : cart.items || cart.products || cart.cart || [];
  if (!Array.isArray(items)) return null;

  return (
    items.find((item) => {
      if (!item) return false;
      const candidates = [
        item.product_id,
        item.productId,
        item.product?._id,
        item.product?.id,
        item.product,
        item._id,
        item.id,
      ];
      return candidates.some((c) => c != null && String(getId(c)) === String(productId));
    }) || null
  );
}

async function sendCartChange(userId, productId, from, to) {
  let res;
  if (from === 0 && to > 0) {
    res = await axios.post(
      `${API}/user/${userId}/cart`,
      { product_id: productId, quantity: to },
      authHeaders(),
    );
  } else if (from > 0 && to <= 0) {
    res = await axios.delete(`${API}/user/${userId}/cart/${productId}`, authHeaders());
  } else {
    res = await axios.put(
      `${API}/user/${userId}/cart/${productId}`,
      { quantity: to },
      authHeaders(),
    );
  }
  if (res.data?.success === false) {
    throw new Error(res.data?.message || 'خطا در به‌روزرسانی سبد خرید');
  }
}

/* ---------- hook اصلی ---------- */

export default function useCartQuantity(productId, { stock = null, soldOut = false } = {}) {
  const { user, cart, refreshCart } = useShop();

  const [qty, setQty] = useState(() => getItemQuantity(findInCart(cart, productId)));
  const [busy, setBusy] = useState(false);

  const uiQtyRef = useRef(qty); // آنچه کاربر می‌بیند
  const serverQtyRef = useRef(qty); // آنچه سرور تأیید کرده
  const inFlightRef = useRef(false);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const flushRef = useRef(null);
  const userIdRef = useRef(user?._id);
  const refreshCartRef = useRef(refreshCart);

  userIdRef.current = user?._id;
  refreshCartRef.current = refreshCart;

  /* ارسال ترتیبی به سرور */
  const flush = async () => {
    if (inFlightRef.current) return;

    const userId = userIdRef.current;
    const target = uiQtyRef.current;
    const confirmed = serverQtyRef.current;

    if (!userId || !productId || target === confirmed) return;

    inFlightRef.current = true;
    if (mountedRef.current) setBusy(true);

    try {
      await sendCartChange(userId, productId, confirmed, target);
      serverQtyRef.current = target;
      try {
        await refreshCartRef.current?.();
      } catch {
        /* همگام‌سازی Context در پس‌زمینه */
      }
    } catch {
      // بدون toast: برگشت سایلنت به مقدار تأییدشده
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      uiQtyRef.current = serverQtyRef.current;
      if (mountedRef.current) setQty(serverQtyRef.current);
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setBusy(false);

      // تغییراتی که وسط درخواست انجام شده
      if (!timerRef.current && uiQtyRef.current !== serverQtyRef.current) {
        flushRef.current?.();
      }
    }
  };
  flushRef.current = flush;

  const schedule = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      flushRef.current?.();
    }, CART_SYNC_DELAY);
  };

  /* هنگام خروج: تغییرات معوق در پس‌زمینه ارسال می‌شود */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      flushRef.current?.();
    };
  }, []);

  /* همگام‌سازی با تغییرات Context (مثلاً بعد از لود سبد یا تغییر از جای دیگر) */
  useEffect(() => {
    if (inFlightRef.current || timerRef.current) return;
    if (uiQtyRef.current !== serverQtyRef.current) return;

    const ctxQty = getItemQuantity(findInCart(cart, productId));
    if (ctxQty !== serverQtyRef.current) {
      serverQtyRef.current = ctxQty;
      uiQtyRef.current = ctxQty;
      setQty(ctxQty);
    }
  }, [cart, productId]);

  const increment = () => {
    if (!userIdRef.current || soldOut) return;
    const current = uiQtyRef.current;
    if (stock !== null && current >= stock) return;

    const next = current + 1;
    uiQtyRef.current = next;
    setQty(next);

    if (serverQtyRef.current === 0 && !inFlightRef.current) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      flush();
    } else {
      schedule();
    }
  };

  const decrement = () => {
    if (!userIdRef.current) return;
    const current = uiQtyRef.current;
    if (current <= 0) return;

    const next = current - 1;
    uiQtyRef.current = next;
    setQty(next);

    if (next === 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      flush();
    } else {
      schedule();
    }
  };

  return {
    qty,
    busy,
    increment,
    decrement,
    loggedIn: !!user?._id,
    atMax: stock !== null && qty >= stock,
  };
}