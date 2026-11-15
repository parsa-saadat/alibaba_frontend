import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductComponent, { ProductSkeleton } from '../product/ProductComponent';
import SectionTitle from '../common/SectionTitle';
import { API } from '../../config/api';
import { getList } from '../../utils/helpers/response';

/* حداکثر ۴ ردیف نمایش؛ لودینگ دقیقاً ۴ کارت نشان می‌دهد */
const MAX_ROWS = 4;
const SKELETON_COUNT = 4;
const FETCH_LIMIT = 40;
const GAP = 12;
const MIN_CARD_WIDTH = 168;

function InfiniteProductsComponent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cols, setCols] = useState(4);
  const wrapRef = useRef(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const measure = () => {
      const width = el.clientWidth || 0;
      const next = Math.max(2, Math.floor((width + GAP) / (MIN_CARD_WIDTH + GAP)));
      setCols((prev) => (prev === next ? prev : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  const visible = useMemo(() => items.slice(0, cols * MAX_ROWS), [items, cols]);
  const gridStyle = {
    gridTemplateColumns: `repeat(auto-fit, minmax(min(${MIN_CARD_WIDTH}px, 100%), 1fr))`,
  };

  return (
    <section className="pb-4">
      <div className="max-w-[1440px] mx-auto px-4">
        <SectionTitle>پیشنهاد برای شما</SectionTitle>

        <div ref={wrapRef}>
          <div className="grid gap-3" style={gridStyle}>
            {loading
              ? Array.from({ length: SKELETON_COUNT }, (_, i) => <ProductSkeleton key={`sk-${i}`} />)
              : visible.map((p) => <ProductComponent key={p._id} product={p} />)}
          </div>
        </div>

        {!loading && !error && visible.length === 0 && (
          <p className="text-center text-sm muted py-10">محصولی یافت نشد</p>
        )}

        {error && (
          <div className="text-center py-4">
            <p className="text-sm muted mb-2">خطا در دریافت محصولات</p>
            <button type="button" onClick={load} className="btn-yellow">
              تلاش مجدد
            </button>
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="text-center pt-4">
            <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-yellow hover:underline">
              مشاهده‌ی همه‌ی محصولات
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default InfiniteProductsComponent;
