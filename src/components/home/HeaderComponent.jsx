import { t as translateText } from '../../i18n/runtime.js';
import React, { useMemo, useState } from 'react';
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
import { hasDiscount, productImages, toFa } from '../../utils/helpers/format';
import useScrollFade from '../../hooks/useScrollFade';

/* ───────── هیرو: تب‌ها + باکس جستجو ─────────
   موبایل: جستجوی فشرده‌ی قرصی‌شکل + ردیف سرویس‌های آیکنی (مثل اپ علی‌بابا)
   دسکتاپ: جعبه‌ی جستجوی بزرگ وسط‌چین با حاشیه‌ی رنگ برند                    */
function HeroSearch() {
  const tab = 'relative pb-2 whitespace-nowrap';

  return (
    <section
      className="px-3 pt-3 pb-4 sm:px-4 sm:pt-6 sm:pb-8 md:pt-4 md:pb-6"
      style={{ background: 'var(--card)' }}
    >
      {/* تب‌ها — پخش‌شده در کل عرض مثل اپ علی‌بابا؛ فعال با زیرخط نارنجی */}
      <div className="flex items-center justify-between gap-2 px-1 text-sm min-[400px]:text-base sm:justify-center sm:gap-12 sm:text-xl md:text-2xl font-black">
        <Link to="/products" className={`${tab} flex-1 text-center sm:flex-none`} style={{ color: 'var(--accent-text)' }}>
          {translateText('محصولات ')}
          <span
            className="absolute inset-x-2 bottom-0 h-[3px] rounded-full sm:inset-x-0"
            style={{ background: 'var(--primary-color)' }}
          />
        </Link>
        <Link to="/products?tab=suppliers" className={`${tab} muted flex-1 text-center transition hover:opacity-80 sm:flex-none`}>
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
            { to: '/products', icon: LayoutGrid, label: translateText(' همه محصولات '), tone: '#2563eb' },
            { to: '/products?discount=true', icon: Flame, label: translateText(' پیشنهاد ویژه '), tone: '#e2352c' },
            { to: '/products', icon: TrendingUp, label: translateText(' پرفروش‌ها '), tone: '#0d9488' },
            { to: '/products?tab=suppliers', icon: Store, label: translateText(' فروشندگان '), tone: '#7c3aed' },
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
                  style={{ background: 'color-mix(in srgb, ' + item.tone + ' 14%, transparent)', color: item.tone }}
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
        className="card mt-5 hidden max-w-[960px] mx-auto rounded-2xl p-4 lg:block"
        style={{ border: '2px solid var(--primary-color)' }}
      >
        <ProductSearchBox variant="hero" />
        <div
          className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2.5 text-[11px] sm:mt-3 sm:gap-y-2 sm:pt-3 sm:text-sm muted"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <Link to="/products?discount=true" className="flex items-center gap-1.5 hover:text-yellow">
            <Flame size={16} />{translateText(' پیشنهادهای ویژه ')}</Link>
          <span className="hidden sm:block h-4 w-px" style={{ background: 'var(--border)' }} />
          <Link to="/products" className="flex items-center gap-1.5 hover:text-yellow">
            <TrendingUp size={16} />{translateText(' پرفروش‌ترین‌ها ')}</Link>
          <span className="hidden sm:block h-4 w-px" style={{ background: 'var(--border)' }} />
          <Link to="/products?tab=suppliers" className="flex items-center gap-1.5 hover:text-yellow">
            <Store size={16} />{translateText(' کشف فروشندگان ')}</Link>
        </div>
      </div>
    </section>
  );
}

