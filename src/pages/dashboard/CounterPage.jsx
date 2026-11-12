import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Users,
  Store,
  Package,
  FolderTree,
  CreditCard,
  ShoppingBag,
  Check,
  RefreshCw,
} from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import { userFullName } from '../../utils/helpers/user';
import StorageImageComponent from '../../components/common/StorageImageComponent';
import ImageLightboxComponent from '../../components/common/ImageLightboxComponent';
import { Loading } from '../../components/common/ScroolToTopComponent';
import {
  formatPrice,
  toFa,
  statusFa,
  productImages,
} from '../../utils/helpers/format';
import { getId } from '../../utils/helpers/response';
import { flattenCategories } from '../../utils/helpers/categories';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

function CounterPage() {
  const [data, setData] = useState({
    users: [],
    sellers: [],
    stores: [],
    products: [],
    categories: [],
    plans: [],
    orders: [],
  });
  const [loading, setLoading] = useState(true);
  const [zoomFile, setZoomFile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const get = (u) =>
      axios
        .get(`${API}${u}`, authHeaders())
        .then((r) => r.data.body?.data || r.data.body || [])
        .catch(() => []);
    const [users, sellers, stores, products, categories, plans, orders] = await Promise.all([
      get('/user?limit=100'),
      get('/sellers?limit=100'),
      get('/perm/stores?limit=100'),
      get('/perm/products?limit=100'),
      get('/category?limit=100'),
      get('/plan?limit=50'),
      get('/orders?limit=100'),
    ]);

    setData({
      users,
      sellers,
      stores,
      products,
      categories: flattenCategories(categories),
      plans,
      orders,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { users, sellers, stores, products, categories, plans, orders } = data;
  const userMap = useMemo(
    () => Object.fromEntries(users.map((u) => [getId(u), u])),
    [users],
  );
  const storeMap = useMemo(
    () => Object.fromEntries(stores.map((s) => [getId(s), s])),
    [stores],
  );
  const pendingSellers = useMemo(
    () => sellers.filter((s) => !s.seller_approved_status),
    [sellers],
  );
  const revenue = useMemo(
    () => orders.reduce((s, o) => s + (o.final_amount ?? o.total_amount ?? 0), 0),
    [orders],
  );

  const approveSeller = (id) =>
    axios
      .put(
        `${API}/seller/${id}`,
        { seller_approved_status: true, seller_active_status: 'ACTIVE' },
        authHeaders(),
      )
      .then(() => {
        toast.success('درخواست فروشندگی تأیید و فعال شد');
        load();
      })
      .catch((e) => toast.error(e.response?.data?.message || 'خطا در تأیید فروشنده'));

  if (loading) {
    return (
      <div className="py-16">
        <Loading label="در حال بارگذاری اطلاعات پیشخوان…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-black text-lg">پیشخوان مدیریت علی‌بازار</h1>
          <p className="text-xs muted">آمار کلی سیستم و دسترسی سریع به بخش‌های مدیریتی</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="btn-ghost !py-2 !px-3 text-xs flex items-center gap-1.5"
        >
          <RefreshCw size={14} /> بروزرسانی
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'درآمد سفارش‌ها', value: formatPrice(revenue), icon: CreditCard },
          { label: 'کل سفارش‌ها', value: toFa(orders.length), icon: ShoppingBag },
          { label: 'فروشندگان در انتظار', value: toFa(pendingSellers.length), icon: Store },
          { label: 'کل کاربران', value: toFa(users.length), icon: Users },
          { label: 'فروشگاه‌ها', value: toFa(stores.length), icon: Store },
          { label: 'محصولات', value: toFa(products.length), icon: Package },
          { label: 'دسته‌بندی‌ها', value: toFa(categories.length), icon: FolderTree },
          { label: 'پلن‌ها', value: toFa(plans.length), icon: CreditCard },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card rounded-2xl p-5 flex items-start justify-between gap-3"
          >
            <div>
              <div className="text-xs muted font-bold">{stat.label}</div>
              <div className="font-black text-xl mt-2 text-yellow">{stat.value}</div>
            </div>
            <span className="w-10 h-10 rounded-xl bg-navy text-brand-yellow grid place-items-center shrink-0">
              <stat.icon size={18} />
            </span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-black">
              فروشندگان در انتظار تأیید ({toFa(pendingSellers.length)})
            </h2>
            <Link to="/dashboard/sellers" className="text-xs font-bold text-yellow">
              مشاهده همه
            </Link>
          </div>
          {pendingSellers.length === 0 ? (
            <p className="text-sm muted py-6 text-center">
              درخواست در انتظار تأیید وجود ندارد.
            </p>
          ) : (
            <div className="space-y-2.5">
              {pendingSellers.slice(0, 4).map((s) => (
                <div
                  key={s._id}
                  className="card2 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm">{userFullName(s) || s.username}</div>
                    <div className="text-xs muted" dir="ltr">
                      {toFa(s.phone)} • ملی: {toFa(s.national_ID || '—')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {s.identity_image_id && (
                      <button
                        type="button"
                        onClick={() =>
                          setZoomFile({
                            file: s.identity_image_id,
                            alt: `مدرک ${s.username}`,
                          })
                        }
                        className="btn-ghost !py-1 !px-2 text-xs"
                      >
                        مدرک
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => approveSeller(s._id)}
                      className="btn-yellow !py-1.5 !px-3 text-xs flex items-center gap-1"
                    >
                      <Check size={13} /> تأیید
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-black">آخرین محصولات ({toFa(products.length)})</h2>
            <Link to="/dashboard/products" className="text-xs font-bold text-yellow">
              مدیریت همه
            </Link>
          </div>
          {products.length === 0 ? (
            <p className="text-sm muted py-6 text-center">محصولی ثبت نشده است.</p>
          ) : (
            <div className="space-y-2.5">
              {products.slice(0, 4).map((p) => {
                const seller = userMap[getId(p.seller_id)];
                const store = storeMap[getId(p.store_id)];
                return (
                  <div key={p._id} className="card2 rounded-xl p-3 flex items-center gap-3">
                    <StorageImageComponent
                      file={productImages(p)[0]}
                      alt={p.name}
                      className="w-11 h-11 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{p.name}</div>
                      <div className="text-[11px] muted truncate">
                        فروشگاه: {store?.name || p.store_name || '—'} • سازنده:{' '}
                        {userFullName(seller) || seller?.username || '—'}
                      </div>
                    </div>
                    <Link
                      to={`/dashboard/products/${p._id}`}
                      className="btn-ghost !py-1.5 !px-2.5 text-xs shrink-0"
                    >
                      ویرایش
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-black">فروشگاه‌ها ({toFa(stores.length)})</h2>
            <Link to="/dashboard/stores" className="text-xs font-bold text-yellow">
              مشاهده همه
            </Link>
          </div>
          <div className="space-y-2.5">
            {stores.slice(0, 4).map((s) => (
              <div
                key={s._id}
                className="card2 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-navy shrink-0 grid place-items-center font-black">
                    <StorageImageComponent
                      file={s.profile_image_id}
                      alt={s.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{s.name}</div>
                    <div className="text-[11px] muted">{statusFa(s.status)}</div>
                  </div>
                </div>
                <Link
                  to="/dashboard/stores"
                  className="btn-ghost !py-1.5 !px-2.5 text-xs shrink-0"
                >
                  مدیریت
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-black">آخرین سفارش‌ها ({toFa(orders.length)})</h2>
            <Link to="/dashboard/orders" className="text-xs font-bold text-yellow">
              مشاهده همه
            </Link>
          </div>
          <div className="space-y-2.5">
            {orders.slice(0, 4).map((o) => {
              const customer = userMap[getId(o.customer_id ?? o.user_id)];
              const payStatus = o.payment?.status || o.payment_status;
              return (
                <div
                  key={o._id}
                  className="card2 rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm" dir="ltr">
                      #{o.order_number || String(o._id).slice(-8)}
                    </div>
                    <div className="text-[11px] muted truncate">
                      {customer?.username || o.shipping_address?.full_name || 'مشتری'} •{' '}
                      {statusFa(payStatus)}
                    </div>
                  </div>
                  <div className="font-black text-yellow shrink-0">
                    {formatPrice(o.final_amount ?? o.total_amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ImageLightboxComponent
        file={zoomFile?.file}
        alt={zoomFile?.alt}
        onClose={() => setZoomFile(null)}
      />
    </div>
  );
}

export default CounterPage;
