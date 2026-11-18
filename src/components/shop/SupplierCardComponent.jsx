import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Package,
  Percent,
  Store,
} from 'lucide-react';
import StorageImageComponent from '../common/StorageImageComponent';
import { formatPrice, finalPrice, hasDiscount, productImages, toFa } from '../../utils/helpers/format';
import { getId } from '../../utils/helpers/response';
import useScrollFade from '../../hooks/useScrollFade';
import { StoreContactModal } from '../store/StoreInfoComponent';

/* قیمت کوتاه برای نوار پایین عکس کالا (مثل «$850» در علی‌بابا) */
const shortPrice = (amount) => {
  const toman = Math.round(Number(amount || 0) / 10);
  try {
    return `${new Intl.NumberFormat('fa-IR', { notation: 'compact', maximumFractionDigits: 1 }).format(toman)} ت`;
  } catch {
    return `${toFa(toman)} ت`;
  }
};

const memberLabel = (since) => {
  if (!since) return '';
  const start = new Date(since).getTime();
  if (!Number.isFinite(start)) return '';
  const years = Math.floor((Date.now() - start) / (365.25 * 86400000));
  return years >= 1 ? `${toFa(years)} سال در ژئو کالا` : 'عضو جدید';
};

function Badge({ icon: Icon, children, tone = 'soft' }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
      style={
        tone === 'trust'
          ? { background: 'rgba(23,153,79,0.14)', color: '#17994f' }
          : {
              background: 'color-mix(in srgb, var(--primary-color) 14%, transparent)',
              color: 'var(--accent-text)',
            }
      }
    >
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

function Stat({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] muted truncate">{label}</div>
      <div className="mt-0.5 text-xs font-black truncate">{value}</div>
    </div>
  );
}

/* کاشی کالا در نوار افقی: عکس + نوار قیمت پایین */
function ProductTile({ product }) {
  const id = getId(product);
  const soldOut = product.stock_status === 'OUT_OF_STOCK';
  return (
    <Link
      to={`/product/${id}`}
      title={product.name}
      className="group relative block h-[132px] w-[132px] shrink-0 overflow-hidden rounded-xl sm:h-[148px] sm:w-[148px]"
      style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
    >
      <StorageImageComponent
        file={productImages(product)[0]}
        alt={product.name}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {soldOut && (
        <span className="absolute start-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-bold text-white">
          ناموجود
        </span>
      )}
      {hasDiscount(product) && (
        <span className="absolute end-1.5 top-1.5 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white">
          {toFa(product.discount.percentage)}٪
        </span>
      )}
      {/* سایه‌ی نرم پایین عکس: گرادیان چندمرحله‌ای (ease) تا بدون لبه‌ی تیز در عکس حل شود */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%]"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.74) 18%, rgba(0,0,0,0.52) 40%, rgba(0,0,0,0.26) 64%, rgba(0,0,0,0.08) 84%, rgba(0,0,0,0) 100%)',
        }}
      />
      <span
        className="absolute inset-x-0 bottom-0 px-2.5 pb-2 text-[12px] font-black leading-none text-white"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}
      >
        {shortPrice(finalPrice(product))}
      </span>
    </Link>
  );
}

