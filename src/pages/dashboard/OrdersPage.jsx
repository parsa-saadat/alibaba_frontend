import RefundActions from '../../components/orders/RefundActionsComponent';
import { formatMoney } from '../../i18n/runtime';
import usePanelStats from '../../hooks/usePanelStats';
import StatsNotice from '../../components/panel/StatsNoticeComponent';
import {
  formatOrderPrice as formatPrice,
  formatCompactOrderPrice,
  orderItemName,
} from '../../utils/helpers/order';
import { t as translateText } from '../../i18n/runtime.js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Check,
  ChevronDown,
  ClipboardList,
  Clock3,
  CreditCard,
  MapPin,
  PackageCheck,
  ReceiptText,
  Search,
  StickyNote,
  Store as StoreIcon,
  User2,
  Wallet,
  X,
} from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { toFa, statusFa, formatDateTime } from '../../utils/helpers/format';
import { getId } from '../../utils/helpers/response';
import { userFullName } from '../../utils/helpers/user';
import PanelPageHeader from '../../components/panel/PanelPageHeaderComponent';
import {
  AddressLines,
  CancellationInfo,
  InfoBox,
  InfoLine,
  OrderItemRow,
  OrderTimeline,
  PayStatusChip,
  SubStatusChip,
  itemName,
} from '../../components/orders/OrderPartsComponent';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

const PAY_FILTERS = [
  ['ALL', translateText('همه')],
  ['paid', translateText('پرداخت‌شده')],
  ['pending', translateText('در انتظار پرداخت')],
  ['failed', translateText('ناموفق')],
];

const payStatusOf = (order) => order.payment?.status || order.payment_status || 'pending';

const netOf = (sub) =>
  (Number(sub.amount ?? sub.subtotal ?? 0) || 0) - (Number(sub.discount_applied ?? 0) || 0);

function StatTile({ label, value, icon: Icon, tint }) {
  return (
    <div className="card rounded-2xl p-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[11px] font-bold muted truncate">{label}</div>
        <div
          className="mt-2 font-black leading-tight"
          style={{ color: tint || 'var(--text)', fontSize: '1.05rem' }}
        >
          {value}
        </div>
      </div>
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{ background: 'var(--card2)', color: tint || 'var(--primary-color)' }}
      >
        <Icon size={17} />
      </span>
    </div>
  );
}

