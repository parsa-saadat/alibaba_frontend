import React, { useEffect, useId, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, X, ArrowUpLeft } from 'lucide-react';
import StorageImageComponent from '../common/StorageImageComponent';
import { Loading } from '../common/ScroolToTopComponent';
import { getList } from '../../utils/helpers/response';
import {
  formatPrice,
  finalPrice,
  hasDiscount,
  productImages,
  toFa,
} from '../../utils/helpers/format';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

function SearchBoxComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [retry, setRetry] = useState(0);
  const boxRef = useRef(null);
  const listId = useId();
  const trimmed = query.trim();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onOutside = (event) => {
      if (!boxRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
    if (!open) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const timer = window.setTimeout(
      () => {
        axios
          .get(`${API}/product`, {
            params: trimmed ? { name: trimmed, limit: 8, page: 1 } : { limit: 6, page: 1 },
            signal: controller.signal,
            timeout: 12000,
          })
          .then((response) => {
            if (response.data?.success === false) {
              throw new Error(response.data.message);
            }
            setResults(getList(response));
          })
          .catch((err) => {
            if (!axios.isCancel(err)) setError('رتباط با بک‌اند برقرار نشد.');
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
  }, [trimmed, open, retry]);

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

  return (
    <div ref={boxRef} className="search-box">
      <form onSubmit={submitSearch} className="search-form" role="search">
        <div className="relative flex-1 min-w-0">
          <Search
            size={17}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 muted pointer-events-none"
          />
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
            placeholder="جستجو در محصولات، برند یا دسته‌بندی…"
            className="input !pr-10 !pl-9 !py-2.5 text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="پاک کردن جستجو"
              className="search-clear"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <button type="submit" className="btn-yellow !py-2.5 !px-4 text-sm shrink-0">
          جستجو
        </button>
      </form>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="نتایج جستجو"
          className="search-dropdown card"
        >
          <div className="search-dropdown-heading">
            <span>{trimmed ? `نتایج برای «${trimmed}»` : 'پیشنهادها'}</span>
            {loading && <Loading label="در حال جستجو…" className="!text-xs" />}
          </div>

          <div className="search-results">
            {error ? (
              <div className="p-6 text-center text-sm muted">
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
              <div className="p-3 space-y-2" aria-hidden="true">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="skeleton h-14" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center text-sm muted">محصولی مطابق جستجو پیدا نشد.</div>
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
                    <div className="text-xs muted truncate">
                      {product.brand || 'بدون برند'}
                      {hasDiscount(product)
                        ? ` • ${toFa(product.discount.percentage)}٪ تخفیف`
                        : ''}
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
            <span>مشاهده همه نتایج در صفحه محصولات</span>
            <ArrowUpLeft size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchBoxComponent;
