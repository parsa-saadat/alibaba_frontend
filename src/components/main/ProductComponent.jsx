import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  GitCompareArrows,
  ShoppingCart,
  BadgeCheck,
  Check,
  Plus,
  Minus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import useCartQuantity from '../../hooks/useCartQuantity';
import StorageImageComponent from './StorageImageComponent';
import {
  formatPrice,
  finalPrice,
  hasDiscount,
  productImages,
  ratingOf,
  toFa,
} from '../../utils/helpers/format';

export function ProductSkeleton() {
  return (
    <div className="card rounded-xl p-3 w-full">
      <div className="skeleton aspect-square" />
      <div className="skeleton h-3 w-1/3 mt-3" />
      <div className="skeleton h-4 w-4/5 mt-2" />
      <div className="skeleton h-6 w-1/2 mt-3" />
      <div className="skeleton h-3 w-2/3 mt-2" />
      <div className="skeleton h-10 w-full mt-4" />
    </div>
  );
}

function ProductComponent({ product }) {
  const { toggleFavorite, isFavorite, toggleCompare, compare } = useShop();

  const id = product._id;
  const fav = isFavorite(id);
  const inCompare = compare.includes(id);
  const discount = hasDiscount(product);

  const rawStock = product.stock == null || product.stock === '' ? null : Number(product.stock);
  const stock = Number.isFinite(rawStock) ? Math.max(0, Math.floor(rawStock)) : null;
  const soldOut = product.stock_status === 'OUT_OF_STOCK' || stock === 0;

  const rating = Number(ratingOf(product)) || 0;
  const sold = Number(product.sold_count) || 0;

  const { qty, busy, increment, decrement, loggedIn, atMax } = useCartQuantity(id, {
    stock,
    soldOut,
  });

  const circle =
    'w-8 h-8 rounded-full grid place-items-center border border-theme bg-[var(--card)]/90 backdrop-blur-sm shadow transition-colors hover:bg-[var(--card)]';

  return (
    <div className="card group relative flex flex-col h-full w-full rounded-xl p-3 transition-shadow hover:shadow-xl">
      {/* ───── تصویر ───── */}
      <div
        className="relative aspect-square rounded-lg overflow-hidden"
        style={{ background: 'var(--card2)' }}
      >
        <StorageImageComponent
          file={productImages(product)[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {soldOut && (
          <div className="absolute inset-0 bg-black/45 grid place-items-center">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/70 text-white">
              ناموجود
            </span>
          </div>
        )}

        <div className="absolute bottom-2 start-2 z-20 flex gap-1.5">
          <button
            type="button"
            onClick={() => toggleFavorite(id)}
            className={circle}
            style={{ color: fav ? '#ff4d6d' : 'var(--text-color)' }}
            aria-label="افزودن به علاقه‌مندی"
            aria-pressed={fav}
          >
            <Heart size={16} fill={fav ? '#ff4d6d' : 'none'} />
          </button>
          <button
            type="button"
            onClick={() => toggleCompare(id)}
            className={circle}
            style={{ color: inCompare ? 'var(--primary-color)' : 'var(--text-color)' }}
            aria-label="مقایسه محصول"
            aria-pressed={inCompare}
          >
            <GitCompareArrows size={16} />
          </button>
        </div>
      </div>

      {/* ───── برچسب‌ها ───── */}
      <div className="mt-3 min-h-[18px] flex items-center gap-1.5 text-[11px]">
        {discount && (
          <span
            className="px-1.5 py-px rounded-sm font-black whitespace-nowrap"
            style={{ background: 'var(--primary-color)', color: 'var(--navy)' }}
          >
            {toFa(product.discount.percentage)}٪ تخفیف
          </span>
        )}
        {product.brand && <span className="muted font-semibold truncate">{product.brand}</span>}
      </div>

      {/* ───── عنوان ───── */}
      <h3 className="mt-1 text-sm font-bold truncate">{product.name}</h3>

      {/* ───── امتیاز ───── */}
      <div className="mt-1 h-[18px] flex items-center gap-1 text-xs muted">
        <Check size={12} strokeWidth={3} />
        {rating > 0 ? `امتیاز ${toFa(rating.toFixed(1))}` : 'ضمانت اصالت'}
      </div>

      {/* ───── قیمت ───── */}
      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
        <span className="text-xl font-black leading-none text-yellow">
          {formatPrice(finalPrice(product))}
        </span>
        {discount && (
          <span className="text-xs muted line-through">{formatPrice(product.price?.amount)}</span>
        )}
      </div>

      {/* ───── موجودی و فروش ───── */}
      <div className="mt-1.5 text-sm">
        {soldOut ? (
          <span className="text-rose-500 font-bold">ناموجود</span>
        ) : stock !== null ? (
          <span>موجودی: {toFa(stock)}</span>
        ) : (
          <span>موجود</span>
        )}
        {sold > 0 && <span className="muted ms-2">{toFa(sold)} فروش</span>}
      </div>

      {/* ───── فروشنده ───── */}
      <div className="mt-1.5 flex items-center gap-1 text-xs muted min-w-0">
        <BadgeCheck size={16} className="text-yellow shrink-0" />
        <span className="font-black text-yellow text-sm shrink-0">تأییدشده</span>
        <span>·</span>
        {product.store_id && product.store_name ? (
          <Link to={`/store/${product.store_id}`} className="relative z-20 truncate hover:underline">
            {product.store_name}
          </Link>
        ) : (
          <span className="truncate">{product.store_name || 'ایران'}</span>
        )}
      </div>

      {/* ───── سبد خرید (همان منطق صفحه محصول) ───── */}
      <div className="relative z-20 mt-auto pt-3">
        {qty === 0 ? (
          <button
            type="button"
            onClick={increment}
            disabled={soldOut || !loggedIn}
            title={!loggedIn ? 'برای افزودن به سبد ابتدا وارد شوید' : undefined}
            className="btn-yellow w-full !rounded-xl !py-2 flex items-center justify-center gap-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart size={16} />
            {soldOut ? 'ناموجود' : 'افزودن به سبد'}
          </button>
        ) : (
          <div
            className="flex items-center justify-between gap-2 rounded-xl border border-theme p-1"
            style={{ background: 'var(--card2)' }}
          >
            <button
              type="button"
              onClick={decrement}
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
              onClick={increment}
              disabled={soldOut || atMax}
              aria-label="افزایش تعداد"
              className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-35"
              style={{ background: 'var(--primary-color)', color: 'var(--navy)' }}
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      {/* لینک کل کارت */}
      <Link
        to={`/product/${id}`}
        className="absolute inset-0 z-10 rounded-xl"
        aria-label={product.name}
      />
    </div>
  );
}

export default ProductComponent;