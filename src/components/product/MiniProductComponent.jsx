import React from 'react';
import { Link } from 'react-router-dom';
import StorageImageComponent from '../common/StorageImageComponent';
import {
  formatPrice,
  finalPrice,
  hasDiscount,
  productImages,
  toFa,
} from '../../utils/helpers/format';

export function MiniProductSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-2.5 space-y-2">
        <div className="h-5 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
      </div>
    </div>
  );
}

function MiniProductComponent({ product }) {
  const discount = hasDiscount(product);
  const sold = Number(product.sold_count) || 0;
  const soldOut = product.stock_status === 'OUT_OF_STOCK' || product.stock === 0;

  let sub = null;
  if (discount) {
    sub = (
      <span className="text-[#999] line-through">{formatPrice(product.price?.amount)}</span>
    );
  } else if (sold > 0) {
    sub = <span className="text-[#555]">{toFa(sold)} فروش</span>;
  } else if (!soldOut) {
    sub = <span className="text-[#1f8f3a]">موجود در انبار</span>;
  }

  return (
    <Link
      to={`/product/${product._id}`}
      className="block bg-white text-[#222] rounded-lg overflow-hidden hover:shadow-[0_6px_18px_rgba(0,0,0,.3)] transition-shadow"
    >
      <div className="relative aspect-square bg-[#f5f5f5]">
        <StorageImageComponent
          file={productImages(product)[0]}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {discount && (
          <span className="absolute top-1.5 start-1.5 bg-white/95 text-[#d0021b] text-[11px] font-bold px-1.5 py-0.5 rounded">
            {toFa(product.discount.percentage)}٪ تخفیف
          </span>
        )}
      </div>
      <div className="px-2.5 pt-2 pb-3">
        <div className="text-lg font-extrabold leading-6 truncate">
          {formatPrice(finalPrice(product))}
        </div>
        <div className="text-[13px] mt-0.5 h-5 truncate">{sub}</div>
      </div>
    </Link>
  );
}

export default MiniProductComponent;