import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronLeft,
  Star,
  Tag,
  ClipboardList,
  Medal,
  Sparkles,
  Flame,
  TrendingUp,
} from 'lucide-react';
import StorageImageComponent from './StorageImageComponent';
import ThemeToggleComponent from './ThemeToggleComponent';
import { useShop } from '../../contexts/ShopContext';
import { hasDiscount, productImages } from '../../utils/helpers/format';

const NAVY = 'linear-gradient(135deg,#0a1736 0%,#162e66 55%,#0f2150 100%)';

/* ───────── هیرو: تب‌ها + باکس جستجو ───────── */
function HeroSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const v = q.trim();
    navigate(v ? `/products?search=${encodeURIComponent(v)}` : '/products');
  };

  const tab = 'relative pb-2 whitespace-nowrap';

  return (
    <section className="px-4 pt-8 pb-10" style={{ background: NAVY }}>
      <div className="flex items-center justify-center gap-6 sm:gap-12 text-xl sm:text-[28px] font-black">
        <Link to="/products" className={tab} style={{ color: 'var(--primary-color)' }}>
          محصولات
          <span
            className="absolute inset-x-0 bottom-0 h-1 rounded-full"
            style={{ background: 'var(--primary-color)' }}
          />
        </Link>
        <a href="#stores" className={`${tab} text-white`}>
          فروشگاه‌ها
        </a>
        <Link to="/products?discount=true" className={`${tab} text-white`}>
          تخفیف‌ها
        </Link>
      </div>

      <form
        onSubmit={submit}
        className="card mt-6 max-w-[960px] mx-auto rounded-[20px] p-4"
        style={{ border: '2px solid var(--primary-color)' }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="دنبال چه محصولی می‌گردید؟"
          className="w-full bg-transparent outline-none text-base placeholder:opacity-60"
        />
        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm muted">
            <Link to="/products?discount=true" className="flex items-center gap-1.5 hover:text-yellow">
              <Flame size={18} /> پیشنهادهای ویژه
            </Link>
            <span className="w-px h-4" style={{ background: 'var(--border)' }} />
            <Link to="/products" className="flex items-center gap-1.5 hover:text-yellow">
              <TrendingUp size={18} /> پرفروش‌ترین‌ها
            </Link>
          </div>
          <button type="submit" className="btn-yellow !rounded-full flex items-center gap-2 px-8">
            <Search size={16} /> جستجو
          </button>
        </div>
      </form>
    </section>
  );
}

/* ───────── نوار خوش‌آمد ───────── */
function WelcomeStrip() {
  const { user } = useShop();
  const name = user?.name || user?.full_name;
  const link = 'flex items-center gap-2 text-[15px] font-semibold hover:text-yellow';

  return (
    <div style={{ background: 'var(--card2)' }}>
      <div className="max-w-[1440px] mx-auto px-4 h-[72px] flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-black">
          {user ? `سلام ${name || ''}`.trim() : 'به فروشگاه خوش آمدید'}
        </h2>

        <ThemeToggleComponent
          showLabel={false}
          className="md:hidden w-10 h-10 rounded-full card grid place-items-center"
        />

        <div className="hidden md:flex items-center gap-4">
          <Link to="/profile" className={link}>
            <ClipboardList size={22} /> درخواست فروشندگی
          </Link>
          <span className="w-px h-4" style={{ background: 'var(--border)' }} />
          <Link to="/products" className={link}>
            <Medal size={22} /> پرفروش‌ها
          </Link>
          <span className="w-px h-4" style={{ background: 'var(--border)' }} />
          <Link to="/products?discount=true" className={link}>
            <Sparkles size={22} /> پیشنهاد ویژه
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ───────── سایدبار دسته‌بندی (آیکون ثابت) ───────── */
function CategoryCard({ categories, loading }) {
  const row =
    'flex items-center gap-3 px-4 py-3 text-[15px] hover:text-yellow hover:bg-[var(--card2)] transition-colors';

  return (
    <aside className="hidden lg:flex flex-col h-[304px] card rounded-xl overflow-hidden">
      <ul className="flex-1 overflow-y-auto py-1 [scrollbar-width:thin]">
        <li>
          <Link to="/products" className={row}>
            <Star size={22} strokeWidth={1.5} className="shrink-0" />
            <span className="flex-1">دسته‌بندی‌های پیشنهادی</span>
            <ChevronLeft size={16} className="muted" />
          </Link>
        </li>
        {loading
          ? Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="px-4 py-3">
                <div className="skeleton h-5 w-full" />
              </li>
            ))
          : categories.map((c) => (
              <li key={c._id}>
                <Link to={`/products?category_id=${c._id}`} className={row}>
                  <Tag size={22} strokeWidth={1.5} className="shrink-0" />
                  <span className="flex-1 leading-5 line-clamp-2">{c.name}</span>
                  <ChevronLeft size={16} className="muted shrink-0" />
                </Link>
              </li>
            ))}
      </ul>
    </aside>
  );
}

