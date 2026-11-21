import { t as translateText } from '../../i18n/runtime.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import {
  CalendarDays,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  Store as StoreIcon,
  X,
} from 'lucide-react';
import ProductGridComponent from '../../components/product/ProductGridComponent';
import { TrustBadge } from '../../components/store/StoreInfoComponent';
import StorageImageComponent from '../../components/common/StorageImageComponent';
import ImageLightboxComponent from '../../components/common/ImageLightboxComponent';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { toFa, formatDate, finalPrice, hasDiscount } from '../../utils/helpers/format';
import { getBody, getList, getId } from '../../utils/helpers/response';
import {
  fetchStore,
  fetchPublicUser,
  trustState,
  sellerIdOfStore,
  TRUST,
} from '../../services/sellerApi';
import { sellerDisplayName } from '../../utils/helpers/user';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

const SORTS = [
  { value: 'newest', label: translateText('جدیدترین') },
  { value: 'cheap', label: translateText('ارزان‌ترین') },
  { value: 'expensive', label: translateText('گران‌ترین') },
  { value: 'discount', label: translateText('بیشترین تخفیف') },
  { value: 'sold', label: translateText('پرفروش‌ترین') },
];

/* ------------------------------------------------------------------ */
/* کامپوننت‌های کمکی                                                   */
/* ------------------------------------------------------------------ */

function ContactChip({ icon: Icon, label, value, href }) {
  const body = (
    <div className="card2 flex items-center gap-2.5 rounded-2xl p-3 min-w-0 transition hover:border-[var(--primary-color)]">
      <Icon size={16} className="shrink-0 text-yellow" />
      <div className="min-w-0">
        <div className="text-[11px] muted">{label}</div>
        <div className="truncate text-xs font-bold" dir={href ? 'ltr' : undefined}>
          {value}
        </div>
      </div>
    </div>
  );
  return href ? <a href={href}>{body}</a> : body;
}

function HeroSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="skeleton h-56 rounded-3xl sm:h-72" />
      <div className="skeleton h-40 rounded-3xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-72 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* صفحه‌ی فروشگاه                                                       */
/* ------------------------------------------------------------------ */

