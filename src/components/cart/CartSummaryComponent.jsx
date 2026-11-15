import React from 'react';
import { ArrowLeft, Check, LoaderCircle, ShieldCheck, Truck, Undo2 } from 'lucide-react';

import { formatPrice, toFa } from '../../utils/helpers/format';

/* نشانگر وضعیت همگام‌سازی سبد با سرور */
export function CartSyncBadge({ state }) {
  if (!state || state === 'idle') return null;

  const content =
    state === 'saved' ? (
      <>
        <Check size={13} style={{ color: '#17994f' }} /> در سرور ذخیره شد
      </>
    ) : (
      <>
        <LoaderCircle size={13} className="animate-spin text-yellow" />
        {state === 'pending' ? 'در انتظار ثبت تغییرات…' : 'همگام‌سازی با سرور…'}
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
        <h2 className="text-sm font-black">خلاصه‌ی سفارش</h2>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-black muted"
          style={{ background: 'var(--card2)' }}
        >
          {toFa(itemCount)} کالا
        </span>
      </div>

      <div className="space-y-2 border-y border-theme py-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="muted">جمع کالاها</span>
          <span className="font-bold">{formatPrice(subtotal + discount)}</span>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between">
            <span className="muted">تخفیف کالاها</span>
            <span className="font-black" style={{ color: '#17994f' }}>
              − {formatPrice(discount)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="muted">هزینه‌ی ارسال</span>
          <span className="font-bold muted">در مرحله‌ی بعد</span>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <span className="text-xs font-bold muted">مبلغ قابل پرداخت</span>
        <span className="text-xl font-black" style={{ color: 'var(--accent-text)' }}>
          {formatPrice(payable)}
        </span>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={disabled || busy}
        className="btn-yellow mt-4 inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowLeft size={16} />}
        ادامه‌ی فرایند خرید
      </button>

      <ul className="mt-4 space-y-2 text-[11px] muted">
        <li className="flex items-center gap-2">
          <ShieldCheck size={14} style={{ color: '#17994f' }} />
          پرداخت امن با درگاه بانکی
        </li>
        <li className="flex items-center gap-2">
          <Undo2 size={14} style={{ color: '#17994f' }} />
          ۷ روز ضمانت بازگشت کالا
        </li>
        <li className="flex items-center gap-2">
          <Truck size={14} style={{ color: '#17994f' }} />
          ارسال سریع به سراسر ایران
        </li>
      </ul>
    </aside>
  );
}

export default CartSummaryComponent;
