import { language, currency, formatMoney, currencyLabel } from '../../i18n/runtime';
import { jalaliYearOfGregorian } from '../../utils/helpers/jalali';
import { t as translateText } from '../../i18n/runtime.js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpDown,
  Award,
  Boxes,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  PackageSearch,
  Percent,
  BadgeCheck,
  RotateCcw,
  Search,
  Store as StoreIcon,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
  X,
} from 'lucide-react';
import ProductComponent, { ProductSkeleton } from '../../components/product/ProductComponent';
import ProductViewSwitcher from '../../components/product/ProductViewSwitcher';
import SupplierCardComponent, {
  SupplierSkeleton,
} from '../../components/shop/SupplierCardComponent';
import { fetchCategories, buildCategoryTree } from '../../utils/helpers/categories';
import { getBody, getList } from '../../utils/helpers/response';
import { toFa, productionYearForApi } from '../../utils/helpers/format';
import useProductViewMode from '../../hooks/useProductViewMode';
import useIsDesktop from '../../hooks/useIsDesktop';

/* ------------------------------------------------------------------ */
/* ثابت‌ها                                                              */
/* ------------------------------------------------------------------ */

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

/* ۲۴ = مضرب ۲، ۳ و ۴ → در هر بریک‌پوینت ردیف آخر بدون جای خالی پر می‌شود */
const PAGE_SIZE = 24;

/* قیمت فیلتر با ارز انتخابی نمایش داده و همراه همان واحد به بک‌اند فرستاده می‌شود.
   وقتی دسته‌ی ماکسیمم روی انتهای نوار باشد، «بدون سقف» در نظر گرفته می‌شود؛
   پس این سقف هیچ کالای گران‌تری را از نتایج حذف نمی‌کند. */
const PRICE_MIN = 0;
const PRICE_MAX = {
  USD: 20000,
  IRT: 200_000_000,
  IRR: 2_000_000_000,
  TRY: 800000,
  AED: 75000,
  EUR: 20000,
}[currency];
const PRICE_STEP = PRICE_MAX / 200;

const YEAR_MIN = language === 'fa' ? 1340 : 1961;
const YEAR_MAX =
  language === 'fa' ? jalaliYearOfGregorian(new Date().getFullYear()) : new Date().getFullYear();

/* تب «تأمین‌کنندگان» (فروشگاه‌هایی که کالا را دارند)، مثل علی‌بابا */
const SUPPLIER_PAGE_SIZE = 8;

const SUPPLIER_SORTS = [
  { value: '', label: translateText('مرتبط‌ترین') },
  { value: 'products', label: translateText('بیشترین کالای مطابق') },
  { value: 'trust', label: translateText('فروشنده‌ی مورد اعتماد') },
  { value: 'price_asc', label: translateText('ارزان‌ترین') },
  { value: 'price_desc', label: translateText('گران‌ترین') },
  { value: 'newest', label: translateText('جدیدترین فروشگاه') },
];

const FILTER_KEYS = [
  'name',
  'verified',
  'min_products',
  'category_id',
  'brand',
  'min_price',
  'max_price',
  'discount',
  'warranty',
  'stock_status',
  'min_production',
  'max_production',
  'desc',
  'tags',
];

const SORTS = [
  { value: '', label: translateText('جدیدترین') },
  { value: 'cheap', label: translateText('ارزان‌ترین') },
  { value: 'expensive', label: translateText('گران‌ترین') },
  { value: 'discount', label: translateText('بیشترین تخفیف') },
  { value: 'sold', label: translateText('پرفروش‌ترین') },
];

const STOCK_OPTIONS = [
  { value: '', label: translateText('همه') },
  { value: 'IN_STOCK', label: translateText('موجود') },
  { value: 'OUT_OF_STOCK', label: translateText('ناموجود') },
];

/*
 * شبکه‌ی محصولات — حداکثر ۴ ستون، همان الگوی بقیه‌ی صفحات سایت
 * (ProductGridComponent). عرض کارت‌ها در همه‌ی بریک‌پوینت‌ها سالم می‌ماند:
 *   ۳۹۰px → ۲ ستون (~۱۷۷px) · ۷۶۸px → ۳ ستون (~۲۳۷px)
 *   ۱۰۲۴px (با سایدبار ۲۷۲px) → ۳ ستون (~۲۲۷px) · ۱۲۸۰px+ → ۴ ستون (~۲۳۰px)
 */
/* سه ستون در دسکتاپ — هم‌اندازه با گرید صفحه‌ی فروشگاه (درخواست کاربر) */
/* موبایل دو ستونه تا کارت‌ها غول‌آسا و خالی نشوند؛ تبلت سه‌ستونه */

/* ------------------------------------------------------------------ */
/* رنگ‌های تم — همه از متغیرهای پروژه (بدون رنگ ثابت)                    */
/* ------------------------------------------------------------------ */

/* پس‌زمینه‌ی ملایم اصلی + متن خوانا در هر دو تم
   (در تم روشن: پس‌زمینه‌ی کرم + متن سرمه‌ای؛ در تم تاریک: همان + متن زرد) */
const ACCENT_SOFT = {
  background: 'color-mix(in srgb, var(--primary-color) 16%, transparent)',
  color: 'var(--accent-text)',
};
/* دکمه/چیپ انتخاب‌شده */
const ACCENT = {
  background: 'var(--primary-color)',
  color: 'var(--on-primary)',
};
/* ریلی که انتخاب‌شده نیست (اسلایدر و سوییچ) */
const TRACK_BG = {
  background: 'var(--card2)',
  border: '1px solid var(--border)',
};

