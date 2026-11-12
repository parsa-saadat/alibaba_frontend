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
  Percent,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
  X,
} from 'lucide-react';
import ProductGridComponent from '../../components/product/ProductGridComponent';
import { fetchCategories, buildCategoryTree } from '../../utils/helpers/categories';
import { getBody, getList } from '../../utils/helpers/response';
import { toFa } from '../../utils/helpers/format';

/* ------------------------------------------------------------------ */
/* ثابت‌ها                                                              */
/* ------------------------------------------------------------------ */

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
const PAGE_SIZE = 20;

const PRICE_MIN = 0;
const PRICE_MAX = 1_000_000_000; // ۱ میلیارد ریال
const PRICE_STEP = 1_000_000;

const YEAR_MIN = 1340;
const YEAR_MAX = 1405;

const FILTER_KEYS = [
  'name',
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
];

const SORTS = [
  { value: '', label: 'جدیدترین' },
  { value: 'cheap', label: 'ارزان‌ترین' },
  { value: 'expensive', label: 'گران‌ترین' },
  { value: 'discount', label: 'بیشترین تخفیف' },
  { value: 'sold', label: 'پرفروش‌ترین' },
];

const STOCK_OPTIONS = [
  { value: '', label: 'همه' },
  { value: 'IN_STOCK', label: 'موجود' },
  { value: 'OUT_OF_STOCK', label: 'ناموجود' },
];

// استایل‌های تم (فقط متغیرهای پروژه)
const ACCENT = { background: 'var(--primary-color)', color: 'var(--navy)' };
const ACCENT_SOFT = {
  background: 'color-mix(in srgb, var(--primary-color) 14%, transparent)',
  color: 'var(--primary-color)',
};
const TRACK_BG = { background: 'color-mix(in srgb, currentColor 14%, transparent)' };

/* ------------------------------------------------------------------ */
/* هِلپرها                                                             */
/* ------------------------------------------------------------------ */

const toLatinDigits = (str = '') =>
  str
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

const digitsOnly = (value) => toLatinDigits(value).replace(/\D/g, '');

const faGrouped = (value) => (value !== '' && value != null ? new Intl.NumberFormat('fa-IR').format(Number(value)) : '');

