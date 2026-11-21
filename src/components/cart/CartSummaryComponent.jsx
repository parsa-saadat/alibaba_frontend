import { currency as preferredCurrency } from '../../i18n/runtime';
import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { ArrowLeft, Check, LoaderCircle, ShieldCheck, Truck, Undo2 } from 'lucide-react';

import { formatPrice, toFa } from '../../utils/helpers/format';

/* نشانگر وضعیت همگام‌سازی سبد با سرور */
export function CartSyncBadge({ state }) {
  if (!state || state === 'idle') return null;

  const content =
    state === 'saved' ? (
      <>
        <Check size={13} style={{ color: '#17994f' }} />
        {translateText(' در سرور ذخیره شد ')}
      </>
    ) : (
      <>
        <LoaderCircle size={13} className="animate-spin text-accent" />
        {state === 'pending'
          ? translateText('در انتظار ثبت تغییرات…')
          : translateText('همگام‌سازی با سرور…')}
      </>
    );

  return (
    <span className="card inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] muted">
      {content}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* خلاصه‌ی سفارش                                                      */
/* ------------------------------------------------------------------ */

function CartSummaryComponent({
  subtotal,
  currencyCode = preferredCurrency,
  itemCount = 0,
  discount = 0,
  disabled = false,
  busy = false,
  onCheckout,
}) {
  const payable = Math.max(0, subtotal);

  return (
    <aside className="card rounded-3xl p-4 lg:sticky lg:top-32 lg:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-black">{translateText('خلاصه‌ی سفارش')}</h2>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-black muted"
          style={{ background: 'var(--card2)' }}
        >
          {toFa(itemCount)}
          {translateText(' کالا ')}
        </span>
      </div>

      <div className="space-y-2 border-y border-theme py-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="muted">{translateText('جمع کالاها')}</span>
          <span className="font-bold">
            {currencyCode ? formatPrice(subtotal + discount, currencyCode) : '—'}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between">
            <span className="muted">{translateText('تخفیف کالاها')}</span>
            <span className="font-black" style={{ color: '#17994f' }}>
              − {currencyCode ? formatPrice(discount, currencyCode) : '—'}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="muted">{translateText('هزینه‌ی ارسال')}</span>
          <span className="font-bold muted">{translateText('در مرحله‌ی بعد')}</span>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <span className="text-xs font-bold muted">{translateText('مبلغ قابل پرداخت')}</span>
        <span className="text-xl font-black" style={{ color: 'var(--accent-text)' }}>
          {currencyCode ? formatPrice(payable, currencyCode) : '—'}
        </span>
      </div>

      <p className="mt-3 text-[11px] leading-6 muted">
        {translateText(
          'مبلغ نمایش داده‌شده برآورد است؛ مبلغ نهایی پرداخت با ریال هنگام ثبت سفارش محاسبه می‌شود.',
        )}
      </p>
      {!currencyCode && (
        <p role="alert" className="mt-2 text-xs text-red-500">
          {translateText('ارز اقلام سبد یکسان نیست؛ سبد را دوباره بارگذاری کنید.')}
        </p>
      )}
      <button
        type="button"
        onClick={onCheckout}
        disabled={disabled || busy}
        className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowLeft size={16} />}
        {translateText('ادامه‌ی فرایند خرید ')}
      </button>

      <ul className="mt-4 space-y-2 text-[11px] muted">
        <li className="flex items-center gap-2">
          <ShieldCheck size={14} style={{ color: '#17994f' }} />
          {translateText('پرداخت امن با درگاه بانکی ')}
        </li>
        <li className="flex items-center gap-2">
          <Undo2 size={14} style={{ color: '#17994f' }} />
          {translateText('b2b.noReturn')}
        </li>
        <li className="flex items-center gap-2">
          <Truck size={14} style={{ color: '#17994f' }} />
          {translateText('b2b.productTerms')}
        </li>
      </ul>
    </aside>
  );
}

export default CartSummaryComponent;
