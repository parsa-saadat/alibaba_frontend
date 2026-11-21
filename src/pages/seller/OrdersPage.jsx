import { formatMoney } from '../../i18n/runtime';
import usePanelStats from '../../hooks/usePanelStats';
import StatsNotice from '../../components/panel/StatsNoticeComponent';
import {
  formatOrderPrice as formatPrice,
  formatCompactOrderPrice,
  orderItemName,
} from '../../utils/helpers/order';
import { t as translateText } from '../../i18n/runtime.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeftRight,
  Ban,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  Flame,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  StickyNote,
  Truck,
  Wallet,
  X,
} from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { formatDate, toFa, statusFa } from '../../utils/helpers/format';
import PanelPageHeader from '../../components/panel/PanelPageHeaderComponent';
import {
  AddressLines,
  CancellationInfo,
  InfoBox,
  InfoLine,
  OrderItemRow,
  OrderTimeline,
  PayStatusChip,
} from '../../components/orders/OrderPartsComponent';
import { getId } from '../../utils/helpers/response';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

/* رنگ و آیکن هر وضعیت */
const STATUS_META = {
  awaiting_approval: {
    color: '#c2740a',
    bg: 'rgba(194,116,10,0.14)',
    icon: Clock3,
  },
  preparing: { color: '#2563eb', bg: 'rgba(37,99,235,0.14)', icon: Package },
  ready_to_ship: {
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.14)',
    icon: ClipboardList,
  },
  shipped: { color: '#0f766e', bg: 'rgba(15,118,110,0.14)', icon: Truck },
  delivered: {
    color: '#17994f',
    bg: 'rgba(23,153,79,0.14)',
    icon: CheckCircle2,
  },
  cancelled: { color: '#e53935', bg: 'rgba(229,57,53,0.14)', icon: Ban },
  rejected: { color: '#b91c1c', bg: 'rgba(185,28,28,0.14)', icon: Ban },
  finalized: {
    color: '#17994f',
    bg: 'rgba(23,153,79,0.14)',
    icon: CheckCircle2,
  },
};

const metaOf = (status) =>
  STATUS_META[status] || {
    color: 'var(--muted)',
    bg: 'var(--card2)',
    icon: Package,
  };

const FILTERS = [
  { key: 'ALL', label: translateText('همه') },
  { key: 'awaiting_approval', label: translateText('در انتظار تأیید') },
  { key: 'preparing', label: translateText('در حال آماده‌سازی') },
  { key: 'ready_to_ship', label: translateText('آماده ارسال') },
  { key: 'shipped', label: translateText('ارسال‌شده') },
  { key: 'delivered', label: translateText('تحویل‌شده') },
  { key: 'cancelled', label: translateText('لغوشده') },
];

/* مسیر پیشرفت سفارش */
const FLOW = ['awaiting_approval', 'preparing', 'ready_to_ship', 'shipped', 'delivered'];

const itemQty = (item) => Number(item?.quantity ?? 1) || 1;
const itemName = orderItemName;

/* نمایش فشرده‌ی مبلغ برای کارت‌های کوچک */
const compactMoney = formatCompactOrderPrice;

const netOf = (sub) => {
  const amount = Number(sub.amount ?? sub.subtotal ?? 0) || 0;
  const discount = Number(sub.discount_applied ?? 0) || 0;
  return amount - discount;
};

