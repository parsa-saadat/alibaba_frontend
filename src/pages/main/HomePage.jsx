import React, { useEffect, useState } from 'react';
import axios from 'axios';
import HeaderComponent from '../../components/home/HeaderComponent';
import OfferProductsComponent from '../../components/home/OfferProductsComponent';
import NewProductsComponent from '../../components/home/NewProductsComponent';
import FeaturedStoresComponent from '../../components/home/FeaturedStoresComponent';
import InfiniteProductsComponent from '../../components/home/InfiniteProductsComponent';
import OurPolicyComponent from '../../components/home/OurPolicyComponnet';
import FloatingToolbarComponent from '../../components/layout/FloatingToolbarComponent';
import { API } from '../../config/api';
import { getList } from '../../utils/helpers/response';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    Promise.allSettled([
      axios.get(`${API}/product`, { params: { page: 1, limit: 100 } }),
      axios.get(`${API}/category`, { params: { page: 1, limit: 100 } }),
      axios.get(`${API}/store`, { params: { page: 1, limit: 20 } }),
    ])
      .then(([p, c, s]) => {
        if (cancelled) return;
        if (p.status === 'fulfilled') setProducts(getList(p.value));
        if (c.status === 'fulfilled') setCategories(getList(c.value));
        if (s.status === 'fulfilled') setStores(getList(s.value));
        if (p.status !== 'fulfilled' && c.status !== 'fulfilled') setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retry]);

  return (
    /* رنگ‌ها از متغیرهای تم می‌آیند تا صفحه اول در تم روشن و تاریک یکسان باشد
       (قبلاً bg-white/text-[#222] ثابت بود و تم روی صفحه اول کار نمی‌کرد) */
    <div dir="rtl" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <HeaderComponent products={products} categories={categories} loading={loading} />

      {error && !loading && (
        <div className="max-w-[1440px] mx-auto px-4 pt-6">
          <div className="card rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm muted">دریافت اطلاعات از بک‌اند ناموفق بود.</span>
            <button type="button" className="btn-yellow !py-2 text-sm" onClick={() => setRetry((v) => v + 1)}>
              تلاش دوباره
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-4 mt-5 space-y-4">
        <OfferProductsComponent products={products} loading={loading} />
        <NewProductsComponent products={products} loading={loading} />
      </div>

      <FeaturedStoresComponent stores={stores} />
      <InfiniteProductsComponent />
      <OurPolicyComponent />
      <FloatingToolbarComponent />
    </div>
  );
};

export default HomePage;
