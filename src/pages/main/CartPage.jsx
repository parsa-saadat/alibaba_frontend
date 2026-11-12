import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShoppingCart } from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import CartLineItemComponent from '../../components/cart/CartLineItemComponent';
import CartSummaryComponent, {
  CartSyncBadge,
} from '../../components/cart/CartSummaryComponent';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { API } from '../../config/api';
import {
  cartErrorMessage,
  getCartRows,
  productIdOfCartRow,
} from '../../utils/helpers/cart';
import { finalPrice, toFa } from '../../utils/helpers/format';

const SYNC_DELAY_MS = 900;

/*
 * صفحه سبد خرید.
 * ردیف‌های سبد از Context می‌آیند (که خودش با بک‌اند هم‌گام است) و
 * جزئیات محصولات فقط برای نمایش از بک‌اند خوانده می‌شود.
 */
function CartPage() {
  const navigate = useNavigate();
  const {
    user,
    cart,
    cartReady,
    setCartItemQuantity,
    removeCartItem,
  } = useShop();

  const [products, setProducts] = useState({}); // productId → محصول
  const [qtys, setQtys] = useState({}); // تغییرات در انتظار ثبت
  const [removing, setRemoving] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [syncState, setSyncState] = useState('idle');

  const fetchedRef = useRef(new Set());
  const timersRef = useRef({});
  const pendingRef = useRef({});

  const rows = useMemo(() => getCartRows(cart), [cart]);

  /* ---------- دریافت جزئیات محصولات سبد ---------- */
  useEffect(() => {
    const missing = rows
      .map((row) => productIdOfCartRow(row))
      .filter((id) => id && !fetchedRef.current.has(id));

    if (!missing.length) {
      setDetailsLoading(false);
      return undefined;
    }

    let cancelled = false;
    missing.forEach((id) => fetchedRef.current.add(id));
    setDetailsLoading(true);

    Promise.all(
      missing.map((id) =>
        axios
          .get(`${API}/product/${id}`)
          .then((res) => [id, res.data?.body ?? null])
          .catch(() => [id, null]),
      ),
    )
      .then((pairs) => {
        if (cancelled) return;
        setProducts((prev) => {
          const next = { ...prev };
          pairs.forEach(([id, product]) => {
            if (product) next[id] = product;
          });
          return next;
        });
      })
      .finally(() => {
        if (!cancelled) setDetailsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rows]);

  /* ---------- پاک کردن تغییرات معوق وقتی سرور تأیید کرد ---------- */
  useEffect(() => {
    setQtys((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.entries(prev).forEach(([productId, quantity]) => {
        const row = rows.find((item) => productIdOfCartRow(item) === productId);
        if (!row || Number(row.quantity) === Number(quantity)) {
          delete next[productId];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [rows]);

  /* ---------- ثبت تغییرات با debounce ---------- */
  const flush = useCallback(
    async (productId) => {
      const pending = pendingRef.current[productId];
      if (!pending) return;
      delete pendingRef.current[productId];
      delete timersRef.current[productId];

      setSyncState('saving');
      try {
        if (pending.type === 'remove') await removeCartItem(productId);
        else await setCartItemQuantity(productId, pending.quantity);
        setSyncState(Object.keys(pendingRef.current).length ? 'pending' : 'saved');
      } catch (error) {
        toast.error(cartErrorMessage(error, 'خطا در همگام‌سازی سبد خرید'));
        setSyncState('idle');
        setQtys((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
      }
    },
    [removeCartItem, setCartItemQuantity],
  );

  const schedule = useCallback(
    (productId, payload) => {
      pendingRef.current[productId] = payload;
      setSyncState('pending');
      if (timersRef.current[productId]) clearTimeout(timersRef.current[productId]);
      timersRef.current[productId] = setTimeout(() => {
        flush(productId);
      }, SYNC_DELAY_MS);
    },
    [flush],
  );

  /* پاک‌سازی تایمرها هنگام خروج */
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (syncState !== 'saved') return undefined;
    const timer = setTimeout(() => setSyncState((state) => (state === 'saved' ? 'idle' : state)), 1600);
    return () => clearTimeout(timer);
  }, [syncState]);

  /* ---------- اکشن‌ها ---------- */
  const items = useMemo(
    () =>
      rows
        .map((row) => {
          const productId = productIdOfCartRow(row);
          const product = products[productId];
          const quantity = qtys[productId] ?? Number(row.quantity || 0);
          return product ? { row, productId, product, quantity } : null;
        })
        .filter(Boolean),
    [rows, products, qtys],
  );

  const changeQuantity = (productId, nextQuantity) => {
    if (nextQuantity < 1) return;

    const product = products[productId];
    const stock =
      product?.stock == null || product?.stock === '' ? null : Number(product.stock);
    if (stock !== null && Number.isFinite(stock) && nextQuantity > stock) {
      toast.warn(`حداکثر موجودی این کالا ${toFa(stock)} عدد است`);
      return;
    }

    setQtys((prev) => ({ ...prev, [productId]: nextQuantity }));
    schedule(productId, { type: 'update', quantity: nextQuantity });
  };

  const remove = (productId) => {
    setRemoving((prev) => ({ ...prev, [productId]: true }));
    setQtys((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    schedule(productId, { type: 'remove' });
  };

  const goToCheckout = async () => {
    const productIds = Object.keys(pendingRef.current);
    if (productIds.length > 0) {
      productIds.forEach((id) => {
        if (timersRef.current[id]) {
          clearTimeout(timersRef.current[id]);
          timersRef.current[id] = null;
        }
      });
      await Promise.all(productIds.map((id) => flush(id)));
    }
    navigate('/checkout');
  };

  /* ---------- حالت‌ها ---------- */
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center card rounded-3xl p-12 mt-6">
        <ShoppingCart size={40} className="mx-auto mb-3 muted" />
        <p className="muted mb-4">برای مشاهده سبد خرید وارد شوید</p>
        <Link to="/auth/pre" className="btn-yellow">
          ورود
        </Link>
      </div>
    );
  }

  if (!cartReady || (detailsLoading && items.length === 0)) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20">
        <Loading label="در حال بارگذاری سبد خرید…" />
      </div>
    );
  }

  const subtotal = items.reduce(
    (sum, item) => sum + finalPrice(item.product) * item.quantity,
    0,
  );
  const visibleItems = items.filter((item) => !removing[item.productId]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <h1 className="font-black text-2xl">سبد خرید ({toFa(visibleItems.length)})</h1>
        <CartSyncBadge state={syncState} />
      </div>

      {visibleItems.length === 0 ? (
        <div className="card rounded-3xl p-12 text-center">
          <ShoppingCart size={40} className="mx-auto mb-3 muted" />
          <div className="font-black">سبد خرید خالی است</div>
          <Link to="/products" className="btn-yellow inline-block mt-4">
            شروع خرید
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
          <div className="space-y-3">
            {visibleItems.map(({ productId, product, quantity }) => (
              <CartLineItemComponent
                key={productId}
                product={product}
                quantity={quantity}
                busy={syncState === 'saving' && !!pendingRef.current[productId]}
                onChangeQuantity={(next) => changeQuantity(productId, next)}
                onRemove={() => remove(productId)}
              />
            ))}
          </div>

          <CartSummaryComponent
            subtotal={subtotal}
            itemCount={visibleItems.length}
            busy={syncState === 'saving'}
            onCheckout={goToCheckout}
          />
        </div>
      )}
    </div>
  );
}

export default CartPage;
