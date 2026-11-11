import React, { useEffect, useState } from 'react';
import axios from 'axios';
import HeaderComponent from '../../components/main/HeaderComponent';
import OfferProductsComponent from '../../components/main/OfferProductsComponent';
import NewProductsComponent from '../../components/main/NewProductsComponent';
import FeaturedStoresComponent from '../../components/main/FeaturedStoresComponent';
import InfiniteProductsComponent from '../../components/main/InfiniteProductsComponent';
import OurPolicyComponent from '../../components/main/OurPolicyComponnet';
import SectionTitle from '../../components/main/SectionTitle';
import FloatingToolbarComponent from '../../components/main/FloatingToolbarComponent';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      axios.get(`${API}/product?limit=100`),
      axios.get(`${API}/category?limit=100`),
      axios.get(`${API}/store?limit=20`),
    ])
      .then(([p, c, s]) => {
        if (p.status === 'fulfilled') setProducts(p.value.data.body?.data || []);
        if (c.status === 'fulfilled') setCategories(c.value.data.body?.data || []);
        if (s.status === 'fulfilled') setStores(s.value.data.body?.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    // تمام‌عرض شدن صفحه (بیرون از کانتینر layout)
    <div dir="rtl" className="bg-white text-[#222]" style={{ marginInline: 'calc(50% - 50vw)' }}>
      <HeaderComponent products={products} categories={categories} loading={loading} />

      <div className="max-w-[1440px] mx-auto px-4">
        <SectionTitle>پیشنهادهای ویژه برای شما</SectionTitle>
        <div className="grid lg:grid-cols-2 gap-4 pb-8">
          <OfferProductsComponent products={products} loading={loading} />
          <NewProductsComponent products={products} loading={loading} />
        </div>
      </div>

      <FeaturedStoresComponent stores={stores} />
      <InfiniteProductsComponent />
      <OurPolicyComponent />
      <FloatingToolbarComponent />
    </div>
  );
};

export default HomePage;