import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { toFa } from '../../utils/helpers/format';

/*
 * کنترل تعداد سبد خرید در صفحه محصول و کارت محصول (− عدد +).
 * منطق سبد در useCartQuantity است؛ این کامپوننت فقط نمایش/اکشن است.
 */
function CartQtyControl({ qty, busy, max, soldOut, onIncrement, onDecrement, compact = false }) {
  const atMax = max !== null && qty >= max;
  const cannotIncrement = soldOut || atMax;
  const cannotDecrement = qty <= 0;

  if (compact) {
    if (qty === 0) {
      return (
        <button
          type="button"
          onClick={onIncrement}
          disabled={soldOut}
          className="btn-yellow w-full !rounded-xl !py-2 flex items-center justify-center gap-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ShoppingCart size={16} />
          {soldOut ? 'ناموجود' : 'افزودن به سبد'}
        </button>
      );
    }

    return (
      <div
        className="flex items-center justify-between gap-2 rounded-xl border border-theme p-1"
        style={{ background: 'var(--card2)' }}
      >
        <button
          type="button"
          onClick={onDecrement}
          aria-label={qty === 1 ? 'حذف از سبد خرید' : 'کاهش تعداد'}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border border-theme bg-[var(--card)] transition ${
            qty === 1 ? 'hover:border-rose-500/40 hover:text-rose-500' : 'hover:opacity-80'
          }`}
        >
          {qty === 1 ? <Trash2 size={15} /> : <Minus size={15} />}
        </button>

        <div className="min-w-[2rem] text-center text-base font-black tabular-nums">
          {busy ? <Loader2 size={15} className="mx-auto animate-spin muted" /> : toFa(qty)}
        </div>

        <button
          type="button"
          onClick={onIncrement}
          disabled={cannotIncrement}
          aria-label="افزایش تعداد"
          className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-35"
          style={{ background: 'var(--primary-color)', color: 'var(--navy)' }}
        >
          <Plus size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          {busy ? (
            <>
              <Loader2 size={14} className="animate-spin muted" />
              <span className="muted">در حال همگام‌سازی…</span>
            </>
          ) : qty > 0 ? (
            <>
              <CheckCircle2
                size={14}
                className="text-emerald-600 dark:text-emerald-400"
              />
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                موجود در سبد خرید شما
              </span>
            </>
          ) : soldOut ? (
            <span className="font-bold text-rose-500">این محصول ناموجود است</span>
          ) : (
            <span className="muted">تعداد در سبد خرید</span>
          )}
        </span>

        {max !== null && !soldOut && (
          <span className="text-[11px] muted">حداکثر: {toFa(max)} عدد</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-theme bg-[var(--card2)]/60 p-1.5">
        <button
          type="button"
          onClick={onDecrement}
          disabled={cannotDecrement}
          aria-label={qty === 1 ? 'حذف از سبد خرید' : 'کاهش تعداد'}
          className={`flex h-11 w-11 items-center justify-center rounded-lg border border-theme bg-[var(--card)] transition disabled:cursor-not-allowed disabled:opacity-35 ${
            qty === 1
              ? 'hover:border-rose-500/40 hover:text-rose-500'
              : 'hover:bg-[var(--card2)]'
          }`}
        >
          {qty === 1 ? <Trash2 size={17} /> : <Minus size={17} />}
        </button>

        <div className="min-w-0 flex-1 text-center">
          <span className="text-xl font-black tabular-nums">{toFa(qty)}</span>
        </div>

        <button
          type="button"
          onClick={onIncrement}
          disabled={cannotIncrement}
          aria-label={qty === 0 ? 'افزودن به سبد خرید' : 'افزایش تعداد'}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-900 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-35"
          style={{ background: 'var(--primary-color)' }}
        >
          <Plus size={18} />
        </button>
      </div>

      {qty > 0 && (
        <Link
          to="/cart"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-400"
        >
          <ShoppingCart size={14} />
          مشاهده سبد خرید
        </Link>
      )}
    </div>
  );
}

export default CartQtyControl;
