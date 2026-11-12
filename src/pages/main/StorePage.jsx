import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import {
  AlertOctagon,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Heart,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  Store as StoreIcon,
  TrendingUp,
  X,
} from 'lucide-react';
import ProductGridComponent from '../../components/product/ProductGridComponent';
import StorageImageComponent from '../../components/common/StorageImageComponent';
import ImageLightboxComponent from '../../components/common/ImageLightboxComponent';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { statusFa, toFa, formatDate, finalPrice, hasDiscount } from '../../utils/helpers/format';
import { getBody, getList } from '../../utils/helpers/response';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

const SORTS = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'cheap', label: 'ارزان‌ترین' },
  { value: 'expensive', label: 'گران‌ترین' },
  { value: 'discount', label: 'بیشترین تخفیف' },
  { value: 'sold', label: 'پرفروش‌ترین' },
];

/* ------------------------------------------------------------------ */
/* کامپوننت‌های کمکی                                                   */
/* ------------------------------------------------------------------ */

function StatTile({ icon: Icon, value, label }) {
  return (
    <div className="card2 flex items-center gap-3 rounded-2xl p-3 min-w-0">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-yellow"
        style={{ background: 'rgba(255,214,10,0.12)' }}
      >
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <div className="font-black text-base leading-tight">{value}</div>
        <div className="truncate text-[11px] muted">{label}</div>
      </div>
    </div>
  );
}