/* ───────── کارت «پرجستجو» ───────── */
function FrequentCard({ cat, product }) {
  return (
    <Link
      to={`/products?category_id=${cat._id}`}
      className="hidden xl:flex flex-col h-[304px] card rounded-xl p-5 hover:-translate-y-1 transition-transform"
    >
      <div className="text-lg font-black">پرجستجو</div>
      <div className="text-sm muted mt-0.5 truncate">{cat.name}</div>
      <div
        className="mt-3 flex-1 min-h-0 rounded-lg overflow-hidden"
        style={{ background: 'var(--card2)' }}
      >
        <StorageImageComponent
          file={productImages(product)[0]}
          alt={cat.name}
          className="w-full h-full object-cover"
        />
      </div>
    </Link>
  );
}

/* ───────── بنر اسلایدی ───────── */
function PromoBanner({ products, loading }) {
  const slides = useMemo(() => {
    const d = products.filter(hasDiscount);
    return (d.length >= 3 ? d : products).slice(0, 5);
  }, [products]);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (loading) return <div className="skeleton h-[220px] sm:h-[304px] rounded-xl" />;

  return (
    <div
      className="relative h-[220px] sm:h-[304px] rounded-xl overflow-hidden"
      style={{ background: NAVY, border: '1px solid var(--border)' }}
    >
      {slides.map((p, idx) => (
        <div
          key={p._id}
          className={`absolute inset-x-0 bottom-0 h-[72%] transition-opacity duration-700 ${
            idx === i ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <StorageImageComponent
            file={productImages(p)[0]}
            alt={p.name}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#0a1736] via-[#0a1736]/50 to-transparent" />

      <div className="relative z-10 text-center pt-5 px-4">
        <div className="text-gray-300 text-sm sm:text-base font-semibold">
          محصولات پرطرفدار با بهترین قیمت
        </div>
        <div className="text-white text-xl sm:text-2xl font-black mt-1">
          پیشنهادهای ویژه برای شما
        </div>
      </div>

      <Link
        to="/products?discount=true"
        className="btn-yellow !rounded-full absolute z-10 inset-x-0 mx-auto bottom-11 w-44 text-center"
      >
        مشاهده بیشتر
      </Link>

      <div className="absolute z-10 bottom-4 inset-x-0 flex justify-center gap-1.5">
        {slides.map((p, n) => (
          <button
            key={p._id}
            type="button"
            onClick={() => setI(n)}
            aria-label={`اسلاید ${n + 1}`}
            className={`h-2 rounded-full transition-all ${
              n === i ? 'w-5 bg-white' : 'w-2 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ───────── اصلی ───────── */
function HeaderComponent({ products = [], categories = [], loading = false }) {
  const picks = useMemo(() => {
    const out = [];
    for (const c of categories) {
      const p = products.find((x) => String(x.category_id) === String(c._id));
      if (p) out.push({ cat: c, product: p });
      if (out.length === 3) break;
    }
    return out;
  }, [categories, products]);

  return (
    <>
      <HeroSearch />
      <WelcomeStrip />

      <div className="max-w-[1440px] mx-auto px-4 mt-5">
        {/* چیپ دسته‌بندی برای موبایل */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 no-scrollbar">
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

        <div className="grid gap-3 grid-cols-1 lg:grid-cols-[285px_minmax(0,1fr)] xl:grid-cols-[285px_repeat(3,minmax(0,1fr))_380px]">
          <CategoryCard categories={categories} loading={loading} />

          {loading
            ? [0, 1, 2].map((i) => <div key={i} className="hidden xl:block skeleton h-[304px]" />)
            : [0, 1, 2].map((i) =>
                picks[i] ? (
                  <FrequentCard key={picks[i].cat._id} cat={picks[i].cat} product={picks[i].product} />
                ) : (
                  <div key={i} className="hidden xl:block" />
                ),
              )}

          <PromoBanner products={products} loading={loading} />
        </div>

        <Link
          to="/products"
          className="card mt-3 flex items-center justify-between rounded-xl px-5 sm:px-6 h-16 hover:-translate-y-0.5 transition-transform"
        >
          <span className="text-sm sm:text-[15px]">
            <b className="text-yellow">ارسال سریع</b> به سراسر کشور و ضمانت اصالت کالا
          </span>
          <span className="flex items-center gap-1 text-sm font-bold text-yellow shrink-0">
            شروع خرید <ChevronLeft size={16} />
          </span>
        </Link>
      </div>
    </>
  );
}

export default HeaderComponent;