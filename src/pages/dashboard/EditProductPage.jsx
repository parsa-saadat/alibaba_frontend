import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { authHeaders } from '../../utils/helpers/storage';
import ProductEditorComponent from '../../components/panel/ProductEditorComponent';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { flattenCategories } from '../../utils/helpers/categories';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

function EditProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/product/${productId}`, authHeaders()).catch(() => null),
      axios.get(`${API}/perm/stores?limit=100`, authHeaders()).catch(() => null),
      axios.get(`${API}/category?limit=100`, authHeaders()).catch(() => null),
    ])
      .then(([pRes, sRes, cRes]) => {
        setProduct(pRes?.data?.body || null);
        setStores(sRes?.data?.body?.data || sRes?.data?.body || []);
        setCategories(flattenCategories(cRes?.data?.body?.data || cRes?.data?.body || []));
      })
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="py-16">
        <Loading label="در حال دریافت مشخصات محصول…" />
      </div>
    );
  }

  /* اگر محصول پیدا نشد یا دریافت اطلاعات ناموفق بود، به‌جای فرم خالی پیام روشن بدهیم */
  if (!product) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <div className="card rounded-3xl p-8 text-center">
          <b className="block text-sm font-black">این محصول پیدا نشد</b>
          <p className="mt-2 text-xs leading-6 muted">
            ممکن است حذف شده باشد یا ارتباط با سرور برقرار نشده باشد. یک‌بار دیگر تلاش کنید یا به
            فهرست محصولات برگردید.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={() => window.location.reload()} className="btn-yellow !py-2 text-xs">
              تلاش دوباره
            </button>
            <a href="/dashboard/products" onClick={(e) => { e.preventDefault(); navigate('/dashboard/products'); }} className="btn-ghost !py-2 text-xs">
              فهرست محصولات
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProductEditorComponent
      product={product}
      stores={stores}
      categories={categories}
      isAdmin
      onCancel={() => navigate('/dashboard/products')}
      onSaved={() => navigate('/dashboard/products')}
    />
  );
}

export default EditProductPage;