/* ------------------------------------------------------------------ */
/* هِلپرها                                                             */
/* ------------------------------------------------------------------ */

const faGrouped = (value) =>
  value !== '' && value != null ? new Intl.NumberFormat(language).format(Number(value)) : '';

const faPlain = (value) =>
  value !== '' && value != null
    ? new Intl.NumberFormat(language, { useGrouping: false }).format(Number(value))
    : '';

/* عدد فشرده برای جا شدن در سایدبار ۲۷۲ پیکسلی: «۱٬۲۵۰٬۰۰۰٬۰۰۰» → «۱٫۳ میلیارد» */
const faCompact = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return translateText('۰');

  try {
    return new Intl.NumberFormat(language, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(number);
  } catch {
    return faGrouped(number);
  }
};

function getPageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push('dots');
  for (let i = start; i <= end; i += 1) items.push(i);
  if (end < total - 1) items.push('dots');
  items.push(total);

  return items;
}

function findAncestorIds(nodes, targetId, trail = []) {
  for (const node of nodes) {
    if (node._id === targetId) return trail;
    const found = findAncestorIds(node.children || [], targetId, [...trail, node._id]);
    if (found) return found;
  }
  return null;
}

function flattenNodes(nodes, out = []) {
  nodes.forEach((node) => {
    out.push(node);
    flattenNodes(node.children || [], out);
  });
  return out;
}

function buildActiveChips(filters, categoryName) {
  const chips = [];

  if (filters.name)
    chips.push({
      key: 'name',
      label: translateText('نام: {{v0}}', { v0: filters.name }),
      patch: { name: '' },
    });
  if (filters.category_id)
    chips.push({
      key: 'category',
      label: categoryName || translateText('دسته‌بندی'),
      patch: { category_id: '' },
    });
  if (filters.brand)
    chips.push({
      key: 'brand',
      label: translateText('برند: {{v0}}', { v0: filters.brand }),
      patch: { brand: '' },
    });

  if (filters.min_price || filters.max_price) {
    const from = filters.min_price ? faCompact(filters.min_price) : '';
    const to = filters.max_price ? faCompact(filters.max_price) : '';
    const range =
      from && to
        ? translateText('{{v0}} تا {{v1}}', { v0: from, v1: to })
        : from
          ? translateText('از {{v0}}', { v0: from })
          : translateText('تا {{v0}}', { v0: to });
    chips.push({
      key: 'price',
      label: `${range} ${currencyLabel(currency)}`,
      patch: { min_price: '', max_price: '' },
    });
  }

  if (filters.min_production || filters.max_production) {
    const from = filters.min_production ? faPlain(filters.min_production) : '';
    const to = filters.max_production ? faPlain(filters.max_production) : '';
    const range =
      from && to
        ? translateText('{{v0}} تا {{v1}}', { v0: from, v1: to })
        : from
          ? translateText('از {{v0}}', { v0: from })
          : translateText('تا {{v0}}', { v0: to });
    chips.push({
      key: 'production',
      label: translateText('سال تولید {{v0}}', { v0: range }),
      patch: { min_production: '', max_production: '' },
    });
  }

  if (filters.stock_status) {
    chips.push({
      key: 'stock',
      label:
        filters.stock_status === 'IN_STOCK' ? translateText('فقط موجود') : translateText('ناموجود'),
      patch: { stock_status: '' },
    });
  }

  if (filters.tags)
    chips.push({
      key: 'tags',
      label: translateText('برچسب: {{v0}}', { v0: filters.tags }),
      patch: { tags: '' },
    });

  if (filters.verified === 'true')
    chips.push({
      key: 'verified',
      label: translateText('فقط مورد اعتماد'),
      patch: { verified: '' },
    });
  if (filters.min_products)
    chips.push({
      key: 'min_products',
      label: translateText('حداقل {{v0}} کالا', { v0: faPlain(filters.min_products) }),
      patch: { min_products: '' },
    });

  if (filters.discount === 'true')
    chips.push({ key: 'discount', label: translateText('تخفیف‌دار'), patch: { discount: '' } });
  if (filters.warranty === 'true')
    chips.push({ key: 'warranty', label: translateText('گارانتی‌دار'), patch: { warranty: '' } });

  return chips;
}

/* ------------------------------------------------------------------ */
/* ورودی متنی با تأخیر                                                  */
/* ------------------------------------------------------------------ */

function DraftField({ value, onCommit, delay = 450, ...props }) {
  const [draft, setDraft] = useState(value);
  const timer = useRef(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return undefined;
    timer.current = setTimeout(() => onCommit(draft), delay);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const commitNow = () => {
    clearTimeout(timer.current);
    if (draft !== value) onCommit(draft);
  };

  return (
    <input
      {...props}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commitNow();
      }}
      onBlur={commitNow}
    />
  );
}

/* ------------------------------------------------------------------ */
/* نوار کشویی دوطرفه (بازه)                                             */
/* ------------------------------------------------------------------ */

const RANGE_CSS = `
.ab-range{position:absolute;inset:0;width:100%;height:100%;margin:0;appearance:none;-webkit-appearance:none;background:transparent;pointer-events:none}
.ab-range::-webkit-slider-runnable-track{background:transparent;height:100%}
.ab-range::-moz-range-track{background:transparent}
.ab-range::-webkit-slider-thumb{-webkit-appearance:none;pointer-events:auto;width:22px;height:22px;border-radius:9999px;background:var(--primary-color);border:3px solid var(--card);box-shadow:0 1px 6px rgba(36,36,36,.35);cursor:grab}
.ab-range::-moz-range-thumb{pointer-events:auto;width:16px;height:16px;border-radius:9999px;background:var(--primary-color);border:3px solid var(--card);box-shadow:0 1px 6px rgba(36,36,36,.35);cursor:grab}
.ab-range:focus-visible::-webkit-slider-thumb{outline:2px solid var(--accent-text);outline-offset:2px}
.ab-range:active::-webkit-slider-thumb{cursor:grabbing}
`;