function OrdersPage() {
  const { stats: panelStats, error: statsError, refresh: refreshStats } = usePanelStats(['order']);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [extraUsers, setExtraUsers] = useState({});
  const [extraStores, setExtraStores] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [busyId, setBusyId] = useState('');

  const requested = useRef(new Set());

  const load = useCallback(async () => {
    refreshStats();

    setLoadError(false);
    const get = (u, params) =>
      axios
        .get(`${API}${u}`, { ...authHeaders(), params })
        .then((r) => r.data.body?.data || r.data.body || []);
    try {
      const [o, u, s] = await Promise.all([
        get('/orders?limit=100&desc=true', { search, payment_status: orderPaymentFilter }),
        get('/user?limit=100').catch(() => []),
        get('/perm/stores?limit=100').catch(() => []),
      ]);
      setOrders(Array.isArray(o) ? o : []);
      setUsers(Array.isArray(u) ? u : []);
      setStores(Array.isArray(s) ? s : []);
    } catch {
      setOrders([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [search, orderPaymentFilter]);

  useEffect(() => {
    const timer = setTimeout(() => load(true), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const userMap = useMemo(
    () => ({ ...extraUsers, ...Object.fromEntries(users.map((u) => [getId(u), u])) }),
    [users, extraUsers],
  );
  const storeMap = useMemo(
    () => ({ ...extraStores, ...Object.fromEntries(stores.map((s) => [getId(s), s])) }),
    [stores, extraStores],
  );
  const userMapRef = useRef(userMap);
  const storeMapRef = useRef(storeMap);
  userMapRef.current = userMap;
  storeMapRef.current = storeMap;

  /* کاربر یا فروشگاهی که در ۱۰۰ مورد اول لیست نبود، هنگام باز کردن سفارش جداگانه خوانده می‌شود */
  const ensureEntity = useCallback((kind, id) => {
    if (!id) return;
    const known = kind === 'user' ? userMapRef.current[id] : storeMapRef.current[id];
    const key = `${kind}:${id}`;
    if (known || requested.current.has(key)) return;
    requested.current.add(key);
    const url = kind === 'user' ? `${API}/user/${id}` : `${API}/perm/store/${id}`;
    axios
      .get(url, authHeaders())
      .then((res) => {
        const body = res.data?.body;
        if (!body || typeof body !== 'object') return;
        if (kind === 'user') setExtraUsers((prev) => ({ ...prev, [id]: body }));
        else setExtraStores((prev) => ({ ...prev, [id]: body }));
      })
      .catch(() => {});
  }, []);

  const toggleOrder = (order) => {
    const open = expandedOrderId !== order._id;
    setExpandedOrderId(open ? order._id : null);
    if (!open) return;
    ensureEntity('user', getId(order.customer_id ?? order.user_id));
    (order.sub_orders || []).forEach((sub) => {
      ensureEntity('user', getId(sub.seller_id));
      ensureEntity('store', getId(sub.store_id));
    });
  };

  const q = search.trim().toLowerCase();
  const filteredOrders = orders;

  const summary = {
    total: panelStats.order?.counts.all ?? '—',
    paid: panelStats.order?.counts.paid ?? '—',
    pending: panelStats.order?.counts.pending ?? '—',
    revenue: panelStats.order?.revenue ?? null,
  };

  const run = (id, request, success, failure) => {
    setBusyId(id);
    return request
      .then(() => {
        toast.success(success);
        return load();
      })
      .catch((e) => toast.error(e.response?.data?.message || failure))
      .finally(() => setBusyId(''));
  };

  const approveSubOrder = (subId) =>
    run(
      subId,
      axios.put(`${API}/order/sub/${subId}/approve`, {}, authHeaders()),
      translateText('مرسوله تأیید شد'),
      translateText('خطا در تأیید مرسوله'),
    );

  const updateSubOrderStatus = (subId, status) =>
    run(
      subId,
      axios.put(`${API}/order/sub/${subId}/status`, { status }, authHeaders()),
      translateText('وضعیت به «{{v0}}» تغییر کرد', { v0: statusFa(status) }),
      translateText('خطا در تغییر وضعیت'),
    );

  const submitCancelSubOrder = (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) return toast.error(translateText('دلیل لغو الزامی است'));
    const id = cancelTarget;
    run(
      id,
      axios.put(`${API}/order/sub/${id}/cancel`, { reason: cancelReason.trim() }, authHeaders()),
      translateText('مرسوله لغو شد'),
      translateText('خطا در لغو مرسوله'),
    ).then(() => {
      setCancelTarget(null);
      setCancelReason('');
    });
  };

  if (loading && orders.length === 0) {
    return (
      <div className="py-16">
        <Loading label={translateText('در حال بارگذاری سفارش‌ها…')} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PanelPageHeader
        icon={ClipboardList}
        title={translateText('سفارش‌ها')}
        subtitle={translateText(
          'جزئیات کامل سفارش‌ها، کالاها، مشتری، پرداخت و مرسوله‌ی هر فروشگاه',
        )}
        onRefresh={() => load()}
      />
      <StatsNotice error={statsError} stats={panelStats} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={translateText('کل سفارش‌ها')}
          value={toFa(summary.total)}
          icon={ReceiptText}
        />
        <StatTile
          label={translateText('پرداخت‌شده')}
          value={toFa(summary.paid)}
          icon={PackageCheck}
          tint="#17994f"
        />
        <StatTile
          label={translateText('در انتظار پرداخت')}
          value={toFa(summary.pending)}
          icon={Clock3}
          tint="#ff6a00"
        />
        <StatTile
          label={translateText('مجموع پرداخت‌شده')}
          value={
            summary.revenue == null
              ? '—'
              : formatMoney(summary.revenue, panelStats.order?.currency, {
                  notation: 'compact',
                  maximumFractionDigits: 1,
                })
          }
          icon={Wallet}
        />
      </div>

      <div className="card rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {PAY_FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setOrderPaymentFilter(key)}
              className={`chip ${orderPaymentFilter === key ? 'on' : ''}`}
            >
              {label}
              {key === 'ALL' ? ` (${toFa(orders.length)})` : ''}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={translateText('شماره سفارش، مشتری، موبایل، کالا یا فروشگاه…')}
            className="input !py-2 !pe-9 text-xs"
          />
        </div>
      </div>

      {loadError && (
        <div className="card rounded-2xl p-6 text-center space-y-3">
          <p className="text-sm muted">{translateText('دریافت سفارش‌ها ناموفق بود.')}</p>
          <button type="button" onClick={load} className="btn-primary !py-2 text-xs">
            {translateText('تلاش دوباره ')}
          </button>
        </div>
      )}

      {!loadError && filteredOrders.length === 0 ? (
        <div className="card rounded-2xl p-10 text-center muted">
          {translateText('سفارشی یافت نشد.')}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((o) => {
            const customerId = getId(o.customer_id ?? o.user_id);
            const customer = userMap[customerId];
            const payStatus = payStatusOf(o);
            const subs = o.sub_orders || [];
            const isOpen = expandedOrderId === o._id;
            const addr = o.shipping_address;
            const itemsCount = subs.reduce(
              (sum, sub) =>
                sum + (sub.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0),
              0,
            );

            return (
              <div key={o._id} className="card rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleOrder(o)}
                  aria-expanded={isOpen}
                  className="w-full p-4 text-start flex items-center justify-between gap-4 flex-wrap hover:bg-white/[0.02]"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <b className="text-base" dir="ltr">
                        #{o.order_number || String(o._id).slice(-8)}
                      </b>
                      <PayStatusChip status={payStatus} />
                      <span className="chip !cursor-default !py-0.5 !px-2 text-[11px]">
                        {toFa(subs.length)}
                        {translateText(' مرسوله ')}
                      </span>
                      <span className="chip !cursor-default !py-0.5 !px-2 text-[11px]">
                        {toFa(itemsCount)}
                        {translateText(' کالا ')}
                      </span>
                    </div>
                    <div className="text-xs muted flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User2 size={12} />
                        {userFullName(customer) ||
                          customer?.username ||
                          addr?.full_name ||
                          translateText('مشتری')}
                        {customer?.phone ? ` (${toFa(customer.phone)})` : ''}
                      </span>
                      {addr && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {addr.province}
                          {translateText('، ')}
                          {addr.city}
                        </span>
                      )}
                      <span>{formatDateTime(o.created_at ?? o.create_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <b className="font-black text-base text-accent">
                      {formatPrice(o.final_amount ?? o.total_amount)}
                    </b>
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="p-4 pt-4 space-y-4 border-t border-theme">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <InfoBox icon={User2} title={translateText('اطلاعات مشتری')}>
                        <InfoLine
                          label={translateText('نام')}
                          value={userFullName(customer) || addr?.full_name}
                        />
                        <InfoLine
                          label={translateText('نام کاربری')}
                          value={customer?.username}
                          ltr
                        />
                        <InfoLine
                          label={translateText('موبایل')}
                          value={customer?.phone ? toFa(customer.phone) : ''}
                        />
                        <InfoLine label={translateText('ایمیل')} value={customer?.email} ltr />
                        {customerId && (
                          <div className="pt-1 text-[10px] muted" dir="ltr">
                            ID: {customerId}
                          </div>
                        )}
                      </InfoBox>

                      <InfoBox icon={MapPin} title={translateText('نشانی تحویل')}>
                        <AddressLines address={addr} />
                      </InfoBox>

                      <InfoBox
                        icon={CreditCard}
                        title={translateText('پرداخت و مبالغ')}
                        className="md:col-span-2 xl:col-span-1"
                      >
                        <InfoLine
                          label={translateText('وضعیت')}
                          value={<PayStatusChip status={payStatus} />}
                        />
                        <InfoLine
                          label={translateText('درگاه')}
                          value={o.payment?.payment_gateway || o.payment?.method}
                        />
                        <InfoLine
                          label={translateText('کد پیگیری')}
                          value={o.payment?.ref_id}
                          ltr
                        />
                        <InfoLine
                          label={translateText('شناسه تراکنش')}
                          value={o.payment?.authority}
                          ltr
                        />
                        <InfoLine
                          label={translateText('تاریخ پرداخت')}
                          value={o.payment?.paid_at ? formatDateTime(o.payment.paid_at) : ''}
                        />
                        <div className="my-1 border-t border-theme" />
                        <InfoLine
                          label={translateText('جمع کالاها')}
                          value={formatPrice(o.total_amount ?? 0)}
                        />
                        <InfoLine
                          label={translateText('تخفیف')}
                          value={formatPrice(o.total_discount ?? 0)}
                        />
                        <InfoLine
                          label={translateText('مبلغ نهایی')}
                          value={formatPrice(o.final_amount ?? 0)}
                        />
                        <InfoLine
                          label={translateText('پرداخت‌شده')}
                          value={formatPrice(o.paid_amount ?? 0)}
                        />
                      </InfoBox>
                    </div>

                    {o.customer_notes && (
                      <InfoBox icon={StickyNote} title={translateText('یادداشت مشتری')}>
                        <p className="leading-6 break-words">{o.customer_notes}</p>
                      </InfoBox>
                    )}

                    <div className="space-y-3">
                      {subs.map((sub) => {
                        const store = storeMap[getId(sub.store_id)];
                        const seller = userMap[getId(sub.seller_id)];
                        const st = sub.status;
                        const busy = busyId === sub._id;
                        return (
                          <div key={sub._id} className="card2 rounded-2xl p-4 space-y-3">
                            <div className="flex items-start justify-between flex-wrap gap-2">
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <b className="text-sm" dir="ltr">
                                    #{sub.order_number || String(sub._id).slice(-8)}
                                  </b>
                                  <SubStatusChip status={st} />
                                </div>
                                <div className="flex items-center gap-3 flex-wrap text-[11px] muted">
                                  <span className="flex items-center gap-1">
                                    <StoreIcon size={12} />
                                    {getId(sub.store_id) ? (
                                      <Link
                                        to={`/store/${getId(sub.store_id)}`}
                                        className="font-bold hover:underline"
                                        style={{ color: 'var(--text)' }}
                                      >
                                        {store?.name || translateText('فروشگاه')}
                                      </Link>
                                    ) : (
                                      '—'
                                    )}
                                  </span>
                                  <span>
                                    {translateText('فروشنده: ')}
                                    {userFullName(seller) || seller?.username || '—'}
                                    {seller?.phone ? ` (${toFa(seller.phone)})` : ''}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {(sub.items || []).map((item, idx) => (
                                <OrderItemRow
                                  key={`${getId(item.product_id) || idx}-${idx}`}
                                  item={item}
                                />
                              ))}
                            </div>

                            <CancellationInfo sub={sub} />
                            <RefundActions sub={sub} onRefresh={load} />

                            <details
                              className="rounded-xl p-3"
                              style={{ background: 'var(--card)' }}
                            >
                              <summary className="cursor-pointer text-[11px] font-black">
                                {translateText('تاریخچه‌ی وضعیت مرسوله')}
                              </summary>
                              <div className="mt-3">
                                <OrderTimeline history={sub.status_history || []} />
                              </div>
                            </details>

                            <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-theme">
                              <div className="flex items-center gap-3 flex-wrap text-[11px]">
                                <span className="muted">
                                  {translateText('جمع اقلام: ')}
                                  <b style={{ color: 'var(--text)' }}>
                                    {formatPrice(sub.amount ?? sub.subtotal ?? 0)}
                                  </b>
                                </span>
                                {Number(sub.discount_applied) > 0 && (
                                  <span style={{ color: '#e53935' }}>
                                    {translateText('تخفیف: ')}
                                    {formatPrice(sub.discount_applied)}
                                  </span>
                                )}
                                <span className="font-black text-accent">
                                  {translateText('خالص مرسوله: ')}
                                  {formatPrice(netOf(sub))}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                {st === 'awaiting_approval' && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => approveSubOrder(sub._id)}
                                    className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-60"
                                  >
                                    <Check size={13} />
                                    {translateText(' تأیید مرسوله ')}
                                  </button>
                                )}
                                {st === 'preparing' && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => updateSubOrderStatus(sub._id, 'ready_to_ship')}
                                    className="btn-primary !py-1.5 !px-3 text-xs disabled:opacity-60"
                                  >
                                    {translateText('آماده ارسال ')}
                                  </button>
                                )}
                                {st === 'ready_to_ship' && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => updateSubOrderStatus(sub._id, 'shipped')}
                                    className="btn-primary !py-1.5 !px-3 text-xs disabled:opacity-60"
                                  >
                                    {translateText('ثبت ارسال ')}
                                  </button>
                                )}
                                {st === 'shipped' && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => updateSubOrderStatus(sub._id, 'delivered')}
                                    className="btn-primary !py-1.5 !px-3 text-xs disabled:opacity-60"
                                  >
                                    {translateText('ثبت تحویل ')}
                                  </button>
                                )}
                                {!['delivered', 'cancelled', 'rejected', 'finalized'].includes(
                                  st,
                                ) && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => {
                                      setCancelTarget(sub._id);
                                      setCancelReason('');
                                    }}
                                    className="btn-ghost !py-1.5 !px-3 text-xs disabled:opacity-60"
                                    style={{ color: '#e53935' }}
                                  >
                                    {translateText('لغو مرسوله ')}
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
              <h3 className="font-black">{translateText('لغو مرسوله')}</h3>
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="btn-ghost !p-1.5"
                aria-label={translateText('بستن')}
              >
                <X size={16} />
              </button>
            </div>
            <textarea
              className="input"
              rows={3}
              maxLength={500}
              placeholder={translateText('دلیل لغو سفارش را وارد کنید…')}
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
                {translateText('انصراف ')}
              </button>
              <button
                type="submit"
                disabled={busyId === cancelTarget}
                className="btn-primary !py-2 text-xs disabled:opacity-60"
              >
                {translateText('تأیید لغو ')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
