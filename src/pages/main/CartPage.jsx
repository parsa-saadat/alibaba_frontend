import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Check,
  CreditCard,
  LoaderCircle,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  Truck,
} from 'lucide-react';

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
import { finalPrice, formatPrice, hasDiscount, toFa } from '../../utils/helpers/format';

const SYNC_DELAY_MS = 900;

/* مراحل خرید — فعلاً فقط مرحله‌ی اول در این صفحه است */
const STEPS = [
  { label: 'سبد خرید', icon: ShoppingCart, active: true },
  { label: 'اطلاعات ارسال', icon: Truck },
  { label: 'پرداخت', icon: CreditCard },
];

function StepsStrip() {
  return (
    <ol className="card mb-4 flex items-center justify-between gap-1 rounded-2xl px-2 py-2.5 sm:px-4">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        return (
          <li key={step.label} className="flex flex-1 items-center gap-2">
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-black"
              style={{
                background: step.active ? 'var(--primary-color)' : 'var(--card2)',
                color: step.active ? 'var(--navy)' : 'var(--muted)',
                border: step.active ? 'none' : '1px solid var(--border)',
              }}
            >
              <Icon size={13} />
            </span>
            <span
              className="truncate text-[11px] font-bold"
              style={{ color: step.active ? 'var(--text)' : 'var(--muted)' }}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className="mx-1 hidden h-px flex-1 sm:block"
                style={{ background: 'var(--border)' }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* صفحه‌ی سبد خرید: ردیف‌ها از Context (هم‌گام با بک‌اند) و جزئیات از API محصول */
function CartPage() {
  const navigate = useNavigate();
  const { user, cart, cartReady, setCartItemQuantity, removeCartItem } = useShop();

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
          .get(`${API}/product/${id}`, { timeout: 15000 })
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
    const timer = setTimeout(
      () => setSyncState((state) => (state === 'saved' ? 'idle' : state)),
      1600,
    );
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
      <div className="mx-auto max-w-lg px-3 py-16 sm:px-4">
        <div className="card rounded-3xl p-10 text-center">
          <span
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: 'color-mix(in srgb, var(--primary-color) 16%, transparent)' }}
          >
            <ShoppingCart size={28} style={{ color: 'var(--accent-text)' }} />
          </span>
          <h1 className="mt-4 text-base font-black">برای دیدن سبد خرید وارد شوید</h1>
          <p className="mt-2 text-xs leading-6 muted">
            سبد خرید به حساب شما گره خورده است تا از هر دستگاهی در دسترس باشد.
          </p>
          <Link to="/auth/pre" className="btn-yellow mt-5 inline-flex items-center gap-2">
            ورود به حساب
            <ArrowLeft size={15} />
          </Link>
        </div>
      </div>
    );
  }

  if (!cartReady || (detailsLoading && items.length === 0)) {
    return (
      <div className="mx-auto max-w-5xl px-3 py-20">
        <Loading label="در حال بارگذاری سبد خرید…" />
      </div>
    );
  }

  const discountTotal = items.reduce((sum, item) => {
    if (!hasDiscount(item.product)) return sum;
    const original = Number(item.product.price?.amount) || 0;
    return sum + Math.max(0, original - finalPrice(item.product)) * item.quantity;
  }, 0);

  const subtotal = items.reduce(
    (sum, item) => sum + finalPrice(item.product) * item.quantity,
    0,
  );
  const visibleItems = items.filter((item) => !removing[item.productId]);
  const pieceCount = visibleItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl px-3 py-5 sm:px-4 sm:py-6">
      <StepsStrip />

      {visibleItems.length === 0 ? (
        <div className="card rounded-3xl p-8 text-center sm:p-12">
          <span
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: 'color-mix(in srgb, var(--primary-color) 14%, transparent)' }}
          >
            <ShoppingCart size={28} style={{ color: 'var(--accent-text)' }} />
          </span>
          <h1 className="mt-4 text-base font-black">سبد خرید شما خالی است</h1>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-6 muted">
            کالاهای مورد علاقه‌تان را به سبد اضافه کنید تا همین‌جا جمع‌بندی شوند.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Link to="/products" className="btn-yellow inline-flex items-center gap-2">
              <Sparkles size={16} />
              شروع خرید
            </Link>
            <Link to="/favorites" className="btn-ghost inline-flex items-center gap-2">
              علاقه‌مندی‌ها
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* ───── هدر ───── */}
          <header className="card mb-3 flex flex-col gap-2 !rounded-2xl p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex items-center gap-2.5">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                style={{ background: 'color-mix(in srgb, var(--primary-color) 16%, transparent)' }}
              >
                <ShoppingCart size={17} style={{ color: 'var(--accent-text)' }} />
              </span>
              <div className="min-w-0">
                <h1 className="flex items-center gap-2 text-base font-black sm:text-lg">
                  سبد خرید
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-black"
                    style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
                  >
                    {toFa(visibleItems.length)} کالا · {toFa(pieceCount)} عدد
                  </span>
                </h1>
                <p className="mt-0.5 text-[11px] muted">
                  تعداد را تغییر دهید؛ تغییرات خودکار در حساب‌تان ذخیره می‌شود.
                </p>
              </div>
            </div>

            <CartSyncBadge state={syncState} />
          </header>

          <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-2.5">
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

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-theme px-3 py-2.5 text-[11px] muted">
                <span className="inline-flex items-center gap-1.5">
                  <Check size={13} style={{ color: '#17994f' }} />
                  قیمت‌ها نهایی و شامل تخفیف هستند
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <PackageCheck size={13} style={{ color: '#17994f' }} />
                  موجودی در لحظه‌ی ثبت سفارش کنترل می‌شود
                </span>
              </div>
            </div>

            <CartSummaryComponent
              subtotal={subtotal}
              itemCount={visibleItems.length}
              discount={discountTotal}
              busy={syncState === 'saving'}
              onCheckout={goToCheckout}
            />
          </div>

          {/* نوار پایین موبایل */}
          <div
            className="fixed inset-x-0 bottom-0 z-40 border-t px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2.5 lg:hidden"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
              <div className="leading-tight">
                <div className="text-[10px] muted">مبلغ قابل پرداخت</div>
                <div className="text-base font-black" style={{ color: 'var(--accent-text)' }}>
                  {formatPrice(subtotal)}
                </div>
              </div>
              <button
                type="button"
                onClick={goToCheckout}
                disabled={syncState === 'saving'}
                className="btn-yellow inline-flex h-11 items-center gap-2 !py-0 disabled:opacity-50"
              >
                {syncState === 'saving' ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <ArrowLeft size={16} />
                )}
                ادامه‌ی خرید
              </button>
            </div>
          </div>
          {/* فاصله برای نوار ثابت موبایل */}
          <div className="h-16 lg:hidden" aria-hidden="true" />
        </>
      )}
    </div>
  );
}

export default CartPage;
