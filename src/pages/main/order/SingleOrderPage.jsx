import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { Package, ArrowRight, MapPin } from 'lucide-react';
import { authHeaders } from '../../../utils/helpers/storage';
import { Loading } from '../../../components/ScroolToTopComponent';
import {
  formatPrice,
  toFa,
  formatDateTime,
  statusFa,
} from '../../../utils/helpers/format';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

function SingleOrderPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/orders?limit=100`, authHeaders())
      .then((res) => {
        const list = res.data.body?.data || res.data.body || [];
        const found = list.find((o) => o._id === orderId) || list[0];
        setOrder(found || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <Loading label="در حال دریافت جزئیات سفارش…" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="muted">سفارش مورد نظر یافت نشد.</p>
        <Link to="/orders" className="btn-yellow inline-block">
          بازگشت به سفارش‌ها
        </Link>
      </div>
    );
  }

  const addr = order.shipping_address;
  const subs = order.sub_orders || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/orders" className="btn-ghost !p-2">
          <ArrowRight size={17} />
        </Link>
        <h1 className="font-black text-xl flex items-center gap-2">
          <Package size={20} className="text-yellow" /> جزئیات سفارش{' '}
          <span dir="ltr">#{order.order_number || String(order._id).slice(-8)}</span>
        </h1>
      </div>

      <div className="card rounded-3xl p-5 grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs muted">تاریخ ثبت</div>
          <div className="font-bold mt-1">{formatDateTime(order.created_at)}</div>
        </div>
        <div>
          <div className="text-xs muted">مبلغ کل سفارش</div>
          <div className="font-black text-yellow text-lg mt-1">
            {formatPrice(order.final_amount ?? order.total_amount)}
          </div>
        </div>
        {addr && (
          <div className="sm:col-span-2 pt-3 border-t border-theme">
            <div className="text-xs muted flex items-center gap-1">
              <MapPin size={14} className="text-yellow" /> نشانی تحویل
            </div>
            <div className="font-bold mt-1">
              {addr.full_name} — {addr.province}، {addr.city}، {addr.neighborhood}،{' '}
              {addr.full_address}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-black text-base">مرسوله‌های سفارش ({toFa(subs.length)})</h2>
        {subs.map((sub) => (
          <div key={sub._id} className="card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <b dir="ltr">#{sub.order_number || String(sub._id).slice(-8)}</b>
              <span className="chip !cursor-default text-xs">{statusFa(sub.status)}</span>
            </div>
            <div className="space-y-2">
              {(sub.items || []).map((item, idx) => (
                <div
                  key={item.product_id || idx}
                  className="card2 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <span className="font-bold">{item.product_name || item.name}</span>
                  <span>
                    {toFa(item.quantity)} × {formatPrice(item.unit_price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SingleOrderPage;
