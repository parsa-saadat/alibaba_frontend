import { t as translateText } from '../../i18n/runtime.js';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, GitCompareArrows, Check } from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import { getId } from '../../utils/helpers/response';
import TrustBadge from './TrustBadge';
import {
  TRUST,
  storeIdOfProduct,
  sellerIdOfProduct,
  registerTrustProbe,
} from '../../services/sellerApi';
import StorageImageComponent from '../common/StorageImageComponent';

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

/*
 * حالت‌های نمایش کارت محصول:
 *  - 'grid'  : کارت عمودی استاندارد (شبکه‌ی ۲/۳/۴ ستونه) — در ابعاد کم، با
 *              Container Query به‌صورت خودکار فشرده می‌شود (ردیف‌های فرعی مخفی).
 *  - 'wide'  : تکی افقی — یک محصول در هر ردیف، تصویر کنار جزئیات (مثل لیست علی‌بابا).
 *  - 'tall'  : تکی عمودی — یک محصول در هر ردیف، تصویر پهن بالای کارت.
 */
function ProductComponent({
  product,
  variant = 'grid',
  /* اگر صفحه‌ی والد وضعیت اعتماد فروشنده را از قبل می‌داند (صفحه‌ی فروشگاه)،
     همان را می‌دهد تا کارت‌ها درخواست تکراری نفرستند */
  trust: trustProp = null,
  /* سازگاری با فراخوانی‌های قبلی؛ برچسب «بدون تأیید» حالا همیشه نمایش داده می‌شود */
  showUntrusted = true,
  storeId: storeIdProp = '',
  sellerId: sellerIdProp = '',
}) {
  const { toggleFavorite, isFavorite, toggleCompare, compare } = useShop();

  const id = getId(product);
  const fav = isFavorite(id);
  const inCompare = compare.includes(id);
  const discount = hasDiscount(product);

  const rawStock = product.stock == null || product.stock === '' ? null : Number(product.stock);
  const stock = Number.isFinite(rawStock) ? Math.max(0, Math.floor(rawStock)) : null;
  const soldOut = product.stock_status === 'OUT_OF_STOCK' || stock === 0;

  const rating = Number(ratingOf(product)) || 0;

  /*
   * نشان «مورد اعتماد» فقط از بک‌اند واقعی می‌آید (هیچ فیلد آماده‌ای روی محصول نیست):
   *   product.store_id → GET /store/:id → store.user → GET /user/:id → seller_trust
   * نتیجه در services/sellerApi کش می‌شود، پس ۲۰ کارت با ۳ فروشگاه چند درخواست بیشتر نمی‌فرستد.
   * قانون ثابت: تا وقتی seller_trust دقیقاً true نباشد، هیچ نشان سبزی رندر نمی‌شود.
   */
  /* «نامشخص» از طرف صفحه‌ی والد یعنی «من نمی‌دانم»، نه «تأییدنشده»؛ در این حالت
     خود کارت وضعیت را از بک‌اند می‌پرسد (داخل TrustBadge). */
  const knownTrust = trustProp && trustProp !== TRUST.UNKNOWN ? trustProp : null;

  /* شناسه‌هایی که برای پیدا کردن فروشنده تلاش می‌شود — روی محصول، بعد از پراپ صفحه */
  const probeStoreId = storeIdOfProduct(product) || storeIdProp || '';
  const probeSellerId = sellerIdOfProduct(product) || sellerIdProp || '';

  /*
   * برای عیب‌یابی روی نصب واقعی: در کنسول مرورگر بنویس
   *     await __trustExplain()
   * تا برای هر کارت ببینی شناسه‌ها چه بودند و درخواست‌ها چه جوابی دادند.
   */
  useEffect(() => {
    registerTrustProbe({ id, storeId: probeStoreId, sellerId: probeSellerId });
  }, [id, probeStoreId, probeSellerId]);

  const circle =
    'grid place-items-center rounded-full border border-theme bg-[var(--card)]/90 backdrop-blur-sm transition-colors hover:bg-[var(--card)]';

  const favButton = (
    <button
      type="button"
      onClick={() => toggleFavorite(id)}
      className={`${circle} h-7 w-7 @[180px]:h-8 @[180px]:w-8`}
      style={{ color: fav ? '#ff4d6d' : 'var(--text-color)' }}
      aria-label={translateText('افزودن به علاقه‌مندی')}
      aria-pressed={fav}
    >
      <Heart size={15} fill={fav ? '#ff4d6d' : 'none'} />
    </button>
  );

  const compareButton = (
    <button
      type="button"
      onClick={() => toggleCompare(id)}
      className={`${circle} h-7 w-7 @[180px]:h-8 @[180px]:w-8`}
      style={{ color: inCompare ? 'var(--primary-color)' : 'var(--text-color)' }}
      aria-label={translateText('مقایسه محصول')}
      aria-pressed={inCompare}
    >
      <GitCompareArrows size={15} />
    </button>
  );

  const soldOutBadge = soldOut && (
    <div className="absolute inset-0 bg-black/45 grid place-items-center">
      <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/70 text-white">
        {translateText('ناموجود ')}
      </span>
    </div>
  );

  const discountBadge = discount && (
    <span
      className="px-1.5 py-px rounded-sm font-black whitespace-nowrap text-[11px]"
      style={{ background: 'var(--primary-color)', color: 'var(--on-primary' }}
    >
      {toFa(product.discount.percentage)}
      {translateText('٪ تخفیف ')}
    </span>
  );

  const priceBlock = (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span
        className={`font-black leading-none text-accent ${
          variant === 'grid'
            ? 'text-base @[180px]:text-lg @[240px]:text-xl'
            : 'text-lg sm:text-xl'
        }`}
      >
        {formatPrice(finalPrice(product), product.price?.currency)}
      </span>
      {discount && (
        <span className="text-xs muted line-through">
          {formatPrice(product.price?.amount, product.price?.currency)}
        </span>
      )}
    </div>
  );

  const stockBlock = (
    <div>
      {soldOut ? (
        <span className="text-rose-500 font-bold">{translateText('ناموجود')}</span>
      ) : stock !== null ? (
        <span>
          {translateText('موجودی: ')}
          {toFa(stock)}
        </span>
      ) : (
        <span>{translateText('موجود')}</span>
      )}
    </div>
  );

  const storeBlock = product.store_id && product.store_name && (
    <Link to={`/store/${product.store_id}`} className="relative z-20 truncate hover:underline">
      {product.store_name}
    </Link>
  );

  const trustBlock = (
    <TrustBadge trust={knownTrust} storeId={probeStoreId} sellerId={probeSellerId} debug />
  );

  const title = (
    <h3
      className="font-bold line-clamp-2 min-h-[2.5rem] @[180px]:min-h-[3rem] text-[13px] @[180px]:text-sm leading-5 @[180px]:leading-6"
      title={product.name}
    >
      {product.name}
    </h3>
  );

  /* ───────────── حالت تکی افقی (یک محصول در ردیف) ───────────── */
  if (variant === 'wide') {
    return (
      <div className="card group relative flex h-full w-full overflow-hidden rounded-xl">
        <div
          className="relative w-32 shrink-0 overflow-hidden sm:w-44 md:w-52"
          style={{ background: 'var(--card2)' }}
        >
          <StorageImageComponent
            file={productImages(product)[0]}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {soldOutBadge}
          <div className="absolute bottom-2 start-2 z-20 flex gap-1.5">
            {favButton}
            {compareButton}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-3">
          <div className="flex items-start justify-between gap-2">
            {title}
            {discountBadge}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs muted">
            <span className="flex items-center gap-1">
              <Check size={12} strokeWidth={3} />
              {rating > 0
                ? translateText('امتیاز {{v0}}', { v0: toFa(rating.toFixed(1)) })
                : translateText('b2b.productTerms')}
            </span>
            {product.brand && <span className="font-semibold">{product.brand}</span>}
          </div>

          <div className="mt-auto pt-2">
            {priceBlock}
            <div className="mt-1.5 text-xs">{stockBlock}</div>
            <div className="mt-1.5 flex items-center gap-2 text-xs muted">
              {storeBlock}
              <span className="flex items-center">{trustBlock}</span>
            </div>
          </div>
        </div>

        <Link
          to={`/product/${id}`}
          className="absolute inset-0 z-10 rounded-xl"
          aria-label={product.name}
        />
      </div>
    );
  }

  /* ───────────── حالت تکی عمودی (کارت‌های عمودی با تصویر مربع؛ تعداد ستون‌ها با گرید والد) ───────────── */
  if (variant === 'tall') {
    return (
      <div className="card group relative flex flex-col h-full w-full rounded-xl p-2.5 sm:p-3">
        <div
          className="relative aspect-square w-full overflow-hidden rounded-lg"
          style={{ background: 'var(--card2)' }}
        >
          <StorageImageComponent
            file={productImages(product)[0]}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {soldOutBadge}
          <div className="absolute bottom-2 start-2 z-20 flex gap-1.5">
            {favButton}
            {compareButton}
          </div>
          {discountBadge && (
            <div className="absolute top-2 end-2 z-20">{discountBadge}</div>
          )}
        </div>

        {title}

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs muted">
          <span className="flex items-center gap-1">
            <Check size={12} strokeWidth={3} />
            {rating > 0
              ? translateText('امتیاز {{v0}}', { v0: toFa(rating.toFixed(1)) })
              : translateText('b2b.productTerms')}
          </span>
          {product.brand && <span className="font-semibold">{product.brand}</span>}
        </div>

        <div className="mt-2">{priceBlock}</div>
        <div className="mt-1.5 text-xs sm:text-sm">{stockBlock}</div>

        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs muted">
          <span className="flex min-w-0 items-center gap-1">
            {storeBlock || (product.store_name ? <span className="truncate">{product.store_name}</span> : null)}
          </span>
          <span className="flex shrink-0 items-center">{trustBlock}</span>
        </div>

        <Link
          to={`/product/${id}`}
          className="absolute inset-0 z-10 rounded-xl"
          aria-label={product.name}
        />
      </div>
    );
  }

  /* ───────────── حالت پیش‌فرض: کارت شبکه‌ای (با فشرده‌سازی خودکار در ابعاد کم) ─────────────
     @container روی لایه‌ی بیرونی است تا خود کارت بتواند با عرض واقعی خودش واکنش دهد. */
  return (
    <div className="@container h-full w-full">
      <div className="card group relative flex flex-col h-full w-full rounded-xl p-2.5 @[180px]:p-3">
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

        {soldOutBadge}

        <div className="absolute bottom-2 start-2 z-20 flex gap-1.5">
          {favButton}
          {compareButton}
        </div>
      </div>

      {/* ───── برچسب‌ها ───── */}
      <div className="mt-2 @[180px]:mt-3 min-h-[18px] flex items-center gap-1.5 text-[11px]">
        {discountBadge}
        {product.brand && <span className="muted font-semibold truncate">{product.brand}</span>}
      </div>

      {/* ───── عنوان (دو خط تا نام محصول کامل‌تر دیده شود) ───── */}
      <div className="mt-1">{title}</div>

      {/* ───── امتیاز — در کارت‌های خیلی باریک مخفی می‌شود ───── */}
      <div className="mt-1 hidden @[200px]:flex h-[18px] items-center gap-1 text-xs muted">
        <Check size={12} strokeWidth={3} />
        {rating > 0
          ? translateText('امتیاز {{v0}}', { v0: toFa(rating.toFixed(1)) })
          : translateText('b2b.productTerms')}
      </div>

      {/* ───── قیمت ───── */}
      <div className="mt-2 @[180px]:mt-3">{priceBlock}</div>

      {/* ───── موجودی — مثل کارت‌های علی‌بابا همیشه دیده می‌شود ───── */}
      <div className="mt-1.5 text-xs @[200px]:text-sm">{stockBlock}</div>

      {/* ───── فروشگاه — در کارت‌های خیلی باریک مخفی می‌شود ───── */}
      <div className="mt-1 hidden @[200px]:flex items-center gap-1 text-xs muted min-w-0">
        {storeBlock || (product.store_name ? <span className="truncate">{product.store_name}</span> : null)}
      </div>

      {/* ───── نشان اعتماد فروشنده — مثل «Verified» علی‌بابا همیشه دیده می‌شود ───── */}
      <div className="mt-1.5 flex min-h-[18px] items-center gap-1">{trustBlock}</div>

      {/* لینک کل کارت */}
        <Link
          to={`/product/${id}`}
          className="absolute inset-0 z-10 rounded-xl"
          aria-label={product.name}
        />
      </div>
    </div>
  );
}

export default ProductComponent;