/* ───────── نوار خوش‌آمد ───────── */
function WelcomeStrip() {
  const { user } = useShop();
  const name = user?.firstname || user?.name || user?.full_name || user?.username;
  const link = 'flex items-center gap-2 text-[15px] font-semibold hover:text-yellow';

  return (
    <div style={{ background: 'var(--card2)' }} className="hidden md:block">
      <div className="max-w-[1440px] mx-auto px-4 h-[72px] flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-black">
          {user ? translateText("سلام{{v0}}", {v0: (name ? `، ${name}` : '')}) : translateText("به فروشگاه خوش آمدید")}
        </h2>

        <ThemeToggleComponent
          showLabel={false}
          className="md:hidden w-10 h-10 rounded-full card grid place-items-center"
        />

        <div className="hidden md:flex items-center gap-4">
          <Link to="/profile" className={link}>
            <ClipboardList size={22} />{translateText(" درخواست فروشندگی ")}</Link>
          <span className="w-px h-4" style={{ background: 'var(--border)' }} />
          <Link to="/products" className={link}>
            <Medal size={22} />{translateText(" پرفروش‌ها ")}</Link>
          <span className="w-px h-4" style={{ background: 'var(--border)' }} />
          <Link to="/products?discount=true" className={link}>
            <Sparkles size={22} />{translateText(" پیشنهاد ویژه ")}</Link>
        </div>
      </div>
    </div>
  );
}

