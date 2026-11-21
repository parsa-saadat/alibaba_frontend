import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Zap } from 'lucide-react';

/*
 * نوار تبلیغاتی بالای صفحه — مثل نوار قرمز بالای Alibaba.com.
 * متن از دیکشنری‌های ۴ زبانه می‌آید (t با متغیر {{v0}} برای درصد).
 */
function PromoBannerComponent() {
  return (
    <div
      className="relative overflow-hidden text-white"
      style={{ background: 'linear-gradient(90deg,#e2352c 0%,#ff7a1a 60%,#e85f00 100%)' }}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-2 px-4 py-2 text-xs font-bold sm:gap-3 sm:text-sm">
        <Zap size={15} className="shrink-0 fill-white/20" />
        <span className="truncate">
          {translateText('فروش ویژه: تا {{v0}} تخفیف روی کالاهای منتخب', { v0: '20%' })}
        </span>
        <Link
          to="/products?discount=true"
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-black underline-offset-4 transition hover:bg-white/25 hover:underline"
        >
          {translateText('همین حالا ببینید ')}
          <ChevronLeft className="logical-icon" size={14} />
        </Link>
      </div>
    </div>
  );
}

export default PromoBannerComponent;
