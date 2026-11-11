import React, { useEffect, useMemo, useState } from 'react';
import { Flame, Timer } from 'lucide-react';
import ProductGridComponent from './ProductGridComponent';
import TitleComponent from './TitleComponent';
import { hasDiscount, toFa } from '../../utils/helpers/format';

function OfferProductsComponent({ products = [], loading = false }) {
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

  const deals = useMemo(() => products.filter(hasDiscount).slice(0, 5), [products]);

  return (
    <section className="mt-8 card rounded-3xl p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <TitleComponent partone="پیشنهادهای" parttwo="شگفت‌انگیز" icon={Flame} />
        <span className="flex items-center gap-2 text-sm font-bold">
          <Timer size={16} className="text-yellow" /> پایان تا:{' '}
          <span dir="ltr">{toFa(countdown)}</span>
        </span>
      </div>
      <ProductGridComponent
        products={deals}
        loading={loading}
        columns={5}
        emptyTitle="تخفیف فعالی موجود نیست"
      />
    </section>
  );
}

export default OfferProductsComponent;
