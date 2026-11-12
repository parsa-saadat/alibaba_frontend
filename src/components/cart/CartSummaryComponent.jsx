import React from 'react';
import { ArrowLeft, Check, LoaderCircle } from 'lucide-react';
import { formatPrice } from '../../utils/helpers/format';

/* نشانگر وضعیت همگام‌سازی سبد با سرور */
export function CartSyncBadge({ state }) {
  if (!state || state === 'idle') return null;
  return (
    <span className="text-xs muted flex items-center gap-1.5 card px-3 py-1.5 rounded-full">
      {state === 'pending' && (
        <>
          <LoaderCircle size={13} className="animate-spin text-yellow" /> در انتظار ثبت تغییرات…
        </>
      )}
      {state === 'saving' && (
        <>
          <LoaderCircle size={13} className="animate-spin text-yellow" /> در حال همگام‌سازی با سرور…
        </>
      )}
      {state === 'saved' && (
        <>
          <Check size={13} className="text-emerald-400" /> در سرور ذخیره شد
        </>
      )}
    </span>
  );
}

function CartSummaryComponent({
  subtotal,
  itemCount = 0,
  disabled = false,
  busy = false,
  onCheckout,
}) {
  return (
    <div className="card rounded-3xl p-5 lg:sticky lg:top-36">
      <h2 className="font-black mb-3">خلاصه سفارش</h2>

      <div className="flex justify-between text-sm muted">
        <span>جمع اقلام ({itemCount} مورد)</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm muted mt-1">
        <span>هزینه ارسال</span>
        <span>محاسبه در تسویه</span>
      </div>

      <div className="border-t border-theme mt-3 pt-3 flex justify-between font-black">
        <span>مبلغ قابل پرداخت</span>
        <span className="text-yellow">{formatPrice(subtotal)}</span>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={disabled || busy}
        className="btn-yellow w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
      >
        ادامه به تسویه حساب <ArrowLeft size={16} />
      </button>
    </div>
  );
}

export default CartSummaryComponent;
