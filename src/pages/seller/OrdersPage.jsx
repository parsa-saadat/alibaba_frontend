import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Check, X } from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import { Loading } from '../../components/ScroolToTopComponent';
import { formatPrice, toFa, statusFa } from '../../utils/helpers/format';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

function OrdersPage() {
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/order/sub/all?limit=100`, authHeaders());
      setSubOrders(res.data.body?.data || res.data.body || []);
    } catch {
      setSubOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredSubOrders = useMemo(
    () =>
      orderStatusFilter === 'ALL'
        ? subOrders
        : subOrders.filter((o) => o.status === orderStatusFilter),
    [subOrders, orderStatusFilter],
  );

  const approveSubOrder = (subId) =>
    axios
      .put(`${API}/order/sub/${subId}/approve`, {}, authHeaders())
      .then(() => {
        toast.success('سفارش تأیید شد');
        load();
      })
      .catch((e) => toast.error(e.response?.data?.message || 'خطا در تأیید سفارش'));

  const updateSubOrderStatus = (subId, status) =>
    axios
      .put(`${API}/order/sub/${subId}/status`, { status }, authHeaders())
      .then(() => {
        toast.success(`وضعیت سفارش به ${statusFa(status)} تغییر کرد`);
        load();
      })
      .catch((e) => toast.error(e.response?.data?.message || 'خطا در تغییر وضعیت'));

  const submitCancelSubOrder = (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) return toast.error('لطفاً دلیل لغو را وارد کنید');
    axios
      .put(`${API}/order/sub/${cancelTarget}`, { reason: cancelReason.trim() }, authHeaders())
      .then(() => {
        setCancelTarget(null);
        setCancelReason('');
        toast.success('سفارش لغو شد');
        load();
      })
      .catch((e2) => toast.error(e2.response?.data?.message || 'خطا در لغو سفارش'));
  };

  if (loading) {
    return (
      <div className="py-16">
        <Loading label="در حال بارگذاری سفارش‌ها…" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card rounded-2xl p-4 flex items-center gap-2 flex-wrap">
        {[
          ['ALL', `همه (${toFa(subOrders.length)})`],
          ['awaiting_approval', 'در انتظار تأیید'],
          ['preparing', 'آماده‌سازی'],
          ['ready_to_ship', 'آماده ارسال'],
          ['shipped', 'ارسال‌شده'],
          ['delivered', 'تحویل‌شده'],
        ].map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setOrderStatusFilter(k)}
            className={`chip ${orderStatusFilter === k ? 'on' : ''}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredSubOrders.map((sub) => {
          const st = sub.status;
          return (
            <div key={sub._id} className="card rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <b className="text-base" dir="ltr">
                  #{sub.order_number || String(sub._id).slice(-8)}
                </b>
                <span className="chip !cursor-default text-xs">{statusFa(st)}</span>
              </div>

              <div className="space-y-1.5 text-xs">
                {(sub.items || []).map((item, idx) => (
                  <div
                    key={item.product_id || idx}
                    className="flex justify-between py-1 border-b border-theme last:border-0"
                  >
                    <span>
                      {item.product_name || item.name} × {toFa(item.quantity)}
                    </span>
                    <b>{formatPrice(item.unit_price * item.quantity)}</b>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-theme">
                <div className="font-black text-yellow">
                  {formatPrice((sub.amount ?? sub.subtotal ?? 0) - (sub.discount_applied ?? 0))}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {st === 'awaiting_approval' && (
                    <button
                      type="button"
                      onClick={() => approveSubOrder(sub._id)}
                      className="btn-yellow !py-1.5 !px-3 text-xs flex items-center gap-1"
                    >
                      <Check size={13} /> تأیید سفارش
                    </button>
                  )}
                  {st === 'preparing' && (
                    <button
                      type="button"
                      onClick={() => updateSubOrderStatus(sub._id, 'ready_to_ship')}
                      className="btn-yellow !py-1.5 !px-3 text-xs"
                    >
                      آماده ارسال
                    </button>
                  )}
                  {st === 'ready_to_ship' && (
                    <button
                      type="button"
                      onClick={() => updateSubOrderStatus(sub._id, 'shipped')}
                      className="btn-yellow !py-1.5 !px-3 text-xs"
                    >
                      ثبت ارسال
                    </button>
                  )}
                  {st === 'shipped' && (
                    <button
                      type="button"
                      onClick={() => updateSubOrderStatus(sub._id, 'delivered')}
                      className="btn-yellow !py-1.5 !px-3 text-xs"
                    >
                      ثبت تحویل
                    </button>
                  )}
                  {!['delivered', 'cancelled', 'rejected', 'finalized'].includes(st) && (
                    <button
                      type="button"
                      onClick={() => setCancelTarget(sub._id)}
                      className="btn-ghost !py-1.5 !px-3 text-xs text-red-400"
                    >
                      لغو سفارش
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {cancelTarget && (
        <div
          className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCancelTarget(null)}
        >
          <form
            onSubmit={submitCancelSubOrder}
            onClick={(e) => e.stopPropagation()}
            className="card rounded-3xl p-6 w-full max-w-md space-y-3"
          >
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="font-black">لغو سفارش</h3>
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="btn-ghost !p-1.5"
              >
                <X size={16} />
              </button>
            </div>
            <textarea
              className="input"
              rows={3}
              placeholder="دلیل لغو سفارش را وارد کنید…"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="btn-ghost !py-2 text-xs"
              >
                انصراف
              </button>
              <button type="submit" className="btn-yellow !py-2 text-xs">
                تأیید لغو
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
