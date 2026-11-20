import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Loader2, ShieldCheck, Store, Trash2, Truck } from 'lucide-react';

import StorageImageComponent from '../common/StorageImageComponent';
import CartQtyControl from './CartQtyControlComponent';
import {
  formatPrice,
  finalPrice,
  hasDiscount,
  productImages,
  toFa,
} from '../../utils/helpers/format';

/*
 * یک ردیف سبد خرید.
 * quantity همان تعدادی است که کاربر می‌بیند (خوش‌بینانه) و onChangeQuantity
 * تغییر را به Context (و در نهایت بک‌اند) می‌سپارد.
 */
function CartLineItemComponent({ product, quantity, onChangeQuantity, onRemove, busy = false }) {
  if (!product) return null;

  const stock = product.stock == null || product.stock === '' ? null : Number(product.stock);
  const atMax = Number.isFinite(stock) && quantity >= stock;
  const soldOut = product.stock_status === 'OUT_OF_STOCK' || stock === 0;
  const unit = finalPrice(product);
  const total = unit * quantity;
  const discounted = hasDiscount(product);
  const productId = product._id || product.id;

  return (
    <article
      className={`card relative rounded-2xl p-3 transition sm:p-4 ${busy ? 'opacity-70' : ''}`}
      aria-busy={busy}
    >
      {busy && (
        <span className="absolute end-3 top-3 inline-flex items-center gap-1 text-[10px] muted">
          <Loader2 size={12} className="animate-spin" />
          {translateText('همگام‌سازی ')}
        </span>
      )}

      <div className="flex gap-3 sm:gap-4">
        {/* تصویر */}
        <Link
          to={`/product/${productId}`}
          className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl border border-theme sm:h-[108px] sm:w-[108px]"
          style={{ background: 'var(--card2)' }}
        >
          <StorageImageComponent
            file={productImages(product)[0]}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </Link>

        <div className="min-w-0 flex-1">
          {/* عنوان + حذف */}
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/product/${productId}`}
              className="line-clamp-2 text-sm font-bold leading-6 hover:underline"
            >
              {product.name}
            </Link>

            <button
              type="button"
              onClick={onRemove}
              disabled={busy}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-red-400 transition hover:bg-red-500/10 disabled:opacity-40"
              aria-label={translateText('حذف از سبد خرید')}
              title={translateText('حذف از سبد خرید')}
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* مشخصات کوتاه */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
            {product.brand && (
              <span
                className="rounded-md px-1.5 py-0.5 font-bold muted"
                style={{ background: 'var(--card2)' }}
              >
                {product.brand}
              </span>
            )}
            {product.warranty && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-bold muted"
                style={{ background: 'var(--card2)' }}
              >
                <ShieldCheck size={11} />
                {translateText('b2b.warrantySeller')}
              </span>
            )}
            {product.seller_trust === true && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-bold"
                style={{ background: 'rgba(23,153,79,0.14)', color: '#17994f' }}
              >
                <BadgeCheck size={11} />
                {translateText('فروشنده تأیید شده ')}
              </span>
            )}
            {product.store_name && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-bold muted"
                style={{ background: 'var(--card2)' }}
              >
                <Store size={11} />
                {product.store_name}
              </span>
            )}
          </div>

          {/* وضعیت موجودی */}
          <div className="mt-1.5 text-[11px]">
            {soldOut ? (
              <span className="font-bold" style={{ color: '#e53935' }}>
                {translateText('این کالا ناموجود شده است ')}
              </span>
            ) : Number.isFinite(stock) ? (
              atMax ? (
                <span style={{ color: '#c2740a' }}>
                  {translateText('حداکثر موجودی (')}
                  {toFa(stock)}
                  {translateText(' عدد) در سبد شماست ')}
                </span>
              ) : (
                <span className="muted">
                  <Truck size={11} className="inline align-[-1px]" />
                  {translateText(' موجودی: ')}
                  {toFa(stock)}
                  {translateText(' عدد ')}
                </span>
              )
            ) : (
              <span className="muted">{translateText('آماده‌ی ارسال')}</span>
            )}
          </div>

          {/* تعداد + قیمت */}
          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="w-[132px]">
              <CartQtyControl
                compact
                qty={quantity}
                busy={busy}
                max={Number.isFinite(stock) ? stock : null}
                soldOut={soldOut}
                onIncrement={() => onChangeQuantity(quantity + 1)}
                onDecrement={() => onChangeQuantity(quantity - 1)}
              />
            </div>

            <div className="min-w-0 text-end leading-tight sm:ms-auto">
              {discounted && (
                <div className="text-[11px] muted">
                  <s>
                    {formatPrice(
                      (Number(product.price?.amount) || 0) * quantity,
                      product.price?.currency,
                    )}
                  </s>
                </div>
              )}
              <div className="text-base font-black" style={{ color: 'var(--accent-text)' }}>
                {formatPrice(total, product.price?.currency)}
              </div>
              {quantity > 1 && (
                <div className="text-[10px] muted">
                  {translateText('واحد: ')}
                  {formatPrice(unit, product.price?.currency)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default CartLineItemComponent;
