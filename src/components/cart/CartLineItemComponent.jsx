import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import StorageImageComponent from '../common/StorageImageComponent';
import {
  formatPrice,
  finalPrice,
  productImages,
  toFa,
} from '../../utils/helpers/format';

/*
 * یک ردیف از سبد خرید.
 * quantity همان تعدادی است که کاربر می‌بیند (خوش‌بینانه) و onQuantityChange
 * تغییر را به Context (و در نهایت بک‌اند) می‌سپارد.
 */
function CartLineItemComponent({ product, quantity, onChangeQuantity, onRemove, busy = false }) {
  if (!product) return null;

  const stock = product.stock == null || product.stock === '' ? null : Number(product.stock);
  const atMax = Number.isFinite(stock) && quantity >= stock;

  return (
    <div className="card rounded-2xl p-3 flex gap-3">
      <Link
        to={`/product/${product._id}`}
        className="w-24 h-24 rounded-xl overflow-hidden shrink-0"
      >
        <StorageImageComponent
          file={productImages(product)[0]}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={`/product/${product._id}`} className="font-bold text-sm line-clamp-2">
          {product.name}
        </Link>
        <div className="text-xs muted mt-1 flex items-center gap-2 flex-wrap">
          {product.brand && <span>{product.brand}</span>}
          {Number.isFinite(stock) && (
            <span className={quantity > stock ? 'text-rose-400 font-bold' : ''}>
              موجودی: {toFa(stock)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
          <div className="flex items-center gap-1 btn-ghost !p-1">
            <button
              type="button"
              onClick={() => onChangeQuantity(quantity - 1)}
              className="p-1.5 disabled:opacity-30"
              disabled={quantity <= 1 || busy}
              aria-label="کاهش تعداد"
            >
              <Minus size={14} />
            </button>
            <span className="w-7 text-center font-black text-sm tabular-nums">
              {toFa(quantity)}
            </span>
            <button
              type="button"
              onClick={() => onChangeQuantity(quantity + 1)}
              className="p-1.5 disabled:opacity-30"
              disabled={atMax || busy}
              aria-label="افزایش تعداد"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="font-black text-yellow">
            {formatPrice(finalPrice(product) * quantity)}
          </div>

          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg disabled:opacity-50"
            aria-label="حذف از سبد"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartLineItemComponent;
