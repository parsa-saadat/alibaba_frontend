import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Search } from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import DashboardProductComponent from '../../components/panel/ProductComponent';
import ImageLightboxComponent from '../../components/common/ImageLightboxComponent';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { getId } from '../../utils/helpers/response';
import { flattenCategories } from '../../utils/helpers/categories';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [zoomFile, setZoomFile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const get = (u) =>
      axios
        .get(`${API}${u}`, authHeaders())
        .then((r) => r.data.body?.data || r.data.body || [])
        .catch(() => []);
    const [p, s, c] = await Promise.all([
      get('/perm/products?limit=100'),
      get('/perm/stores?limit=50'),
      get('/category?limit=100'),
    ]);
    setProducts(p);
    setStores(s);
    setCategories(flattenCategories(c));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const storeMap = useMemo(
    () => Object.fromEntries(stores.map((s) => [getId(s), s])),
    [stores],
  );
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [getId(c), c])),
    [categories],
  );

  const q = search.trim().toLowerCase();
  const filteredProducts = useMemo(
    () =>
      q
        ? products.filter(
            (p) =>
              p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q),
          )
        : products,
    [products, q],
  );

  const deleteProduct = (id) => {
    if (!confirm('این محصول حذف شود؟')) return;
    axios
      .delete(`${API}/product/${id}`, authHeaders())
      .then(() => {
        toast.success('محصول حذف شد');
        load();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'خطا در حذف'));
  };

  if (loading) {
    return (
      <div className="py-16">
        <Loading label="در حال بارگذاری محصولات…" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در محصولات من…"
            className="input !py-2 !pr-9 text-xs"
          />
        </div>
        <Link
          to="/seller/products/create"
          className="btn-yellow !py-2.5 text-sm flex items-center gap-1.5"
        >
          <Plus size={16} /> محصول جدید
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProducts.map((p) => (
          <DashboardProductComponent
            key={p._id}
            product={p}
            store={storeMap[getId(p.store_id)]}
            category={categoryMap[getId(p.category_id)]}
            onEdit={(prod) => navigate(`/seller/products/${prod._id}`)}
            onDelete={deleteProduct}
            onZoom={(f, a) => setZoomFile({ file: f, alt: a })}
          />
        ))}
      </div>

      <ImageLightboxComponent
        file={zoomFile?.file}
        alt={zoomFile?.alt}
        onClose={() => setZoomFile(null)}
      />
    </div>
  );
}

export default ProductsPage;
