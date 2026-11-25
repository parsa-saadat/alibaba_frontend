import useConfirmDialog from '../../hooks/useConfirmDialog';
import StatTile from '../../components/panel/StatTileComponent';
import { toFa } from '../../utils/helpers/format';
import usePanelStats from '../../hooks/usePanelStats';
import StatsNotice from '../../components/panel/StatsNoticeComponent';
import { t as translateText } from '../../i18n/runtime.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Package, Plus, Search } from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import DashboardProductComponent from '../../components/panel/ProductComponent';
import ImageLightboxComponent from '../../components/common/ImageLightboxComponent';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { getId } from '../../utils/helpers/response';
import { flattenCategories } from '../../utils/helpers/categories';
import PanelPageHeader from '../../components/panel/PanelPageHeaderComponent';
import useStoreCapacity from '../../hooks/useStoreCapacity';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

function ProductsPage() {
  const { confirm: askConfirmation, dialog: confirmationDialog } = useConfirmDialog();
  const {
    stats: panelStats,
    error: statsError,
    refresh: refreshStats,
  } = usePanelStats(['product']);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [zoomFile, setZoomFile] = useState(null);
  const capacity = useStoreCapacity();
  const canAdd = capacity.isAdmin || capacity.planActive;

  const load = useCallback(async () => {
    refreshStats();

    const get = (u, params) =>
      axios
        .get(`${API}${u}`, { ...authHeaders(), params })
        .then((r) => r.data.body?.data || r.data.body || [])
        .catch(() => []);
    const [p, s, c] = await Promise.all([
      get('/perm/products?limit=100', { search }),
      get('/perm/stores?limit=50'),
      get('/category?limit=100'),
    ]);
    setProducts(p);
    setStores(s);
    setCategories(flattenCategories(c));
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => load(true), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const storeMap = useMemo(() => Object.fromEntries(stores.map((s) => [getId(s), s])), [stores]);
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [getId(c), c])),
    [categories],
  );

  const q = search.trim().toLowerCase();
  const filteredProducts = products;

  const duplicateProduct = async (id) => {
    if (
      !(await askConfirmation({
        title: translateText('کپی محصول'),
        message: translateText(
          'نسخه‌ای خصوصی و غیرفعال، با موجودی صفر ساخته می‌شود. ادامه می‌دهید؟',
        ),
        confirmLabel: translateText('تکثیر محصول'),
      }))
    )
      return;
    try {
      await axios.post(`${API}/product/${id}/duplicate`, {}, authHeaders());
      toast.success(translateText('کپی محصول به‌صورت غیرفعال ایجاد شد'));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || translateText('کپی محصول ناموفق بود'));
    }
  };

  const deleteProduct = async (id) => {
    if (
      !(await askConfirmation({
        title: translateText('حذف محصول'),
        message: translateText('این محصول حذف می‌شود. این کار قابل بازگشت نیست.'),
        confirmLabel: translateText('حذف'),
        danger: true,
      }))
    )
      return;
    axios
      .delete(`${API}/product/${id}`, authHeaders())
      .then(() => {
        toast.success(translateText('محصول حذف شد'));
        load();
      })
      .catch((err) => toast.error(err.response?.data?.message || translateText('خطا در حذف')));
  };

  if (loading) {
    return (
      <div className="py-16">
        <Loading label={translateText('در حال بارگذاری محصولات…')} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {confirmationDialog}
      <PanelPageHeader
        icon={Package}
        title={translateText('محصولات من')}
        subtitle={translateText('ثبت، ویرایش و مدیریت کالاهای فروشگاه')}
        onRefresh={() => load()}
      />
      <StatsNotice error={statsError} stats={panelStats} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label={translateText('محصولات')}
          value={toFa(panelStats.product?.counts?.all ?? '—')}
        />
        <StatTile
          label={translateText('فعال')}
          value={toFa(panelStats.product?.counts?.active ?? '—')}
        />
        <StatTile
          label={translateText('غیرفعال')}
          value={toFa(panelStats.product?.counts?.inactive ?? '—')}
        />
        <StatTile
          label={translateText('ناموجود')}
          value={toFa(panelStats.product?.counts?.outOfStock ?? '—')}
        />
      </div>

      <div className="card rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={translateText('جستجو در محصولات من…')}
            className="input !py-2 !pe-9 text-xs"
          />
        </div>
        {canAdd ? (
          <Link
            to="/seller/products/create"
            className="btn-primary !py-2.5 text-sm flex items-center gap-1.5"
          >
            <Plus size={16} />
            {translateText(' محصول جدید ')}
          </Link>
        ) : (
          <button
            type="button"
            disabled={capacity.loading}
            onClick={() => {
              toast.error(translateText('برای ساخت محصول باید پلن فعال داشته باشید'));
              navigate('/seller/plans');
            }}
            className="btn-primary !py-2.5 text-sm flex items-center gap-1.5 disabled:opacity-60"
            title={translateText('پلن فعال لازم است')}
          >
            <Plus size={16} />
            {translateText(' محصول جدید ')}
          </button>
        )}
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
            onDuplicate={duplicateProduct}
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
