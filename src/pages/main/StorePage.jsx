import ReviewsComponent from '../../components/product/ReviewsComponent';
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
import ChatNowButton from '../../components/chat/ChatNowButton';
import { StoreContactModal } from '../../components/store/StoreInfoComponent';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

const SORTS = [
  { value: 'newest', label: translateText('جدیدترین') },
  { value: 'cheap', label: translateText('ارزان‌ترین') },
  { value: 'expensive', label: translateText('گران‌ترین') },
  { value: 'discount', label: translateText('بیشترین تخفیف') },
];

/* ------------------------------------------------------------------ */
/* کامپوننت‌های کمکی                                                   */
/* ------------------------------------------------------------------ */

function ContactChip({ icon: Icon, label, value, href }) {
  const body = (
    <div className="card2 flex items-center gap-2.5 rounded-2xl p-3 min-w-0 transition hover:border-[var(--primary-color)]">
      <Icon size={16} className="shrink-0 text-accent" />
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
  const [contactOpen, setContactOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [productRevision, refreshProducts] = useState(0);

  // دریافت اطلاعات فروشگاه و محصولات
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetchStore(id)
      .then((storeRes) => {
        if (controller.signal.aborted) return;
        const s = getBody(storeRes) || storeRes;
        if (!s) throw new Error(translateText('فروشگاه پیدا نشد.'));
        setStore(s);
        /* نام و نشان «مورد اعتماد» فروشنده — از روت عمومی /user/:id */
        const ownerId = s.user?._id || s.user;
        if (ownerId) {
          fetchPublicUser(ownerId)
            .then((value) => {
              if (!controller.signal.aborted) setOwner(value);
            })
            .catch(() => {
              if (!controller.signal.aborted) setOwner(null);
            });
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

  useEffect(() => {
    const controller = new AbortController();
    setProductsLoading(true);
    setProductsError('');
    if (productPage === 1) {
      setProducts([]);
      setProductTotal(0);
    }
    const timer = setTimeout(() => {
      axios
        .get(`${API}/product`, {
          signal: controller.signal,
          timeout: 15000,
          params: {
            store_id: id,
            currency: undefined,
            page: productPage,
            limit: 8,
            store_search: query || undefined,
            store_sort: sort,
            store_discount: onlyDiscount ? 'true' : undefined,
            store_in_stock: onlyInStock ? 'true' : undefined,
          },
        })
        .then((response) => {
          if (controller.signal.aborted) return;
          const body = getBody(response),
            rows = getList(response);
          if (rows.some((row) => String(getId(row.store_id)) !== String(id)))
            throw new Error('Unexpected store product response');
          setProducts((previous) =>
            productPage === 1
              ? rows
              : [...new Map([...previous, ...rows].map((row) => [getId(row), row])).values()],
          );
          setProductTotal(Number(body?.total) || 0);
        })
        .catch((error) => {
          if (!controller.signal.aborted)
            setProductsError(
              error?.response?.data?.message || translateText('store.productsError'),
            );
        })
        .finally(() => {
          if (!controller.signal.aborted) setProductsLoading(false);
        });
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [id, productPage, query, sort, onlyDiscount, onlyInStock, productRevision]);

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

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredProducts = products;

  const hasActiveFilters = query || onlyDiscount || onlyInStock || sort !== 'newest';

  const resetFilters = () => {
    setProductPage(1);
    setQuery('');
    setOnlyDiscount(false);
    setOnlyInStock(false);
    setSort('newest');
  };

  /* ---------------- حالت‌های بارگذاری و خطا ---------------- */

  if (loading) {
    return (
      <div className="mx-auto site-width max-w-7xl px-4 py-6">
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
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl text-accent"
            style={{ background: 'rgba(255,106,0,0.12)' }}
          >
            <StoreIcon size={30} />
          </span>
          <h1 className="mt-4 text-lg font-black">{translateText('فروشگاه پیدا نشد')}</h1>
          <p className="mt-2 text-sm muted">
            {error || translateText('این فروشگاه ممکن است حذف شده باشد یا آدرس آن اشتباه است.')}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button type="button" onClick={() => setRetry((v) => v + 1)} className="btn-primary">
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
  const contact = {
    ...(store.contact_info || {}),
    address: store.address || store.contact_info?.address,
  };

  return (
    <div className="mx-auto site-width max-w-7xl space-y-6 px-4 py-6">
      <div className="store-layout-v32">
        <aside className="store-profile-v32 card" aria-label={translateText('b2b.sellerStore')}>
          <div className="store-profile-banner">
            {store.banner_image_id && (
              <StorageImageComponent
                file={store.banner_image_id}
                alt={store.name}
                eager
                className="w-full h-full object-cover"
                onZoom={(file, alt) => setZoomFile({ file, alt })}
              />
            )}
          </div>
          <div className="store-profile-body">
            <div className="store-profile-avatar">
              <StorageImageComponent
                file={store.profile_image_id}
                alt={store.name}
                compact
                className="w-full h-full object-cover"
                onZoom={store.profile_image_id ? (file, alt) => setZoomFile({ file, alt }) : null}
              />
            </div>
            <h1>{store.name}</h1>
            {sellerName && (
              <p className="store-profile-seller">
                {translateText('فروشنده: {{v0}}', { v0: sellerName })}
              </p>
            )}
            <TrustBadge trusted={sellerTrusted} showUntrusted />
            {store.description && <p className="store-profile-description">{store.description}</p>}
            {store.create_at && (
              <span className="store-profile-date">
                <CalendarDays size={14} />
                {translateText('عضویت از ')}
                {formatDate(store.create_at)}
              </span>
            )}
            <div className="store-profile-contacts">
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
            <section className={`store-trust-panel ${sellerTrusted ? 'is-trusted' : ''}`} aria-label={translateText('وضعیت اعتماد فروشنده')}>
              <div className="store-trust-panel-heading"><StoreIcon size={19} /><h2>{translateText('وضعیت اعتماد فروشنده')}</h2></div>
              <TrustBadge trusted={sellerTrusted} showUntrusted />
              <p>{sellerTrusted ? translateText('b2b.approvalNote') : translateText('این فروشنده هنوز نشان اعتماد ژئوکالا را دریافت نکرده است. پیش از خرید، اطلاعات تماس و شرایط فروش را با او هماهنگ کنید.')}</p>
            </section>
            <div className="store-profile-actions">
              <ChatNowButton
                seller_id={sellerIdForCards}
                store_id={getId(store) || id}
                variant="solid"
                className="w-full"
              />
              {/* «ارتباط با فروشنده» عمداً فقط در صفحهٔ فروشگاه است */}
              <button
                type="button"
                className="review-button secondary w-full"
                aria-haspopup="dialog"
                onClick={() => setContactOpen(true)}
              >
                <Phone size={15} />
                {translateText('ارتباط با فروشنده ')}
              </button>

              <button
                type="button"
                className="review-button secondary"
                onClick={() =>
                  document.getElementById('store-comments')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                <StoreIcon size={15} />
                {translateText('reviews.title')}
              </button>
            </div>
          </div>
        </aside>
        <div className="store-content-v32">
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
                    {toFa(productTotal)}
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
                      onChange={(event) => {
                        setProductPage(1);
                        setQuery(event.target.value);
                      }}
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
                    onChange={(event) => {
                      setProductPage(1);
                      setSort(event.target.value);
                    }}
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
                  onClick={() => {
                    setProductPage(1);
                    setOnlyDiscount((value) => !value);
                  }}
                  className={onlyDiscount ? 'is-active' : ''}
                >
                  <Sparkles size={16} />
                  <span>{translateText('تخفیف‌دار')}</span>
                  <span className="store-filter-switch" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-pressed={onlyInStock}
                  onClick={() => {
                    setProductPage(1);
                    setOnlyInStock((value) => !value);
                  }}
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
              loading={productsLoading && productPage === 1}
              columns={4}
              emptyTitle={translateText('محصولی مطابق فیلتر در این فروشگاه یافت نشد')}
              /* همه‌ی کالاهای این صفحه از همین فروشگاه‌اند؛ پس وضعیت تأیید فروشنده
             مستقیم به کارت‌ها داده می‌شود تا هر کارت دنبال فروشنده نگردد */
              trust={storeTrust}
              showUntrusted
              storeId={getId(store) || id}
              sellerId={sellerIdForCards}
            />
            {productsError && (
              <div role="alert" className="store-products-error">
                <p>{productsError}</p>
                <button
                  type="button"
                  className="review-button primary"
                  onClick={() => refreshProducts((v) => v + 1)}
                >
                  {translateText('reviews.retry')}
                </button>
              </div>
            )}
            {!productsError && products.length < productTotal && (
              <div className="store-more-row">
                <button
                  type="button"
                  className="review-button secondary"
                  disabled={productsLoading}
                  onClick={() => setProductPage((p) => p + 1)}
                >
                  {productsLoading
                    ? translateText('reviews.loading')
                    : translateText('store.moreProducts')}
                  <span>
                    {toFa(products.length)} / {toFa(productTotal)}
                  </span>
                </button>
              </div>
            )}
          </section>
          <div id="store-comments">
            <ReviewsComponent key={id} storeId={getId(store) || id} incremental />
          </div>
        </div>
      </div>
      {/* پیام کوتاه */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-charcoal px-4 py-2.5 text-xs font-bold text-white shadow-2xl transition-all duration-300 ${
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

      <StoreContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        store={store}
        owner={owner}
      />
    </div>
  );
}

export default StorePage;
