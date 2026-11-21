import { t as translateText } from '../../i18n/runtime.js';
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowUpDown,
  Heart,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

import ProductGridComponent from '../../components/product/ProductGridComponent';
import { useShop } from '../../contexts/ShopContext';
import { API } from '../../config/api';
import { finalPrice, hasDiscount, toFa } from '../../utils/helpers/format';
import { getBody } from '../../utils/helpers/response';

/* ------------------------------------------------------------------ */
/* مرتب‌سازی                                                          */
/* ------------------------------------------------------------------ */

const SORTS = [
  { key: 'newest', label: translateText("تازه‌ترین") },
  { key: 'cheap', label: translateText("ارزان‌ترین") },
  { key: 'expensive', label: translateText("گران‌ترین") },
  { key: 'discount', label: translateText("بیشترین تخفیف") },
];

/* ------------------------------------------------------------------ */
/* صفحه‌ی علاقه‌مندی‌ها                                                 */
/* ------------------------------------------------------------------ */

function FavoritesPage() {
  const { favorites, clearFavorites } = useShop();

  const [products, setProducts] = useState([]);
  const [missing, setMissing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [query, setQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!favorites.length) {
      setProducts([]);
      setMissing(0);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setMissing(0);

    Promise.all(
      favorites.map((id) =>
        axios
          .get(`${API}/product/${id}`, { timeout: 15000 })
          .then((res) => {
            const product = getBody(res);
            return product ? { ...product, _order: favorites.indexOf(id) } : null;
          })
          .catch(() => null),
      ),
    )
      .then((list) => {
        if (cancelled) return;
        const found = list.filter(Boolean);
        setProducts(found);
        setMissing(list.length - found.length);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [favorites]);

  /* ---------- فیلتر و مرتب‌سازی ---------- */
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((product) => {
      if (!q) return true;
      return (
        String(product.name || '').toLowerCase().includes(q) ||
        String(product.brand || '').toLowerCase().includes(q) ||
        String(product.store_name || '').toLowerCase().includes(q)
      );
    });

    const byPrice = (a, b) => finalPrice(a) - finalPrice(b);

    if (sort === 'cheap') list = [...list].sort(byPrice);
    if (sort === 'expensive') list = [...list].sort((a, b) => byPrice(b, a));
    if (sort === 'discount') {
      list = [...list].sort((a, b) => {
        const da = hasDiscount(a) ? Number(a.discount?.percentage) || 0 : 0;
        const db = hasDiscount(b) ? Number(b.discount?.percentage) || 0 : 0;
        return db - da;
      });
    }
    if (sort === 'newest') list = [...list].sort((a, b) => (a._order ?? 0) - (b._order ?? 0));

    return list;
  }, [products, query, sort]);

  const discounted = useMemo(() => products.filter(hasDiscount).length, [products]);

  const handleClear = () => {
    clearFavorites();
    setConfirmClear(false);
    toast.success(translateText("لیست علاقه‌مندی‌ها پاک شد"));
  };

  /* ---------- حالت خالی ---------- */
  const empty = !loading && products.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-6">
      {/* ───── هدر صفحه ───── */}
      <header className="card mb-4 flex flex-col gap-3 rounded-3xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
            style={{ background: 'rgba(255,77,109,0.14)' }}
          >
            <Heart size={20} style={{ color: '#ff4d6d' }} fill="#ff4d6d" />
          </span>
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-lg font-black sm:text-xl">{translateText("علاقه‌مندی‌های من ")}<span
                className="rounded-full px-2 py-0.5 text-[11px] font-black"
                style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
              >
                {toFa(products.length)}
              </span>
            </h1>
            <p className="mt-0.5 text-[11px] muted">
              {discounted > 0
                ? translateText("{{v0}} کالا از لیست شما تخفیف دارد — قبل از پایان تخفیف بررسی کنید.", {v0: (toFa(discounted))})
                : translateText("کالاهایی که ذخیره کرده‌اید همیشه همین‌جا در دسترس‌اند.")}
            </p>
          </div>
        </div>

        {products.length > 0 && (
          <div className="flex items-center gap-2">
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="btn-ghost inline-flex h-10 items-center gap-1.5 !py-0 text-xs text-red-400 hover:!border-red-400"
              >
                <Trash2 size={14} />{translateText("پاک کردن همه ")}</button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-red-500 px-3 text-xs font-black text-white"
                >
                  <Trash2 size={14} />{translateText("مطمئنم، پاک کن ")}</button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="btn-ghost grid h-10 w-10 place-items-center !p-0"
                  aria-label={translateText("انصراف")}
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ───── نوار ابزار ───── */}
      {!empty && (
        <div className="card mb-4 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search
              size={15}
              className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 muted"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={translateText("جستجو در علاقه‌مندی‌ها…")}
              className="input h-10 !pe-9 text-xs"
              aria-label={translateText("جستجو در علاقه‌مندی‌ها")}
            />
          </div>

          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto sm:flex-wrap sm:overflow-visible">
            <span className="me-1 inline-flex shrink-0 items-center gap-1 text-[11px] muted">
              <ArrowUpDown size={13} />{translateText("مرتب‌سازی ")}</span>
            {SORTS.map((item) => {
              const on = sort === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSort(item.key)}
                  aria-pressed={on}
                  className="shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold transition"
                  style={{
                    borderColor: on ? 'var(--primary-color)' : 'var(--border)',
                    background: on ? 'var(--primary-color)' : 'transparent',
                    color: on ? 'var(--charcoal)' : 'var(--muted)',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ───── محتوا ───── */}
      {empty ? (
        <div className="card rounded-3xl p-8 text-center sm:p-12">
          <span
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: 'rgba(255,77,109,0.12)' }}
          >
            <Heart size={28} style={{ color: '#ff4d6d' }} />
          </span>
          <h2 className="mt-4 text-base font-black">{translateText("لیست علاقه‌مندی‌های شما خالی است")}</h2>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-6 muted">{translateText("روی آیکن قلب هر کالا بزنید تا اینجا ذخیره شود و بعداً راحت پیدایش کنید. ")}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Link to="/products" className="btn-primary inline-flex items-center gap-2">
              <ShoppingBag size={16} />{translateText("شروع خرید ")}</Link>
            <Link to="/" className="btn-ghost inline-flex items-center gap-2">
              <Sparkles size={16} />{translateText("پیشنهادهای امروز ")}</Link>
          </div>
        </div>
      ) : (
        <>
          {missing > 0 && !loading && (
            <div
              className="mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] muted"
              style={{ borderColor: 'var(--border)', background: 'var(--card2)' }}
            >
              <X size={13} />
              {toFa(missing)}{translateText(" کالا از این لیست در فروشگاه موجود نیست و حذف شد. ")}</div>
          )}

          {visible.length === 0 && !loading ? (
            <div className="card rounded-3xl p-10 text-center">
              <Search size={28} className="mx-auto muted" />
              <div className="mt-3 text-sm font-black">{translateText("چیزی با این جستجو پیدا نشد")}</div>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="btn-ghost mt-4 inline-flex items-center gap-1.5 text-xs"
              >
                <X size={14} />{translateText("پاک کردن جستجو ")}</button>
            </div>
          ) : (
            <ProductGridComponent products={visible} loading={loading} columns={4} />
          )}

          {visible.length > 0 && (
            <div className="mt-4 flex items-center gap-1.5 rounded-2xl border border-theme px-3 py-2.5 text-[11px] muted">
              <Heart size={13} style={{ color: '#ff4d6d' }} fill="#ff4d6d" />{translateText("با زدن قلب هر کارت، آن کالا از این لیست حذف می‌شود. ")}</div>
          )}
        </>
      )}
    </div>
  );
}

export default FavoritesPage;
