import React, { useEffect, useState } from 'react';
import axios from 'axios';
import HeaderComponent from '../../components/main/HeaderComponent';
import OfferProductsComponent from '../../components/main/OfferProductsComponent';
import NewProductsComponent from '../../components/main/NewProductsComponent';
import FeaturedStoresComponent from '../../components/main/FeaturedStoresComponent';
import OurPolicyComponent from '../../components/main/OurPolicyComponnet';

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
    <div className="max-w-7xl mx-auto px-4">
      <HeaderComponent products={products} categories={categories} loading={loading} />
      <OfferProductsComponent products={products} loading={loading} />
      <NewProductsComponent products={products} loading={loading} />
      <FeaturedStoresComponent stores={stores} />
      <OurPolicyComponent />
    </div>
  );
};

export default HomePage;
