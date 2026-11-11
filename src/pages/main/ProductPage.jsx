import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  GitCompareArrows,
  Heart,
  Loader2,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Store,
  Trash2,
  ZoomIn,
} from 'lucide-react';

import { useShop } from '../../contexts/ShopContext';
import {
  authHeaders,
  readList,
  writeList,
} from '../../utils/helpers/storage';
import { getBody, getList, getId } from '../../utils/helpers/response';
import {
  formatPrice,
  finalPrice,
  hasDiscount,
  toFa,
  formatDimensions,
  formatWeight,
  productImages,
  statusFa,
} from '../../utils/helpers/format';

import ProductGridComponent from '../../components/main/ProductGridComponent';
import StorageImageComponent from '../../components/main/StorageImageComponent';
import ImageLightboxComponent from '../../components/main/ImageLightboxComponent';
import MarkdownContentComponent from '../../components/main/MarkdownContentComponent';
import { Loading } from '../../components/ScroolToTopComponent';

const API =
  import.meta.env.VITE_APP_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

const accent = { color: 'var(--primary-color)' };
const CART_SYNC_DELAY = 1000;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function getStock(product) {
  if (!product || product.stock == null || product.stock === '') return null;
  const stock = Number(product.stock);
  return Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : null;
}

function getItemQuantity(item) {
  if (!item) return 0;
  const raw = item.quantity ?? item.qty ?? item.count;
  if (raw == null || raw === '') return 1;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 1;
}

function findInCart(cart, productId) {
  if (!cart || !productId) return null;
  const items = Array.isArray(cart)
    ? cart
    : cart.items || cart.products || cart.cart || [];
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
      return candidates.some(
        (c) => c != null && String(getId(c)) === String(productId),
      );
    }) || null
  );
}

/* ------------------------------------------------------------------ */
/* دکمه کپی لینک (هم‌اندازه با علاقه‌مندی و مقایسه)                    */
/* ------------------------------------------------------------------ */

function CopyUrlButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback برای مرورگرهای قدیمی
      const textarea = document.createElement('textarea');
      textarea.value = window.location.href;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        /* نادیده */
      }
      document.body.removeChild(textarea);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="btn-ghost !p-2"
      aria-label={copied ? 'لینک کپی شد' : 'کپی لینک محصول'}
      title={copied ? 'لینک کپی شد' : 'کپی لینک'}
    >
      {copied ? (
        <Check size={18} className="text-emerald-500" />
      ) : (
        <Copy size={18} />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* گالری محصول — نسبت ۱:۱ با تصویر Cover                              */
/* ------------------------------------------------------------------ */

function ProductGallery({ images, productName, discountPercentage, onZoom }) {
  const [activeImage, setActiveImage] = useState(0);
  const touchStartXRef = useRef(null);

  useEffect(() => {
    setActiveImage((current) =>
      images.length ? Math.min(current, images.length - 1) : 0,
    );
  }, [images.length]);

  const previous = () => {
    if (images.length > 1) {
      setActiveImage((current) => (current - 1 + images.length) % images.length);
    }
  };

  const next = () => {
    if (images.length > 1) {
      setActiveImage((current) => (current + 1) % images.length);
    }
  };

  const handleTouchStart = (event) => {
    touchStartXRef.current = event.changedTouches?.[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    if (touchStartXRef.current == null || images.length <= 1) return;
    const endX = event.changedTouches?.[0]?.clientX;
    if (endX == null) return;
    const delta = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (delta > 40) next();
    else if (delta < -40) previous();
  };

  const selectedImage = images[activeImage];

  return (
    <section className="min-w-0 space-y-3">
      <div
        className="group relative overflow-hidden rounded-2xl border border-theme bg-[var(--card2)]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 🔧 نسبت ۱:۱ (مربع) و حذف padding اضافی */}
        <div className="relative aspect-square w-full overflow-hidden">
          {images.length > 0 ? (
            <>
              {discountPercentage != null && (
                <span className="absolute right-3 top-3 z-20 rounded-full bg-rose-600/90 px-3 py-1 text-xs font-bold text-white">
                  {toFa(discountPercentage)}٪ تخفیف
                </span>
              )}

              {selectedImage && (
                <button
                  type="button"
                  onClick={() => onZoom({ file: selectedImage, alt: productName })}
                  aria-label="بزرگ‌نمایی تصویر محصول"
                  className="absolute left-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-theme bg-[var(--card)]/90 text-[var(--text-color)] backdrop-blur-sm transition hover:bg-[var(--card)]"
                >
                  <ZoomIn size={17} />
                </button>
              )}

              <div
                dir="rtl"
                className="flex h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
                style={{ transform: `translateX(${activeImage * 100}%)` }}
              >
                {images.map((image, index) => (
                  <div
                    key={getId(image) || index}
                    className="relative h-full w-full shrink-0 overflow-hidden"
                  >
                    {/* 🔧 object-cover برای پر کردن کامل کادر */}
                    <StorageImageComponent
                      file={image}
                      alt={`${productName}، تصویر ${toFa(index + 1)}`}
                      eager={index === 0 || index === activeImage}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      onZoom={(file, alt) => onZoom({ file, alt })}
                    />
                  </div>
                ))}
              </div>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={previous}
                    aria-label="تصویر قبلی"
                    className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-theme bg-[var(--card)]/85 backdrop-blur-sm transition hover:bg-[var(--card)]"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="تصویر بعدی"
                    className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-theme bg-[var(--card)]/85 backdrop-blur-sm transition hover:bg-[var(--card)]"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="absolute bottom-3 left-3 z-20 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                    {toFa(activeImage + 1)} از {toFa(images.length)}
                  </span>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 muted">
              <Package size={48} className="opacity-30" />
              <span className="text-sm">تصویری برای این محصول ثبت نشده است</span>
            </div>
          )}
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {images.map((image, index) => {
            const active = index === activeImage;
            return (
              <button
                key={getId(image) || index}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`نمایش تصویر ${toFa(index + 1)}`}
                aria-pressed={active}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-[var(--card2)] transition sm:h-20 sm:w-20 ${
                  active
                    ? 'border-[var(--primary-color)] opacity-100'
                    : 'border-theme opacity-65 hover:opacity-100'
                }`}
              >
                <StorageImageComponent
                  file={image}
                  alt={`${productName}، تصویر ${toFa(index + 1)}`}
                  compact
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* کنترل یکپارچه سبد خرید (− 0 +)                                      */
/* ------------------------------------------------------------------ */

function CartQtyControl({
  qty,
  busy,
  max,
  soldOut,
  onIncrement,
  onDecrement,
}) {
  const atMax = max !== null && qty >= max;
  const cannotIncrement = soldOut || atMax;
  const cannotDecrement = qty <= 0;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          {busy ? (
            <>
              <Loader2 size={14} className="animate-spin muted" />
              <span className="muted">در حال همگام‌سازی…</span>
            </>
          ) : qty > 0 ? (
            <>
              <CheckCircle2
                size={14}
                className="text-emerald-600 dark:text-emerald-400"
              />
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                موجود در سبد خرید شما
              </span>
            </>
          ) : soldOut ? (
            <span className="font-bold text-rose-500">این محصول ناموجود است</span>
          ) : (
            <span className="muted">تعداد در سبد خرید</span>
          )}
        </span>

        {max !== null && !soldOut && (
          <span className="text-[11px] muted">حداکثر: {toFa(max)} عدد</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-theme bg-[var(--card2)]/60 p-1.5">
        <button
          type="button"
          onClick={onDecrement}
          disabled={cannotDecrement}
          aria-label={qty === 1 ? 'حذف از سبد خرید' : 'کاهش تعداد'}
          className={`flex h-11 w-11 items-center justify-center rounded-lg border border-theme bg-[var(--card)] transition disabled:cursor-not-allowed disabled:opacity-35 ${
            qty === 1
              ? 'hover:border-rose-500/40 hover:text-rose-500'
              : 'hover:bg-[var(--card2)]'
          }`}
        >
          {qty === 1 ? <Trash2 size={17} /> : <Minus size={17} />}
        </button>

        <div className="min-w-0 flex-1 text-center">
          <span className="text-xl font-black tabular-nums">{toFa(qty)}</span>
        </div>

        <button
          type="button"
          onClick={onIncrement}
          disabled={cannotIncrement}
          aria-label={qty === 0 ? 'افزودن به سبد خرید' : 'افزایش تعداد'}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-900 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-35"
          style={{ background: 'var(--primary-color)' }}
        >
          <Plus size={18} />
        </button>
      </div>

      {qty > 0 && (
        <Link
          to="/cart"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-400"
        >
          <ShoppingCart size={14} />
          مشاهده سبد خرید
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* نوار پایین — فقط موبایل و تبلت                                      */
/* ------------------------------------------------------------------ */

function MobileBottomBar({
  product,
  cartQty,
  syncBusy,
  stock,
  soldOut,
  discounted,
  loggedIn,
  onIncrement,
  onDecrement,
}) {
  const atMax = stock !== null && cartQty >= stock;
  const cannotIncrement = soldOut || atMax;

  return (
    <div
      dir="rtl"
      className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-theme bg-[var(--card)]/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 pt-2.5">
        {/* قیمت */}
        <div className="min-w-0 flex-1">
          <div className="text-[10px] muted">قیمت محصول</div>
          <div className="flex items-baseline gap-2">
            <span className="truncate text-base font-black" style={accent}>
              {formatPrice(finalPrice(product))}
            </span>
            {discounted && (
              <span className="text-[10px] line-through muted">
                {formatPrice(product.price?.amount)}
              </span>
            )}
          </div>
        </div>

        {/* اکشن */}
        {cartQty === 0 ? (
          <button
            type="button"
            onClick={onIncrement}
            disabled={soldOut || !loggedIn}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: 'var(--primary-color)' }}
            aria-label="افزودن به سبد خرید"
          >
            <ShoppingCart size={16} />
            {soldOut ? 'ناموجود' : 'افزودن به سبد'}
          </button>
        ) : (
          <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-theme bg-[var(--card2)]/60 p-1">
            <button
              type="button"
              onClick={onDecrement}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border border-theme bg-[var(--card)] transition ${
                cartQty === 1
                  ? 'hover:border-rose-500/40 hover:text-rose-500'
                  : 'hover:bg-[var(--card2)]'
              }`}
              aria-label={cartQty === 1 ? 'حذف از سبد' : 'کاهش تعداد'}
            >
              {cartQty === 1 ? <Trash2 size={15} /> : <Minus size={15} />}
            </button>
            <div className="min-w-[2rem] text-center text-sm font-black tabular-nums">
              {syncBusy ? (
                <Loader2 size={14} className="mx-auto animate-spin muted" />
              ) : (
                toFa(cartQty)
              )}
            </div>
            <button
              type="button"
              onClick={onIncrement}
              disabled={cannotIncrement}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-900 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-35"
              style={{ background: 'var(--primary-color)' }}
              aria-label="افزایش تعداد"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* صفحه محصول                                                          */
/* ------------------------------------------------------------------ */

function ProductPage() {
  const { id, productId } = useParams();
  const activeProductId = id || productId;

  const {
    user,
    cart,
    toggleFavorite,
    isFavorite,
    toggleCompare,
    compare,
    refreshCart,
  } = useShop();

  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [category, setCategory] = useState(null);
  const [similar, setSimilar] = useState([]);

  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  const [zoomFile, setZoomFile] = useState(null);

  // --- وضعیت کنترل سبد خرید ---
  const [cartQty, setCartQty] = useState(0);
  const [syncBusy, setSyncBusy] = useState(false);

  const uiQtyRef = useRef(0);
  const serverQtyRef = useRef(0);
  const inFlightRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const sessionIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const deferredFlushRef = useRef(null);

  const activeProductIdRef = useRef(activeProductId);
  const userIdRef = useRef(user?._id);
  const refreshCartRef = useRef(refreshCart);

  activeProductIdRef.current = activeProductId;
  userIdRef.current = user?._id;
  refreshCartRef.current = refreshCart;

  const dispatchBackgroundSync = (userId, prodId, fromQty, toQty) => {
    if (!userId || !prodId || fromQty === toQty) return;

    const refreshSafe = () => {
      try {
        refreshCartRef.current?.()?.catch?.(() => {});
      } catch {
        /* نادیده */
      }
    };

    if (fromQty === 0 && toQty > 0) {
      axios
        .post(
          `${API}/user/${userId}/cart`,
          { product_id: prodId, quantity: toQty },
          authHeaders(),
        )
        .then(refreshSafe)
        .catch(() => {});
    } else if (fromQty > 0 && toQty <= 0) {
      axios
        .delete(`${API}/user/${userId}/cart/${prodId}`, authHeaders())
        .then(refreshSafe)
        .catch(() => {});
    } else if (fromQty > 0 && toQty > 0) {
      axios
        .put(
          `${API}/user/${userId}/cart/${prodId}`,
          { quantity: toQty },
          authHeaders(),
        )
        .then(refreshSafe)
        .catch(() => {});
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /* ---------- بارگذاری اطلاعات محصول ---------- */
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setProduct(null);
    setStore(null);
    setCategory(null);
    setSimilar([]);
    setError('');
    setLoading(true);
    setSimilarLoading(false);
    setZoomFile(null);

    if (!activeProductId) {
      setError('شناسه محصول مشخص نشده است.');
      setLoading(false);
      return () => controller.abort();
    }

    const loadProduct = async () => {
      try {
        const response = await axios.get(
          `${API}/product/${activeProductId}`,
          { signal, timeout: 15000 },
        );

        if (signal.aborted) return;

        if (response.data?.success === false) {
          throw new Error(response.data.message || 'محصول پیدا نشد.');
        }

        const current = getBody(response);
        if (!current) throw new Error('محصول پیدا نشد.');

        setProduct(current);

        try {
          const history = readList('history').filter(
            (item) => String(item) !== String(activeProductId),
          );
          writeList('history', [activeProductId, ...history].slice(0, 20));
        } catch {
          /* اختیاری */
        }

        const currentStoreId = getId(current.store_id);
        const currentCategoryId = getId(current.category_id);

        if (currentStoreId) {
          axios
            .get(`${API}/store/${currentStoreId}`, { signal, timeout: 15000 })
            .then((res) => {
              if (!signal.aborted) setStore(getBody(res));
            })
            .catch(() => {});
        }

        if (currentCategoryId) {
          axios
            .get(`${API}/category/${currentCategoryId}`, {
              signal,
              timeout: 15000,
            })
            .then((res) => {
              if (!signal.aborted) setCategory(getBody(res));
            })
            .catch(() => {});

          setSimilarLoading(true);
          axios
            .get(`${API}/product`, {
              params: { category_id: currentCategoryId, limit: 6, page: 1 },
              signal,
              timeout: 15000,
            })
            .then((res) => {
              if (signal.aborted) return;
              setSimilar(
                getList(res)
                  .filter(
                    (item) => String(getId(item)) !== String(activeProductId),
                  )
                  .slice(0, 4),
              );
            })
            .catch(() => {})
            .finally(() => {
              if (!signal.aborted) setSimilarLoading(false);
            });
        }
      } catch (err) {
        if (signal.aborted || axios.isCancel(err)) return;
        setError(
          err.response?.data?.message ||
            err.message ||
            'خطا در دریافت اطلاعات محصول.',
        );
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    loadProduct();
    return () => controller.abort();
  }, [activeProductId, retry]);

  /* ---------- ریست و ارسال تغییرات معوق هنگام تغییر محصول / خروج ---------- */
  useEffect(() => {
    const currentProductId = activeProductId;
    const currentUserId = user?._id;
    const currentSession = sessionIdRef.current + 1;
    sessionIdRef.current = currentSession;

    const initialQty = getItemQuantity(findInCart(cart, currentProductId));
    uiQtyRef.current = initialQty;
    serverQtyRef.current = initialQty;
    inFlightRef.current = false;
    deferredFlushRef.current = null;
    setCartQty(initialQty);
    setSyncBusy(false);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      const pendingTarget = uiQtyRef.current;
      const confirmedServer = serverQtyRef.current;

      if (!currentUserId || !currentProductId || pendingTarget === confirmedServer) {
        return;
      }

      if (inFlightRef.current) {
        deferredFlushRef.current = {
          session: currentSession,
          productId: currentProductId,
          userId: currentUserId,
          targetQty: pendingTarget,
        };
        return;
      }

      dispatchBackgroundSync(
        currentUserId,
        currentProductId,
        confirmedServer,
        pendingTarget,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProductId, user?._id]);

  /* ---------- همگام‌سازی خودکار با تغییرات Context ---------- */
  useEffect(() => {
    if (inFlightRef.current || debounceTimerRef.current) return;
    if (uiQtyRef.current !== serverQtyRef.current) return;

    const contextQty = getItemQuantity(findInCart(cart, activeProductId));
    if (contextQty !== serverQtyRef.current) {
      serverQtyRef.current = contextQty;
      uiQtyRef.current = contextQty;
      setCartQty(contextQty);
    }
  }, [cart, activeProductId]);

  /* ---------- موتور همگام‌سازی ترتیبی با سرور ---------- */

  const flushSync = async () => {
    if (inFlightRef.current) return;

    const targetUserId = userIdRef.current;
    const targetProductId = activeProductIdRef.current;
    const targetQty = uiQtyRef.current;
    const confirmedServerQty = serverQtyRef.current;

    if (!targetUserId || !targetProductId) return;
    if (targetQty === confirmedServerQty) return;

    const reqSession = sessionIdRef.current;
    inFlightRef.current = true;
    setSyncBusy(true);

    let mode = 'PUT';
    if (confirmedServerQty === 0 && targetQty > 0) {
      mode = 'POST';
    } else if (confirmedServerQty > 0 && targetQty <= 0) {
      mode = 'DELETE';
    }

    let succeeded = false;
    let confirmedQtyAfterRequest = confirmedServerQty;

    try {
      if (mode === 'POST') {
        const response = await axios.post(
          `${API}/user/${targetUserId}/cart`,
          { product_id: targetProductId, quantity: targetQty },
          authHeaders(),
        );
        if (response.data?.success === false) {
          throw new Error(
            response.data?.message || 'افزودن به سبد خرید ناموفق بود.',
          );
        }
        succeeded = true;
        confirmedQtyAfterRequest = targetQty;

        if (reqSession === sessionIdRef.current && isMountedRef.current) {
          serverQtyRef.current = targetQty;
        }
      } else if (mode === 'DELETE') {
        const response = await axios.delete(
          `${API}/user/${targetUserId}/cart/${targetProductId}`,
          authHeaders(),
        );
        if (response.data?.success === false) {
          throw new Error(
            response.data?.message || 'حذف محصول از سبد خرید ناموفق بود.',
          );
        }
        succeeded = true;
        confirmedQtyAfterRequest = 0;

        if (reqSession === sessionIdRef.current && isMountedRef.current) {
          serverQtyRef.current = 0;
        }
      } else {
        const response = await axios.put(
          `${API}/user/${targetUserId}/cart/${targetProductId}`,
          { quantity: targetQty },
          authHeaders(),
        );
        if (response.data?.success === false) {
          throw new Error(
            response.data?.message || 'به‌روزرسانی سبد خرید ناموفق بود.',
          );
        }
        succeeded = true;
        confirmedQtyAfterRequest = targetQty;

        if (reqSession === sessionIdRef.current && isMountedRef.current) {
          serverQtyRef.current = targetQty;
        }
      }

      try {
        await refreshCartRef.current?.();
      } catch {
        /* همگام‌سازی Context در پس‌زمینه */
      }
    } catch {
      // 🔧 بدون toast — فقط rollback سایلنت
      if (reqSession === sessionIdRef.current && isMountedRef.current) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        const revertedQty = serverQtyRef.current;
        uiQtyRef.current = revertedQty;
        setCartQty(revertedQty);
      }
    } finally {
      if (reqSession === sessionIdRef.current && isMountedRef.current) {
        inFlightRef.current = false;
        setSyncBusy(false);

        if (!debounceTimerRef.current && uiQtyRef.current !== serverQtyRef.current) {
          flushSync();
        }
      } else {
        const deferred = deferredFlushRef.current;
        if (
          succeeded &&
          deferred &&
          deferred.session === reqSession &&
          deferred.productId === targetProductId
        ) {
          deferredFlushRef.current = null;
          dispatchBackgroundSync(
            deferred.userId,
            deferred.productId,
            confirmedQtyAfterRequest,
            deferred.targetQty,
          );
        }
      }
    }
  };

  const schedulePutSync = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      flushSync();
    }, CART_SYNC_DELAY);
  };

  const incrementCart = () => {
    // 🔧 بدون toast — اگر لاگین نیست، فقط کار نمی‌کند
    if (!user?._id) return;

    const stockLimit = getStock(product);
    const isSoldOut =
      product?.stock_status === 'OUT_OF_STOCK' || stockLimit === 0;
    if (isSoldOut) return;

    const current = uiQtyRef.current;
    if (stockLimit !== null && current >= stockLimit) return;

    const nextQty = current + 1;
    uiQtyRef.current = nextQty;
    setCartQty(nextQty);

    if (serverQtyRef.current === 0 && !inFlightRef.current) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      flushSync();
    } else {
      schedulePutSync();
    }
  };

  const decrementCart = () => {
    if (!user?._id) return;

    const current = uiQtyRef.current;
    if (current <= 0) return;

    const nextQty = Math.max(0, current - 1);
    uiQtyRef.current = nextQty;
    setCartQty(nextQty);

    if (nextQty === 0) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      flushSync();
    } else {
      schedulePutSync();
    }
  };

  /* ---------- حالت‌های بارگذاری / خطا ---------- */

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8" aria-busy="true">
        <Loading label="در حال بارگذاری جزئیات محصول…" />
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="skeleton aspect-square rounded-2xl lg:col-span-6" />
          <div className="space-y-4 lg:col-span-6">
            <div className="skeleton h-8 w-3/4 rounded-xl" />
            <div className="skeleton h-20 rounded-xl" />
            <div className="skeleton h-52 rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="card space-y-4 rounded-2xl p-8">
          <Package size={36} className="mx-auto muted" />
          <h1 className="text-lg font-black">دریافت محصول ناموفق بود</h1>
          <p className="text-sm muted">{error || 'محصول موردنظر پیدا نشد.'}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="btn-yellow"
              onClick={() => setRetry((v) => v + 1)}
            >
              تلاش دوباره
            </button>
            <Link to="/products" className="btn-ghost">
              بازگشت به محصولات
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ---------- داده‌های محاسبه‌شده ---------- */

  const images = productImages(product) || [];
  const storeId = getId(product.store_id);
  const categoryId = getId(product.category_id);

  const stock = getStock(product);
  const soldOut = product.stock_status === 'OUT_OF_STOCK' || stock === 0;

  const discounted = hasDiscount(product);
  const favorite = isFavorite(activeProductId);
  const compared = compare?.includes(activeProductId);

  const stockLabel = soldOut
    ? 'ناموجود'
    : stock === null
      ? statusFa(product.stock_status) || 'وضعیت موجودی ثبت نشده'
      : `${toFa(stock)} عدد موجود در انبار`;

  const specs = [
    ['برند', product.brand || 'ثبت نشده'],
    ['سال تولید', product.production ? toFa(product.production) : 'ثبت نشده'],
    ['وضعیت موجودی', stockLabel],
    ['ابعاد', formatDimensions(product.dimensions) || 'ثبت نشده'],
    ['وزن', formatWeight(product.weight) || 'ثبت نشده'],
    [
      'گارانتی',
      product.warranty ? 'دارای گارانتی اصالت و سلامت' : 'بدون گارانتی',
    ],
    ['فروش رفته', `${toFa(product.sold_count ?? 0)} عدد`],
  ];

  /* ---------- رندر ---------- */

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-7xl px-4 pt-6 pb-24 md:pt-8 md:pb-24 lg:pb-8"
    >
      {/* مسیر صفحه */}
      <nav
        aria-label="مسیر صفحه"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-xs muted"
      >
        <Link to="/" className="hover:opacity-70">
          خانه
        </Link>
        <ChevronLeft size={14} />
        <Link to="/products" className="hover:opacity-70">
          محصولات
        </Link>
        {category && categoryId && (
          <>
            <ChevronLeft size={14} />
            <Link
              to={`/products?category_id=${encodeURIComponent(categoryId)}`}
              className="hover:opacity-70"
            >
              {category.name}
            </Link>
          </>
        )}
        <ChevronLeft size={14} />
        <span aria-current="page" className="font-bold text-[var(--text-color)]">
          {product.name}
        </span>
      </nav>

      {/* بخش اصلی */}
      <div className="grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
        {/* گالری */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:col-span-6">
          <ProductGallery
            key={activeProductId}
            images={images}
            productName={product.name}
            discountPercentage={discounted ? product.discount?.percentage : null}
            onZoom={setZoomFile}
          />
        </div>

        {/* اطلاعات محصول و خرید */}
        <div className="min-w-0 space-y-5 lg:col-span-6">
          {/* برچسب‌ها و اکشن‌های سریع */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {product.brand && (
                <span className="rounded-full border border-theme bg-[var(--card2)] px-3 py-1 font-bold">
                  {product.brand}
                </span>
              )}
              <span
                className={`rounded-full px-3 py-1 font-bold ${
                  soldOut
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {soldOut ? 'ناموجود' : 'موجود'}
              </span>
              {product.warranty && (
                <span className="rounded-full border border-theme px-3 py-1 font-medium muted">
                  گارانتی اصالت
                </span>
              )}
            </div>

            {/* 🔧 دکمه‌های اکشن هم‌اندازه — کپی لینک، علاقه‌مندی، مقایسه */}
            <div className="flex items-center gap-1">
              <CopyUrlButton />
              <button
                type="button"
                onClick={() => toggleFavorite(activeProductId)}
                className="btn-ghost !p-2"
                aria-label={
                  favorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'
                }
                aria-pressed={favorite}
              >
                <Heart
                  size={18}
                  fill={favorite ? '#ff4d6d' : 'none'}
                  color={favorite ? '#ff4d6d' : 'currentColor'}
                />
              </button>
              <button
                type="button"
                onClick={() => toggleCompare(activeProductId)}
                className="btn-ghost !p-2"
                aria-label={compared ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
                aria-pressed={!!compared}
              >
                <GitCompareArrows
                  size={18}
                  style={compared ? accent : undefined}
                />
              </button>
            </div>
          </div>

          {/* عنوان و معرفی کوتاه */}
          <div className="space-y-3">
            <h1 className="text-xl font-black leading-8 md:text-2xl md:leading-9">
              {product.name}
            </h1>
            {product.short_description && (
              <p className="whitespace-pre-line break-words text-sm leading-7 muted">
                {product.short_description}
              </p>
            )}
          </div>

          {/* کارت خرید */}
          <aside className="card space-y-4 rounded-2xl p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-theme pb-4">
              <div>
                <div className="text-xs muted">قیمت محصول</div>
                <div className="mt-1 text-2xl font-black" style={accent}>
                  {formatPrice(finalPrice(product))}
                </div>
              </div>

              {discounted && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="line-through muted">
                    {formatPrice(product.price?.amount)}
                  </span>
                  <span className="rounded-full bg-rose-500/10 px-2.5 py-1 font-bold text-rose-600 dark:text-rose-400">
                    {toFa(product.discount?.percentage)}٪ تخفیف
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2.5 text-xs">
              {store ? (
                <Link
                  to={`/store/${store._id || storeId}`}
                  className="flex items-center justify-between gap-2 py-0.5 transition hover:opacity-80"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Store size={15} style={accent} />
                    <span className="muted">فروشنده:</span>
                    <span className="truncate font-bold text-[var(--text-color)]">
                      {store.name}
                    </span>
                  </span>
                  <ArrowLeft size={14} className="shrink-0 muted" />
                </Link>
              ) : (
                <div className="flex items-center gap-2 muted">
                  <Store size={15} />
                  <span>اطلاعات فروشنده در دسترس نیست.</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <ShieldCheck size={15} style={accent} />
                <span>
                  {product.warranty
                    ? 'گارانتی اصالت و سلامت فیزیکی کالا'
                    : 'بدون گارانتی'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ShoppingCart size={15} style={accent} />
                <span
                  className={`font-bold ${
                    soldOut
                      ? 'text-rose-500'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {stockLabel}
                </span>
              </div>
            </div>

            <div className="border-t border-theme pt-4">
              <CartQtyControl
                qty={cartQty}
                busy={syncBusy}
                max={stock}
                soldOut={soldOut}
                onIncrement={incrementCart}
                onDecrement={decrementCart}
              />
            </div>
          </aside>

          {/* مشخصات کلیدی */}
          <section aria-label="خلاصه مشخصات">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-theme bg-[var(--border-color)]">
              {[
                ['وزن', formatWeight(product.weight) || 'ثبت نشده'],
                ['ابعاد', formatDimensions(product.dimensions) || 'ثبت نشده'],
                [
                  'سال تولید',
                  product.production ? toFa(product.production) : 'ثبت نشده',
                ],
                ['برند', product.brand || 'ثبت نشده'],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 bg-[var(--card)] p-3.5">
                  <div className="text-[11px] muted">{label}</div>
                  <div className="mt-1 break-words text-sm font-bold">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <a
              href="#product-description"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold hover:opacity-80"
              style={accent}
            >
              مشاهده توضیحات و مشخصات کامل
              <ArrowLeft size={14} />
            </a>
          </section>
        </div>
      </div>

      {/* توضیحات و مشخصات فنی */}
      <div
        id="product-description"
        className="mt-8 grid scroll-mt-24 gap-6 lg:grid-cols-12 lg:items-start"
      >
        {/* توضیحات */}
        <section className="card min-w-0 rounded-2xl p-5 md:p-7 lg:col-span-8">
          <div className="mb-5 border-b border-theme pb-4">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <span
                className="h-5 w-1 rounded-full"
                style={{ background: 'var(--primary-color)' }}
              />
              معرفی و توضیحات محصول
            </h2>
            <p className="mt-1 text-xs muted">
              جزئیات و اطلاعات تکمیلی محصول
            </p>
          </div>

          {typeof product.description === 'string' &&
          product.description.trim() ? (
            <div
              className="
                min-w-0 break-words text-right leading-8

                [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-black
                [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-black
                [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-bold
                [&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:text-base [&_h4]:font-bold

                [&_p]:my-3 [&_p]:leading-8
                [&_strong]:font-black [&_em]:italic
                [&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-6
                [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-6
                [&_li]:my-1

                [&_blockquote]:my-4 [&_blockquote]:rounded-xl
                [&_blockquote]:border-s-4 [&_blockquote]:border-s-[var(--primary-color)]
                [&_blockquote]:bg-black/5 [&_blockquote]:p-4

                [&_a]:text-[var(--primary-color)] [&_a]:underline
                [&_a]:underline-offset-4

                [&_pre]:my-4 [&_pre]:overflow-x-auto
                [&_pre]:rounded-xl [&_pre]:bg-black/10 [&_pre]:p-4
                [&_pre]:text-left
                [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1
                [&_code]:font-mono [&_code]:text-sm

                [&_img]:my-4 [&_img]:block [&_img]:h-auto
                [&_img]:w-full [&_img]:max-w-full [&_img]:rounded-xl
                [&_video]:my-4 [&_video]:block [&_video]:h-auto
                [&_video]:w-full [&_video]:rounded-xl
                [&_iframe]:my-4 [&_iframe]:aspect-video
                [&_iframe]:w-full [&_iframe]:rounded-xl

                [&_table]:my-4 [&_table]:block [&_table]:max-w-full
                [&_table]:overflow-x-auto [&_table]:border-collapse
                [&_th]:min-w-[90px] [&_th]:border
                [&_th]:border-gray-500/30 [&_th]:bg-black/5
                [&_th]:p-3 [&_th]:text-right [&_th]:font-bold
                [&_td]:min-w-[90px] [&_td]:border
                [&_td]:border-gray-500/30 [&_td]:p-3
                [&_td]:text-right
              "
            >
              <MarkdownContentComponent content={product.description} />
            </div>
          ) : (
            <p className="text-sm muted">
              توضیحاتی برای این محصول ثبت نشده است.
            </p>
          )}

          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2 border-t border-theme pt-5">
              {product.tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="chip !cursor-default text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ستون کنار: قیمت + سبد + مشخصات فنی (چسبان در دسکتاپ) */}
        <div className="hidden min-w-0 space-y-4 lg:col-span-4 lg:sticky lg:top-36 lg:block lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overscroll-contain lg:pe-1">
          {/* جعبه قیمت + افزودن به سبد خرید */}
          <aside className="card space-y-3 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs muted">قیمت محصول</div>
                <div className="mt-1 text-2xl font-black" style={accent}>
                  {formatPrice(finalPrice(product))}
                </div>
              </div>

              {discounted && (
                <div className="flex flex-col items-end gap-1 text-xs">
                  <span className="line-through muted">
                    {formatPrice(product.price?.amount)}
                  </span>
                  <span className="rounded-full bg-rose-500/10 px-2.5 py-1 font-bold text-rose-600 dark:text-rose-400">
                    {toFa(product.discount?.percentage)}٪ تخفیف
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-theme pt-3">
              <CartQtyControl
                qty={cartQty}
                busy={syncBusy}
                max={stock}
                soldOut={soldOut}
                onIncrement={incrementCart}
                onDecrement={decrementCart}
              />
            </div>
          </aside>

          {/* مشخصات فنی */}
          <section className="card rounded-2xl p-5">
            <h2 className="flex items-center gap-2 border-b border-theme pb-4 text-lg font-black">
              <span
                className="h-5 w-1 rounded-full"
                style={{ background: 'var(--primary-color)' }}
              />
              مشخصات فنی
            </h2>

            <dl className="mt-2">
              {specs.map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 border-b border-theme py-3 text-sm last:border-0"
                >
                  <dt className="muted">{label}</dt>
                  <dd className="text-left font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* مشخصات فنی (فقط موبایل و تبلت) */}
        <section className="card rounded-2xl p-5 lg:hidden">
          <h2 className="flex items-center gap-2 border-b border-theme pb-4 text-lg font-black">
            <span
              className="h-5 w-1 rounded-full"
              style={{ background: 'var(--primary-color)' }}
            />
            مشخصات فنی
          </h2>

          <dl className="mt-2">
            {specs.map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 border-b border-theme py-3 text-sm last:border-0"
              >
                <dt className="muted">{label}</dt>
                <dd className="text-left font-bold">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* محصولات مشابه */}
      {(similarLoading || similar.length > 0) && (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <span
                className="h-5 w-1 rounded-full"
                style={{ background: 'var(--primary-color)' }}
              />
              محصولات مشابه
            </h2>
            {categoryId && (
              <Link
                to={`/products?category_id=${encodeURIComponent(categoryId)}`}
                className="inline-flex items-center gap-1 text-xs font-bold"
                style={accent}
              >
                مشاهده همه
                <ArrowLeft size={15} />
              </Link>
            )}
          </div>

          <ProductGridComponent
            products={similar}
            loading={similarLoading}
            columns={4}
            skeletonCount={4}
          />
        </section>
      )}

      {/* نوار پایین — فقط موبایل و تبلت */}
      <MobileBottomBar
        product={product}
        cartQty={cartQty}
        syncBusy={syncBusy}
        stock={stock}
        soldOut={soldOut}
        discounted={discounted}
        loggedIn={!!user?._id}
        onIncrement={incrementCart}
        onDecrement={decrementCart}
      />

      <ImageLightboxComponent
        file={zoomFile?.file}
        alt={zoomFile?.alt}
        onClose={() => setZoomFile(null)}
      />
    </main>
  );
}

export default ProductPage;