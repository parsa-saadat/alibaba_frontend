import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { authHeaders } from '../../utils/helpers/storage';
import ProductEditorComponent from '../../components/panel/ProductEditorComponent';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { flattenCategories } from '../../utils/helpers/categories';
import useStoreCapacity from '../../hooks/useStoreCapacity';
import PlanRequiredNotice from '../../components/panel/PlanRequiredNotice';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

function CreateProductPage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  /* بدون پلن فعال، ساخت محصول ممنوع است (مدیر مستثناست) */
  const capacity = useStoreCapacity();

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/perm/stores?limit=50`, authHeaders()).catch(() => null),
      axios.get(`${API}/category?limit=100`, authHeaders()).catch(() => null),
    ])
      .then(([sRes, cRes]) => {
        setStores(sRes?.data?.body?.data || sRes?.data?.body || []);
        setCategories(flattenCategories(cRes?.data?.body?.data || cRes?.data?.body || []));
      })
      .finally(() => setLoading(false));
  }, []);

  if (capacity.loading) {
    return (
      <div className="py-16">
        <Loading label="در حال بررسی پلن فروشندگی…" />
      </div>
    );
  }

  if (!capacity.isAdmin && !capacity.planActive) {
    return (
      <PlanRequiredNotice
        text={
          capacity.reason === 'expired'
            ? 'اعتبار پلن فروشندگی شما تمام شده است؛ برای اضافه کردن محصول، پلن را تمدید کنید.'
            : undefined
        }
      />
    );
  }

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
      onCancel={() => navigate('/seller/products')}
      onSaved={() => navigate('/seller/products')}
    />
  );
}

export default CreateProductPage;
