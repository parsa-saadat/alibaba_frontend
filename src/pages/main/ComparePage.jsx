import { localizedField, readContent } from '../../i18n/content-fields';
import { t as translateText } from '../../i18n/runtime.js';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BadgeCheck,
  Check,
  GitCompareArrows,
  Minus,
  Sparkles,
  Store,
  Trash2,
  X,
} from 'lucide-react';

import { useShop } from '../../contexts/ShopContext';
import useSellerProfile, { useSellerProfiles } from '../../hooks/useSellerProfile';
import { TRUST } from '../../services/sellerApi';
import StorageImageComponent from '../../components/common/StorageImageComponent';
import { API } from '../../config/api';
import { getBody } from '../../utils/helpers/response';
import {
  formatPrice,
  finalPrice,
  toFa,
  productImages,
  hasDiscount,
  formatDimensions,
  formatWeight,
  formatProductionYear,
} from '../../utils/helpers/format';

const MAX = 4;

/* قیمت نهایی برای مقایسه (اگر قیمت نبود، Infinity تا پایین‌ترین انتخاب نشود) */
const priceOf = (product) => {
  const value = Number(finalPrice(product));
  return Number.isFinite(value) && value > 0 ? value : Infinity;
};

const stockOf = (product) => {
  if (product?.stock_status === 'OUT_OF_STOCK') return 0;
  const raw = product?.stock;
  if (raw == null || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

/* ردیف‌های جدول: هر گروه عنوان دارد و مقدار هر ستون با یک تابع ساخته می‌شود */
const GROUPS = [
  {
    title: translateText('قیمت و موجودی'),
    rows: [
      {
        label: translateText('قیمت نهایی'),
        render: (p) => formatPrice(finalPrice(p), p.price?.currency),
        strong: true,
        highlight: 'price',
      },
      {
        label: translateText('قیمت اصلی'),
        render: (p) =>
          hasDiscount(p) ? (
            <s className="muted">{formatPrice(p.price?.amount, p.price?.currency)}</s>
          ) : (
            '—'
          ),
      },
      {
        label: translateText('تخفیف'),
        render: (p) =>
          hasDiscount(p) ? (
            <span
              className="rounded-md px-1.5 py-0.5 text-[11px] font-black"
              style={{ background: 'rgba(229,57,53,0.14)', color: '#ff6b6b' }}
            >
              {toFa(p.discount.percentage)}
              {translateText('٪ ')}
            </span>
          ) : (
            '—'
          ),
      },
      {
        label: translateText('موجودی'),
        render: (p) => {
          const stock = stockOf(p);
          if (stock === 0)
            return <span style={{ color: '#e53935' }}>{translateText('ناموجود')}</span>;
          if (stock === null) return <span className="muted">{translateText('موجود')}</span>;
          return translateText('{{v0}} عدد', { v0: toFa(stock) });
        },
      },
    ],
  },
  {
    title: translateText('مشخصات فنی'),
    rows: [
      { label: translateText('برند'), render: (p) => localizedField(p.brand) || '—' },
      {
        label: translateText('سال تولید'),
        render: (p) => (p.production ? formatProductionYear(p.production) : '—'),
      },
      {
        label: translateText('گارانتی'),
        render: (p) => (p.warranty ? translateText('دارد') : translateText('ندارد')),
      },
      { label: translateText('ابعاد'), render: (p) => formatDimensions(p.dimensions) || '—' },
      { label: translateText('وزن'), render: (p) => formatWeight(p.weight) || '—' },
    ],
  },
  {
    title: translateText('فروشنده'),
    rows: [
      {
        label: translateText('فروشگاه'),
        render: (p, seller) => {
          const name = localizedField(seller?.store?.name) || localizedField(p.store_name) || '';
          const storeId = seller?.store?._id || seller?.store?.id || p.store_id;
          if (!name && !storeId) return <span className="muted">—</span>;
          return storeId ? (
            <Link
              to={`/store/${storeId}`}
              className="inline-flex items-center gap-1 hover:underline"
            >
              <Store size={13} className="muted" />
              {name || translateText('صفحه فروشگاه')}
            </Link>
          ) : (
            name
          );
        },
      },
      {
        label: translateText('نشان اعتماد'),
        render: (p, seller) => {
          const trust =
            seller?.trust ||
            (p.seller_trust === true
              ? TRUST.TRUSTED
              : p.seller_trust === false
                ? TRUST.UNTRUSTED
                : TRUST.UNKNOWN);
          if (trust === TRUST.TRUSTED)
            return (
              <span
                className="inline-flex items-center gap-1 font-black"
                style={{ color: '#17994f' }}
              >
                <BadgeCheck size={14} />
                {translateText('تأییدشده ')}
              </span>
            );
          if (trust === TRUST.UNTRUSTED)
            return <span className="muted">{translateText('تأییدنشده')}</span>;
          return <span className="muted">—</span>;
        },
      },
    ],
  },
];

function ComparePage() {
  const { compare, toggleCompare, clearCompare } = useShop();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  /*
   * سرستون‌ها همراه با اسکرول صفحه می‌آیند و زیر هدر سایت می‌چسبند؛
   * عنوان هر گروه هم دقیقاً زیر همان سرستون‌ها می‌ایستد (ارتفاعش اندازه‌گیری می‌شود).
   */
  const headRowRef = useRef(null);
  const [headHeight, setHeadHeight] = useState(0);

  useLayoutEffect(() => {
    const el = headRowRef.current;
    if (!el) {
      setHeadHeight(0);
      return undefined;
    }
    const measure = () => setHeadHeight(Math.round(el.getBoundingClientRect().height));
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [products.length, loading]);

  /* نام فروشگاه، نشان اعتماد و امتیاز فروشنده از بک‌اند (نه از فیلدهای محصول) */
  const { sellers } = useSellerProfiles(products);

  useEffect(() => {
    let cancelled = false;

    if (!compare.length) {
      setProducts([]);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    Promise.all(
      compare.map((id) =>
        axios
          .get(`${API}/product/${id}`, { timeout: 15000 })
          .then((res) => {
            const body = getBody(res);
            return body ? { ...body, _id: body._id || id } : null;
          })
          .catch(() => null),
      ),
    )
      .then((list) => {
        if (!cancelled) setProducts(list.filter(Boolean).map(readContent));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [compare]);

  /* ارزان‌ترین ستون (فقط وقتی بیش از یک محصول باشد و یکتا باشد) */
  const best = useMemo(() => {
    if (products.length < 2) return { price: null };

    const prices = products.map(priceOf);
    const minPrice = Math.min(...prices);
    const cheapest =
      prices.filter((price) => price === minPrice).length === 1
        ? products[prices.indexOf(minPrice)]?._id
        : null;

    return { price: cheapest };
  }, [products]);

  const empty = !loading && products.length === 0;

  return (
    <div className="mx-auto site-width max-w-7xl px-3 py-5 sm:px-4 sm:py-6">
      {/* ───── هدر ───── */}
      <header className="card mb-4 flex flex-col gap-3 rounded-3xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
            style={{ background: 'color-mix(in srgb, var(--primary-color) 16%, transparent)' }}
          >
            <GitCompareArrows size={20} style={{ color: 'var(--accent-text)' }} />
          </span>
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-lg font-black sm:text-xl">
              {translateText('مقایسه‌ی محصولات ')}
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-black"
                style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
              >
                {toFa(products.length)}
                {translateText(' از ')}
                {toFa(MAX)}
              </span>
            </h1>
            <p className="mt-0.5 text-[11px] muted">
              {translateText(
                'حداکثر ۴ کالا را کنار هم بگذارید و ارزان‌ترین قیمت و مشخصات کامل را ببینید. ',
              )}
            </p>
          </div>
        </div>

        {products.length > 0 && (
          <button
            type="button"
            onClick={clearCompare}
            className="btn-ghost inline-flex h-10 items-center gap-1.5 !py-0 text-xs text-red-400 hover:!border-red-400"
          >
            <Trash2 size={14} />
            {translateText('پاک کردن لیست ')}
          </button>
        )}
      </header>

      {empty ? (
        <div className="card rounded-3xl p-8 text-center sm:p-12">
          <span
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: 'color-mix(in srgb, var(--primary-color) 14%, transparent)' }}
          >
            <GitCompareArrows size={28} style={{ color: 'var(--accent-text)' }} />
          </span>
          <h2 className="mt-4 text-base font-black">
            {translateText('هنوز محصولی برای مقایسه انتخاب نکرده‌اید')}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-6 muted">
            {translateText('روی آیکن مقایسه در کارت هر کالا بزنید تا اینجا کنار هم بررسی شوند. ')}
          </p>
          <Link to="/products" className="btn-primary mt-5 inline-flex items-center gap-2">
            <Sparkles size={16} />
            {translateText('انتخاب محصول ')}
          </Link>
        </div>
      ) : (
        <div className="card rounded-3xl">
          <div className="overflow-x-auto lg:overflow-visible">
            <table
              className="w-full min-w-[560px] table-fixed border-collapse text-sm sm:min-w-[680px]"
              style={{ '--cmp-head': `${headHeight}px` }}
            >
              <thead>
                <tr ref={headRowRef}>
                  <th
                    className="w-24 border-b border-theme p-2 text-start text-[11px] font-bold muted sm:w-36 sm:p-3 lg:sticky lg:top-[var(--header-h,96px)] lg:z-30"
                    style={{ background: 'var(--card)' }}
                  >
                    {translateText('مشخصه ')}
                  </th>

                  {loading && !products.length
                    ? Array.from({ length: compare.length }).map((_, index) => (
                        <th key={index} className="border-b border-theme p-3">
                          <div className="skeleton mx-auto h-16 w-16 rounded-2xl sm:h-20 sm:w-20" />
                          <div className="skeleton mx-auto mt-3 h-3 w-3/4" />
                        </th>
                      ))
                    : products.map((product) => {
                        return (
                          <th
                            key={product._id}
                            className="border-b border-theme p-3 align-top font-normal lg:sticky lg:top-[var(--header-h,96px)] lg:z-30"
                            style={{ background: 'var(--card)' }}
                          >
                            <div className="relative flex flex-col items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleCompare(product._id)}
                                className="absolute -top-1 start-0 grid h-7 w-7 place-items-center rounded-full border border-theme transition hover:opacity-80"
                                style={{ background: 'var(--card2)' }}
                                aria-label={translateText('حذف {{v0}} از مقایسه', {
                                  v0: product.name,
                                })}
                              >
                                <X size={13} />
                              </button>

                              <Link
                                to={`/product/${product._id}`}
                                className="block h-16 w-16 overflow-hidden rounded-2xl border border-theme sm:h-20 sm:w-20"
                              >
                                <StorageImageComponent
                                  file={productImages(product)[0]}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              </Link>

                              <Link
                                to={`/product/${product._id}`}
                                className="line-clamp-2 text-center text-[11px] font-black leading-5 hover:underline sm:text-xs"
                              >
                                {product.name}
                              </Link>

                              <div
                                className="text-sm font-black"
                                style={{ color: 'var(--accent-text)' }}
                              >
                                {formatPrice(finalPrice(product), product.price?.currency)}
                              </div>
                            </div>
                          </th>
                        );
                      })}
                </tr>
              </thead>

              <tbody>
                {GROUPS.map((group) => (
                  <React.Fragment key={group.title}>
                    <tr>
                      <td
                        colSpan={products.length + 1}
                        className="border-b border-theme px-3 py-2 text-[11px] font-black lg:sticky lg:z-20 lg:top-[calc(var(--header-h,96px)+var(--cmp-head,0px)-1px)]"
                        style={{
                          background: 'var(--card2)',
                          color: 'var(--accent-text)',
                          boxShadow: '0 6px 12px -10px rgba(0,0,0,0.35)',
                        }}
                      >
                        {group.title}
                      </td>
                    </tr>

                    {group.rows.map((row) => (
                      <tr key={row.label} className="border-b border-theme last:border-0">
                        <th
                          scope="row"
                          className="whitespace-nowrap p-2 text-start text-[11px] font-bold muted sm:p-3"
                          style={{ background: 'var(--card)' }}
                        >
                          {row.label}
                        </th>

                        {products.map((product) => {
                          const isBest = row.highlight === 'price' && best.price === product._id;

                          return (
                            <td
                              key={product._id}
                              className="p-2 text-center align-middle sm:p-3"
                              style={{
                                background: isBest ? 'rgba(23,153,79,0.07)' : undefined,
                              }}
                            >
                              <div
                                className={`inline-flex flex-wrap items-center justify-center gap-1 ${
                                  row.strong ? 'text-sm font-black' : 'text-xs font-bold'
                                }`}
                                style={row.strong ? { color: 'var(--accent-text)' } : undefined}
                              >
                                {row.render(product, sellers[product._id])}
                                {isBest && (
                                  <span
                                    className="rounded-full px-1.5 py-0.5 text-[10px] font-black"
                                    style={{ background: 'rgba(23,153,79,0.16)', color: '#17994f' }}
                                  >
                                    {row.highlight === 'price'
                                      ? translateText('کمترین قیمت')
                                      : translateText('بهترین امتیاز')}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* راهنمای موبایل */}
          <div className="flex items-center gap-1.5 border-t border-theme px-3 py-2.5 text-[11px] muted sm:hidden">
            <Minus size={13} className="rotate-90" />
            {translateText('برای دیدن همه‌ی ستون‌ها جدول را افقی بکشید. ')}
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-theme px-3 py-2.5 text-[11px] muted">
          <span className="inline-flex items-center gap-1.5">
            <Check size={13} style={{ color: '#17994f' }} />
            {translateText('ستون سبز یعنی بهترین مقدار در همان ردیف ')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <GitCompareArrows size={13} />
            {translateText('با ضربدر گوشه‌ی هر ستون، آن کالا از مقایسه حذف می‌شود ')}
          </span>
        </div>
      )}
    </div>
  );
}

export default ComparePage;
