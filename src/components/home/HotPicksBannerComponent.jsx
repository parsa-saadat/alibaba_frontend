import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Flame } from 'lucide-react';
import StorageImageComponent from '../common/StorageImageComponent';
import { productImages, hasDiscount, finalPrice, formatPrice } from '../../utils/helpers/format';

/*
 * بنر «پیشنهادهای داغ» سمت راست هیروی دسکتاپ — مثل پنل بنرهای Alibaba.com.
 * با محصولات تخفیف‌دار پر می‌شود: عکس مربع، نام دو خطی، قیمت با تخفیف.
 */
function HotPicksBannerComponent({ products = [] }) {
  const deals = products.filter(hasDiscount).slice(0, 3);

  return (
    <Link
      to="/products?discount=true"
      className="group relative flex h-[304px] flex-col overflow-hidden rounded-xl p-4 text-white transition-transform hover:-translate-y-0.5"
      style={{ background: 'linear-gradient(160deg,#6d28d9 0%,#8b5cf6 55%,#c084fc 100%)' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl"
      />
      <div className="flex items-center gap-2 shrink-0">
        <Flame size={20} className="shrink-0" />
        <h3 className="text-lg font-black">{translateText('پیشنهادهای داغ')}</h3>
      </div>
      <p className="mt-0.5 text-xs text-white/80 shrink-0">
        {translateText('بهترین تخفیف‌های امروز را از دست ندهید')}
      </p>

      {deals.length ? (
        <div className="mt-3 grid flex-1 min-h-0 grid-cols-3 gap-2">
          {deals.map((p) => (
            <div
              key={p._id}
              className="flex min-h-0 flex-col overflow-hidden rounded-xl p-1.5 transition-transform group-hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.16)' }}
            >
              <div className="aspect-square w-full shrink-0 overflow-hidden rounded-lg bg-white/25">
                <StorageImageComponent
                  file={productImages(p)[0]}
                  alt={p.name}
                  compact
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="mt-1.5 text-[11px] font-bold leading-4 line-clamp-2 break-words">
                {p.name}
              </span>
              <span className="mt-auto pt-1 text-[11px] font-black truncate">
                {formatPrice(finalPrice(p), p.price?.currency)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid flex-1 place-items-center">
          <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-black">
            {translateText('تخفیف‌های ویژه')}
          </span>
        </div>
      )}

      <span
        className="mt-3 inline-flex shrink-0 items-center justify-center gap-1 rounded-lg py-2 text-sm font-black"
        style={{ background: 'var(--primary-color)', color: 'var(--on-primary)' }}
      >
        {translateText('مشاهده بیشتر ')}
        <ChevronLeft className="logical-icon" size={15} />
      </span>
    </Link>
  );
}

export default HotPicksBannerComponent;
