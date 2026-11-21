import { direction as i18nDirection } from '../../i18n/runtime';
import { t as translateText } from '../../i18n/runtime.js';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  GitCompareArrows,
  Heart,
  Layers,
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
import useCartQuantity from '../../hooks/useCartQuantity';
import { readList, writeList } from '../../utils/helpers/storage';
import { isTrustedProduct, isTrustedStore } from '../../utils/helpers/user';
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
  formatProductionYear,
} from '../../utils/helpers/format';

import ProductScrollerComponent from '../../components/product/ProductScrollerComponent';
import RecentlyViewedComponent from '../../components/product/RecentlyViewedComponent';
import { fetchCategories, descendantIds } from '../../utils/helpers/categories';
import {
  SellerStoreCard,
  StoreContactModal,
  TrustBadge,
} from '../../components/store/StoreInfoComponent';
import CartQtyControl from '../../components/cart/CartQtyControlComponent';
import StorageImageComponent from '../../components/common/StorageImageComponent';
import ImageLightboxComponent from '../../components/common/ImageLightboxComponent';
import MarkdownContentComponent from '../../components/common/MarkdownContentComponent';
import ErrorBoundaryComponent from '../../components/common/ErrorBoundaryComponent';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { fetchStore, fetchPublicUser, primeSeller } from '../../services/sellerApi';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