function SupplierCardComponent({ store }) {
  const id = getId(store);
  const seller = store.seller || {};
  const products = store.matched_products || [];
  const rest = Math.max(0, (store.matched_count || 0) - products.length);
  const member = memberLabel(seller.member_since);
  const [contactOpen, setContactOpen] = useState(false);
  const rowRef = useRef(null);
  const [fadeRef, rowOverflows, fadeStyle] = useScrollFade();

  /* دکمه‌های جلو/عقب نوار کالاها؛ در RTL جهت اسکرول برعکس است */
  const scrollRow = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl';
    el.scrollBy({ left: dir * (rtl ? -1 : 1) * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const priceRange =
    store.min_price == null
      ? '—'
      : store.min_price === store.max_price
        ? formatPrice(store.min_price)
        : `${formatPrice(store.min_price)} تا ${formatPrice(store.max_price)}`;

  return (
    <article className="card rounded-3xl p-4 sm:p-5">
      {/* ردیف بالا: لوگو + نام + نشان‌ها + دکمه‌ها */}
      <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap">
        <Link
          to={`/store/${id}`}
          className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl"
          style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
        >
          <StorageImageComponent
            file={store.profile_image_id}
            alt={store.name}
            className="h-full w-full object-cover"
            fallback={<Store size={22} className="muted" />}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <Link to={`/store/${id}`} className="block truncate text-sm font-black hover:opacity-80 sm:text-base">
            {store.name}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {seller.seller_trust && (
              <Badge icon={BadgeCheck} tone="trust">
                فروشنده‌ی مورد اعتماد
              </Badge>
            )}
            {member && <Badge icon={CalendarDays}>{member}</Badge>}
            {store.has_discount && <Badge icon={Percent}>دارای تخفیف</Badge>}
          </div>
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="btn-ghost inline-flex items-center gap-1.5 !py-2 text-xs"
          >
            <MessageCircle size={13} />
            ارتباط با فروشنده
          </button>
          <Link to={`/store/${id}`} className="btn-yellow inline-flex items-center gap-1 !py-2 text-xs">
            مشاهده فروشگاه
            <ChevronLeft size={13} />
          </Link>
        </div>
      </div>

      {/* آمار */}
      <div
        className="mt-3 grid grid-cols-2 gap-3 rounded-2xl p-3 sm:grid-cols-3"
        style={{ background: 'var(--card2)' }}
      >
        <Stat label="کالای مطابق" value={`${toFa(store.matched_count || 0)} کالا`} />
        <Stat label="موجود در انبار" value={`${toFa(store.in_stock_count || 0)} کالا`} />
        <div className="col-span-2 sm:col-span-1">
          <Stat label="بازه‌ی قیمت" value={priceRange} />
        </div>
      </div>

      {/* نوار افقی کالاها — با سایه‌ی محو دو سر و دکمه‌های جلو/عقب مثل بقیه‌ی اسکرول‌های سایت */}
      {products.length > 0 ? (
        <div className="relative mt-3">
          {rowOverflows && (
            <>
              <button
                type="button"
                onClick={() => scrollRow(-1)}
                aria-label="قبلی"
                className="card absolute start-1 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full shadow-md transition-colors hover:text-yellow md:grid"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => scrollRow(1)}
                aria-label="بعدی"
                className="card absolute end-1 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full shadow-md transition-colors hover:text-yellow md:grid"
              >
                <ChevronLeft size={16} />
              </button>
            </>
          )}
          <div
            ref={(node) => {
              rowRef.current = node;
              fadeRef.current = node;
            }}
            style={fadeStyle}
            className="scroll-fade-x no-scrollbar flex scroll-smooth snap-x snap-proximity gap-2.5 overflow-x-auto py-1.5"
          >
            {products.map((product) => (
              <div key={getId(product)} className="snap-start">
                <ProductTile product={product} />
              </div>
            ))}
            {rest > 0 && (
              <Link
                to={`/store/${id}`}
                className="grid h-[132px] w-[110px] shrink-0 snap-start place-items-center rounded-xl text-center text-[11px] font-bold sm:h-[148px]"
                style={{ background: 'var(--card2)', border: '1px dashed var(--border)' }}
              >
                <span className="space-y-1">
                  <Package size={18} className="mx-auto muted" />
                  <span className="block">+{toFa(rest)} کالای دیگر</span>
                </span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-center text-xs muted">هنوز کالایی برای نمایش ثبت نشده است.</p>
      )}

      {/* پاپ‌آپ ارتباط با فروشنده — همان پاپ‌آپ صفحه‌ی محصول */}
      <StoreContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        store={store}
        owner={seller?._id ? seller : null}
        product={null}
      />
    </article>
  );
}

export function SupplierSkeleton() {
  return (
    <div className="card animate-pulse rounded-3xl p-5" aria-hidden>
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-xl" style={{ background: 'var(--card2)' }} />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded" style={{ background: 'var(--card2)' }} />
          <div className="h-2.5 w-1/4 rounded" style={{ background: 'var(--card2)' }} />
        </div>
      </div>
      <div className="mt-4 h-14 rounded-2xl" style={{ background: 'var(--card2)' }} />
      <div className="mt-3 flex gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[132px] w-[132px] shrink-0 rounded-xl" style={{ background: 'var(--card2)' }} />
        ))}
      </div>
    </div>
  );
}

export default SupplierCardComponent;
