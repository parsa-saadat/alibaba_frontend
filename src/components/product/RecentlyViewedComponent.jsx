import { t as translateText } from '../../i18n/runtime.js';
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { History, Trash2 } from 'lucide-react';

import ProductScrollerComponent from './ProductScrollerComponent';
import { API } from '../../config/api';
import { getBody } from '../../utils/helpers/response';
import { readList, writeList } from '../../utils/helpers/storage';

/*
 * RecentlyViewedComponent
 * -----------------------
 * «اخیراً مشاهده‌شده‌ها» — شناسه‌ی محصول‌هایی که کاربر باز کرده است در
 * localStorage (کلید `history`) ذخیره می‌شود؛ در صفحه‌ی محصول همین‌جا نوشته
 * می‌شود و این کامپوننت آن‌ها را دوباره از بک‌اند می‌خواند.
 *
 * - هر محصول یک بار در طول عمر صفحه دانلود و در `productCache` نگه داشته
 *   می‌شود، پس جابه‌جایی بین صفحه‌ها درخواست تکراری نمی‌فرستد.
 * - اگر تاریخچه خالی باشد یا هیچ محصولی پیدا نشود، هیچ چیز رندر نمی‌شود
 *   (بخش خالی و بی‌معنی نمی‌سازیم).
 */
const MAX_ITEMS = 12;
const productCache = new Map();
/* شناسه‌هایی که بک‌اند ندارد (۴۰۴) — در همین سشن دیگر درخواست نمی‌شوند */
const missingCache = new Set();

const loadProduct = (id) => {
  if (productCache.has(id)) return Promise.resolve(productCache.get(id));
  if (missingCache.has(id)) return Promise.resolve(null);
  return axios
    .get(`${API}/product/${id}`, { timeout: 15000 })
    .then((res) => {
      const product = getBody(res);
      if (product) productCache.set(id, product);
      else missingCache.add(id);
      return product;
    })
    .catch((err) => {
      /*
       * محصولی که در تاریخچه مانده ولی بک‌اند ندارد (مثلاً داده‌ی قدیمی یا حذف‌شده)
       * نباید هر بار درخواست ۴۰۴ بفرستد؛ یک‌بار علامت می‌خورد و از تاریخچه پاک می‌شود.
       */
      const status = err?.response?.status;
      if (status === 404 || status === 400 || status === 422) missingCache.add(id);
      return null;
    });
};

function RecentlyViewedComponent({
  /* محصول جاری از فهرست حذف می‌شود (در صفحه‌ی محصول) */
  excludeId = '',
  limit = 8,
  title = translateText("اخیراً مشاهده کرده‌اید"),
  subtitle = translateText("محصولاتی که در این مرورگر باز کرده‌اید"),
  moreTo = null,
  className = '',
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const ids = useMemo(() => {
    const stored = readList('history')
      .map((id) => String(id || ''))
      .filter(Boolean)
      .filter((id) => id !== String(excludeId || ''));
    return [...new Set(stored)].slice(0, Math.min(limit, MAX_ITEMS));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excludeId, limit, version]);

  const signature = ids.join('|');

  useEffect(() => {
    if (!ids.length) {
      setProducts([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(ids.map(loadProduct))
      .then((items) => {
        if (cancelled) return;
        setProducts(items.filter(Boolean));
        /* شناسه‌های نامعتبر از تاریخچه حذف می‌شوند تا دفعه‌ی بعد درخواستی نرود */
        const alive = ids.filter((id) => !missingCache.has(id));
        if (alive.length !== ids.length) {
          writeList('history', alive);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  if (!loading && products.length === 0) return null;

  const clear = () => {
    writeList('history', []);
    setProducts([]);
    setVersion((v) => v + 1);
  };

  const extra = (
    <button
      type="button"
      onClick={clear}
      className="inline-flex items-center gap-1 text-xs muted hover:text-accent transition-colors"
      title={translateText("پاک کردن تاریخچه‌ی بازدید")}
    >
      <Trash2 size={14} />{translateText("پاک کردن ")}</button>
  );

  return (
    <div className={className}>
      <ProductScrollerComponent
        partone={title.split(' ')[0]}
        parttwo={title.split(' ').slice(1).join(' ')}
        icon={History}
        subtitle={subtitle}
        products={products}
        loading={loading}
        moreTo={moreTo}
        extra={extra}
        emptyText={translateText("هنوز محصولی مشاهده نکرده‌اید")}
      />
    </div>
  );
}

export default RecentlyViewedComponent;
