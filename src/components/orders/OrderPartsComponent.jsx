import { formatOrderPrice as formatPrice, orderItemName } from '../../utils/helpers/order';
import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpLeft } from 'lucide-react';
import StorageImageComponent from '../common/StorageImageComponent';
import { toFa, statusFa, formatDateTime } from '../../utils/helpers/format';
import { getId } from '../../utils/helpers/response';

/*
 * اجزای مشترک نمایش سفارش در پنل ادمین و فروشنده:
 * ردیف کالا (عکس + نام با لینک به صفحه‌ی محصول)، تاریخچه‌ی وضعیت، کادر اطلاعات.
 */

/* ---------- کمک‌تابع‌های مبلغ و تعداد (اقلام سفارش یک عکس لحظه‌ای از کالا هستند) ---------- */
export const itemQty = (item) => Number(item?.quantity ?? 1) || 1;
export const itemName = orderItemName;
export const itemUnitPrice = (item) =>
  Number(item?.price?.amount ?? item?.unit_price ?? item?.price ?? 0) || 0;
export const itemUnitDiscount = (item) => Number(item?.discount?.amount ?? 0) || 0;
export const itemLineTotal = (item) =>
  (itemUnitPrice(item) - itemUnitDiscount(item)) * itemQty(item);

/* ---------- رنگ وضعیت مرسوله ---------- */
const SUB_STATUS_COLORS = {
  awaiting_approval: ['#c2740a', 'rgba(194,116,10,0.14)'],
  preparing: ['#2563eb', 'rgba(37,99,235,0.14)'],
  ready_to_ship: ['#7c3aed', 'rgba(124,58,237,0.14)'],
  shipped: ['#0f766e', 'rgba(15,118,110,0.14)'],
  delivered: ['#17994f', 'rgba(23,153,79,0.14)'],
  finalized: ['#17994f', 'rgba(23,153,79,0.14)'],
  cancelled: ['#e53935', 'rgba(229,57,53,0.14)'],
  rejected: ['#b91c1c', 'rgba(185,28,28,0.14)'],
};

export function SubStatusChip({ status }) {
  const [color, bg] = SUB_STATUS_COLORS[status] || ['var(--muted)', 'var(--card2)'];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black whitespace-nowrap"
      style={{ background: bg, color }}
    >
      {statusFa(status)}
    </span>
  );
}

const PAY_META = {
  paid: { label: translateText('پرداخت‌شده'), color: '#17994f', bg: 'rgba(23,153,79,0.14)' },
  failed: { label: translateText('پرداخت ناموفق'), color: '#e53935', bg: 'rgba(229,57,53,0.14)' },
  pending: {
    label: translateText('در انتظار پرداخت'),
    color: '#c2740a',
    bg: 'rgba(194,116,10,0.14)',
  },
};

export const payMetaOf = (status) => PAY_META[status] || PAY_META.pending;