function ContactChip({ icon: Icon, label, value, href }) {
  const body = (
    <div className="card2 flex items-center gap-2.5 rounded-2xl p-3 min-w-0 transition hover:border-yellow">
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);

  const [zoomFile, setZoomFile] = useState(null);
  const [following, setFollowing] = useState(false);
  const [toast, setToast] = useState('');
  const [scrolled, setScrolled] = useState(false);

  // دریافت اطلاعات فروشگاه و محصولات
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    Promise.all([
      axios.get(`${API}/store/${id}`, { signal: controller.signal, timeout: 15000 }),
      axios.get(`${API}/product`, {
        params: { store_id: id, limit: 100, page: 1 },
        signal: controller.signal,
        timeout: 15000,
      }),
    ])
      .then(([storeRes, prodRes]) => {
        const s = getBody(storeRes);
        if (!s) throw new Error('فروشگاه پیدا نشد.');
        setStore(s);
        setProducts(getList(prodRes));
      })
      .catch((err) => {
        if (!axios.isCancel(err)) {
          setError(err.response?.data?.message || err.message || 'فروشگاه پیدا نشد.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id, retry]);

  // وضعیت «دنبال کردن» (فعلاً در localStorage؛ بعداً به API وصل شود)
  useEffect(() => {
    setFollowing(localStorage.getItem(`follow-store-${id}`) === '1');
  }, [id]);

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

  const toggleFollow = () => {
    const next = !following;
    setFollowing(next);
    localStorage.setItem(`follow-store-${id}`, next ? '1' : '0');
    setToast(next ? 'فروشگاه به لیست دنبال‌شده‌ها اضافه شد' : 'دنبال کردن لغو شد');
    // TODO: ارسال وضعیت به API
  };

  const shareStore = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: store?.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setToast('لینک فروشگاه کپی شد');
    } catch {
      // کاربر اشتراک‌گذاری را لغو کرده است
    }
  };

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // بیشترین تخفیف فروشگاه
  const featured = useMemo(() => {
    const discounted = products.filter(hasDiscount);
    if (!discounted.length) return null;
    return discounted.reduce((best, p) =>
      (p.discount?.percentage ?? 0) > (best.discount?.percentage ?? 0) ? p : best,
    );
  }, [products]);

  const totalSold = useMemo(
    () => products.reduce((sum, p) => sum + (p.sold_count ?? 0), 0),
    [products],
  );

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
        list = [...list].sort((a, b) => (b.discount?.percentage ?? 0) - (a.discount?.percentage ?? 0));
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
        <Loading label="در حال بارگذاری فروشگاه…" />
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
            style={{ background: 'rgba(255,214,10,0.12)' }}
          >
            <StoreIcon size={30} />
          </span>
          <h1 className="mt-4 text-lg font-black">فروشگاه پیدا نشد</h1>
          <p className="mt-2 text-sm muted">{error || 'این فروشگاه ممکن است حذف شده باشد یا آدرس آن اشتباه است.'}</p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button type="button" onClick={() => setRetry((v) => v + 1)} className="btn-yellow">
              تلاش دوباره
            </button>
            <Link to="/products" className="btn-ghost">
              مشاهده همه محصولات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isActive = store.status === 'ENABLE';
  const contact = store.contact_info || {};
  const discountCount = products.filter(hasDiscount).length;

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
              <StorageImageComponent file={store.profile_image_id} alt={store.name} className="h-full w-full object-cover" />
            </div>
            <span className="truncate text-sm font-black">{store.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFollow}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                following ? 'bg-yellow text-[#0a1736]' : 'card2 border border-theme'
              }`}
            >
              <Heart size={13} fill={following ? 'currentColor' : 'none'} />
              {following ? 'دنبال می‌کنید' : 'دنبال کردن'}
            </button>
            <button type="button" onClick={scrollToProducts} className="btn-ghost hidden !py-1.5 text-xs sm:inline-flex">
              محصولات
            </button>
          </div>
        </div>
      </div>

      {/* هیرو */}
      <section className="card relative overflow-hidden rounded-3xl">
        <div className="relative h-52 w-full bg-navy sm:h-72">
          <StorageImageComponent
            file={store.banner_image_id}
            alt={`بنر ${store.name}`}
            eager
            className="h-full w-full object-cover"
            onZoom={store.banner_image_id ? (f, a) => setZoomFile({ file: f, alt: a }) : null}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, var(--card) 0%, transparent 70%)' }}
          />
          <div className="absolute start-4 top-4">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black shadow-lg ${
                isActive ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-[#0a1736]'
              }`}
            >
              {isActive ? <CheckCircle2 size={14} /> : <AlertOctagon size={14} />}
              {statusFa(store.status)}
            </span>
          </div>
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
                  onZoom={store.profile_image_id ? (f, a) => setZoomFile({ file: f, alt: a }) : null}
                />
              </div>
              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-xl font-black sm:text-3xl">{store.name}</h1>
                  {isActive && <BadgeCheck size={20} className="shrink-0 text-yellow" />}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs muted">
                  <StoreIcon size={12} />
                  فروشگاه رسمی در علی‌بازار
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFollow}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 ${
                  following ? 'bg-yellow text-[#0a1736]' : 'btn-ghost'
                }`}
              >
                <Heart size={16} fill={following ? 'currentColor' : 'none'} />
                {following ? 'دنبال می‌کنید' : 'دنبال کردن'}
              </button>
              <button type="button" onClick={shareStore} className="btn-ghost inline-flex items-center gap-2 !px-3.5 text-sm">
                <Share2 size={16} />
                <span className="hidden sm:inline">اشتراک‌گذاری</span>
              </button>
            </div>
          </div>

          {store.description && (
            <p className="mt-5 max-w-3xl text-sm leading-7 muted">{store.description}</p>
          )}

          {/* آمار */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile icon={Package} value={toFa(products.length)} label="کالای فعال" />
            <StatTile icon={Sparkles} value={toFa(discountCount)} label="کالای تخفیف‌دار" />
            <StatTile icon={TrendingUp} value={toFa(totalSold)} label="فروش کل" />
            <StatTile
              icon={CalendarDays}
              value={store.create_at ? formatDate(store.create_at) : '—'}
              label="عضویت از"
            />
          </div>

          {/* اطلاعات تماس */}
          {(contact.email || contact.phone || contact.address) && (
            <div className="mt-5 grid gap-3 border-t border-theme pt-5 sm:grid-cols-2 lg:grid-cols-3">
              {contact.email && (
                <ContactChip icon={Mail} label="ایمیل" value={contact.email} href={`mailto:${contact.email}`} />
              )}
              {contact.phone && (
                <ContactChip icon={Phone} label="تلفن تماس" value={toFa(contact.phone)} href={`tel:${contact.phone}`} />
              )}
              {contact.address && <ContactChip icon={MapPin} label="نشانی فروشگاه" value={contact.address} />}
            </div>
          )}
        </div>
      </section>

      {/* ایده‌ی جدید: پیشنهاد ویژه‌ی فروشگاه */}
      {featured && (
        <section
          className="relative grid gap-4 overflow-hidden rounded-3xl p-5 text-white sm:p-6 md:grid-cols-[1fr_auto] md:items-center"
          style={{ background: 'linear-gradient(120deg, var(--navy) 0%, #1b3a80 100%)' }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full blur-3xl"
            style={{ background: 'rgba(255,214,10,0.25)' }}
          />
          <div className="relative flex min-w-0 items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-yellow text-[#0a1736]">
              <Sparkles size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-yellow">پیشنهاد ویژه‌ی این فروشگاه</p>
              <h2 className="mt-1 truncate text-base font-black sm:text-lg">{featured.name}</h2>
              <p className="mt-1 text-xs text-white/75">
                {toFa(featured.discount?.percentage ?? 0)}٪ تخفیف • قیمت نهایی {toFa(finalPrice(featured))}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={scrollToProducts}
            className="relative inline-flex w-max items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0a1736] transition hover:-translate-y-0.5"
          >
            مشاهده‌ی پیشنهادها
            <ArrowLeft size={16} />
          </button>
        </section>
      )}

      {/* محصولات */}
      <section ref={productsRef} id="store-products" className="scroll-mt-20 space-y-4">
        <div className="card flex flex-col gap-4 rounded-2xl p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Package size={19} className="text-yellow" />
            <h2 className="text-base font-black">محصولات فروشگاه</h2>
            <span className="rounded-full bg-yellow/15 px-2.5 py-0.5 text-xs font-bold text-yellow" style={{ background: 'rgba(255,214,10,0.12)' }}>
              {toFa(filteredProducts.length)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1 sm:flex-initial sm:w-64">
              <Search size={15} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو در این فروشگاه…"
                className="input !py-2 !pe-9 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => setOnlyDiscount((v) => !v)}
              className={`chip inline-flex items-center gap-1 ${onlyDiscount ? 'on' : ''}`}
            >
              <Sparkles size={13} />
              تخفیف‌دار
            </button>

            <button
              type="button"
              onClick={() => setOnlyInStock((v) => !v)}
              className={`chip inline-flex items-center gap-1 ${onlyInStock ? 'on' : ''}`}
            >
              <ShoppingBag size={13} />
              فقط موجود
            </button>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input !w-auto !py-1.5 text-xs"
              aria-label="مرتب‌سازی محصولات فروشگاه"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold text-yellow transition hover:bg-white/5"
              >
                <X size={13} />
                پاک کردن
              </button>
            )}
          </div>
        </div>

        <ProductGridComponent
          products={filteredProducts}
          loading={loading}
          columns={4}
          emptyTitle="محصولی مطابق فیلتر در این فروشگاه یافت نشد"
        />
      </section>

      {/* پیام کوتاه */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 start-1/2 z-50 -translate-x-1/2 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-2xl transition-all duration-300 ${
          toast ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        {toast}
      </div>

      <ImageLightboxComponent file={zoomFile?.file} alt={zoomFile?.alt} onClose={() => setZoomFile(null)} />
    </div>
  );
}

export default StorePage;