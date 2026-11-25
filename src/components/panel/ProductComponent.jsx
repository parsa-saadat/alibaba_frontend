import { formatNumber } from '../../i18n/runtime';
import { formatDateTime } from '../../utils/helpers/format';
import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, ExternalLink, Copy, BadgePercent } from 'lucide-react';
import StorageImageComponent from '../common/StorageImageComponent';
import TrustBadge from '../product/TrustBadge';
import { TRUST, trustState, storeIdOfProduct, sellerIdOfProduct } from '../../services/sellerApi';
import {
  formatPrice,
  finalPrice,
  hasDiscount,
  productImages,
  toFa,
} from '../../utils/helpers/format';

function DashboardProductComponent({
  product,
  seller,
  store,
  category,
  onEdit,
  onDelete,
  onDuplicate,
  onZoom,
}) {
  const disc = hasDiscount(product);
  const percentage = Number(product.discount?.percentage || 0);
  const expiry = product.discount?.expirationDate;
  const status = String(product.status || '').toUpperCase();

  /*
   * نشان «مورد اعتماد» در پنل (فروشنده/مدیر) — همان قاعده‌ی کارت‌های فروشگاه:
   * اگر store یا seller همین‌جا در دست باشند استفاده می‌شوند، وگرنه از بک‌اند
   * خوانده می‌شود.
   */
  const knownTrust = trustState(store, seller);

  return (
    <div className="card rounded-2xl p-4 flex flex-col gap-4 min-w-0 h-full border border-theme">
      <div className="flex gap-3 items-start">
        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-theme">
          <StorageImageComponent
            file={productImages(product)[0]}
            alt={product.name}
            compact
            className="w-full h-full object-cover"
            onZoom={onZoom}
          />
        </div>
        <div className="flex-1 min-w-0">
          <Link
            to={`/product/${product._id}`}
            className="font-black text-sm line-clamp-2 hover:underline"
          >
            {product.name}
          </Link>
          <div className="text-xs muted mt-1 break-words">
            {product.brand} • {category?.name || translateText('بدون دسته')}
          </div>
        </div>
      </div>

      {(seller || store) && (
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="card2 rounded-xl p-2.5 min-w-0">
            <span className="muted block text-[10px]">{translateText('فروشگاه')}</span>
            <b className="truncate block mt-0.5">{store?.name || product.store_name || '—'}</b>
            <span className="block mt-1">
              <TrustBadge
                trust={knownTrust === TRUST.UNKNOWN ? null : knownTrust}
                storeId={storeIdOfProduct(product)}
                sellerId={sellerIdOfProduct(product)}
              />
            </span>
          </div>
        </div>
      )}

      <div className="card2 rounded-xl p-3 space-y-2 min-w-0">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="text-[11px] muted">{translateText('قیمت')}</span>
          {disc && (
            <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <BadgePercent size={14} />
              {translateText('{{v0}}٪ تخفیف', { v0: formatNumber(percentage) })}
            </span>
          )}
          {!disc && percentage > 0 && (
            <span className="text-[10px] muted">{translateText('تخفیف منقضی شده')}</span>
          )}
        </div>
        {disc && (
          <del className="block text-xs muted break-words" dir="auto">
            {formatPrice(product.price?.amount, product.price?.currency)}
          </del>
        )}
        <strong className="block text-lg font-black text-accent break-words leading-7" dir="auto">
          {formatPrice(finalPrice(product), product.price?.currency)}
        </strong>
        {disc && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 break-words">
            {translateText('صرفه‌جویی: {{v0}}', {
              v0: formatPrice(
                Number(product.price?.amount) - finalPrice(product),
                product.price?.currency,
              ),
            })}
          </p>
        )}
        {disc && expiry && (
          <p className="text-[10px] muted leading-5 break-words">
            {translateText('پایان تخفیف: {{v0}}', { v0: formatDateTime(expiry) })}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="chip !cursor-default !py-1 !px-2">
          {translateText('موجودی: ')}
          {toFa(product.stock ?? 0)}
        </span>
        <span className="chip !cursor-default !py-1 !px-2">
          {translateText(status === 'ACTIVE' ? 'فعال' : 'غیرفعال')}
        </span>
        <span className="chip !cursor-default !py-1 !px-2">
          {translateText(String(product.visibility).toUpperCase() === 'PUBLIC' ? 'عمومی' : 'خصوصی')}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-3 mt-auto border-t border-theme">
        <button
          type="button"
          onClick={() => onEdit?.(product)}
          className="btn-primary !py-1.5 text-xs flex-1 min-w-[110px] flex items-center justify-center gap-1"
        >
          <Pencil size={13} />
          {translateText(' ویرایش محصول ')}
        </button>
        <Link
          to={`/product/${product._id}`}
          className="btn-ghost product-card-icon"
          title={translateText('مشاهده در سایت')}
        >
          <ExternalLink size={14} />
        </Link>
        {onDuplicate && (
          <button
            type="button"
            className="btn-ghost product-card-icon"
            onClick={() => onDuplicate(product._id)}
            title={translateText('کپی محصول')}
          >
            <Copy size={14} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(product._id)}
            className="btn-ghost product-card-icon text-red-500"
            title={translateText('حذف محصول')}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default DashboardProductComponent;
