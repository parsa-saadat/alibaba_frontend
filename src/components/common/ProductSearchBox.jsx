import React, { useEffect, useId, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, X, ArrowUpLeft, TrendingUp, Clock3, PackageSearch } from 'lucide-react';
import StorageImageComponent from './StorageImageComponent';
import { Loading } from './ScroolToTopComponent';
import { getList } from '../../utils/helpers/response';
import {
  formatPrice,
  finalPrice,
  hasDiscount,
  productImages,
  toFa,
} from '../../utils/helpers/format';
import { API } from '../../config/api';

/* نرمال‌سازی متن برای مقایسه محلی (حذف نیم‌فاصله، فاصله و نشانه‌ها) */
const normalizeText = (value) =>
  String(value || '')
    .replace(/[\u200c\u200d\u200e\u200f\s\-_.،,«»"'()]/g, '')
    .toLowerCase();

/*
 * جستجوی زنده‌ی محصولات (AJAX) — مشترک بین هدر و هیروی صفحه اول.
 * variant:
 *   compact → باکس کوچک هدر
 *   hero    → باکس بزرگ وسط هیروی صفحه اول (نتایج دو ستونی)
 */
function ProductSearchBox({ variant = 'compact', placeholder }) {
  const navigate = useNavigate();
  const location = useLocation();
  const hero = variant === 'hero';

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [retry, setRetry] = useState(0);
  const [localMatch, setLocalMatch] = useState(false);
  const boxRef = useRef(null);
  const listId = useId();
  const trimmed = query.trim();

  /* بستن نتایج با تغییر مسیر */
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  /* بستن با کلیک بیرون */
  useEffect(() => {
    const onOutside = (event) => {
      if (!boxRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, []);

  /* دریافت پیشنهادها/نتایج از بک‌اند */
  useEffect(() => {
    setActiveIndex(-1);
    if (!open) return undefined;

    const controller = new AbortController();
    setLoading(true);
    setError('');

    const request = (params) =>
      axios.get(`${API}/product`, { params, signal: controller.signal, timeout: 12000 });

    const load = async () => {
      const response = await request(
        trimmed ? { name: trimmed, limit: 8, page: 1 } : { limit: 6, page: 1 },
      );
      if (response.data?.success === false) throw new Error(response.data.message);

      let rows = getList(response);
      let matchedLocally = false;

      // اگر بک‌اند نتیجه نداد، یک‌بار محلی جستجو می‌کنیم
      // (تفاوت نیم‌فاصله/فاصله در نام محصولات، مثل «لپ‌تاپ» و «لپ تاپ»)
      if (trimmed && rows.length === 0) {
        const allResponse = await request({ limit: 100, page: 1 });
        const needle = normalizeText(trimmed);
        rows = getList(allResponse)
          .filter((row) =>
            normalizeText(`${row.name} ${row.brand || ''} ${row.store_name || ''}`).includes(needle),
          )
          .slice(0, 8);
        matchedLocally = rows.length > 0;
      }

      if (controller.signal.aborted) return;
      setLocalMatch(matchedLocally);
      setResults(rows);
    };

    const timer = window.setTimeout(
      () => {
        load()
          .catch((err) => {
            if (!axios.isCancel(err)) setError('ارتباط با بک‌اند برقرار نشد.');
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          });
      },
      trimmed ? 240 : 0,
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, open, retry, hero]);

  const submitSearch = (event) => {
    event?.preventDefault();
    setOpen(false);
    navigate(trimmed ? `/products?name=${encodeURIComponent(trimmed)}` : '/products');
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open || !results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      setOpen(false);
      navigate(`/product/${results[activeIndex]._id}`);
    }
  };

  const clearButton = query ? (
    <button
      type="button"
      onClick={() => {
        setQuery('');
        setOpen(true);
      }}
      aria-label="پاک کردن جستجو"
      className={hero ? 'shrink-0 muted hover:text-yellow transition-colors' : 'search-clear'}
    >
      <X size={15} />
    </button>
  ) : null;

  const input = (
    <input
      value={query}
      onFocus={() => setOpen(true)}
      onChange={(event) => {
        setQuery(event.target.value);
        setOpen(true);
      }}
      onKeyDown={onKeyDown}
      role="combobox"
      aria-expanded={open}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-label="جستجو در محصولات علی‌بازار"
      placeholder={placeholder || (hero ? 'دنبال چه محصولی می‌گردید؟' : 'جستجو در محصولات، برند یا دسته‌بندی…')}
      className={
        hero
          ? 'min-w-0 flex-1 bg-transparent text-sm sm:text-base outline-none placeholder:opacity-60'
          : 'input !pr-10 !pl-9 !py-2.5 text-sm'
      }
    />
  );

  const submitButton = (
    <button
      type="submit"
      className={
        hero
          ? 'btn-yellow !rounded-full flex shrink-0 items-center gap-2 px-5 sm:px-8'
          : 'btn-yellow !py-2.5 !px-4 text-sm shrink-0'
      }
    >
      <Search size={hero ? 15 : 15} className={hero ? 'hidden sm:block' : undefined} />
      جستجو
    </button>
  );

  return (
    <div ref={boxRef} className={`search-box ${hero ? 'w-full' : ''}`}>
      {hero ? (
        <form
          onSubmit={submitSearch}
          role="search"
          className="flex items-center gap-2 sm:gap-3 rounded-xl px-3 py-2"
          style={{ background: 'rgba(255,255,255,.07)', border: '1px solid var(--border)' }}
        >
          <Search size={19} className="shrink-0 muted" aria-hidden="true" />
          {input}
          {clearButton}
          {submitButton}
        </form>
      ) : (
        <form onSubmit={submitSearch} className="search-form" role="search">
          <div className="relative flex-1 min-w-0">
            <Search
              size={17}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 muted pointer-events-none"
            />
            {input}
            {clearButton}
          </div>
          {submitButton}
        </form>
      )}

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="نتایج جستجو"
          className={`search-dropdown card ${hero ? '!rounded-2xl shadow-2xl' : ''}`}
        >
          <div className="search-dropdown-heading">
            <span className="flex items-center gap-1.5">
              {trimmed ? (
                <>
                  {localMatch ? 'نزدیک‌ترین نتایج برای' : 'نتایج برای'} «{trimmed}»
                </>
              ) : (
                <>
                  <TrendingUp size={14} className="text-yellow" />
                  پرطرفدارترین محصولات
                </>
              )}
            </span>
            {loading && <Loading label="در حال جستجو…" className="!text-xs" />}
          </div>

          <div className={`search-results ${hero ? 'is-grid' : ''}`}>
            {error ? (
              <div className={hero ? 'col-span-full p-6 text-center text-sm muted' : 'p-6 text-center text-sm muted'}>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => setRetry((value) => value + 1)}
                  className="btn-ghost mt-3 text-xs"
                >
                  تلاش دوباره
                </button>
              </div>
            ) : loading && !results.length ? (
              <div className={hero ? 'col-span-full p-3 grid sm:grid-cols-2 gap-2' : 'p-3 space-y-2'} aria-hidden="true">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="skeleton h-14" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className={hero ? 'col-span-full p-8 text-center text-sm muted' : 'p-6 text-center text-sm muted'}>
                <PackageSearch size={26} className="mx-auto mb-2 opacity-60" />
                محصولی مطابق جستجو پیدا نشد.
              </div>
            ) : (
              results.map((product, index) => (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => setOpen(false)}
                  className={`search-result ${index === activeIndex ? 'selected' : ''}`}
                >
                  <StorageImageComponent
                    file={productImages(product)[0]}
                    alt={product.name}
                    compact
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm truncate">{product.name}</div>
                    <div className="text-xs muted truncate flex items-center gap-1.5">
                      <span>{product.brand || 'بدون برند'}</span>
                      {hasDiscount(product) ? (
                        <span className="text-yellow font-bold">
                          • {toFa(product.discount.percentage)}٪ تخفیف
                        </span>
                      ) : (
                        product.store_name && <span>• {product.store_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-black text-yellow shrink-0">
                    {formatPrice(finalPrice(product))}
                  </div>
                </Link>
              ))
            )}
          </div>

          <button type="button" onClick={submitSearch} className="search-all">
            <span className="flex items-center gap-1.5">
              <Clock3 size={14} className="opacity-60" />
              {trimmed ? 'مشاهده همه نتایج در صفحه محصولات' : 'مشاهده همه محصولات'}
            </span>
            <ArrowUpLeft size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductSearchBox;