export function PayStatusChip({ status }) {
  const meta = payMetaOf(status);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black whitespace-nowrap"
      style={{ background: meta.bg, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

/* ---------- ردیف یک کالا: عکس و نام، هر دو لینک به صفحه‌ی محصول ---------- */
export function OrderItemRow({ item }) {
  const productId = getId(item?.product_id);
  const name = itemName(item);
  const qty = itemQty(item);
  const unit = itemUnitPrice(item);
  const discount = itemUnitDiscount(item);
  const percent =
    Number(item?.discount?.percentage) || (unit ? Math.round((discount / unit) * 100) : 0);
  const image = Array.isArray(item?.images_id) ? item.images_id[0] : item?.image;
  const to = productId ? `/product/${productId}` : null;

  const picture = (
    <StorageImageComponent file={image} alt={name} className="h-full w-full object-cover" compact />
  );
  const frameClass = 'block h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-theme';

  return (
    <div className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: 'var(--card)' }}>
      {to ? (
        <Link
          to={to}
          className={frameClass}
          aria-label={translateText('مشاهده {{v0}}', { v0: name })}
          title={translateText('مشاهده صفحه محصول')}
        >
          {picture}
        </Link>
      ) : (
        <div className={frameClass}>{picture}</div>
      )}

      <div className="min-w-0 flex-1">
        {to ? (
          <Link
            to={to}
            className="inline-flex items-start gap-1 text-xs font-black leading-5 hover:underline"
            title={translateText('مشاهده صفحه محصول')}
          >
            <span className="line-clamp-2">{name}</span>
            <ArrowUpLeft size={12} className="mt-1 shrink-0 opacity-60" />
          </Link>
        ) : (
          <span className="line-clamp-2 text-xs font-black leading-5">{name}</span>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] muted">
          {item?.brand && (
            <span>
              {translateText('برند: ')}
              <b style={{ color: 'var(--text)' }}>{String(item.brand)}</b>
            </span>
          )}
          <span>
            {translateText('قیمت واحد: ')}
            {formatPrice(unit)}
          </span>
          {discount > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-black"
              style={{ background: 'rgba(229,57,53,0.14)', color: '#e53935' }}
            >
              {toFa(percent)}
              {translateText('٪ تخفیف ')}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-end">
        <div className="text-[11px] muted">
          {toFa(qty)}
          {translateText(' عدد')}
        </div>
        <b className="text-xs">{formatPrice(itemLineTotal(item))}</b>
      </div>
    </div>
  );
}

/* ---------- کادر اطلاعات ---------- */
export function InfoBox({ icon: Icon, title, children, className = '' }) {
  return (
    <section className={`card2 rounded-xl p-3 space-y-1.5 text-xs ${className}`}>
      <div className="mb-1 flex items-center gap-1.5 font-black text-yellow">
        {Icon && <Icon size={13} />}
        {title}
      </div>
      {children}
    </section>
  );
}

export function InfoLine({ label, value, ltr = false }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="muted shrink-0">{label}</span>
      <b
        className="min-w-0 break-words text-start font-bold"
        dir={ltr && !empty ? 'ltr' : undefined}
      >
        {empty ? '—' : value}
      </b>
    </div>
  );
}

/* ---------- نشانی تحویل ---------- */
export function AddressLines({ address }) {
  if (!address) return <div className="muted">{translateText('نشانی ثبت نشده است.')}</div>;
  return (
    <>
      <InfoLine label={translateText('گیرنده')} value={address.full_name} />
      <InfoLine
        label={translateText('استان و شهر')}
        value={[address.province, address.city].filter(Boolean).join(translateText('، '))}
      />
      <InfoLine label={translateText('محله')} value={address.neighborhood} />
      <InfoLine label={translateText('نشانی کامل')} value={address.full_address} />
      <InfoLine
        label={translateText('پلاک')}
        value={address.building_number ? toFa(address.building_number) : ''}
      />
      <InfoLine label={translateText('واحد')} value={address.unit ? toFa(address.unit) : ''} />
      <InfoLine
        label={translateText('کد پستی')}
        value={address.postal_code ? toFa(address.postal_code) : ''}
      />
    </>
  );
}

/* ---------- تاریخچه‌ی وضعیت ---------- */
const ACTORS = {
  system: translateText('سیستم'),
  seller: translateText('فروشنده'),
  admin: translateText('مدیر سایت'),
  customer: translateText('مشتری'),
  user: translateText('مشتری'),
};
const hasPersian = (text) => /[\u0600-\u06FF]/.test(String(text || ''));

export function OrderTimeline({ history = [] }) {
  if (!history.length)
    return <p className="text-[11px] muted">{translateText('تاریخچه‌ای ثبت نشده است.')}</p>;
  return (
    <ol className="space-y-2.5">
      {[...history].reverse().map((entry, index) => (
        <li key={`${entry.status}-${index}`} className="flex items-start gap-2 text-[11px]">
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{ background: 'var(--primary-color)' }}
          />
          <div className="min-w-0">
            <b>{statusFa(entry.status)}</b>
            <span className="muted">
              {' · '}
              {ACTORS[entry.by] || entry.by || translateText('سیستم')}
              {' · '}
              {formatDateTime(entry.timestamp)}
            </span>
            {hasPersian(entry.note) && <p className="mt-0.5 break-words muted">{entry.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ---------- لغو و بازپرداخت ---------- */
export function CancellationInfo({ sub }) {
  const cancel = sub?.cancellation;
  const refund = sub?.refund;
  const hasRefund = refund && refund.status && refund.status !== 'none';
  if (!cancel?.cancelled && !hasRefund) return null;

  return (
    <div
      className="rounded-xl p-3 text-[11px] space-y-1"
      style={{ background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.25)' }}
    >
      {cancel?.cancelled && (
        <>
          <div className="font-black" style={{ color: '#e53935' }}>
            {translateText('این مرسوله لغو شده است ')}
          </div>
          {cancel.reason && (
            <div>
              {translateText('دلیل: ')}
              {cancel.reason}
            </div>
          )}
          {cancel.cancelled_at && (
            <div className="muted">
              {translateText('زمان لغو: ')}
              {formatDateTime(cancel.cancelled_at)}
            </div>
          )}
        </>
      )}
      {hasRefund && (
        <div>
          {translateText('بازپرداخت: ')}
          <b>{statusFa(refund.status)}</b>
          {refund.amount ? (
            <>
              {translateText(' — مبلغ ')}
              {formatPrice(refund.amount)}
            </>
          ) : null}
          {refund.penalty_amount ? (
            <>
              {translateText(' — جریمه ')}
              {formatPrice(refund.penalty_amount)}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