function StorePage() {
  const { id } = useParams();
  const productsRef = useRef(null);

  const [store, setStore] = useState(null);
  const [owner, setOwner] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);

  const [zoomFile, setZoomFile] = useState(null);
  const [toast, setToast] = useState('');
  const [scrolled, setScrolled] = useState(false);

  // دریافت اطلاعات فروشگاه و محصولات
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    Promise.all([
      fetchStore(id),
      axios.get(`${API}/product`, {
        params: { store_id: id, limit: 100, page: 1 },
        signal: controller.signal,
        timeout: 15000,
      }),
    ])
      .then(([storeRes, prodRes]) => {
        const s = getBody(storeRes) || storeRes;
        if (!s) throw new Error(translateText('فروشگاه پیدا نشد.'));
        setStore(s);

        /*
         * فقط محصولات همین فروشگاه.
         * پارامتر `store_id` را بعضی نسخه‌های بک‌اند در فیلتر محصولات نمی‌خوانند
         * (روت `/product` فقط seller_id را فیلتر می‌کند) و نتیجه این بود که
         * صفحه‌ی فروشگاه محصولات همه‌ی فروشگاه‌ها را نشان می‌داد. اینجا خودمان
         * بر اساس `store_id` هر محصول فیلتر می‌کنیم؛ اگر پاسخ هیچ‌کدام از
         * محصولات فیلد store_id نداشته باشد، فیلتر اعمال نمی‌شود تا صفحه خالی نشود.
         */
        const all = getList(prodRes);
        const hasStoreField = all.some((item) => Boolean(getId(item.store_id)));
        const own = all.filter((item) => String(getId(item.store_id)) === String(id));
        setProducts(hasStoreField ? own : all);

        /* نام و نشان «مورد اعتماد» فروشنده — از روت عمومی /user/:id */
        const ownerId = s.user?._id || s.user;
        if (ownerId) {
          fetchPublicUser(ownerId)
            .then((value) => setOwner(value))
            .catch(() => setOwner(null));
        } else {
          setOwner(null);
        }
      })
      .catch((err) => {
        if (!axios.isCancel(err)) {
          setError(
            err.response?.data?.message || err.message || translateText('فروشگاه پیدا نشد.'),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id, retry]);

  // نمایش نوار ثابت بالا بعد از اسکرول
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // پیام کوتاه (toast)
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  /* نام نمایشی و وضعیت اعتماد فروشنده (دارنده‌ی فروشگاه) */
  const sellerName = useMemo(() => sellerDisplayName(owner), [owner]);
  /* همان قاعده‌ی سخت‌گیرانه‌ی services/sellerApi: تأییدشده فقط با seller_trust === true و تأیید ادمین */
  const storeTrust = useMemo(() => trustState(store, owner), [owner, store]);
  const sellerTrusted = storeTrust === TRUST.TRUSTED;
  const sellerIdForCards = useMemo(() => sellerIdOfStore(store, owner), [owner, store]);

  const shareStore = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: store?.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setToast(translateText('لینک فروشگاه کپی شد'));
    } catch {
      // کاربر اشتراک‌گذاری را لغو کرده است
    }
  };

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      if (q && !p.name?.toLowerCase().includes(q) && !p.brand?.toLowerCase().includes(q)) {
        return false;
      }
      if (onlyDiscount && !hasDiscount(p)) return false;
      if (onlyInStock && (p.stock_status === 'OUT_OF_STOCK' || (p.stock ?? 0) <= 0)) return false;
      return true;
    });

    switch (sort) {
      case 'cheap':
        list = [...list].sort((a, b) => finalPrice(a) - finalPrice(b));
        break;
      case 'expensive':
        list = [...list].sort((a, b) => finalPrice(b) - finalPrice(a));
        break;
      case 'discount':
        list = [...list].sort(
          (a, b) => (b.discount?.percentage ?? 0) - (a.discount?.percentage ?? 0),
        );
        break;
      case 'sold':
        list = [...list].sort((a, b) => (b.sold_count ?? 0) - (a.sold_count ?? 0));
        break;
      default:
        break;
    }
    return list;
  }, [products, query, sort, onlyDiscount, onlyInStock]);

  const hasActiveFilters = query || onlyDiscount || onlyInStock || sort !== 'newest';

  const resetFilters = () => {
    setQuery('');
    setOnlyDiscount(false);
    setOnlyInStock(false);
    setSort('newest');
  };

  /* ---------------- حالت‌های بارگذاری و خطا ---------------- */

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Loading label={translateText('در حال بارگذاری فروشگاه…')} />
        <div className="mt-6">
          <HeroSkeleton />
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <div className="card rounded-3xl p-8 text-center">
          <span
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl text-yellow"
            style={{ background: 'rgba(255,106,0,0.12)' }}
          >
            <StoreIcon size={30} />
          </span>
          <h1 className="mt-4 text-lg font-black">{translateText('فروشگاه پیدا نشد')}</h1>
          <p className="mt-2 text-sm muted">
            {error || translateText('این فروشگاه ممکن است حذف شده باشد یا آدرس آن اشتباه است.')}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button type="button" onClick={() => setRetry((v) => v + 1)} className="btn-yellow">
              {translateText('تلاش دوباره ')}
            </button>
            <Link to="/products" className="btn-ghost">
              {translateText('مشاهده همه محصولات ')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* فعال/غیرفعال از وضعیت فروشنده (روت عمومی کاربر) و در نبود آن از وضعیت فروشگاه */
  const contact = { ...(store.contact_info || {}), address: store.address || store.contact_info?.address };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      {/* نوار ثابت هنگام اسکرول */}
      <div
        className={`fixed inset-x-0 top-0 z-40 border-b border-theme backdrop-blur-md transition-all duration-300 ${
          scrolled ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'
        }`}
        style={{ background: 'color-mix(in srgb, var(--card) 92%, transparent)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-navy">
              <StorageImageComponent
                file={store.profile_image_id}
                alt={store.name}
                compact
                className="h-full w-full object-cover"
              />
            </div>
            <span className="truncate text-sm font-black">{store.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={scrollToProducts}
              className="btn-ghost hidden !py-1.5 text-xs sm:inline-flex"
            >
              {translateText('محصولات ')}
            </button>
          </div>
        </div>
      </div>

      {/* هیرو */}
      <section className="card relative overflow-hidden rounded-3xl">
        <div className="relative h-52 w-full bg-navy sm:h-72">
          <StorageImageComponent
            file={store.banner_image_id}
            alt={translateText('بنر {{v0}}', { v0: store.name })}
            eager
            className="h-full w-full object-cover"
            onZoom={store.banner_image_id ? (f, a) => setZoomFile({ file: f, alt: a }) : null}
          />
          <div
            className="absolute inset-0"
            /* پایان محو با آلفای صفر از همان رنگ کارت (نه transparent سیاه) */
            style={{
              background:
                'linear-gradient(to top, var(--card) 0%, color-mix(in srgb, var(--card) 0%, transparent) 70%)',
            }}
          />
        </div>

        <div className="relative px-5 pb-6 sm:px-8">
          <div className="-mt-16 flex flex-col gap-5 md:flex-row md:items-end md:justify-between sm:-mt-20">
            <div className="flex min-w-0 items-end gap-4">
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-3xl border-4 border-[var(--card)] bg-navy shadow-2xl sm:h-32 sm:w-32">
                <StorageImageComponent
                  file={store.profile_image_id}
                  alt={store.name}
                  eager
                  className="h-full w-full object-cover"
                  onZoom={
                    store.profile_image_id ? (f, a) => setZoomFile({ file: f, alt: a }) : null
                  }
                />
              </div>
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-black sm:text-3xl">{store.name}</h1>
                  <TrustBadge trusted={sellerTrusted} showUntrusted />
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs muted">
                  <span className="inline-flex items-center gap-1.5">
                    <StoreIcon size={12} className="shrink-0" />
                    {sellerName
                      ? translateText('فروشنده: {{v0}}', { v0: sellerName })
                      : translateText('b2b.sellerStore')}
                  </span>
                  {store.create_at && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={12} className="shrink-0" />
                      {translateText('عضویت از ')}
                      {formatDate(store.create_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={shareStore}
                className="btn-ghost inline-flex items-center gap-2 !px-3.5 text-sm"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">{translateText('اشتراک‌گذاری')}</span>
              </button>
            </div>
          </div>

          {store.description && (
            <p className="mt-5 max-w-3xl text-sm leading-7 muted">{store.description}</p>
          )}

          {/* وضعیت اعتماد فروشنده — همیشه صریح می‌گوید تأییدشده هست یا نه */}
          <div className="card2 mt-5 rounded-2xl p-3.5 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <TrustBadge trusted={sellerTrusted} showUntrusted />
              <span className="text-xs font-bold">{translateText('وضعیت اعتماد فروشنده')}</span>
            </div>
            <p className="mt-2 text-xs leading-6 muted">
              {sellerTrusted
                ? translateText('b2b.approvalNote')
                : translateText(
                    'این فروشنده هنوز نشان اعتماد ژئوکالا را دریافت نکرده است. پیش از خرید، اطلاعات تماس و شرایط فروش را با او هماهنگ کنید.',
                  )}
            </p>
          </div>

          {/* اطلاعات تماس */}
          {(contact.email || contact.phone || contact.address) && (
            <div className="mt-5 grid gap-3 border-t border-theme pt-5 sm:grid-cols-2 lg:grid-cols-3">
              {contact.email && (
                <ContactChip
                  icon={Mail}
                  label={translateText('ایمیل')}
                  value={contact.email}
                  href={`mailto:${contact.email}`}
                />
              )}
              {contact.phone && (
                <ContactChip
                  icon={Phone}
                  label={translateText('تلفن تماس')}
                  value={toFa(contact.phone)}
                  href={`tel:${contact.phone}`}
                />
              )}
              {contact.address && (
                <ContactChip
                  icon={MapPin}
                  label={translateText('نشانی فروشگاه')}
                  value={contact.address}
                />
              )}
            </div>
          )}
        </div>
      </section>

      {/* محصولات */}
      <section ref={productsRef} id="store-products" className="scroll-mt-20 space-y-4">
        <div className="store-product-filters card" data-testid="store-product-filters">
          <div className="store-product-filters__heading">
            <div className="flex items-center gap-2 min-w-0">
              <span className="store-product-filters__icon">
                <Package size={20} />
              </span>
              <h2 className="text-base font-black">{translateText('محصولات فروشگاه')}</h2>
              <span className="store-product-filters__count" role="status">
                {toFa(filteredProducts.length)}
              </span>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="store-product-filters__reset"
            >
              <X size={14} />
              {translateText('پاک کردن فیلترها')}
            </button>
          </div>
          <div className="store-product-filters__fields">
            <label className="store-product-filters__search">
              <span className="text-xs font-bold muted">{translateText('جستجو')}</span>
              <span className="relative block">
                <Search
                  size={17}
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 muted"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={translateText('جستجو در این فروشگاه…')}
                  className="input !ps-10"
                />
              </span>
            </label>
            <label className="store-product-filters__sort">
              <span className="text-xs font-bold muted">
                {translateText('مرتب‌سازی محصولات فروشگاه')}
              </span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="input"
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div
            className="store-product-filters__toggles"
            role="group"
            aria-label={translateText('فیلتر محصولات')}
          >
            <button
              type="button"
              aria-pressed={onlyDiscount}
              onClick={() => setOnlyDiscount((value) => !value)}
              className={onlyDiscount ? 'is-active' : ''}
            >
              <Sparkles size={16} />
              <span>{translateText('تخفیف‌دار')}</span>
              <span className="store-filter-switch" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-pressed={onlyInStock}
              onClick={() => setOnlyInStock((value) => !value)}
              className={onlyInStock ? 'is-active' : ''}
            >
              <ShoppingBag size={16} />
              <span>{translateText('فقط موجود')}</span>
              <span className="store-filter-switch" aria-hidden="true" />
            </button>
          </div>
        </div>

        <ProductGridComponent
          products={filteredProducts}
          loading={loading}
          columns={3}
          emptyTitle={translateText('محصولی مطابق فیلتر در این فروشگاه یافت نشد')}
          /* همه‌ی کالاهای این صفحه از همین فروشگاه‌اند؛ پس وضعیت تأیید فروشنده
             مستقیم به کارت‌ها داده می‌شود تا هر کارت دنبال فروشنده نگردد */
          trust={storeTrust}
          showUntrusted
          storeId={getId(store) || id}
          sellerId={sellerIdForCards}
        />
      </section>

      {/* پیام کوتاه */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-2xl transition-all duration-300 ${
          toast ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        {toast}
      </div>

      <ImageLightboxComponent
        file={zoomFile?.file}
        alt={zoomFile?.alt}
        onClose={() => setZoomFile(null)}
      />
    </div>
  );
}

export default StorePage;