function RangeSlider({ min, max, step, from, to, onCommit, format, unit = '' }) {
  const clamp = (value, fallback) => {
    if (value === '' || value == null || Number.isNaN(Number(value))) return fallback;
    return Math.min(max, Math.max(min, Number(value)));
  };

  const committedLo = clamp(from, min);
  const committedHi = clamp(to, max);
  const [range, setRange] = useState([committedLo, committedHi]);

  useEffect(() => {
    setRange([committedLo, committedHi]);
  }, [committedLo, committedHi]);

  const [lo, hi] = range;
  const pct = (value) => ((value - min) / (max - min)) * 100;

  // فقط بعد از رها کردن نوار درخواست ارسال می‌شود
  const commit = () => {
    if (lo === committedLo && hi === committedHi) return;
    onCommit(lo <= min ? '' : String(lo), hi >= max ? '' : String(hi));
  };

  return (
    <div className="space-y-2.5">
      <style>{RANGE_CSS}</style>

      <div dir="ltr" className="relative h-6">
        <div
          className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full"
          style={TRACK_BG}
        />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
          style={{
            left: `${pct(lo)}%`,
            right: `${100 - pct(hi)}%`,
            background: 'var(--primary-color)',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          aria-label={translateText('حداقل')}
          onChange={(e) => setRange([Math.min(Number(e.target.value), hi), hi])}
          onPointerUp={commit}
          onKeyUp={commit}
          onBlur={commit}
          className="ab-range"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          aria-label={translateText('حداکثر')}
          onChange={(e) => setRange([lo, Math.max(Number(e.target.value), lo)])}
          onPointerUp={commit}
          onKeyUp={commit}
          onBlur={commit}
          className="ab-range"
        />
      </div>

      <div className="flex items-center gap-1.5 text-[10px] font-bold">
        <span
          className="max-w-[47%] truncate rounded-lg px-2 py-1"
          style={ACCENT_SOFT}
          title={format(lo, false)}
        >
          {format(lo, false)} {unit}
        </span>
        <span className="shrink-0 muted">{translateText('تا')}</span>
        <span
          className="max-w-[47%] truncate rounded-lg px-2 py-1"
          style={ACCENT_SOFT}
          title={format(hi, hi >= max)}
        >
          {format(hi, hi >= max)} {hi < max ? unit : ''}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* اجزای فیلتر                                                         */
/* ------------------------------------------------------------------ */

function Section({ icon: Icon, title, badge = 0, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  /* اگر فیلتری از بیرون فعال شد (چیپ/بازنشانی) بخش مربوطه خودش باز شود */
  const hadBadge = useRef(badge > 0);
  useEffect(() => {
    if (badge > 0 && !hadBadge.current) setOpen(true);
    hadBadge.current = badge > 0;
  }, [badge]);

  return (
    <section className="card2 overflow-hidden rounded-2xl border border-theme">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-start transition hover:opacity-90"
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg" style={ACCENT_SOFT}>
          <Icon size={13} />
        </span>
        <span className="flex-1 truncate text-[13px] font-black">{title}</span>
        {badge > 0 && (
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black" style={ACCENT}>
            {toFa(badge)}
          </span>
        )}
        <ChevronDown
          size={16}
          className={`shrink-0 muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-2 px-3 pb-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Switch({ icon: Icon, label, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 transition hover:opacity-90"
    >
      <span className="flex min-w-0 items-center gap-2 text-xs font-bold">
        <Icon
          size={14}
          className="shrink-0"
          style={{ color: checked ? 'var(--accent-text)' : 'var(--muted)' }}
        />
        <span className="truncate">{label}</span>
      </span>
      <span
        className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300"
        style={checked ? { background: 'var(--primary-color)' } : TRACK_BG}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full shadow transition-all duration-300 ${
            checked ? 'end-0.5' : 'start-0.5'
          }`}
          style={{ background: 'var(--card)' }}
        />
      </span>
    </button>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div
      role="radiogroup"
      className="grid gap-1 rounded-xl border border-theme p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-lg py-2 text-[11px] font-bold transition-all duration-200 ${
              active ? 'shadow-md' : 'muted hover:opacity-80'
            }`}
            style={active ? ACCENT : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function CategoryNode({ node, selectedId, expanded, onSelect, onToggle }) {
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const isOpen = Boolean(expanded[node._id]);
  const isSelected = selectedId === node._id;

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-pressed={isSelected}
          onClick={() => onSelect(isSelected ? '' : node._id)}
          title={node.name}
          className={`flex-1 truncate rounded-lg px-2.5 py-1.5 text-start text-xs transition ${
            isSelected ? 'font-black' : 'hover:opacity-80'
          }`}
          style={isSelected ? ACCENT : undefined}
        >
          {node.name}
        </button>
        {hasChildren && (
          <button
            type="button"
            onClick={() => onToggle(node._id)}
            aria-label={
              isOpen ? translateText('بستن زیرمجموعه') : translateText('باز کردن زیرمجموعه')
            }
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg muted transition hover:opacity-80"
          >
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="ms-3 mt-0.5 space-y-0.5 border-s border-theme ps-2">
          {children.map((child) => (
            <CategoryNode
              key={child._id}
              node={child}
              selectedId={selectedId}
              expanded={expanded}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* تعداد دسته‌هایی که بدون «نمایش بیشتر» نشان داده می‌شوند — تا هیچ‌وقت
   ناحیه‌ی فیلترها اسکرول داخلی پیدا نکند */
const CATEGORY_PREVIEW = 8;

function CategoryPicker({ tree, selectedId, expanded, onSelect, onToggle }) {
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const q = query.trim();
  const flat = useMemo(() => flattenNodes(tree), [tree]);
  const matches = q ? flat.filter((node) => node.name?.includes(q)) : null;
  const roots = showAll || q ? tree : tree.slice(0, CATEGORY_PREVIEW);
  const hiddenCount = Math.max(0, tree.length - roots.length);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          size={13}
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 muted"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={translateText('جستجوی دسته…')}
          className="input !py-2 !ps-9 text-xs"
        />
      </div>

      <div className="space-y-0.5">
        <button
          type="button"
          aria-pressed={!selectedId}
          onClick={() => onSelect('')}
          className={`w-full rounded-lg px-2.5 py-1.5 text-start text-xs transition ${
            !selectedId ? 'font-black' : 'hover:opacity-80'
          }`}
          style={!selectedId ? ACCENT : undefined}
        >
          {translateText('همه دسته‌ها ')}
        </button>

        {matches ? (
          matches.length ? (
            matches.map((node) => (
              <button
                key={node._id}
                type="button"
                aria-pressed={selectedId === node._id}
                onClick={() => onSelect(selectedId === node._id ? '' : node._id)}
                title={node.name}
                className={`w-full truncate rounded-lg px-2.5 py-1.5 text-start text-xs transition ${
                  selectedId === node._id ? 'font-black' : 'hover:opacity-80'
                }`}
                style={selectedId === node._id ? ACCENT : undefined}
              >
                {node.name}
              </button>
            ))
          ) : (
            <p className="px-2 py-3 text-center text-xs muted">
              {translateText('دسته‌ای پیدا نشد')}
            </p>
          )
        ) : (
          roots.map((root) => (
            <CategoryNode
              key={root._id}
              node={root}
              selectedId={selectedId}
              expanded={expanded}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))
        )}

        {!matches &&
          (showAll ? (
            tree.length > CATEGORY_PREVIEW && (
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="mt-1 w-full rounded-lg px-2 py-1.5 text-[11px] font-bold muted transition hover:opacity-80"
              >
                {translateText('نمایش کمتر ')}
              </button>
            )
          ) : hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-1 w-full rounded-lg px-2 py-1.5 text-[11px] font-bold transition hover:opacity-80"
              style={{ color: 'var(--accent-text)' }}
            >
              {translateText('نمایش ')}
              {toFa(hiddenCount)}
              {translateText(' دسته‌ی دیگر ')}
            </button>
          ) : null)}
      </div>
    </div>
  );
}

function FiltersPanel({
  filters,
  setFilter,
  categoryTree,
  brands,
  expanded,
  onToggleCat,
  sort = '',
  onSort,
  scope = 'desktop',
  mode = 'products',
}) {
  /* پنل دو بار رندر می‌شود (سایدبار دسکتاپ + شیت موبایل) → id یکتا لازم است */
  const brandListId = `brand-options-${scope}`;
  const priceCount = (filters.min_price ? 1 : 0) + (filters.max_price ? 1 : 0);
  const yearCount = (filters.min_production ? 1 : 0) + (filters.max_production ? 1 : 0);
  const statusCount =
    (filters.stock_status ? 1 : 0) +
    (filters.discount === 'true' ? 1 : 0) +
    (filters.warranty === 'true' ? 1 : 0);

  const formatPrice = (value, isMax) => (isMax ? translateText('بدون سقف') : faCompact(value));
  const formatYear = (value, isMax) => (isMax ? `${faPlain(value)}+` : faPlain(value));

  const isSuppliers = mode === 'suppliers';
  const sortOptions = (isSuppliers ? SUPPLIER_SORTS : SORTS).map((o) => ({
    value: o.value,
    label: o.label,
  }));

  return (
    <div className="space-y-2">
      {/* مرتب‌سازی — از هدر بخش محصولات به داخل خود فیلترها منتقل شد */}
      <Section
        icon={ArrowUpDown}
        title={translateText('مرتب‌سازی')}
        badge={sort ? 1 : 0}
        defaultOpen
      >
        <SelectField
          value={sort}
          onChange={(v) => onSort?.(v)}
          options={sortOptions}
          label={
            isSuppliers
              ? translateText('مرتب‌سازی تأمین‌کنندگان')
              : translateText('مرتب‌سازی محصولات')
          }
          icon={ArrowUpDown}
        />
      </Section>

      {isSuppliers && (
        <Section
          icon={StoreIcon}
          title={translateText('فروشنده')}
          badge={(filters.verified === 'true' ? 1 : 0) + (filters.min_products ? 1 : 0)}
        >
          <Switch
            icon={BadgeCheck}
            label={translateText('فقط فروشنده‌ی مورد اعتماد')}
            checked={filters.verified === 'true'}
            onChange={(c) => setFilter({ verified: c ? 'true' : '' })}
          />
          <Switch
            icon={Boxes}
            label={translateText('حداقل ۲ کالای مطابق')}
            checked={filters.min_products === '2'}
            onChange={(c) => setFilter({ min_products: c ? '2' : '' })}
          />
        </Section>
      )}

      <Section icon={Search} title={translateText('جستجو در نام')} badge={filters.name ? 1 : 0}>
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 muted"
          />
          <DraftField
            value={filters.name}
            onCommit={(v) => setFilter({ name: v })}
            placeholder={translateText('نام محصول…')}
            className="input !py-2 !ps-9 text-xs"
          />
        </div>
      </Section>

      <Section icon={Layers} title={translateText('دسته‌بندی')} badge={filters.category_id ? 1 : 0}>
        <CategoryPicker
          tree={categoryTree}
          selectedId={filters.category_id}
          expanded={expanded}
          onSelect={(id) => setFilter({ category_id: id })}
          onToggle={onToggleCat}
        />
      </Section>

      <Section
        icon={Award}
        title={translateText('برند')}
        badge={filters.brand ? 1 : 0}
        defaultOpen={Boolean(filters.brand)}
      >
        <DraftField
          list={brandListId}
          value={filters.brand}
          onCommit={(v) => setFilter({ brand: v })}
          placeholder={translateText('نام برند…')}
          className="input !py-2 text-xs"
        />
        <datalist id={brandListId}>
          {brands.map((brand) => (
            <option key={brand} value={brand} />
          ))}
        </datalist>
        {brands.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {brands.slice(0, 8).map((brand) => {
              const active = filters.brand === brand;
              return (
                <button
                  key={brand}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter({ brand: active ? '' : brand })}
                  className="max-w-full truncate rounded-full border border-theme px-2.5 py-1 text-[11px] font-bold transition hover:opacity-80"
                  style={active ? ACCENT : undefined}
                >
                  {brand}
                </button>
              );
            })}
          </div>
        )}
      </Section>

      <Section icon={Wallet} title={translateText('قیمت')} badge={priceCount}>
        <RangeSlider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          from={filters.min_price}
          to={filters.max_price}
          format={formatPrice}
          unit={currencyLabel(currency)}
          onCommit={(lo, hi) => setFilter({ min_price: lo, max_price: hi })}
        />
      </Section>

      <Section
        icon={CalendarDays}
        title={translateText('سال تولید')}
        badge={yearCount}
        defaultOpen={yearCount > 0}
      >
        <RangeSlider
          min={YEAR_MIN}
          max={YEAR_MAX}
          step={1}
          from={filters.min_production}
          to={filters.max_production}
          format={formatYear}
          onCommit={(lo, hi) => setFilter({ min_production: lo, max_production: hi })}
        />
      </Section>

      <Section
        icon={Boxes}
        title={translateText('وضعیت و امکانات')}
        badge={statusCount}
        defaultOpen={statusCount > 0}
      >
        <Segmented
          options={STOCK_OPTIONS}
          value={filters.stock_status}
          onChange={(v) => setFilter({ stock_status: v })}
        />
        <Switch
          icon={Percent}
          label={translateText('فقط کالاهای تخفیف‌دار')}
          checked={filters.discount === 'true'}
          onChange={(c) => setFilter({ discount: c ? 'true' : '' })}
        />
        <Switch
          icon={ShieldCheck}
          label={translateText('دارای گارانتی')}
          checked={filters.warranty === 'true'}
          onChange={(c) => setFilter({ warranty: c ? 'true' : '' })}
        />
      </Section>
    </div>
  );
}

/*
 * سایدبار فیلترها تا وقتی همه‌ی بخش‌ها بسته‌اند کوتاه است و می‌تواند چسبان بماند.
 * اگر کاربر همه را باز کند و بلندتر از صفحه شود، حالت چسبان برداشته می‌شود تا
 * ناحیه‌ی فیلترها هیچ‌وقت اسکرول داخلی (نوار اسکرول جدا) نداشته باشد و کل صفحه
 * به‌جای آن اسکرول شود.
 */
function useFitsViewport(ref, reserved = 120) {
  const [fits, setFits] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const check = () => setFits(el.scrollHeight <= window.innerHeight - reserved);
    check();

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null;
    ro?.observe(el);
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    const id = window.setInterval(check, 600); // بعد از باز/بسته شدن بخش‌ها هم دوباره بسنجد

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
      window.clearInterval(id);
    };
  }, [ref, reserved]);

  return fits;
}

function SelectField({ value, onChange, options, label, icon: Icon }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={14}
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 muted"
        />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="input cursor-pointer appearance-none !py-2 !ps-9 !pe-8 text-xs"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 muted"
      />
    </div>
  );
}

function FiltersSheet({ open, onClose, total, activeCount, onReset, children }) {
  const closeBtnRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={translateText('فیلترها')}
    >
      <style>{`
        @keyframes shop-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes shop-fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <button
        type="button"
        aria-label={translateText('بستن فیلترها')}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ animation: 'shop-fade-in 0.2s ease-out' }}
      />

      <div
        className="absolute inset-x-0 bottom-0 flex max-h-[86vh] flex-col rounded-t-[28px] border-t border-theme shadow-2xl"
        style={{
          background: 'var(--card)',
          animation: 'shop-sheet-up 0.32s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full" style={TRACK_BG} />

        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm font-black">
            <SlidersHorizontal size={16} style={{ color: 'var(--accent-text)' }} />
            {translateText('فیلترها ')}
          </div>
          <div className="flex items-center gap-1">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold"
                style={{ color: 'var(--accent-text)' }}
              >
                {translateText('پاک کردن ')}
              </button>
            )}
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label={translateText('بستن')}
              className="grid h-9 w-9 place-items-center rounded-xl transition hover:opacity-80"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>

        <div className="border-t border-theme p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="btn-primary w-full !py-2.5">
            {translateText('مشاهده ')}
            {toFa(total)}
            {translateText(' کالا ')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const items = getPageItems(page, totalPages);

  return (
    <nav
      aria-label={translateText('صفحه‌بندی')}
      className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="btn-ghost inline-flex items-center gap-1 !py-2 text-xs disabled:opacity-40"
      >
        <ChevronRight className="logical-icon" size={14} />
        {translateText('قبلی ')}
      </button>

      {items.map((item, index) =>
        typeof item === 'number' ? (
          <button
            key={`${item}-${index}`}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className="grid h-9 min-w-9 place-items-center rounded-xl px-2 text-xs font-bold transition hover:opacity-80"
            style={item === page ? ACCENT : undefined}
          >
            {toFa(item)}
          </button>
        ) : (
          <span key={`dots-${index}`} className="px-1 text-xs muted">
            …
          </span>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-ghost inline-flex items-center gap-1 !py-2 text-xs disabled:opacity-40"
      >
        {translateText('بعدی ')}
        <ChevronLeft className="logical-icon" size={14} />
      </button>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* شبکه‌ی محصولات (با اسکلتون و حالت خالی)                              */
/* ------------------------------------------------------------------ */

function ProductsGrid({ products, loading, onClear, viewMode = 'double' }) {
  const showSkeletons = loading && products.length === 0;
  /* حالت‌های نمایش: دوتایی / تکی افقی / تکی عمودی (تکی عمودی فقط موبایل — دسکتاپ → دوتایی) */
  const variant =
    viewMode === 'single' ? 'wide' : viewMode === 'single-vertical' ? 'tall' : 'grid';
  /* دوتایی: دسکتاپ ۴ کنار هم، تبلت ۳، گوشی ۲ — تکی عمودی: از ۳ تا ۱ ستون */
  const gridClass =
    viewMode === 'single'
      ? 'grid grid-cols-1 gap-2.5 sm:gap-3'
      : viewMode === 'single-vertical'
        ? 'grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3'
        : 'grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4';

  if (showSkeletons) {
    return (
      <div
        className={gridClass}
        aria-busy="true"
        aria-label={translateText('در حال بارگذاری محصولات')}
      >
        {Array.from({ length: viewMode === 'double' ? 12 : 5 }, (_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="card rounded-3xl p-10 text-center">
        <PackageSearch size={34} className="mx-auto mb-3 muted" />
        <div className="font-black">{translateText('محصولی با این فیلترها پیدا نشد')}</div>
        <p className="mt-1 text-xs muted">
          {translateText('فیلترها را کمتر کن یا عبارت دیگری جستجو کن.')}
        </p>
        {onClear && (
          <button type="button" onClick={onClear} className="btn-ghost mt-4 !py-2 text-xs">
            {translateText('پاک کردن فیلترها ')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${gridClass} transition-opacity duration-150 ${
        loading ? 'pointer-events-none opacity-40' : ''
      }`}
      aria-busy={loading}
    >
      {products.map((product) => (
        <ProductComponent
          key={product._id || product.id}
          product={product}
          variant={variant}
        />
      ))}
    </div>
  );
}

function SuppliersList({ suppliers, loading, onClear }) {
  if (loading && suppliers.length === 0) {
    return (
      <div
        className="space-y-3"
        aria-busy="true"
        aria-label={translateText('در حال بارگذاری تأمین‌کنندگان')}
      >
        {[0, 1, 2].map((i) => (
          <SupplierSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!suppliers.length) {
    return (
      <div className="card rounded-3xl p-10 text-center">
        <PackageSearch size={34} className="mx-auto mb-3 muted" />
        <div className="font-black">{translateText('فروشگاهی با این فیلترها پیدا نشد')}</div>
        <p className="mt-1 text-xs muted">
          {translateText('فیلترها را کمتر کن یا عبارت دیگری جستجو کن.')}
        </p>
        {onClear && (
          <button type="button" onClick={onClear} className="btn-ghost mt-4 !py-2 text-xs">
            {translateText('پاک کردن فیلترها ')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`space-y-3 transition-opacity duration-150 ${loading ? 'pointer-events-none opacity-40' : ''}`}
      aria-busy={loading}
    >
      {suppliers.map((store) => (
        <SupplierCardComponent key={store._id} store={store} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* صفحه‌ی محصولات                                                      */
/* ------------------------------------------------------------------ */

function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  /* سایدبار فیلتر بدون اسکرول داخلی (توضیح در useFitsViewport) */
  const asideRef = useRef(null);
  const asideFits = useFitsViewport(asideRef, 112);
  const search = searchParams.toString();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const sort = searchParams.get('sort') || '';
  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) || '']));
  /* تب فعال: محصولات | تأمین‌کنندگان (فروشگاه‌هایی که کالای جستجوشده را دارند) */
  const isSuppliers = searchParams.get('tab') === 'suppliers';

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierBrands, setSupplierBrands] = useState([]);
  const [supplierTotal, setSupplierTotal] = useState(null);
  const [categories, setCategories] = useState([]);
  const [expandedCatIds, setExpandedCatIds] = useState({});
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  /* حالت نمایش محصولات: دوتایی / تکی / تکی عمودی (تکی عمودی فقط موبایل) */
  const [viewMode, setViewMode] = useProductViewMode('double');
  const isDesktop = useIsDesktop();
  /* در دسکتاپ حالت «تکی عمودی» وجود ندارد → دوتایی نمایش داده می‌شود */
  const effectiveViewMode = isDesktop && viewMode === 'single-vertical' ? 'double' : viewMode;

  const updateParams = (patch) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      Object.entries(patch).forEach(([key, value]) =>
        value ? next.set(key, value) : next.delete(key),
      );
      next.delete('page');
      return next;
    });
  };

  const goToPage = (number) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('page', String(number));
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* تغییر تب: مرتب‌سازی و فیلترهای مخصوص هر تب پاک می‌شوند، بقیه‌ی فیلترها می‌مانند */
  const switchTab = (next) => {
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous);
      ['page', 'sort', 'verified', 'min_products'].forEach((key) => params.delete(key));
      if (next === 'suppliers') params.set('tab', 'suppliers');
      else params.delete('tab');
      return params;
    });
  };

  const resetFilters = () =>
    setSearchParams(
      (() => {
        const keep = {};
        if (sort) keep.sort = sort;
        if (isSuppliers) keep.tab = 'suppliers';
        return keep;
      })(),
    );
  const toggleCat = useCallback(
    (id) => setExpandedCatIds((prev) => ({ ...prev, [id]: !prev[id] })),
    [],
  );
  const closeSheet = useCallback(() => setFiltersOpen(false), []);

  useEffect(() => {
    const controller = new AbortController();
    fetchCategories(controller.signal)
      .then(setCategories)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(search);
    params.set('page', String(page));
    params.delete('tab');

    /* سال تولید در فیلتر شمسی است، ولی بک‌اند سال میلادی را مقایسه می‌کند */
    ['min_production', 'max_production'].forEach((key) => {
      const value = params.get(key);
      if (!value) return;
      const gregorian = productionYearForApi(value);
      if (gregorian) params.set(key, gregorian);
      else params.delete(key);
    });

    /* ---------- تب تأمین‌کنندگان: GET /product/stores ---------- */
    if (isSuppliers) {
      const query = (params.get('name') || '').trim();
      params.delete('name');
      if (query) params.set('q', query);
      params.set('limit', String(SUPPLIER_PAGE_SIZE));
      params.set('products_per_store', '8');
      if (params.get('stock_status') === 'IN_STOCK') {
        params.delete('stock_status');
        params.set('in_stock', 'true');
      }

      setLoading(true);
      setError('');

      axios
        .get(`${API}/product/stores?${params}`, { signal: controller.signal, timeout: 15000 })
        .then((response) => {
          if (response.data?.success === false) throw new Error(response.data.message);
          const body = getBody(response);
          const count = Number(body?.total ?? 0) || 0;
          setSuppliers(Array.isArray(body?.data) ? body.data : []);
          setSupplierBrands((body?.facets?.brands || []).map((b) => b.value));
          setSupplierTotal(count);
          setTotal(count);
          setTotalPages(Math.max(1, Number(body?.totalPages) || 1));
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setError(
              translateText('دریافت تأمین‌کنندگان ناموفق بود. اتصال به بک‌اند را بررسی کنید.'),
            );
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });

      return () => controller.abort();
    }

    /* ---------- تب محصولات: GET /product ---------- */
    ['verified', 'min_products'].forEach((key) => params.delete(key));
    params.set('limit', String(PAGE_SIZE));

    setLoading(true);
    setError('');

    axios
      .get(`${API}/product?${params}`, { signal: controller.signal, timeout: 15000 })
      .then((response) => {
        if (response.data?.success === false) throw new Error(response.data.message);
        const body = getBody(response);
        const count = Number(body?.total ?? body?.count ?? 0) || 0;
        const pages = Number(body?.totalPages) || (count ? Math.ceil(count / PAGE_SIZE) : 1);

        setProducts(getList(response));
        setTotal(count);
        setTotalPages(Math.max(1, pages));
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(translateText('دریافت محصولات ناموفق بود. اتصال به بک‌اند را بررسی کنید.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [search, page, retry, isSuppliers]);

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean))],
    [products],
  );

  const activeCategory = categories.find((c) => c._id === filters.category_id);
  const chips = buildActiveChips(filters, activeCategory?.name);

  useEffect(() => {
    if (!filters.category_id || !categoryTree.length) return;
    const ancestors = findAncestorIds(categoryTree, filters.category_id);
    if (!ancestors?.length) return;
    setExpandedCatIds((prev) => {
      const next = { ...prev };
      ancestors.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  }, [filters.category_id, categoryTree]);

  const title = isSuppliers
    ? filters.name
      ? translateText('تأمین‌کنندگان «{{v0}}»', { v0: filters.name })
      : activeCategory
        ? translateText('تأمین‌کنندگان {{v0}}', { v0: activeCategory.name })
        : translateText('همه‌ی تأمین‌کنندگان')
    : activeCategory?.name ||
      (filters.name
        ? translateText('نتایج «{{v0}}»', { v0: filters.name })
        : translateText('همه محصولات'));

  const panelProps = {
    filters,
    setFilter: updateParams,
    categoryTree,
    brands: isSuppliers ? supplierBrands : brands,
    mode: isSuppliers ? 'suppliers' : 'products',
    expanded: expandedCatIds,
    onToggleCat: toggleCat,
    sort,
    onSort: (value) => updateParams({ sort: value }),
  };

  return (
    <div
      className="mx-auto max-w-7xl space-y-4 px-3 py-5 sm:space-y-5 sm:px-4 sm:py-6"
      style={{ color: 'var(--text)' }}
    >
      {/* هدر */}
      <header className="card relative overflow-hidden rounded-3xl p-4 sm:p-5 md:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-20 -top-20 h-56 w-56 rounded-full blur-3xl"
          style={{ background: 'color-mix(in srgb, var(--primary-color) 12%, transparent)' }}
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <nav className="flex flex-wrap items-center gap-1.5 text-[11px] muted">
              <Link to="/" className="transition hover:opacity-70">
                {translateText('خانه ')}
              </Link>
              <ChevronLeft className="logical-icon" size={12} />
              <Link to="/products" className="transition hover:opacity-70">
                {translateText('محصولات ')}
              </Link>
              {activeCategory && (
                <>
                  <ChevronLeft className="logical-icon" size={12} />
                  <span className="max-w-[40vw] truncate">{activeCategory.name}</span>
                </>
              )}
            </nav>
            <h1 className="mt-2 truncate text-lg font-black sm:text-xl md:text-2xl">{title}</h1>
            <p className="mt-1 text-xs muted" aria-live="polite">
              {loading
                ? isSuppliers
                  ? translateText('در حال دریافت تأمین‌کنندگان…')
                  : translateText('در حال دریافت کالاها…')
                : isSuppliers
                  ? filters.name
                    ? translateText('{{v0}} فروشگاه این کالا را دارند', { v0: toFa(total) })
                    : translateText('{{v0}} فروشگاه یافت شد', { v0: toFa(total) })
                  : translateText('{{v0}} کالا یافت شد', { v0: toFa(total) })}
            </p>
          </div>

          {/* مرتب‌سازی داخل پنل فیلترهاست؛ اینجا فقط دکمه‌ی فیلتر برای موبایل می‌ماند */}
          <div className="flex w-full items-center gap-2 md:w-auto">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="btn-ghost inline-flex w-full shrink-0 items-center justify-center gap-2 !py-2 text-xs md:w-auto lg:hidden"
            >
              <SlidersHorizontal size={15} />
              {translateText('فیلترها ')}
              {chips.length > 0 && (
                <span className="rounded-full px-1.5 text-[10px] font-black" style={ACCENT}>
                  {toFa(chips.length)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* تب‌ها: محصولات | تأمین‌کنندگان (مثل علی‌بابا) + انتخابگر حالت نمایش */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div
          role="tablist"
          aria-label={translateText('نوع نتایج')}
          className="flex items-center gap-6 px-1"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {[
            { key: 'products', label: translateText('محصولات'), icon: Boxes },
            { key: 'suppliers', label: translateText('تأمین‌کنندگان'), icon: StoreIcon },
          ].map((item) => {
            const active = (item.key === 'suppliers') === isSuppliers;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => !active && switchTab(item.key)}
                className="relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-1 pb-2.5 pt-1 text-sm transition"
                style={{
                  fontWeight: active ? 900 : 600,
                  color: active ? 'var(--text)' : 'var(--muted)',
                  boxShadow: active ? 'inset 0 -3px 0 var(--primary-color)' : 'none',
                }}
              >
                <Icon size={15} />
                {item.label}
                {item.key === 'suppliers' && isSuppliers && supplierTotal !== null && (
                  <span className="rounded-full px-1.5 text-[10px] font-black" style={ACCENT_SOFT}>
                    {toFa(supplierTotal)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* انتخابگر حالت نمایش — فقط در تب محصولات */}
        {!isSuppliers && (
          <ProductViewSwitcher value={effectiveViewMode} onChange={setViewMode} />
        )}
      </div>

      {/* چیپ‌های فعال */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => updateParams(chip.patch)}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition hover:opacity-80"
              style={ACCENT_SOFT}
            >
              <span className="truncate">{chip.label}</span>
              <X size={12} className="shrink-0" />
            </button>
          ))}
          <button
            type="button"
            onClick={resetFilters}
            className="text-[11px] font-bold underline-offset-4 hover:underline"
            style={{ color: 'var(--accent-text)' }}
          >
            {translateText('پاک کردن همه ')}
          </button>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[272px_minmax(0,1fr)] xl:gap-5 2xl:grid-cols-[288px_minmax(0,1fr)]">
        {/* سایدبار دسکتاپ — بدون اسکرول داخلی؛ اگر بلندتر از صفحه شد، چسبان نمی‌ماند */}
        <aside
          ref={asideRef}
          className={`card hidden rounded-3xl p-3 lg:block ${asideFits ? 'sticky top-24' : ''}`}
        >
          <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 text-[13px] font-black">
              <SlidersHorizontal size={16} style={{ color: 'var(--accent-text)' }} />
              {translateText('فیلترها ')}
              {chips.length > 0 && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={ACCENT}>
                  {toFa(chips.length)}
                </span>
              )}
            </div>
            {chips.length > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex shrink-0 items-center gap-1 text-[11px] muted transition hover:opacity-70"
              >
                <RotateCcw size={12} />
                {translateText('پاک کردن ')}
              </button>
            )}
          </div>
          <FiltersPanel {...panelProps} scope="desktop" />
        </aside>

        <div className="min-w-0">
          {error ? (
            <div className="card rounded-3xl p-10 text-center">
              <p className="muted">{error}</p>
              <button
                type="button"
                onClick={() => setRetry((v) => v + 1)}
                className="btn-primary mt-4"
              >
                {translateText('تلاش دوباره ')}
              </button>
            </div>
          ) : isSuppliers ? (
            <SuppliersList suppliers={suppliers} loading={loading} onClear={resetFilters} />
          ) : (
            <ProductsGrid
              products={products}
              loading={loading}
              onClear={resetFilters}
              viewMode={effectiveViewMode}
            />
          )}

          <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
        </div>
      </div>

      <FiltersSheet
        open={filtersOpen}
        onClose={closeSheet}
        total={total}
        activeCount={chips.length}
        onReset={resetFilters}
      >
        <FiltersPanel {...panelProps} scope="mobile" />
      </FiltersSheet>
    </div>
  );
}

export default ShopPage;