/* ───────── سایدبار دسته‌بندی (با قابلیت هاور) ───────── */
function CategoryCard({ categories, loading, activeCategoryId, onHoverCategory }) {
  return (
    <aside className="hidden lg:flex flex-col h-[304px] card rounded-xl overflow-hidden">
      <ul className="flex-1 overflow-y-auto py-1 [scrollbar-width:thin]">
        {loading
          ? Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="px-4 py-3">
                <div className="skeleton h-5 w-full" />
              </li>
            ))
          : categories.map((c) => {
              const isActive = String(c._id) === String(activeCategoryId);
              return (
                <li key={c._id} onMouseEnter={() => onHoverCategory(c._id)}>
                  <Link
                    to={`/products?category_id=${c._id}`}
                    className={`flex items-center gap-3 px-4 py-3 text-[15px] transition-colors ${
                      isActive
                        ? 'text-yellow bg-[var(--card2)] font-bold'
                        : 'hover:text-yellow hover:bg-[var(--card2)]'
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
  if (loading) {
    return <div className="hidden xl:block skeleton h-[304px] w-full rounded-xl" />;
  }

  const categoryProducts = category
    ? products.filter((p) => String(p.category_id) === String(category._id)).slice(0, 3)
    : [];

  return (
    <div className="hidden xl:flex w-full flex-col h-[304px] card rounded-xl p-4">
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
          >{translateText('مشاهده همه ')}<ChevronLeft className="logical-icon" size={14} />
          </Link>
        )}
      </div>

      {categoryProducts.length === 0 ? (
        <div className="flex-1 grid place-items-center text-sm muted">{translateText('محصولی در این دسته‌بندی وجود ندارد ')}</div>
      ) : (
        <div
          className="flex-1 grid gap-3 min-h-0"
          style={{ gridTemplateColumns: `repeat(${categoryProducts.length}, minmax(0, 1fr))` }}
        >
          {categoryProducts.map((p) => (
            <Link
              key={p._id}
              to={`/product/${p._id}`}
              className="group flex flex-col rounded-xl p-2 transition-transform hover:-translate-y-1 overflow-hidden"
              style={{ background: 'var(--card2)' }}
            >
              <div className="aspect-square min-h-0 rounded-lg overflow-hidden">
                <StorageImageComponent
                  file={productImages(p)[0]}
                  alt={p.name}
                  compact
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="mt-2 text-xs font-bold leading-5 line-clamp-2 break-words">
                {p.name}
              </span>
              <span className="mt-auto pt-1.5 flex items-center justify-between gap-1">
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
function LatestProducts({ products, loading }) {
  if (loading) return <div className="skeleton h-[304px] rounded-xl" />;

  const latest = products.slice(0, 10);

  return (
    <div className="flex w-full flex-col h-[304px] card rounded-xl p-4 overflow-hidden">
      <div
        className="flex items-center justify-between pb-3 mb-2 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h3 className="text-base font-black">{translateText("آخرین محصولات")}</h3>
        <Link
          to="/products"
          className="text-xs font-semibold flex items-center gap-1 text-yellow"
        >{translateText("همه محصولات ")}<ChevronLeft className="logical-icon" size={14} />
        </Link>
      </div>

      {latest.length === 0 ? (
        <div className="flex-1 grid place-items-center text-sm muted">{translateText("محصولی یافت نشد ")}</div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 ps-1 [scrollbar-width:thin]">
          {latest.map((p) => (
            <Link
              key={p._id}
              to={`/product/${p._id}`}
              className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-[var(--card2)] group"
            >
              <div
                className="w-14 h-14 rounded-lg overflow-hidden shrink-0"
                style={{ background: 'var(--card2)' }}
              >
                <StorageImageComponent
                  file={productImages(p)[0]}
                  alt={p.name}
                  compact
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <MarqueeText
                  text={p.name}
                  className="text-sm font-semibold group-hover:text-yellow"
                />
                {hasDiscount(p) && (
                  <span className="inline-block mt-1 text-[11px] text-yellow font-bold">{translateText("دارای تخفیف ویژه ")}</span>
                )}
                {/* نشان اعتماد فروشنده — فهرست «آخرین محصولات» */}
                <span className="mt-1 flex min-h-[16px] items-center gap-1">
                  <TrustBadge product={p} size={11} />
                </span>
              </div>

              <ChevronLeft size={16} className="logical-icon muted shrink-0 group-hover:text-yellow" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── اصلی ───────── */
function HeaderComponent({ products = [], categories = [], loading = false }) {
  /* محو‌شدگی ردیف چیپ‌های موبایل فقط وقتی سرریز دارد */
  const [mobileRowRef, , mobileRowFade] = useScrollFade();
  const [hoveredCatId, setHoveredCatId] = useState(null);

  // دسته‌بندی فعال: دسته‌ای که موس روی آن است، یا به صورت پیش‌فرض اولین دسته‌ای که محصول دارد
  const activeCategory = useMemo(() => {
    if (!categories.length) return null;
    if (hoveredCatId) {
      return categories.find((c) => String(c._id) === String(hoveredCatId)) || categories[0];
    }
    const firstWithProducts = categories.find((c) =>
      products.some((p) => String(p.category_id) === String(c._id)),
    );
    return firstWithProducts || categories[0];
  }, [categories, products, hoveredCatId]);

  return (
    <>
      <HeroSearch />
      <WelcomeStrip />

      <div className="max-w-[1440px] mx-auto px-4 mt-5">
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
        <div className="hidden lg:grid gap-3 grid-cols-1 lg:grid-cols-[285px_minmax(0,1fr)] xl:grid-cols-[285px_minmax(0,1fr)_340px]">
          <CategoryCard
            categories={categories}
            loading={loading}
            activeCategoryId={activeCategory?._id}
            onHoverCategory={setHoveredCatId}
          />

          <div className="flex min-w-0 flex-col gap-3 xl:flex-row">
            <div className="flex min-w-0 flex-1 flex-col">
              <LatestProducts products={products} loading={loading} />
            </div>
            <div className="hidden min-w-0 flex-1 xl:flex">
              <CategoryShowcase
                category={activeCategory}
                products={products}
                loading={loading}
              />
            </div>
          </div>

          <div className="hidden xl:block">
            <HotPicksBannerComponent products={products} />
          </div>
        </div>

        {/* کشف فروشندگان — لینک به تب «تأمین‌کنندگان» صفحه فروشگاه */}
        <Link
          to="/products?tab=suppliers"
          className="card mt-3 flex items-center justify-between rounded-xl px-5 sm:px-6 h-16 hover:-translate-y-0.5 transition-transform"
        >
          <span className="text-sm sm:text-[15px]">
            <b className="text-yellow">{translateText("b2b.sellers")}</b>
            {' '}
            {translateText("b2b.sellersDesc")}
          </span>
          <span className="flex items-center gap-1 text-sm font-bold text-yellow shrink-0">{translateText("مشاهده فروشندگان ")}<ChevronLeft className="logical-icon" size={16} />
          </span>
        </Link>
      </div>
    </>
  );
}

export default HeaderComponent;