const accent = { color: 'var(--primary-color)' };

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function getStock(product) {
  if (!product || product.stock == null || product.stock === '') return null;
  const stock = Number(product.stock);
  return Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : null;
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
      aria-label={copied ? translateText('لینک کپی شد') : translateText('کپی لینک محصول')}
      title={copied ? translateText('لینک کپی شد') : translateText('کپی لینک')}
    >
      {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
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
    setActiveImage((current) => (images.length ? Math.min(current, images.length - 1) : 0));
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
    if (delta * (i18nDirection === 'rtl' ? 1 : -1) > 40) next();
    else if (delta * (i18nDirection === 'rtl' ? 1 : -1) < -40) previous();
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
                <span className="absolute end-3 top-3 z-20 rounded-full bg-rose-600/90 px-3 py-1 text-xs font-bold text-white">
                  {toFa(discountPercentage)}
                  {translateText('٪ تخفیف ')}
                </span>
              )}

              {selectedImage && (
                <button
                  type="button"
                  onClick={() => onZoom({ file: selectedImage, alt: productName })}
                  aria-label={translateText('بزرگ‌نمایی تصویر محصول')}
                  className="absolute start-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-theme bg-[var(--card)]/90 text-[var(--text-color)] backdrop-blur-sm transition hover:bg-[var(--card)]"
                >
                  <ZoomIn size={17} />
                </button>
              )}

              <div
                dir={i18nDirection}
                data-testid="product-gallery-track"
                className="flex h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
                style={{
                  transform: `translateX(${activeImage * (i18nDirection === 'rtl' ? 100 : -100)}%)`,
                }}
              >
                {images.map((image, index) => (
                  <div
                    key={getId(image) || index}
                    className="relative h-full w-full shrink-0 overflow-hidden"
                  >
                    {/* 🔧 object-cover برای پر کردن کامل کادر */}
                    <StorageImageComponent
                      file={image}
                      alt={translateText('{{v0}}، تصویر {{v1}}', {
                        v0: productName,
                        v1: toFa(index + 1),
                      })}
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
                    aria-label={translateText('تصویر قبلی')}
                    className="absolute start-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-theme bg-[var(--card)]/85 backdrop-blur-sm transition hover:bg-[var(--card)]"
                  >
                    <ChevronRight className="logical-icon" size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label={translateText('تصویر بعدی')}
                    className="absolute end-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-theme bg-[var(--card)]/85 backdrop-blur-sm transition hover:bg-[var(--card)]"
                  >
                    <ChevronLeft className="logical-icon" size={18} />
                  </button>
                  <span className="absolute bottom-3 start-3 z-20 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                    {toFa(activeImage + 1)}
                    {translateText(' از ')}
                    {toFa(images.length)}
                  </span>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 muted">
              <Package size={48} className="opacity-30" />
              <span className="text-sm">{translateText('تصویری برای این محصول ثبت نشده است')}</span>
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
                aria-label={translateText('نمایش تصویر {{v0}}', { v0: toFa(index + 1) })}
                aria-pressed={active}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-[var(--card2)] transition sm:h-20 sm:w-20 ${
                  active
                    ? 'border-[var(--primary-color)] opacity-100'
                    : 'border-theme opacity-65 hover:opacity-100'
                }`}
              >
                <StorageImageComponent
                  file={image}
                  alt={translateText('{{v0}}، تصویر {{v1}}', {
                    v0: productName,
                    v1: toFa(index + 1),
                  })}
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
      dir={i18nDirection}
      className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-theme bg-[var(--card)]/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 pt-2.5">
        {/* قیمت */}
        <div className="min-w-0 flex-1">
          <div className="text-[10px] muted">{translateText('قیمت محصول')}</div>
          <div className="flex items-baseline gap-2">
            <span className="truncate text-base font-black" style={accent}>
              {formatPrice(finalPrice(product), product.price?.currency)}
            </span>
            {discounted && (
              <span className="text-[10px] line-through muted">
                {formatPrice(product.price?.amount, product.price?.currency)}
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
            aria-label={translateText('افزودن به سبد خرید')}
          >
            <ShoppingCart size={16} />
            {soldOut ? translateText('ناموجود') : translateText('افزودن به سبد')}
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
              aria-label={cartQty === 1 ? translateText('حذف از سبد') : translateText('کاهش تعداد')}
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
              aria-label={translateText('افزایش تعداد')}
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

  const { toggleFavorite, isFavorite, toggleCompare, compare } = useShop();

  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [owner, setOwner] = useState(null); // صاحب فروشگاه (برای وضعیت اعتماد و اطلاعات تماس)
  const [category, setCategory] = useState(null);
  const [similar, setSimilar] = useState([]);

  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  const [zoomFile, setZoomFile] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);

  /* ---------- بارگذاری اطلاعات محصول ---------- */
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setProduct(null);
    setStore(null);
    setOwner(null);
    setContactOpen(false);
    setCategory(null);
    setSimilar([]);
    setError('');
    setLoading(true);
    setSimilarLoading(false);
    setZoomFile(null);

    if (!activeProductId) {
      setError(translateText('شناسه محصول مشخص نشده است.'));
      setLoading(false);
      return () => controller.abort();
    }

    const loadProduct = async () => {
      try {
        const response = await axios.get(`${API}/product/${activeProductId}`, {
          signal,
          timeout: 15000,
        });

        if (signal.aborted) return;

        if (response.data?.success === false) {
          throw new Error(response.data.message || translateText('محصول پیدا نشد.'));
        }

        const current = getBody(response);
        if (!current) throw new Error(translateText('محصول پیدا نشد.'));

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

        /* شناسه‌ی فروشنده، مستقل از فروشگاه (برای وقتی /store پاسخ نمی‌دهد) */
        const currentSellerId = getId(current.seller_id);

        /*
         * صاحب فروشگاه از روت عمومی کاربر خوانده می‌شود:
         * seller_trust (اعتماد)، seller_active_status (فعال/غیرفعال)،
         * firstname/lastname (نام و نام خانوادگی فروشنده).
         */
        const loadOwner = (ownerId) => {
          if (!ownerId) return;
          fetchPublicUser(ownerId)
            .then((value) => {
              if (!signal.aborted) setOwner(value);
            })
            .catch(() => {
              if (!signal.aborted) setOwner(null);
            });
        };

        if (currentStoreId) {
          fetchStore(currentStoreId)
            .then((value) => {
              if (signal.aborted) return;
              const currentStore = value || null;
              setStore(currentStore);

              /* store.user می‌تواند رشته یا آبجکت پرشده باشد */
              loadOwner(
                getId(currentStore?.user) ||
                  currentStore?.user_id ||
                  getId(currentStore?.owner) ||
                  currentSellerId,
              );
            })
            .catch(() => {
              /* فروشگاه در دسترس نبود → حداقل اطلاعات فروشنده را بگیر */
              if (!signal.aborted) loadOwner(currentSellerId);
            });
        } else {
          loadOwner(currentSellerId);
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

          /*
           * «محصولات مرتبط» فقط از همین دسته‌بندی (و زیردسته‌هایش).
           * بک‌اند پارامتر category_id را فیلتر می‌کند، ولی برای اطمینان خودمان هم
           * دوباره روی پاسخ فیلتر می‌زنیم؛ قبلاً کارت‌هایی از دسته‌های دیگر هم
           * می‌آمد. تعداد از ۴ به ۱۲ رسید و نمایش افقی/اسکرولی شد.
           */
          setSimilarLoading(true);
          Promise.all([
            axios.get(`${API}/product`, {
              params: { category_id: currentCategoryId, limit: 24, page: 1 },
              signal,
              timeout: 15000,
            }),
            fetchCategories(signal).catch(() => []),
          ])
            .then(([res, categories]) => {
              if (signal.aborted) return;

              const allowed = new Set([
                String(currentCategoryId),
                ...descendantIds(categories, currentCategoryId),
              ]);

              const matched = getList(res).filter((item) => {
                if (String(getId(item)) === String(activeProductId)) return false;
                const catId = getId(item.category_id);
                return Boolean(catId) && allowed.has(String(catId));
              });

              setSimilar(matched.slice(0, 12));
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
            translateText('خطا در دریافت اطلاعات محصول.'),
        );
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    loadProduct();
    return () => controller.abort();
  }, [activeProductId, retry]);

  /* ---------- سبد خرید (منبع واحد: Context + بک‌اند) ---------- */
  const stock = getStock(product);
  const soldOut = !!product && (product.stock_status === 'OUT_OF_STOCK' || stock === 0);

  const {
    qty: cartQty,
    busy: syncBusy,
    increment: incrementCart,
    decrement: decrementCart,
    loggedIn,
  } = useCartQuantity(activeProductId, { stock, soldOut });

  /* ---------- حالت‌های بارگذاری / خطا ---------- */

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8" aria-busy="true">
        <Loading label={translateText('در حال بارگذاری جزئیات محصول…')} />
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
          <h1 dir="auto" className="text-lg font-black">
            {translateText('دریافت محصول ناموفق بود')}
          </h1>
          <p className="text-sm muted">{error || translateText('محصول موردنظر پیدا نشد.')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-primary" onClick={() => setRetry((v) => v + 1)}>
              {translateText('تلاش دوباره ')}
            </button>
            <Link to="/products" className="btn-ghost">
              {translateText('بازگشت به محصولات ')}
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

  /* فروشنده‌ی تأییدشده: از فروشگاه/صاحب فروشگاه و در نهایت از خود محصول */
  const sellerTrusted = isTrustedStore(store, owner) || isTrustedProduct(product);

  const discounted = hasDiscount(product);
  const favorite = isFavorite(activeProductId);
  const compared = compare?.includes(activeProductId);

  const stockLabel = soldOut
    ? translateText('ناموجود')
    : stock === null
      ? statusFa(product.stock_status) || translateText('وضعیت موجودی ثبت نشده')
      : translateText('{{v0}} عدد موجود در انبار', { v0: toFa(stock) });

  const specs = [
    [translateText('برند'), product.brand || translateText('ثبت نشده')],
    [translateText('سال تولید'), formatProductionYear(product.production)],
    [translateText('وضعیت موجودی'), stockLabel],
    [translateText('ابعاد'), formatDimensions(product.dimensions) || translateText('ثبت نشده')],
    [translateText('وزن'), formatWeight(product.weight) || translateText('ثبت نشده')],
    [
      translateText('گارانتی'),
      product.warranty
        ? translateText('b2b.warrantySeller')
        : translateText('b2b.noWarrantySeller'),
    ],
  ];

  /* ---------- رندر ---------- */

  return (
    <main
      dir={i18nDirection}
      className="mx-auto max-w-7xl px-4 pt-6 pb-24 md:pt-8 md:pb-24 lg:pb-12"
    >
      {/* مسیر صفحه */}
      <nav
        aria-label={translateText('مسیر صفحه')}
        className="mb-6 flex flex-wrap items-center gap-1.5 text-xs muted"
      >
        <Link to="/" className="hover:opacity-70">
          {translateText('خانه ')}
        </Link>
        <ChevronLeft className="logical-icon" size={14} />
        <Link to="/products" className="hover:opacity-70">
          {translateText('محصولات ')}
        </Link>
        {category && categoryId && (
          <>
            <ChevronLeft className="logical-icon" size={14} />
            <Link
              to={`/products?category_id=${encodeURIComponent(categoryId)}`}
              className="hover:opacity-70"
            >
              {category.name}
            </Link>
          </>
        )}
        <ChevronLeft className="logical-icon" size={14} />
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
                {soldOut ? translateText('ناموجود') : translateText('موجود')}
              </span>
              {product.warranty && (
                <span className="rounded-full border border-theme px-3 py-1 font-medium muted">
                  {translateText('b2b.warrantySeller')}
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
                  favorite
                    ? translateText('حذف از علاقه‌مندی‌ها')
                    : translateText('افزودن به علاقه‌مندی‌ها')
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
                aria-label={
                  compared ? translateText('حذف از مقایسه') : translateText('افزودن به مقایسه')
                }
                aria-pressed={!!compared}
              >
                <GitCompareArrows size={18} style={compared ? accent : undefined} />
              </button>
            </div>
          </div>

          {/* عنوان و معرفی کوتاه */}
          <div className="space-y-3">
            <h1 dir="auto" className="text-xl font-black leading-8 md:text-2xl md:leading-9">
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
                <div className="text-xs muted">{translateText('قیمت محصول')}</div>
                <div className="mt-1 text-2xl font-black" style={accent}>
                  {formatPrice(finalPrice(product), product.price?.currency)}
                </div>
              </div>

              {discounted && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="line-through muted">
                    {formatPrice(product.price?.amount, product.price?.currency)}
                  </span>
                  <span className="rounded-full bg-rose-500/10 px-2.5 py-1 font-bold text-rose-600 dark:text-rose-400">
                    {toFa(product.discount?.percentage)}
                    {translateText('٪ تخفیف ')}
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
                    <span className="muted">{translateText('فروشنده:')}</span>
                    <span className="truncate font-bold text-[var(--text-color)]">
                      {store.name}
                    </span>
                    <TrustBadge trusted={sellerTrusted} />
                  </span>
                  <ArrowLeft size={14} className="shrink-0 muted" />
                </Link>
              ) : (
                <div className="flex items-center gap-2 muted">
                  <Store size={15} />
                  <span>{translateText('اطلاعات فروشنده در دسترس نیست.')}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <ShieldCheck size={15} style={accent} />
                <span>
                  {product.warranty
                    ? translateText('b2b.warrantySeller')
                    : translateText('b2b.noWarrantySeller')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ShoppingCart size={15} style={accent} />
                <span
                  className={`font-bold ${
                    soldOut ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
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
          <section aria-label={translateText('خلاصه مشخصات')}>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-theme bg-[var(--border-color)]">
              {[
                [translateText('وزن'), formatWeight(product.weight) || translateText('ثبت نشده')],
                [
                  translateText('ابعاد'),
                  formatDimensions(product.dimensions) || translateText('ثبت نشده'),
                ],
                [translateText('سال تولید'), formatProductionYear(product.production)],
                [translateText('برند'), product.brand || translateText('ثبت نشده')],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 bg-[var(--card)] p-3.5">
                  <div className="text-[11px] muted">{label}</div>
                  <div className="mt-1 break-words text-sm font-bold">{value}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* فروشگاه فروشنده — با کلیک، پاپ‌آپ اطلاعات تماس باز می‌شود */}
      <div className="mt-6 lg:mt-8">
        <SellerStoreCard
          store={store}
          owner={owner}
          product={product}
          onOpenContact={() => setContactOpen(true)}
        />
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
              {translateText('معرفی و توضیحات محصول ')}
            </h2>
            <p className="mt-1 text-xs muted">{translateText('جزئیات و اطلاعات تکمیلی محصول ')}</p>
          </div>

          {typeof product.description === 'string' && product.description.trim() ? (
            <div
              className="
                min-w-0 break-words text-start leading-8

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
                [&_th]:p-3 [&_th]:text-start [&_th]:font-bold
                [&_td]:min-w-[90px] [&_td]:border
                [&_td]:border-gray-500/30 [&_td]:p-3
                [&_td]:text-start
              "
            >
              <ErrorBoundaryComponent
                resetKey={activeProductId}
                fallback={
                  <pre dir="auto" className="whitespace-pre-wrap font-sans text-sm leading-7">
                    {String(product.description || '')}
                  </pre>
                }
              >
                <MarkdownContentComponent content={product.description} />
              </ErrorBoundaryComponent>
            </div>
          ) : (
            <p className="text-sm muted">
              {translateText('توضیحاتی برای این محصول ثبت نشده است. ')}
            </p>
          )}

          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2 border-t border-theme pt-5">
              {product.tags.map((tag, index) => (
                <Link
                  key={`${tag}-${index}`}
                  to={`/products?tags=${encodeURIComponent(tag)}`}
                  className="chip text-xs transition hover:-translate-y-0.5"
                  title={translateText('همه‌ی کالاهای با برچسب «{{v0}}»', { v0: tag })}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ستون کنار: مشخصات فنی (چسبان در دسکتاپ) — جعبه قیمت و سبد
            فقط یک‌بار در بالای صفحه رندر می‌شد، نسخه تکراری حذف شد */}
        <div className="hidden min-w-0 space-y-4 lg:col-span-4 lg:sticky lg:top-36 lg:block lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overscroll-contain lg:pe-1">
          {/*
            جعبه‌ی اقدام، زیر کارت «مشخصات فنی» و داخل همان ستون چسبان است؛
            پس با اسکرول کاربر پایین می‌آید و هیچ نواری به پایین صفحه نمی‌چسبد.
          */}
          <section className="card rounded-2xl p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <span className="block text-[10px] muted">{translateText('قیمت محصول')}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black" style={accent}>
                    {formatPrice(finalPrice(product), product.price?.currency)}
                  </span>
                  {discounted && (
                    <span className="text-[11px] line-through muted">
                      {formatPrice(product.price?.amount, product.price?.currency)}
                    </span>
                  )}
                </div>
              </div>
              {stock !== null && (
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{ background: 'var(--card2)' }}
                >
                  {soldOut
                    ? translateText('ناموجود')
                    : translateText('{{v0}} عدد', { v0: toFa(stock) })}
                </span>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {cartQty === 0 ? (
                <button
                  type="button"
                  onClick={incrementCart}
                  disabled={soldOut || !loggedIn}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: 'var(--primary-color)' }}
                >
                  <ShoppingCart size={16} />
                  {soldOut ? translateText('ناموجود') : translateText('افزودن به سبد خرید')}
                </button>
              ) : (
                <div className="flex items-center justify-between gap-1.5 rounded-xl border border-theme bg-[var(--card2)]/60 p-1">
                  <button
                    type="button"
                    onClick={decrementCart}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border border-theme bg-[var(--card)] transition ${
                      cartQty === 1
                        ? 'hover:border-rose-500/40 hover:text-rose-500'
                        : 'hover:bg-[var(--card2)]'
                    }`}
                    aria-label={
                      cartQty === 1 ? translateText('حذف از سبد') : translateText('کاهش تعداد')
                    }
                  >
                    {cartQty === 1 ? <Trash2 size={15} /> : <Minus size={15} />}
                  </button>
                  <div className="text-center text-sm font-black tabular-nums">
                    {syncBusy ? (
                      <Loader2 size={14} className="mx-auto animate-spin muted" />
                    ) : (
                      toFa(cartQty)
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={incrementCart}
                    disabled={soldOut || (stock !== null && cartQty >= stock) || !loggedIn}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-900 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-35"
                    style={{ background: 'var(--primary-color)' }}
                    aria-label={translateText('افزایش تعداد')}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-theme px-4 py-2.5 text-sm font-bold transition hover:border-[var(--primary-color)]"
              >
                <Store size={16} />
                {translateText('ارتباط با فروشنده ')}
              </button>
            </div>
          </section>

          {/* مشخصات فنی */}
          <section className="card rounded-2xl p-5">
            <h2 className="flex items-center gap-2 border-b border-theme pb-4 text-lg font-black">
              <span
                className="h-5 w-1 rounded-full"
                style={{ background: 'var(--primary-color)' }}
              />
              {translateText('مشخصات فنی ')}
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
            <span className="h-5 w-1 rounded-full" style={{ background: 'var(--primary-color)' }} />
            {translateText('مشخصات فنی ')}
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

      {/* محصولات مرتبط — فقط از همین دسته‌بندی، اسکرولی و بیشتر */}
      {(similarLoading || similar.length > 0) && (
        <section className="mt-10">
          <ProductScrollerComponent
            partone={translateText('محصولات')}
            parttwo={translateText('مرتبط')}
            icon={Layers}
            subtitle={
              category?.name
                ? translateText('از دسته‌ی «{{v0}}» — با کشیدن به کنار، محصولات بیشتری ببینید', {
                    v0: category.name,
                  })
                : translateText('از همین دسته‌بندی — با کشیدن به کنار، محصولات بیشتری ببینید')
            }
            products={similar}
            loading={similarLoading}
            moreTo={
              categoryId ? `/products?category_id=${encodeURIComponent(categoryId)}` : '/products'
            }
            emptyText={translateText('محصول مرتبطی در این دسته‌بندی نیست')}
          />
        </section>
      )}

      {/* اخیراً مشاهده‌شده‌ها */}
      <section className="mt-6">
        <RecentlyViewedComponent excludeId={activeProductId} limit={8} />
      </section>

      {/* نوار پایین — فقط موبایل و تبلت */}
      <MobileBottomBar
        product={product}
        cartQty={cartQty}
        syncBusy={syncBusy}
        stock={stock}
        soldOut={soldOut}
        discounted={discounted}
        loggedIn={loggedIn}
        onIncrement={incrementCart}
        onDecrement={decrementCart}
      />

      <StoreContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        store={store}
        owner={owner}
        product={product}
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
