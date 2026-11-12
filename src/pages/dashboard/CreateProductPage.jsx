import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { authHeaders } from '../../utils/helpers/storage';
import ProductEditorComponent from '../../components/panel/ProductEditorComponent';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { flattenCategories } from '../../utils/helpers/categories';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

function CreateProductPage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/perm/stores?limit=100`, authHeaders()).catch(() => null),
      axios.get(`${API}/category?limit=100`, authHeaders()).catch(() => null),
    ])
      .then(([sRes, cRes]) => {
        setStores(sRes?.data?.body?.data || sRes?.data?.body || []);
        setCategories(flattenCategories(cRes?.data?.body?.data || cRes?.data?.body || []));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-16">
        <Loading label="در حال آماده‌سازی فرم ایجاد محصول…" />
      </div>
    );
  }

  return (
    <ProductEditorComponent
      product={null}
      stores={stores}
      categories={categories}
      isAdmin
      onCancel={() => navigate('/dashboard/products')}
      onSaved={() => navigate('/dashboard/products')}
    />
  );
}

export default CreateProductPage;
