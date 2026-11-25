import { t as translateText } from '../../i18n/runtime.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  LayoutGrid,
  Tag,
  ClipboardList,
  Medal,
  Sparkles,
  Flame,
  TrendingUp,
  Store,
} from 'lucide-react';
import StorageImageComponent from '../common/StorageImageComponent';
import TrustBadge from '../product/TrustBadge';
import ThemeToggleComponent from '../common/ThemeToggleComponent';
import MarqueeText from '../common/MarqueeText';
import ProductSearchBox from '../common/ProductSearchBox';
import HotPicksBannerComponent from './HotPicksBannerComponent';
import { useShop } from '../../contexts/ShopContext';
import {
  hasDiscount,
  productImages,
  toFa,
  formatPrice,
  finalPrice,
} from '../../utils/helpers/format';
import useScrollFade from '../../hooks/useScrollFade';

// API responses may contain either a category id or a populated category document.
const categoryIdOf = (value) => String(value?._id ?? value?.id ?? value ?? '');
const belongsToCategory = (product, category) => {
  const ids = [
    product.category_id,
    product.category,
    ...(Array.isArray(product.categories) ? product.categories : []),
  ];
  return ids.some((id) => categoryIdOf(id) === categoryIdOf(category));
};

/*
 * ستون‌های ویترین دسته‌بندی فقط در دسکتاپ دیده می‌شود (بخش `hidden lg:block`)؛
 * همان دو نقطه‌شکنی که در CSS تعریف شده‌اند اینجا خوانده می‌شوند تا تعداد
 * محصولات = ستون × ۲ ردیف باشد و هیچ ردیفی نیمه‌پر نماند.
 */
const SHOWCASE_BREAKPOINTS = [
  ['(min-width: 1600px)', 6],
  ['(min-width: 1024px)', 5],
];
const showcaseColumns = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return 5;
  const hit = SHOWCASE_BREAKPOINTS.find(([query]) => window.matchMedia(query).matches);
  return hit ? hit[1] : 5;
};
function useShowcaseColumns() {
  const [columns, setColumns] = useState(showcaseColumns);
  useEffect(() => {
    const onChange = () => setColumns(showcaseColumns());
    const lists = SHOWCASE_BREAKPOINTS.map(([query]) => window.matchMedia(query));
    lists.forEach((list) => list.addEventListener('change', onChange));
    onChange();
    return () => lists.forEach((list) => list.removeEventListener('change', onChange));
  }, []);
  return columns;
}

/* ───────── هیرو: تب‌ها + باکس جستجو ─────────
   موبایل: جستجوی فشرده‌ی قرصی‌شکل + ردیف سرویس‌های آیکنی (مثل اپ علی‌بابا)
   دسکتاپ: جعبه‌ی جستجوی بزرگ وسط‌چین با حاشیه‌ی رنگ برند                    */
