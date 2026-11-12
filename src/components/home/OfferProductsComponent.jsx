import React, { useEffect, useMemo, useState } from 'react';
import { Flame, Timer } from 'lucide-react';
import ProductScrollerComponent from '../product/ProductScrollerComponent';
import { hasDiscount, toFa } from '../../utils/helpers/format';

/*
 * «پیشنهادهای شگفت‌انگیز»
 * مثل «پیشنهاد ویژه برای شما» به‌صورت اسکرول افقی نمایش داده می‌شود
 * (قبلاً grid با ۵ ستون در نصف عرض بود و کارت‌ها فشرده می‌شدند).
 */
function OfferProductsComponent({ products = [], loading = false, limit = 14 }) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const tick = () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const d = Math.max(0, end - Date.now());
      const h = Math.floor(d / 3600000);
      const m = Math.floor((d % 3600000) / 60000);
      const s = Math.floor((d % 60000) / 1000);
      setCountdown(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const deals = useMemo(
    () => products.filter(hasDiscount).slice(0, limit),
    [products, limit],
  );

  return (
    <ProductScrollerComponent
      partone="پیشنهادهای"
      parttwo="شگفت‌انگیز"
      icon={Flame}
      subtitle="تخفیف‌های فعال امشب — کارت‌ها را کنار بکشید"
      extra={
        <span className="flex items-center gap-2 rounded-full border border-theme px-3 py-1 text-xs sm:text-sm font-bold shrink-0">
          <Timer size={15} className="text-yellow" />
          <span className="muted">پایان تا</span>
          <span dir="ltr" className="tabular-nums">
            {toFa(countdown)}
          </span>
        </span>
      }
      products={deals}
      loading={loading}
      moreTo="/products?discount=true"
      emptyText="تخفیف فعالی موجود نیست"
    />
  );
}

export default OfferProductsComponent;