const faPlain = (value) =>
  value !== '' && value != null ? new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(Number(value)) : '';

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

  if (filters.name) chips.push({ key: 'name', label: `نام: ${filters.name}`, patch: { name: '' } });
  if (filters.category_id)
    chips.push({ key: 'category', label: categoryName || 'دسته‌بندی', patch: { category_id: '' } });
  if (filters.brand) chips.push({ key: 'brand', label: `برند: ${filters.brand}`, patch: { brand: '' } });
  if (filters.min_price || filters.max_price) {
    chips.push({
      key: 'price',
      label: `قیمت: ${faGrouped(filters.min_price) || '۰'} تا ${faGrouped(filters.max_price) || 'بی‌نهایت'}`,
      patch: { min_price: '', max_price: '' },
    });
  }
  if (filters.min_production || filters.max_production) {
    const from = faPlain(filters.min_production);
    const to = faPlain(filters.max_production);
    chips.push({
      key: 'production',
      label: `سال تولید: ${from}${from && to ? ' تا ' : ''}${to}`,
      patch: { min_production: '', max_production: '' },
    });
  }
  if (filters.stock_status) {
    chips.push({
      key: 'stock',
      label: filters.stock_status === 'IN_STOCK' ? 'فقط موجود' : 'ناموجود',
      patch: { stock_status: '' },
    });
  }
  if (filters.discount === 'true') chips.push({ key: 'discount', label: 'تخفیف‌دار', patch: { discount: '' } });
  if (filters.warranty === 'true') chips.push({ key: 'warranty', label: 'گارانتی‌دار', patch: { warranty: '' } });

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
.ab-range::-webkit-slider-thumb{-webkit-appearance:none;pointer-events:auto;width:20px;height:20px;border-radius:9999px;background:var(--primary-color);border:3px solid var(--card);box-shadow:0 2px 8px rgba(0,0,0,.35);cursor:grab}
.ab-range::-moz-range-thumb{pointer-events:auto;width:14px;height:14px;border-radius:9999px;background:var(--primary-color);border:3px solid var(--card);box-shadow:0 2px 8px rgba(0,0,0,.35);cursor:grab}
.ab-range:focus-visible::-webkit-slider-thumb{outline:2px solid var(--primary-color);outline-offset:2px}
`;

function RangeSlider({ min, max, step, from, to, onCommit, format }) {
  const clamp = (v, fallback) => {
    if (v === '' || v == null || Number.isNaN(Number(v))) return fallback;
    return Math.min(max, Math.max(min, Number(v)));
  };

  const committedLo = clamp(from, min);
  const committedHi = clamp(to, max);
  const [range, setRange] = useState([committedLo, committedHi]);

  useEffect(() => {
    setRange([committedLo, committedHi]);
  }, [committedLo, committedHi]);

  const [lo, hi] = range;
  const pct = (v) => ((v - min) / (max - min)) * 100;

  // فقط بعد از رها کردن نوار درخواست ارسال می‌شود
  const commit = () => {
    if (lo === committedLo && hi === committedHi) return;
    onCommit(lo <= min ? '' : String(lo), hi >= max ? '' : String(hi));
  };

  return (
    <div className="space-y-3">
      <style>{RANGE_CSS}</style>

      <div dir="ltr" className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full" style={TRACK_BG} />
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
          aria-label="حداقل"
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
          aria-label="حداکثر"
          onChange={(e) => setRange([lo, Math.max(Number(e.target.value), lo)])}
          onPointerUp={commit}
          onKeyUp={commit}
          onBlur={commit}
          className="ab-range"
        />
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="rounded-lg px-2 py-1 font-bold" style={ACCENT_SOFT}>
          {format(lo, false)}
        </span>
        <span className="muted">تا</span>
        <span className="rounded-lg px-2 py-1 font-bold" style={ACCENT_SOFT}>
          {format(hi, hi >= max)}
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

  return (
    <section className="card2 overflow-hidden rounded-2xl border border-theme">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-start"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg  var(--primary-color)" style={ACCENT_SOFT}>
          <Icon size={14} />
        </span>
        <span className="flex-1 text-sm font-black">{title}</span>
        {badge > 0 && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={ACCENT}>
            {toFa(badge)}
          </span>
        )}
        <ChevronDown
          size={16}
          className={`shrink-0 muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-3 px-3.5 pb-4">{children}</div>
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
      className="flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2.5 transition hover:opacity-80"
    >
      <span className="flex items-center gap-2 text-xs font-bold">
        <Icon size={14} className={checked ? '' : 'muted'} style={checked ? { color: 'var(--primary-color)' } : undefined} />
        {label}
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
            className={`rounded-lg py-2 text-xs font-bold transition-all duration-200 ${active ? 'shadow-md' : 'hover:opacity-80'}`}
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
          className="flex-1 truncate rounded-lg px-2.5 py-1.5 text-start text-xs transition hover:opacity-80"
          style={isSelected ? ACCENT : undefined}
        >
          {node.name}
        </button>
        {hasChildren && (
          <button
            type="button"
            onClick={() => onToggle(node._id)}
            aria-label={isOpen ? 'بستن زیرمجموعه' : 'باز کردن زیرمجموعه'}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg muted"
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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

function CategoryPicker({ tree, selectedId, expanded, onSelect, onToggle }) {
  const [query, setQuery] = useState('');
  const q = query.trim();
  const flat = useMemo(() => flattenNodes(tree), [tree]);
  const matches = q ? flat.filter((node) => node.name?.includes(q)) : null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={13} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی دسته…"
          className="input !py-2 !ps-9 text-xs"
        />
      </div>

      <div className="max-h-64 space-y-0.5 overflow-y-auto pe-1">
        <button
          type="button"
          aria-pressed={!selectedId}
          onClick={() => onSelect('')}
          className="w-full rounded-lg px-2.5 py-1.5 text-start text-xs transition hover:opacity-80"
          style={!selectedId ? ACCENT : undefined}
        >
          همه دسته‌ها
        </button>

        {matches ? (
          matches.length ? (
            matches.map((node) => (
              <button
                key={node._id}
                type="button"
                aria-pressed={selectedId === node._id}
                onClick={() => onSelect(selectedId === node._id ? '' : node._id)}
                className="w-full rounded-lg px-2.5 py-1.5 text-start text-xs transition hover:opacity-80"
                style={selectedId === node._id ? ACCENT : undefined}
              >
                {node.name}
              </button>
            ))
          ) : (
            <p className="px-2 py-3 text-center text-xs muted">دسته‌ای پیدا نشد</p>
          )
        ) : (
          tree.map((root) => (
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
      </div>
    </div>
  );
}

function FiltersPanel({ filters, setFilter, categoryTree, brands, expanded, onToggleCat }) {
  const priceCount = (filters.min_price ? 1 : 0) + (filters.max_price ? 1 : 0);
  const yearCount = (filters.min_production ? 1 : 0) + (filters.max_production ? 1 : 0);
  const statusCount =
    (filters.stock_status ? 1 : 0) + (filters.discount === 'true' ? 1 : 0) + (filters.warranty === 'true' ? 1 : 0);

  const formatPrice = (v, isMax) => (isMax ? 'بدون سقف' : `${faGrouped(v)} ریال`);
  const formatYear = (v, isMax) => (isMax ? `${faPlain(v)} و بعد` : faPlain(v));

  return (
    <div className="space-y-3">
      <Section icon={Search} title="جستجو در نام" badge={filters.name ? 1 : 0}>
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 muted " />
          <DraftField
            value={filters.name}
            onCommit={(v) => setFilter({ name: v })}
            placeholder="نام محصول…"
            className="input !ps-9"
          />
        </div>
      </Section>

      <Section icon={Layers} title="دسته‌بندی" badge={filters.category_id ? 1 : 0}>
        <CategoryPicker
          tree={categoryTree}
          selectedId={filters.category_id}
          expanded={expanded}
          onSelect={(id) => setFilter({ category_id: id })}
          onToggle={onToggleCat}
        />
      </Section>

      <Section icon={Award} title="برند" badge={filters.brand ? 1 : 0} defaultOpen={Boolean(filters.brand)}>
        <DraftField
          list="brand-options"
          value={filters.brand}
          onCommit={(v) => setFilter({ brand: v })}
          placeholder="نام برند…"
          className="input"
        />
        <datalist id="brand-options">
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
                  className="rounded-full border border-theme px-2.5 py-1 text-[11px] font-bold transition hover:opacity-80"
                  style={active ? ACCENT : undefined}
                >
                  {brand}
                </button>
              );
            })}
          </div>
        )}
      </Section>

      <Section icon={Wallet} title="قیمت" badge={priceCount}>
        <RangeSlider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          from={filters.min_price}
          to={filters.max_price}
          format={formatPrice}
          onCommit={(lo, hi) => setFilter({ min_price: lo, max_price: hi })}
        />
      </Section>

      <Section icon={CalendarDays} title="سال تولید" badge={yearCount} defaultOpen={yearCount > 0}>
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

      <Section icon={Boxes} title="وضعیت و امکانات" badge={statusCount} defaultOpen={statusCount > 0}>
        <Segmented
          options={STOCK_OPTIONS}
          value={filters.stock_status}
          onChange={(v) => setFilter({ stock_status: v })}
        />
        <Switch
          icon={Percent}
          label="فقط کالاهای تخفیف‌دار"
          checked={filters.discount === 'true'}
          onChange={(c) => setFilter({ discount: c ? 'true' : '' })}
        />
        <Switch
          icon={ShieldCheck}
          label="دارای گارانتی"
          checked={filters.warranty === 'true'}
          onChange={(c) => setFilter({ warranty: c ? 'true' : '' })}
        />
      </Section>
    </div>
  );
}

