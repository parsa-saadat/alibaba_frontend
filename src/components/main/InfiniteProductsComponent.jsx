import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import ProductComponent, { ProductSkeleton } from './ProductComponent';
import SectionTitle from './SectionTitle';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
const LIMIT = 24;
const GRID = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3';

function InfiniteProductsComponent() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState(false);

  const loaderRef = useRef(null);
  const fetchingRef = useRef(false);
  const seenRef = useRef(new Set());

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(false);

    try {
      const res = await axios.get(`${API}/product`, { params: { page, limit: LIMIT } });
      const data = res.data.body?.data || [];

      const fresh = data.filter((p) => !seenRef.current.has(p._id));
      fresh.forEach((p) => seenRef.current.add(p._id));

      setItems((prev) => [...prev, ...fresh]);
      setPage((p) => p + 1);
      if (data.length < LIMIT || fresh.length === 0) setHasMore(false);
    } catch {
      setError(true);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
      setFirstLoad(false);
    }
  }, [page, hasMore]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !error) loadMore();
      },
      { rootMargin: '700px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, error]);

  return (
    <section className="pb-4">
      <div className="max-w-[1440px] mx-auto px-4">
        <SectionTitle>پیشنهاد برای شما</SectionTitle>

        <div className={GRID}>
          {items.map((p) => (
            <ProductComponent key={p._id} product={p} />
          ))}
          {(firstLoad || loading) &&
            Array.from({ length: firstLoad ? 12 : 6 }, (_, i) => (
              <ProductSkeleton key={`sk-${i}`} />
            ))}
        </div>

        <div ref={loaderRef} className="h-10" />

        {!firstLoad && !loading && items.length === 0 && !error && (
          <p className="text-center text-sm muted py-10">محصولی یافت نشد</p>
        )}

        {error && (
          <div className="text-center py-4">
            <p className="text-sm muted mb-2">خطا در دریافت محصولات</p>
            <button type="button" onClick={loadMore} className="btn-yellow">
              تلاش مجدد
            </button>
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <p className="text-center text-sm muted py-4">همه محصولات نمایش داده شد</p>
        )}
      </div>
    </section>
  );
}

export default InfiniteProductsComponent;