function HeroSearch() {
  const tab = 'relative pb-2 whitespace-nowrap';

  return (
    <section className="home-search-hero px-3 pt-3 pb-4 sm:px-4 sm:pt-6 sm:pb-8 md:pt-4 md:pb-6">
      {/* تب‌ها — پخش‌شده در کل عرض مثل اپ علی‌بابا؛ فعال با زیرخط نارنجی */}
      <div className="flex items-center justify-between gap-2 px-1 text-sm min-[400px]:text-base sm:justify-center sm:gap-12 sm:text-xl md:text-2xl font-black">
        <Link
          to="/products"
          className={`${tab} flex-1 text-center sm:flex-none`}
          style={{ color: 'var(--accent-text)' }}
        >
          {translateText('محصولات ')}
          <span
            className="absolute inset-x-2 bottom-0 h-[3px] rounded-full sm:inset-x-0"
            style={{ background: 'var(--primary-color)' }}
          />
        </Link>
        <Link
          to="/products?tab=suppliers"
          className={`${tab} muted flex-1 text-center transition hover:opacity-80 sm:flex-none`}
        >
          {translateText('فروشگاه‌ها ')}
        </Link>
        <Link
          to="/products?discount=true"
          className={`${tab} muted flex-1 text-center transition hover:opacity-80 sm:flex-none`}
        >
          {translateText('تخفیف‌ها ')}
        </Link>
      </div>

      {/* ───── موبایل: قرص جستجو + کارت‌های سرویس ───── */}
      <div className="mt-3 lg:hidden">
        <ProductSearchBox variant="hero" compact />
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            {
              to: '/products',
              icon: LayoutGrid,
              label: translateText(' همه محصولات '),
              tone: '#2563eb',
            },
            {
              to: '/products?discount=true',
              icon: Flame,
              label: translateText(' پیشنهاد ویژه '),
              tone: '#e2352c',
            },
            {
              to: '/products',
              icon: TrendingUp,
              label: translateText(' پرفروش‌ها '),
              tone: '#0d9488',
            },
            {
              to: '/products?tab=suppliers',
              icon: Store,
              label: translateText(' فروشندگان '),
              tone: '#7c3aed',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label + item.to}
                to={item.to}
                className="card flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-[10px] font-bold transition hover:-translate-y-0.5"
              >
                <span
                  className="grid h-10 w-10 place-items-center rounded-full"
                  style={{
                    background: 'color-mix(in srgb, ' + item.tone + ' 14%, transparent)',
                    color: item.tone,
                  }}
                >
                  <Icon size={18} />
                </span>
                <span className="w-full truncate text-center leading-4">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ───── دسکتاپ: جعبه‌ی جستجوی بزرگ ───── */}
      <div
        className="hero-search-frame card mt-5 hidden max-w-[960px] mx-auto rounded-2xl p-4 lg:block"
        style={{ border: '2px solid var(--primary-color)' }}
      >
        <ProductSearchBox variant="hero" />
        <div
          className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2.5 text-[11px] sm:mt-3 sm:gap-y-2 sm:pt-3 sm:text-sm muted"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <Link
            to="/products?discount=true"
            className="flex items-center gap-1.5 hover:text-accent"
          >
            <Flame size={16} />
            {translateText(' پیشنهادهای ویژه ')}
          </Link>
          <span className="hidden sm:block h-4 w-px" style={{ background: 'var(--border)' }} />
          <Link to="/products" className="flex items-center gap-1.5 hover:text-accent">
            <TrendingUp size={16} />
            {translateText(' پرفروش‌ترین‌ها ')}
          </Link>
          <span className="hidden sm:block h-4 w-px" style={{ background: 'var(--border)' }} />
          <Link
            to="/products?tab=suppliers"
            className="flex items-center gap-1.5 hover:text-accent"
          >
            <Store size={16} />
            {translateText(' کشف فروشندگان ')}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ───────── نوار خوش‌آمد ───────── */
function WelcomeStrip() {
  const { user } = useShop();
  const name = user?.firstname || user?.name || user?.full_name || user?.username;
  const link = 'flex items-center gap-2 text-[15px] font-semibold hover:text-accent';

  return (
    <div style={{ background: 'var(--card2)' }} className="hidden md:block">
      <div className="site-width max-w-[1440px] mx-auto px-4 h-[72px] flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-black">
          {user
            ? translateText('سلام{{v0}}', { v0: name ? `، ${name}` : '' })
            : translateText('به فروشگاه خوش آمدید')}
        </h2>

        <ThemeToggleComponent
          showLabel={false}
          className="md:hidden w-10 h-10 rounded-full card grid place-items-center"
        />

        <div className="hidden md:flex items-center gap-4">
          <Link to="/account" className={link}>
            <ClipboardList size={22} />
            {translateText(' درخواست فروشندگی ')}
          </Link>
          <span className="w-px h-4" style={{ background: 'var(--border)' }} />
          <Link to="/products" className={link}>
            <Medal size={22} />
            {translateText(' پرفروش‌ها ')}
          </Link>
          <span className="w-px h-4" style={{ background: 'var(--border)' }} />
          <Link to="/products?discount=true" className={link}>
            <Sparkles size={22} />
            {translateText(' پیشنهاد ویژه ')}
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ───────── سایدبار دسته‌بندی (با قابلیت هاور) ───────── */
function CategoryCard({ categories, loading, activeCategoryId, onHoverCategory }) {
  return (
    <aside className="home-category-sidebar hidden lg:flex flex-col card rounded-2xl overflow-hidden">
      <div className="px-4 py-4 text-sm font-black border-b border-theme">
        {translateText('محصولات دسته‌بندی')}
      </div>
      <ul className="flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
        {loading
          ? Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="px-4 py-3">
                <div className="skeleton h-5 w-full" />
              </li>
            ))
          : categories.map((c) => {
              const isActive = String(c._id) === String(activeCategoryId);
              return (
                <li key={c._id}>
                  <Link
                    to={`/products?category_id=${encodeURIComponent(c._id)}`}
                    onMouseEnter={() => onHoverCategory(c._id)}
                    onFocus={() => onHoverCategory(c._id, true)}
                    onMouseLeave={() => onHoverCategory(null)}
                    data-active={isActive || undefined}
                    className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm transition-colors ${
                      isActive
                        ? 'text-accent bg-[var(--card2)] font-bold'
                        : 'hover:text-accent hover:bg-[var(--card2)]'
                    }`}
                  >
                    <Tag size={20} strokeWidth={1.5} className="shrink-0" />
                    <span className="flex-1 leading-5 line-clamp-2">{c.name}</span>
                    <ChevronLeft size={16} className="logical-icon muted shrink-0" />
                  </Link>
                </li>
              );
            })}
      </ul>
    </aside>
  );
}

/* ───────── نمایش نمونه محصولاتِ دسته‌بندی انتخاب‌شده ───────── */
function CategoryShowcase({ category, products, loading }) {
  const columns = useShowcaseColumns();

  if (loading) {
    return <div className="skeleton h-[400px] w-full rounded-xl" />;
  }

  // دو ردیف کامل: تعداد کارت‌ها با تعداد ستون‌های همان عرض صفحه تنظیم می‌شود.
  const categoryProducts = category
    ? products.filter((p) => belongsToCategory(p, category)).slice(0, columns * 2)
    : [];

  return (
    <div className="category-showcase flex min-w-0 w-full flex-col card rounded-2xl p-4 xl:p-5">
      <div
        className="flex items-center justify-between pb-3 mb-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base font-black truncate">
            {category ? category.name : translateText('محصولات دسته‌بندی')}
          </span>
        </div>
        {category && (
          <Link
            to={`/products?category_id=${category._id}`}
            className="text-xs font-semibold flex items-center gap-1 shrink-0 transition hover:opacity-80"
            style={{ color: 'var(--accent-text)' }}
          >
            {translateText('مشاهده همه ')}
            <ChevronLeft className="logical-icon" size={14} />
          </Link>
        )}
      </div>

      {categoryProducts.length === 0 ? (
        <div className="flex-1 grid place-items-center text-sm muted">
          {translateText('محصولی در این دسته‌بندی وجود ندارد ')}
        </div>
      ) : (
        <div className="category-showcase-grid flex-1 grid grid-cols-3 min-[1600px]:grid-cols-4 gap-2.5 min-h-0">
          {categoryProducts.map((p) => (
            <Link
              key={p._id}
              to={`/product/${p._id}`}
              className="category-showcase-product group flex min-w-0 flex-col rounded-xl overflow-hidden"
              style={{ background: 'var(--card2)' }}
            >
              <div className="category-showcase-image relative aspect-square w-full shrink-0 overflow-hidden rounded-lg">
                <StorageImageComponent
                  file={productImages(p)[0]}
                  alt={p.name}
                  compact
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <span className="mt-2 min-h-8 text-xs font-bold leading-4 line-clamp-2 break-words">
                {p.name}
              </span>
              <span className="category-showcase-price mt-1.5 text-xs font-black text-accent">
                {formatPrice(finalPrice(p), p.price?.currency)}
                {hasDiscount(p) && (
                  <del className="muted text-xs font-normal">
                    {formatPrice(p.price?.amount, p.price?.currency)}
                  </del>
                )}
              </span>
              <span className="mt-auto pt-2 flex items-center justify-between gap-1">
                <TrustBadge product={p} size={11} />
                {hasDiscount(p) && (
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-black shrink-0"
                    style={{ background: 'var(--primary-color)', color: 'var(--on-primary)' }}
                  >
                    {toFa(p.discount.percentage)}٪
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── اسکرول ساده از آخرین محصولات ───────── */
function HeaderComponent({ products = [], categories = [], loading = false }) {
  useEffect(() => {
    const pane = document.querySelector('[data-testid="category-showcase"]');
    const layout = pane?.closest('.home-category-layout');
    if (!pane || !layout) return;
    const update = () => layout.style.setProperty('--showcase-h', `${Math.ceil(pane.getBoundingClientRect().height)}px`);
    const observer = new ResizeObserver(update); observer.observe(pane); update();
    return () => observer.disconnect();
  }, []);
  /* محو‌شدگی ردیف چیپ‌های موبایل فقط وقتی سرریز دارد */
  const [mobileRowRef, , mobileRowFade] = useScrollFade();
  const [hoveredCatId, setHoveredCatId] = useState(null);
  const hoverTimer = useRef(null);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  const selectCategory = (id, immediate = false) => {
    clearTimeout(hoverTimer.current);
    if (!id) return;
    if (immediate) setHoveredCatId(id);
    else setHoveredCatId(id);
  };

  // دسته‌بندی فعال: دسته‌ای که موس روی آن است، یا به صورت پیش‌فرض اولین دسته‌ای که محصول دارد
  const activeCategory = useMemo(() => {
    if (!categories.length) return null;
    if (hoveredCatId) {
      return categories.find((c) => String(c._id) === String(hoveredCatId)) || categories[0];
    }
    const firstWithProducts = categories.find((c) => products.some((p) => belongsToCategory(p, c)));
    return firstWithProducts || categories[0];
  }, [categories, products, hoveredCatId]);

  return (
    <>
      <HeroSearch />
      <WelcomeStrip />

      <div className="site-width max-w-[1440px] mx-auto px-4 mt-5">
        {/* چیپ دسته‌بندی برای موبایل */}
        <div
          ref={mobileRowRef}
          style={mobileRowFade}
          className="scroll-fade-x lg:hidden flex gap-2 overflow-x-auto pb-3 no-scrollbar"
        >
          {loading
            ? [0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-8 w-24 shrink-0" />)
            : categories.map((c) => (
                <Link
                  key={c._id}
                  to={`/products?category_id=${c._id}`}
                  className="chip whitespace-nowrap"
                >
                  {c.name}
                </Link>
              ))}
        </div>

        {/* دسکتاپ: [سایدبار دسته‌ها | کارت‌های محتوا | بنر پیشنهادهای داغ] — مثل Alibaba.com */}
        <section data-testid="home-category-browser" className="hidden lg:block space-y-4">
          <div className="home-category-layout grid min-w-0 grid-cols-[220px_minmax(0,1fr)] min-[1440px]:grid-cols-[240px_minmax(0,1fr)_240px] gap-4">
            <CategoryCard
              categories={categories}
              loading={loading}
              activeCategoryId={activeCategory?._id}
              onHoverCategory={selectCategory}
            />
            <div
              data-testid="category-showcase"
              className="min-w-0"
              aria-live="polite"
              aria-atomic="true"
            >
              <CategoryShowcase category={activeCategory} products={products} loading={loading} />
            </div>
            <div className="home-hot-picks-slot hidden min-[1440px]:block min-w-0">
              <HotPicksBannerComponent products={products} />
            </div>
          </div>
        </section>

        {/* کشف فروشندگان — لینک به تب «تأمین‌کنندگان» صفحه فروشگاه */}
        <Link
          to="/products?tab=suppliers"
          className="seller-discovery-banner card mt-3 flex items-center justify-between gap-4 rounded-xl px-5 sm:px-6 py-4 hover:-translate-y-0.5 transition-transform"
        >
          <span className="seller-discovery-emblem" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none">
              <path
                d="M9 21h30v20H9zM6 21l5-13h26l5 13M18 41V28h12v13M6 21c0 7 9 7 9 0 0 7 9 7 9 0 0 7 9 7 9 0 0 7 9 7 9 0"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="seller-discovery-banner__copy">
            <b>{translateText('b2b.sellers')}</b>
            <span>{translateText('b2b.sellersDesc')}</span>
          </span>
          <span className="seller-discovery-banner__action">
            {translateText('مشاهده فروشندگان ')}
            <ChevronLeft className="logical-icon" size={18} />
          </span>
        </Link>
      </div>
    </>
  );
}

export default HeaderComponent;
