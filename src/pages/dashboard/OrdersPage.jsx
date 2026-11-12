import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Search, ChevronDown, User2, MapPin, Check, X } from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import { Loading } from '../../components/common/ScroolToTopComponent';
import {
  formatPrice,
  toFa,
  statusFa,
  formatDateTime,
} from '../../utils/helpers/format';
import { getId } from '../../utils/helpers/response';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const get = (u) =>
      axios
        .get(`${API}${u}`, authHeaders())
        .then((r) => r.data.body?.data || r.data.body || [])
        .catch(() => []);
    const [o, u, s] = await Promise.all([
      get('/orders?limit=100'),
      get('/user?limit=100'),
      get('/perm/stores?limit=100'),
    ]);
    setOrders(o);
    setUsers(u);
    setStores(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const userMap = useMemo(
    () => Object.fromEntries(users.map((u) => [getId(u), u])),
    [users],
  );
  const storeMap = useMemo(
    () => Object.fromEntries(stores.map((s) => [getId(s), s])),
    [stores],
  );

  const q = search.trim().toLowerCase();
  const filteredOrders = useMemo(() => {
    let list = orders;
    if (orderPaymentFilter !== 'ALL') {
      list = list.filter((o) => (o.payment?.status || o.payment_status) === orderPaymentFilter);
    }
    if (q) {
      list = list.filter((o) => {
        const customer = userMap[getId(o.customer_id ?? o.user_id)];
        return (
          String(o.order_number || o._id).toLowerCase().includes(q) ||
          customer?.username?.toLowerCase().includes(q) ||
          customer?.phone?.includes(q) ||
          o.shipping_address?.full_name?.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [orders, orderPaymentFilter, userMap, q]);

  const approveSubOrder = (subId) =>
    axios
      .put(`${API}/order/sub/${subId}/approve`, {}, authHeaders())
      .then(() => {
        toast.success('ساب‌سفارش تأیید شد');
        load();
      })
      .catch((e) => toast.error(e.response?.data?.message || 'خطا در تأیید'));

  const updateSubOrderStatus = (subId, status) =>
    axios
      .put(`${API}/order/sub/${subId}/status`, { status }, authHeaders())
      .then(() => {
        toast.success(`وضعیت به ${statusFa(status)} تغییر کرد`);
        load();
      })
      .catch((e) => toast.error(e.response?.data?.message || 'خطا در تغییر وضعیت'));

  const submitCancelSubOrder = (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) return toast.error('دلیل لغو الزامی است');
    axios
      .put(`${API}/order/sub/${cancelTarget}`, { reason: cancelReason.trim() }, authHeaders())
      .then(() => {
        setCancelTarget(null);
        setCancelReason('');
        toast.success('ساب‌سفارش لغو شد');
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
      <div className="card rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {[
            ['ALL', `همه (${toFa(orders.length)})`],
            ['paid', 'پرداخت‌شده'],
            ['pending', 'در انتظار پرداخت'],
            ['failed', 'ناموفق'],
          ].map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setOrderPaymentFilter(k)}
              className={`chip ${orderPaymentFilter === k ? 'on' : ''}`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="شماره سفارش، نام مشتری یا موبایل…"
            className="input !py-2 !pr-9 text-xs"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="card rounded-2xl p-10 text-center muted">سفارشی یافت نشد.</div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((o) => {
            const customer = userMap[getId(o.customer_id ?? o.user_id)];
            const payStatus = o.payment?.status || o.payment_status || 'pending';
            const subs = o.sub_orders || [];
            const isOpen = expandedOrderId === o._id;
            const addr = o.shipping_address;

            return (
              <div key={o._id} className="card rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedOrderId(isOpen ? null : o._id)}
                  className="w-full p-4 text-right flex items-center justify-between gap-4 flex-wrap hover:bg-white/[0.02]"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <b className="text-base" dir="ltr">
                        #{o.order_number || String(o._id).slice(-8)}
                      </b>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          payStatus === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : payStatus === 'failed'
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {payStatus === 'paid'
                          ? 'پرداخت‌شده'
                          : payStatus === 'failed'
                            ? 'پرداخت ناموفق'
                            : 'در انتظار پرداخت'}
                      </span>
                      <span className="chip !cursor-default !py-0.5 !px-2 text-[11px]">
                        {toFa(subs.length)} مرسوله
                      </span>
                    </div>
                    <div className="text-xs muted flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User2 size={12} /> {customer?.username || addr?.full_name || 'مشتری'}
                        {customer?.phone ? ` (${toFa(customer.phone)})` : ''}
                      </span>
                      {addr && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {addr.province}، {addr.city}
                        </span>
                      )}
                      <span>{formatDateTime(o.created_at ?? o.create_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-left">
                      <div className="font-black text-base text-yellow">
                        {formatPrice(o.final_amount ?? o.total_amount)}
                      </div>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="p-4 pt-0 space-y-4 border-t border-theme">
                    <div className="grid md:grid-cols-2 gap-3 pt-4 text-xs">
                      <div className="card2 rounded-xl p-3 space-y-1">
                        <div className="font-bold text-yellow mb-1">آدرس تحویل</div>
                        {addr ? (
                          <>
                            <div>
                              گیرنده: <b>{addr.full_name}</b>
                            </div>
                            <div>
                              {addr.province}، {addr.city}، {addr.neighborhood} —{' '}
                              {addr.full_address}
                            </div>
                          </>
                        ) : (
                          <div className="muted">آدرس ثبت نشده</div>
                        )}
                      </div>
                      <div className="card2 rounded-xl p-3 space-y-1">
                        <div className="font-bold text-yellow mb-1">اطلاعات پرداخت</div>
                        <div>وضعیت: {statusFa(payStatus)}</div>
                        {o.payment?.ref_id && (
                          <div>
                            کد پیگیری: <b dir="ltr">{o.payment.ref_id}</b>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {subs.map((sub) => {
                        const store = storeMap[getId(sub.store_id)];
                        const st = sub.status;
                        return (
                          <div key={sub._id} className="card2 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <b className="text-sm" dir="ltr">
                                  #{sub.order_number || String(sub._id).slice(-8)}
                                </b>
                                <span className="text-xs muted mr-2">
                                  فروشگاه: {store?.name || '—'}
                                </span>
                              </div>
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
                              <div className="font-black text-yellow text-xs">
                                جمع مرسوله:{' '}
                                {formatPrice(
                                  (sub.amount ?? sub.subtotal ?? 0) -
                                    (sub.discount_applied ?? 0),
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {st === 'awaiting_approval' && (
                                  <button
                                    type="button"
                                    onClick={() => approveSubOrder(sub._id)}
                                    className="btn-yellow !py-1.5 !px-3 text-xs flex items-center gap-1"
                                  >
                                    <Check size={13} /> تأیید مرسوله
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
                                {!['delivered', 'cancelled', 'rejected', 'finalized'].includes(
                                  st,
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() => setCancelTarget(sub._id)}
                                    className="btn-ghost !py-1.5 !px-3 text-xs text-red-400"
                                  >
                                    لغو مرسوله
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
              <h3 className="font-black">لغو مرسوله</h3>
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