/* ------------------------------------------------------------------ */
/* کارت آماری                                                          */
/* ------------------------------------------------------------------ */
function StatTile({ label, value, hint, icon: Icon, tint }) {
  return (
    <div className="card rounded-2xl p-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[11px] font-bold muted truncate">{label}</div>
        <div
          className="mt-2 font-black leading-tight"
          style={{
            color: tint || 'var(--text)',
            fontSize: String(value).length > 9 ? '0.85rem' : '1.05rem',
          }}
        >
          {value}
        </div>
        {hint && <div className="mt-1 text-[10px] muted truncate">{hint}</div>}
      </div>
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{
          background: 'var(--card2)',
          color: tint || 'var(--primary-color)',
        }}
      >
        <Icon size={17} />
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* صفحه                                                               */
/* ------------------------------------------------------------------ */
function OrdersPage() {
  const { stats: panelStats, error: statsError, refresh: refreshStats } = usePanelStats(['order']);
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelPreset, setCancelPreset] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(
    async (silent = false) => {
      refreshStats();
      if (silent) setRefreshing(true);
      else setRefreshing(true);
      try {
        const res = await axios.get(`${API}/order/sub/all?limit=100`, {
          ...authHeaders(),
          params: { search, status: statusFilter === 'ALL' ? undefined : statusFilter },
        });
        setSubOrders(res.data.body?.data || res.data.body || []);
      } catch {
        setSubOrders([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, statusFilter],
  );

  useEffect(() => {
    const timer = setTimeout(() => load(true), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const counts = {
    ALL: panelStats.order?.counts.all ?? '—',
    ...(panelStats.order?.statuses || {}),
  };

  const totals = {
    total: panelStats.order?.revenue ?? null,
    waiting: panelStats.order?.counts.waiting ?? '—',
    inProgress: panelStats.order?.counts.inProgress ?? '—',
    done: panelStats.order?.counts.done ?? '—',
    items: panelStats.order?.counts.items ?? '—',
  };

  const filtered = subOrders;

  const runAction = (id, promise, successMessage) => {
    setBusyId(id);
    promise
      .then(() => {
        toast.success(successMessage);
        return load(true);
      })
      .catch((error) =>
        toast.error(error.response?.data?.message || translateText('خطا در انجام عملیات')),
      )
      .finally(() => setBusyId(''));
  };

  const approveSubOrder = (subId) =>
    runAction(
      subId,
      axios.put(`${API}/order/sub/${subId}/approve`, {}, authHeaders()),
      translateText('سفارش تأیید شد'),
    );

  const updateSubOrderStatus = (subId, status) =>
    runAction(
      subId,
      axios.put(`${API}/order/sub/${subId}/status`, { status }, authHeaders()),
      translateText('وضعیت به «{{v0}}» تغییر کرد', { v0: statusFa(status) }),
    );

  const submitCancelSubOrder = (e) => {
    e.preventDefault();
    const reason = [cancelPreset, cancelReason.trim()].filter(Boolean).join(' — ');
    if (!reason) return toast.error(translateText('لطفاً دلیل لغو را وارد کنید'));
    const id = cancelTarget;
    setBusyId(id);
    axios
      .put(`${API}/order/sub/${id}/cancel`, { reason }, authHeaders())
      .then(() => {
        setCancelTarget(null);
        setCancelReason('');
        setCancelPreset('');
        toast.success(translateText('سفارش لغو شد'));
        return load(true);
      })
      .catch((err) => toast.error(err.response?.data?.message || translateText('خطا در لغو سفارش')))
      .finally(() => setBusyId(''));
  };

  if (loading) {
    return (
      <div className="py-16">
        <Loading label={translateText('در حال بارگذاری سفارش‌ها…')} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PanelPageHeader
        icon={ClipboardList}
        title={translateText('سفارش‌های فروشگاه')}
        subtitle={translateText('تأیید، آماده‌سازی و پیگیری سفارش‌های فروشنده • {{v0}} سفارش', {
          v0: toFa(subOrders.length),
        })}
        onRefresh={() => load(true)}
        refreshing={refreshing}
      />
      <StatsNotice error={statsError} stats={panelStats} />
      {/* ───── سرصفحه ───── */}

      {/* ───── کارت‌های آماری ───── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={translateText('کل سفارش‌ها')}
          value={toFa(subOrders.length)}
          hint={translateText('{{v0}} قلم کالا', { v0: toFa(totals.items) })}
          icon={ShoppingBag}
        />
        <StatTile
          label={translateText('در انتظار تأیید')}
          value={toFa(totals.waiting)}
          hint={translateText('نیازمند اقدام شما')}
          icon={Clock3}
          tint="#c2740a"
        />
        <StatTile
          label={translateText('در حال پردازش')}
          value={toFa(totals.inProgress)}
          hint={translateText('آماده‌سازی و آماده‌ی ارسال')}
          icon={Flame}
          tint="#2563eb"
        />
        <StatTile
          label={translateText('فروش خالص')}
          value={
            totals.total == null
              ? '—'
              : formatMoney(totals.total, panelStats.order?.currency, {
                  notation: 'compact',
                  maximumFractionDigits: 1,
                })
          }
          hint={translateText('{{v0}} سفارش تحویل‌شده', { v0: toFa(totals.done) })}
          icon={Wallet}
          tint="#17994f"
        />
      </div>

      {/* ───── نوار فیلتر و جستجو ───── */}
      <section className="card rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((filter) => {
            const active = statusFilter === filter.key;
            const count = counts[filter.key] || 0;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className="chip flex items-center gap-1.5"
                style={
                  active
                    ? {
                        background: 'var(--primary-color)',
                        color: 'var(--on-primary)',
                        borderColor: 'transparent',
                      }
                    : undefined
                }
              >
                <span>{filter.label}</span>
                <span
                  className="rounded-full px-1.5 text-[10px] font-black"
                  style={{
                    background: active ? 'rgba(10,23,54,0.16)' : 'var(--card2)',
                  }}
                >
                  {toFa(count)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={translateText('جستجو با شماره سفارش یا نام کالا…')}
            className="input !py-2.5 !pe-9 text-xs w-full"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="btn-ghost !p-1 absolute start-2 top-1/2 -translate-y-1/2"
              aria-label={translateText('پاک کردن جستجو')}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </section>

      {/* ───── لیست سفارش‌ها ───── */}
      {filtered.length === 0 ? (
        <section className="card rounded-3xl p-10 text-center space-y-3">
          <span
            className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: 'var(--card2)', color: 'var(--muted)' }}
          >
            <ShoppingBag size={24} />
          </span>
          <b className="block text-sm">{translateText('سفارشی برای نمایش نیست')}</b>
          <p className="text-xs muted">
            {subOrders.length === 0
              ? translateText('هنوز سفارشی از فروشگاه شما ثبت نشده است.')
              : translateText('با این فیلتر یا عبارت جستجو سفارشی پیدا نشد.')}
          </p>
          {(search || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
              }}
              className="btn-ghost !py-2 !px-3 text-xs"
            >
              {translateText('پاک کردن فیلترها ')}
            </button>
          )}
        </section>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => {
            const meta = metaOf(sub.status);
            const StatusIcon = meta.icon;
            const stepIndex = FLOW.indexOf(sub.status);
            const cancelled = ['cancelled', 'rejected'].includes(sub.status);
            const busy = busyId === sub._id;

            return (
              <article key={sub._id} className="card rounded-2xl overflow-hidden">
                {/* سر کارت */}
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-theme px-4 py-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      <StatusIcon size={16} />
                    </span>
                    <div className="min-w-0">
                      <b className="block text-sm" dir="ltr">
                        #{sub.order_number || String(sub._id).slice(-8)}
                      </b>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] muted">
                        <CalendarDays size={11} />
                        {formatDate(sub.created_at || sub.create_at)}
                      </span>
                    </div>
                  </div>

                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-black"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {statusFa(sub.status)}
                  </span>
                </header>

                {/* مسیر پیشرفت */}
                {!cancelled && stepIndex >= 0 && (
                  <div className="flex items-center gap-1 px-4 pt-3" aria-hidden>
                    {FLOW.map((step, index) => {
                      const done = index <= stepIndex;
                      return (
                        <div key={step} className="flex-1 flex items-center gap-1">
                          <span
                            className="h-1.5 flex-1 rounded-full"
                            style={{
                              background: done ? meta.color : 'var(--card2)',
                              opacity: done ? 1 : 0.7,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* اقلام: عکس و نام کالا هر دو لینک صفحه‌ی محصول هستند */}
                <div className="px-4 py-3 space-y-2">
                  {(sub.items || []).map((item, index) => (
                    <OrderItemRow key={`${getId(item.product_id) || index}-${index}`} item={item} />
                  ))}
                </div>

                {/* جزئیات تحویل، پرداخت و تاریخچه */}
                <div className="px-4 pb-3 space-y-2">
                  <CancellationInfo sub={sub} />
                  <details className="rounded-xl p-3" style={{ background: 'var(--card2)' }}>
                    <summary className="cursor-pointer text-[11px] font-black">
                      {translateText('جزئیات تحویل، پرداخت و تاریخچه‌ی سفارش ')}
                    </summary>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <InfoBox icon={MapPin} title={translateText('نشانی تحویل')}>
                        <AddressLines address={sub.shipping_address} />
                      </InfoBox>
                      <InfoBox icon={CreditCard} title={translateText('پرداخت و سفارش')}>
                        <InfoLine
                          label={translateText('وضعیت پرداخت')}
                          value={<PayStatusChip status={sub.payment_status || 'pending'} />}
                        />
                        <InfoLine
                          label={translateText('شماره سفارش اصلی')}
                          value={sub.parent_order_number}
                          ltr
                        />
                        <InfoLine
                          label={translateText('جمع اقلام')}
                          value={formatPrice(sub.amount ?? sub.subtotal ?? 0)}
                        />
                        <InfoLine
                          label={translateText('تخفیف')}
                          value={formatPrice(sub.discount_applied ?? 0)}
                        />
                        <InfoLine
                          label={translateText('خالص مرسوله')}
                          value={formatPrice(netOf(sub))}
                        />
                      </InfoBox>
                      {sub.customer_notes && (
                        <InfoBox
                          icon={StickyNote}
                          title={translateText('یادداشت مشتری')}
                          className="md:col-span-2"
                        >
                          <p className="leading-6 break-words">{sub.customer_notes}</p>
                        </InfoBox>
                      )}
                      <div className="md:col-span-2">
                        <div className="mb-2 text-[11px] font-black">
                          {translateText('تاریخچه‌ی وضعیت ')}
                        </div>
                        <OrderTimeline history={sub.status_history || []} />
                      </div>
                    </div>
                  </details>
                </div>

                {/* جمع و عملیات */}
                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-theme px-4 py-3">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="muted">
                      {translateText('جمع اقلام:')}{' '}
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
                    <span className="muted">
                      {translateText('خالص:')}{' '}
                      <b style={{ color: 'var(--primary-color)' }}>{formatPrice(netOf(sub))}</b>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {sub.status === 'awaiting_approval' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => approveSubOrder(sub._id)}
                        className="btn-yellow !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-60"
                      >
                        <Check size={13} />
                        {translateText(' تأیید سفارش ')}
                      </button>
                    )}
                    {sub.status === 'preparing' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updateSubOrderStatus(sub._id, 'ready_to_ship')}
                        className="btn-yellow !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-60"
                      >
                        <ClipboardList size={13} />
                        {translateText(' آماده ارسال ')}
                      </button>
                    )}
                    {sub.status === 'ready_to_ship' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updateSubOrderStatus(sub._id, 'shipped')}
                        className="btn-yellow !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-60"
                      >
                        <Truck size={13} />
                        {translateText(' ثبت ارسال ')}
                      </button>
                    )}
                    {sub.status === 'shipped' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updateSubOrderStatus(sub._id, 'delivered')}
                        className="btn-yellow !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-60"
                      >
                        <CheckCircle2 size={13} />
                        {translateText(' ثبت تحویل ')}
                      </button>
                    )}
                    {!['delivered', 'cancelled', 'rejected', 'finalized'].includes(sub.status) && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setCancelTarget(sub._id);
                          setCancelReason('');
                          setCancelPreset('');
                        }}
                        className="btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-60"
                        style={{ color: '#e53935' }}
                      >
                        <Ban size={13} />
                        {translateText(' لغو ')}
                      </button>
                    )}
                    {['delivered', 'finalized', 'cancelled', 'rejected'].includes(sub.status) && (
                      <span className="flex items-center gap-1 text-[11px] muted">
                        <ArrowLeftRight size={12} />
                        {translateText(' پرونده‌ی سفارش بسته شده است ')}
                      </span>
                    )}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {/* ───── مودال لغو سفارش ───── */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCancelTarget(null)}
        >
          <form
            onSubmit={submitCancelSubOrder}
            onClick={(e) => e.stopPropagation()}
            className="card rounded-3xl p-5 w-full max-w-md space-y-4"
          >
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="flex items-center gap-2 font-black text-sm">
                <Ban size={16} style={{ color: '#e53935' }} />
                {translateText(' لغو سفارش ')}
              </h3>
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="btn-ghost !p-1.5"
                aria-label={translateText('بستن')}
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-bold muted">{translateText('دلیل لغو')}</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  translateText('ناموجود شدن کالا'),
                  translateText('اشتباه در قیمت'),
                  translateText('درخواست مشتری'),
                  translateText('مشکل در ارسال'),
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setCancelPreset(reason === cancelPreset ? '' : reason)}
                    className="chip text-[11px]"
                    style={
                      cancelPreset === reason
                        ? {
                            background: 'var(--primary-color)',
                            color: '#1a1b1e',
                            borderColor: 'transparent',
                          }
                        : undefined
                    }
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-[11px] font-bold muted">
              {translateText('توضیح تکمیلی (اختیاری) ')}
              <textarea
                className="input mt-1.5 !text-xs"
                rows={3}
                placeholder={translateText('مثلاً: موجودی انبار تمام شده است…')}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </label>

            <p className="text-[11px] muted leading-5">
              {translateText(
                'لغو سفارش به مشتری اطلاع داده می‌شود و مبلغ طبق قوانین بازگشت داده خواهد شد. ',
              )}
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="btn-ghost !py-2 !px-4 text-xs"
              >
                {translateText('انصراف ')}
              </button>
              <button
                type="submit"
                className="btn-yellow !py-2 !px-4 text-xs"
                style={{ background: '#e53935', color: '#fff' }}
              >
                {translateText('تأیید لغو سفارش ')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
