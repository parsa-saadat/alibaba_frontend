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

function ProductComponent({
  product,
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
    'w-8 h-8 rounded-full grid place-items-center border border-theme bg-[var(--card)]/90 backdrop-blur-sm  transition-colors hover:bg-[var(--card)]';

  return (
    <div className="card group relative flex flex-col h-full w-full rounded-xl p-3 ">
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
              {translateText('ناموجود ')}
            </span>
          </div>
        )}

        <div className="absolute bottom-2 start-2 z-20 flex gap-1.5">
          <button
            type="button"
            onClick={() => toggleFavorite(id)}
            className={circle}
            style={{ color: fav ? '#ff4d6d' : 'var(--text-color)' }}
            aria-label={translateText('افزودن به علاقه‌مندی')}
            aria-pressed={fav}
          >
            <Heart size={16} fill={fav ? '#ff4d6d' : 'none'} />
          </button>
          <button
            type="button"
            onClick={() => toggleCompare(id)}
            className={circle}
            style={{ color: inCompare ? 'var(--primary-color)' : 'var(--text-color)' }}
            aria-label={translateText('مقایسه محصول')}
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
            {toFa(product.discount.percentage)}
            {translateText('٪ تخفیف ')}
          </span>
        )}
        {product.brand && <span className="muted font-semibold truncate">{product.brand}</span>}
      </div>

      {/* ───── عنوان (دو خط تا نام محصول کامل‌تر دیده شود) ───── */}
      <h3
        className="mt-1 text-sm font-bold leading-6 line-clamp-2 min-h-[3rem]"
        title={product.name}
      >
        {product.name}
      </h3>

      {/* ───── امتیاز ───── */}
      <div className="mt-1 h-[18px] flex items-center gap-1 text-xs muted">
        <Check size={12} strokeWidth={3} />
        {rating > 0
          ? translateText('امتیاز {{v0}}', { v0: toFa(rating.toFixed(1)) })
          : translateText('b2b.productTerms')}
      </div>

      {/* ───── قیمت ───── */}
      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
        <span className="text-lg sm:text-xl font-black leading-none text-yellow">
          {formatPrice(finalPrice(product), product.price?.currency)}
        </span>
        {discount && (
          <span className="text-xs muted line-through">
            {formatPrice(product.price?.amount, product.price?.currency)}
          </span>
        )}
      </div>

      {/* ───── موجودی ───── */}
      <div className="mt-1.5 text-sm">
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

      {/* ───── فروشگاه ───── */}
      <div className="flex items-center gap-1 text-xs muted min-w-0">
        {product.store_id && product.store_name ? (
          <Link
            to={`/store/${product.store_id}`}
            className="relative z-20 truncate hover:underline"
          >
            {product.store_name}
          </Link>
        ) : product.store_name ? (
          <span className="truncate">{product.store_name}</span>
        ) : null}
      </div>

      {/* ───── نشان اعتماد فروشنده ─────
          زیر خود محصول (آخرین سطر کارت) و همیشه نمایش داده می‌شود؛
          ظاهر ملایم دور ۱۸: سبز کم‌رنگ برای تأییدشده، خاکستری برای تأییدنشده.
          وضعیت «نامشخص» هیچ برچسبی نمی‌گیرد. ───── */}
      <div className="mt-1.5 flex min-h-[18px] items-center gap-1">
        <TrustBadge trust={knownTrust} storeId={probeStoreId} sellerId={probeSellerId} debug />
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