function SelectField({ value, onChange, options, label, icon: Icon }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon size={14} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 muted" />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="input cursor-pointer appearance-none !py-2 text-xs"
        style={{ paddingInlineStart: Icon ? '2.25rem' : undefined, paddingInlineEnd: '2.5rem' }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 muted" />
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
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="فیلترها">
      <style>{`
        @keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <button
        type="button"
        aria-label="بستن فیلترها"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ animation: 'fade-in 0.2s ease-out' }}
      />

      <div
        className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[28px] border-t border-theme shadow-2xl"
        style={{ background: 'var(--card)', animation: 'sheet-up 0.32s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full" style={TRACK_BG} />

        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-2 font-black">
            <SlidersHorizontal size={16} style={{ color: 'var(--primary-color)' }} />
            فیلترها
          </div>
          <div className="flex items-center gap-1">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold"
                style={{ color: 'var(--primary-color)' }}
              >
                پاک کردن
              </button>
            )}
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="grid h-9 w-9 place-items-center rounded-xl"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>

        <div className="border-t border-theme p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="btn-yellow w-full">
            مشاهده {toFa(total)} کالا
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
    <nav aria-label="صفحه‌بندی" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="btn-ghost inline-flex items-center gap-1 !py-2 text-xs disabled:opacity-40"
      >
        <ChevronRight size={14} />
        قبلی
      </button>

      {items.map((item, index) =>
        typeof item === 'number' ? (
          <button
            key={`${item}-${index}`}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className="grid h-9 min-w-9 place-items-center rounded-xl px-2.5 text-xs font-bold transition hover:opacity-80"
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
        بعدی
        <ChevronLeft size={14} />
      </button>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* صفحه‌ی محصولات                                                      */
/* ------------------------------------------------------------------ */

function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.toString();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const sort = searchParams.get('sort') || '';
  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) || '']));

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expandedCatIds, setExpandedCatIds] = useState({});
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const updateParams = (patch) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      Object.entries(patch).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
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

  const resetFilters = () => setSearchParams(sort ? { sort } : {});
  const toggleCat = useCallback((id) => setExpandedCatIds((prev) => ({ ...prev, [id]: !prev[id] })), []);
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
    params.set('limit', String(PAGE_SIZE));

    setLoading(true);
    setError('');

    axios
      .get(`${API}/product?${params}`, { signal: controller.signal, timeout: 15000 })
      .then((response) => {
        if (response.data?.success === false) throw new Error(response.data.message);
        const body = getBody(response);
        setProducts(getList(response));
        setTotal(Number(body?.total) || 0);
        setTotalPages(Math.max(1, Number(body?.totalPages) || 1));
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError('دریافت محصولات ناموفق بود. اتصال به بک‌اند را بررسی کنید.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [search, page, retry]);

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand).filter(Boolean))], [products]);

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

  const title = activeCategory?.name || (filters.name ? `نتایج «${filters.name}»` : 'همه محصولات');

  const panelProps = {
    filters,
    setFilter: updateParams,
    categoryTree,
    brands,
    expanded: expandedCatIds,
    onToggleCat: toggleCat,
  };

  const sortOptions = SORTS.map((s) => ({ value: s.value, label: s.label }));

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6">
      {/* هدر */}
      <header className="card relative overflow-hidden rounded-3xl p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-20 -top-20 h-56 w-56 rounded-full blur-3xl"
          style={{ background: 'color-mix(in srgb, var(--primary-color) 14%, transparent)' }}
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <nav className="flex flex-wrap items-center gap-1.5 text-[11px] muted">
              <Link to="/" className="transition hover:opacity-70">
                خانه
              </Link>
              <ChevronLeft size={12} />
              <Link to="/products" className="transition hover:opacity-70">
                محصولات
              </Link>
              {activeCategory && (
                <>
                  <ChevronLeft size={12} />
                  <span className="truncate">{activeCategory.name}</span>
                </>
              )}
            </nav>
            <h1 className="mt-2 text-xl font-black sm:text-2xl">{title}</h1>
            <p className="mt-1 text-xs muted" aria-live="polite">
              {loading ? 'در حال دریافت کالاها…' : `${toFa(total)} کالا یافت شد`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-44">
              <SelectField
                value={sort}
                onChange={(v) => updateParams({ sort: v })}
                options={sortOptions}
                label="مرتب‌سازی محصولات"
                icon={ArrowUpDown}
              />
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="btn-ghost inline-flex items-center gap-2 !py-2 text-xs lg:hidden"
            >
              <SlidersHorizontal size={15} />
              فیلترها
              {chips.length > 0 && (
                <span className="rounded-full px-1.5 text-[10px] font-black" style={ACCENT}>
                  {toFa(chips.length)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* چیپ‌های فعال */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => updateParams(chip.patch)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition hover:opacity-80"
              style={ACCENT_SOFT}
            >
              {chip.label}
              <X size={12} />
            </button>
          ))}
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-bold underline-offset-4 hover:underline"
            style={{ color: 'var(--primary-color)' }}
          >
            پاک کردن همه
          </button>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[280px_1fr]">
        {/* سایدبار دسکتاپ: بدون اسکرول داخلی تا با باز بودن همه بخش‌ها تو در تو نشود */}
        <aside className="card sticky top-28 hidden rounded-3xl p-4 lg:block">
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-sm font-black">
              <SlidersHorizontal size={16} style={{ color: 'var(--primary-color)' }} />
              فیلترها
              {chips.length > 0 && (
                <span className="rounded-full  px-2 py-0.5 text-[10px] font-black" style={ACCENT}>
                  {toFa(chips.length)}
                </span>
              )}
            </div>
            {chips.length > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs muted transition hover:opacity-70"
              >
                <RotateCcw size={12} />
                پاک کردن
              </button>
            )}
          </div>
          <FiltersPanel {...panelProps} />
        </aside>

        <div className="min-w-0">
          {error ? (
            <div className="card rounded-3xl p-10 text-center">
              <p className="muted">{error}</p>
              <button type="button" onClick={() => setRetry((v) => v + 1)} className="btn-yellow mt-4">
                تلاش دوباره
              </button>
            </div>
          ) : (
            <ProductGridComponent
              products={products}
              loading={loading}
              columns={3}
              emptyTitle="محصولی با این فیلترها پیدا نشد"
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
        <FiltersPanel {...panelProps} />
      </FiltersSheet>
    </div>
  );
}

export default ShopPage;