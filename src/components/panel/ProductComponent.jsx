import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';
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
  onZoom,
}) {
  const disc = hasDiscount(product);

  /*
   * نشان «مورد اعتماد» در پنل (فروشنده/مدیر) — همان قاعده‌ی کارت‌های فروشگاه:
   * اگر store یا seller همین‌جا در دست باشند استفاده می‌شوند، وگرنه از بک‌اند
   * خوانده می‌شود.
   */
  const knownTrust = trustState(store, seller);

  return (
    <div className="card rounded-2xl p-4 flex flex-col gap-3">
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
          <div className="text-xs muted mt-1">
            {product.brand} • {category?.name || translateText("بدون دسته")}
          </div>
        </div>
      </div>

      {(seller || store) && (
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="card2 rounded-xl p-2.5 min-w-0">
            <span className="muted block text-[10px]">{translateText("فروشگاه")}</span>
            <b className="truncate block mt-0.5">
              {store?.name || product.store_name || '—'}
            </b>
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

      <div className="flex items-center justify-between text-xs pt-1">
        <div>
          {disc && (
            <span className="muted line-through ms-2">
              {formatPrice(product.price?.amount)}
            </span>
          )}
          <b className="text-yellow text-sm">{formatPrice(finalPrice(product))}</b>
        </div>
        <span className="chip !cursor-default !py-0.5 !px-2 text-[11px]">{translateText("موجودی: ")}{toFa(product.stock ?? 0)}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-2 mt-auto border-t border-theme">
        <button
          type="button"
          onClick={() => onEdit?.(product)}
          className="btn-yellow !py-1.5 text-xs flex-1 flex items-center justify-center gap-1"
        >
          <Pencil size={13} />{translateText(" ویرایش محصول ")}</button>
        <Link
          to={`/product/${product._id}`}
          className="btn-ghost !p-2"
          title={translateText("مشاهده در سایت")}
        >
          <ExternalLink size={14} />
        </Link>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(product._id)}
            className="btn-ghost !p-2 text-red-400"
            title={translateText("حذف محصول")}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default DashboardProductComponent;
