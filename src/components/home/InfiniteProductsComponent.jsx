import { t as translateText } from '../../i18n/runtime.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductComponent, { ProductSkeleton } from '../product/ProductComponent';
import ProductViewSwitcher from '../product/ProductViewSwitcher';
import SectionTitle from '../common/SectionTitle';
import { API } from '../../config/api';
import { getList } from '../../utils/helpers/response';
import useProductViewMode from '../../hooks/useProductViewMode';
import useIsDesktop from '../../hooks/useIsDesktop';

/* حداکثر ۴ ردیف در حالت دوتایی؛ در حالت‌های تکی تعداد ثابت */
const MAX_ROWS = 4;
const SKELETON_COUNT = 4;
const SINGLE_COUNT = 6;
const FETCH_LIMIT = 40;

function InfiniteProductsComponent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewMode, setViewMode] = useProductViewMode('double');
  const isDesktop = useIsDesktop();
  /* تکی عمودی فقط موبایل؛ در دسکتاپ دوتایی نمایش داده می‌شود */
  const effectiveViewMode = isDesktop && viewMode === 'single-vertical' ? 'double' : viewMode;

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get(`${API}/product`, { params: { page: 1, limit: FETCH_LIMIT } });
      setItems(getList(res) || []);
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isDouble = effectiveViewMode === 'double';
  const variant = isDouble ? 'grid' : effectiveViewMode === 'single' ? 'wide' : 'tall';
  const visible = useMemo(
    () => items.slice(0, isDouble ? MAX_ROWS * 2 : SINGLE_COUNT),
    [items, isDouble],
  );

  /* دوتایی: دسکتاپ ۴ ستون، تبلت ۳، گوشی ۲ — تکی عمودی: از ۳ تا ۱ ستون — تکی: تک‌ستونه */
  const gridClass =
    viewMode === 'single'
      ? 'grid grid-cols-1 gap-3'
      : viewMode === 'single-vertical'
        ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'
        : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4';

  const gridStyle = undefined;

  return (
    <section className="pb-4">
      <div className="max-w-[1440px] mx-auto px-4">
        <SectionTitle>{translateText("پیشنهاد برای شما")}</SectionTitle>

        <div className="mb-3 flex justify-center lg:justify-end">
          <ProductViewSwitcher value={effectiveViewMode} onChange={setViewMode} />
        </div>

        <div>
          <div className={gridClass} style={gridStyle}>
            {loading ? (
              Array.from({ length: SKELETON_COUNT }, (_, i) => <ProductSkeleton key={`sk-${i}`} />)
            ) : (
              visible.map((p) => <ProductComponent key={p._id} product={p} variant={variant} />)
            )}
          </div>
        </div>

        {!loading && !error && visible.length === 0 && (
          <p className="text-center text-sm muted py-10">{translateText("محصولی یافت نشد")}</p>
        )}

        {error && (
          <div className="text-center py-4">
            <p className="text-sm muted mb-2">{translateText("خطا در دریافت محصولات")}</p>
            <button type="button" onClick={load} className="btn-yellow">{translateText("تلاش مجدد ")}</button>
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="text-center pt-4">
            <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-yellow hover:underline">{translateText("مشاهده‌ی همه‌ی محصولات ")}</Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default InfiniteProductsComponent;
