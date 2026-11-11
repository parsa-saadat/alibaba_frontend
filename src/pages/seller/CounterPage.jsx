import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Package, Store, ShoppingBag, CreditCard, RefreshCw } from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import { authHeaders } from '../../utils/helpers/storage';
import StorageImageComponent from '../../components/main/StorageImageComponent';
import { Loading } from '../../components/ScroolToTopComponent';
import {
  formatPrice,
  toFa,
  statusFa,
  productImages,
} from '../../utils/helpers/format';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

function CounterPage() {
  const { user } = useShop();
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return setLoading(false);
    setLoading(true);
    const get = (u) =>
      axios
        .get(`${API}${u}`, authHeaders())
        .then((r) => r.data.body?.data || r.data.body || [])
        .catch(() => []);
    const [p, s, o] = await Promise.all([
      get('/perm/products?limit=100'),
      get('/perm/stores?limit=50'),
      get('/order/sub/all?limit=100'),
    ]);
    setProducts(p);
    setStores(s);
    setSubOrders(o);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const totalSales = useMemo(
    () =>
      subOrders.reduce(
        (sum, sub) => sum + ((sub.amount ?? sub.subtotal ?? 0) - (sub.discount_applied ?? 0)),
        0,
      ),
    [subOrders],
  );

  if (loading) {
    return (
      <div className="py-16">
        <Loading label="در حال بارگذاری پیشخوان فروشنده…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-black text-lg">پیشخوان فروشنده</h1>
          <p className="text-xs muted">مدیریت فروشگاه‌ها، محصولات و سفارش‌های ثبت‌شده</p>
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
          { label: 'کل فروش', value: formatPrice(totalSales), icon: CreditCard },
          { label: 'سفارش‌ها', value: toFa(subOrders.length), icon: ShoppingBag },
          { label: 'محصولات من', value: toFa(products.length), icon: Package },
          { label: 'فروشگاه‌ها', value: toFa(stores.length), icon: Store },
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
            <h2 className="font-black">محصولات اخیر ({toFa(products.length)})</h2>
            <Link to="/seller/products" className="text-xs font-bold text-yellow">
              مدیریت محصولات
            </Link>
          </div>
          {products.slice(0, 4).map((p) => (
            <div key={p._id} className="card2 rounded-xl p-3 flex items-center gap-3">
              <StorageImageComponent
                file={productImages(p)[0]}
                alt={p.name}
                className="w-11 h-11 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{p.name}</div>
                <div className="text-xs muted">موجودی: {toFa(p.stock ?? 0)}</div>
              </div>
              <Link
                to={`/seller/products/${p._id}`}
                className="btn-ghost !py-1.5 !px-2.5 text-xs shrink-0"
              >
                ویرایش
              </Link>
            </div>
          ))}
        </div>

        <div className="card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-black">سفارش‌های اخیر ({toFa(subOrders.length)})</h2>
            <Link to="/seller/orders" className="text-xs font-bold text-yellow">
              مدیریت سفارش‌ها
            </Link>
          </div>
          {subOrders.slice(0, 4).map((sub) => (
            <div
              key={sub._id}
              className="card2 rounded-xl p-3 flex items-center justify-between gap-3"
            >
              <div>
                <b className="text-sm" dir="ltr">
                  #{sub.order_number || String(sub._id).slice(-8)}
                </b>
                <div className="text-xs muted">{statusFa(sub.status)}</div>
              </div>
              <div className="font-black text-yellow">
                {formatPrice((sub.amount ?? sub.subtotal ?? 0) - (sub.discount_applied ?? 0))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CounterPage;
