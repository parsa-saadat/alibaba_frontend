import { t as translateText } from '../../i18n/runtime.js';
import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Flame } from 'lucide-react';
import StorageImageComponent from '../common/StorageImageComponent';
import { productImages, hasDiscount, finalPrice, formatPrice } from '../../utils/helpers/format';

/*
 * بنر «پیشنهادهای داغ» سمت راست هیروی دسکتاپ — مثل پنل بنرهای Alibaba.com.
 * با محصولات تخفیف‌دار پر می‌شود: عکس مربع، نام دو خطی، قیمت با تخفیف.
 */
function HotPicksBannerComponent({ products = [] }) {
  const card = useRef(null);
  const [limit, setLimit] = useState(1);
  useEffect(() => {
    const observer = new ResizeObserver(() => setLimit(Math.max(0, Math.min(5, Math.floor((card.current.clientHeight - 140) / 78)))));
    if (card.current) observer.observe(card.current);
    return () => observer.disconnect();
  }, []);
  const deals = products.filter(hasDiscount).slice(0, limit);

  return (
    <Link
      ref={card}
      to="/products?discount=true"
      className="hot-picks-card group relative flex h-full flex-col overflow-hidden rounded-xl p-4 text-white transition-transform hover:-translate-y-0.5"
      style={{ background: 'linear-gradient(160deg,#e85f00 0%,#ff6a00 55%,#e85f00 100%)' }}
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
        <div className="mt-3 grid flex-1 min-h-0 hot-picks-items gap-2">
          {deals.map((p) => (
            <div
              key={p._id}
              className="flex min-h-0 items-center gap-2 overflow-hidden rounded-xl p-2 transition-transform group-hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.16)' }}
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white/25">
                <StorageImageComponent
                  file={productImages(p)[0]}
                  alt={p.name}
                  compact
                  className="h-full w-full object-contain bg-white p-1"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[11px] font-bold leading-4 line-clamp-2 break-words">
                  {p.name}
                </span>
                <span className="text-[11px] font-black truncate">
                  {formatPrice(finalPrice(p), p.price?.currency)}
                </span>
              </div>
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
