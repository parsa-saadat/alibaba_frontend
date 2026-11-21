import { formatMoney } from '../../i18n/runtime';
import usePanelStats from '../../hooks/usePanelStats';
import StatsNotice from '../../components/panel/StatsNoticeComponent';
import {
  formatOrderPrice as formatPrice,
  formatCompactOrderPrice,
} from '../../utils/helpers/order';
import { t as translateText } from '../../i18n/runtime.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Check,
  CircleDollarSign,
  Clock3,
  CreditCard,
  ExternalLink,
  Package,
  Plus,
  RefreshCw,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import { authHeaders } from '../../utils/helpers/storage';
import { userDisplayName } from '../../utils/helpers/user';
import StorageImageComponent from '../../components/common/StorageImageComponent';
import { Loading } from '../../components/common/ScroolToTopComponent';
import {
  toFa,
  statusFa,
  productImages,
  formatDate,
  formatDateLong,
  formatDayOfMonth,
} from '../../utils/helpers/format';
import { getId } from '../../utils/helpers/response';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return translateText('صبح بخیر');
  if (hour < 18) return translateText('بعدازظهر بخیر');
  return translateText('شب بخیر');
};

const dayKey = (date) => {
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
};

const netOf = (sub) =>
  (Number(sub.amount ?? sub.subtotal ?? 0) || 0) - (Number(sub.discount_applied ?? 0) || 0);

const STATUS_TONE = {
  awaiting_approval: { color: '#c2740a', bg: 'rgba(194,116,10,0.14)' },
  preparing: { color: '#2563eb', bg: 'rgba(37,99,235,0.14)' },
  ready_to_ship: { color: '#7c3aed', bg: 'rgba(124,58,237,0.14)' },
  shipped: { color: '#0f766e', bg: 'rgba(15,118,110,0.14)' },
  delivered: { color: '#17994f', bg: 'rgba(23,153,79,0.14)' },
  cancelled: { color: '#e53935', bg: 'rgba(229,57,53,0.14)' },
};
const toneOf = (status) => STATUS_TONE[status] || { color: 'var(--muted)', bg: 'var(--card2)' };

function KpiTile({ label, value, hint, icon: Icon, tint, to }) {
  const body = (
    <div className="card rounded-2xl p-4 flex items-start justify-between gap-3 h-full transition-transform hover:-translate-y-0.5">
      <div className="min-w-0">
        <div className="text-[11px] font-bold muted truncate">{label}</div>
        <div
          className="mt-2 font-black leading-tight"
          style={{
            color: tint || 'var(--text)',
            fontSize: String(value).length > 9 ? '0.88rem' : '1.05rem',
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
  return to ? <Link to={to}>{body}</Link> : body;
}

function Panel({ title, hint, icon: Icon, action, children, className = '' }) {
  return (
    <section className={`card rounded-2xl flex flex-col ${className}`}>
      <header className="flex items-center justify-between gap-2 border-b border-theme px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
            style={{ background: 'var(--card2)' }}
          >
            <Icon size={15} style={{ color: 'var(--primary-color)' }} />
          </span>
          <div className="min-w-0">
            <b className="block text-sm truncate">{title}</b>
            {hint && <span className="text-[10px] muted">{hint}</span>}
          </div>
        </div>
        {action}
      </header>
      <div className="p-3 sm:p-4 flex-1">{children}</div>
    </section>
  );
}

const EmptyRow = ({ text }) => (
  <div className="grid place-items-center py-8 text-center text-xs muted">{text}</div>
);

function CounterPage() {
  const {
    stats: panelStats,
    error: statsError,
    refresh: refreshStats,
  } = usePanelStats(['store', 'product', 'order']);
  const compactMoney = (value) =>
    value == null
      ? '—'
      : formatMoney(value, panelStats.order?.currency, {
          notation: 'compact',
          maximumFractionDigits: 1,
        });
  const { user } = useShop();
  const [data, setData] = useState({ products: [], stores: [], subOrders: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState('');

  const load = useCallback(
    async (silent = false) => {
      refreshStats();
      if (!user) return setLoading(false);
      if (silent) setRefreshing(true);
      else setLoading(true);
      const get = (url) =>
        axios
          .get(`${API}${url}`, authHeaders())
          .then((r) => r.data.body?.data || r.data.body || [])
          .catch(() => []);
      const [products, stores, subOrders] = await Promise.all([
        get('/perm/products?limit=100'),
        get('/perm/stores?limit=50'),
        get('/order/sub/all?limit=100'),
      ]);
      setData({
        products: Array.isArray(products) ? products : [],
        stores: Array.isArray(stores) ? stores : [],
        subOrders: Array.isArray(subOrders) ? subOrders : [],
      });
      setLoading(false);
      setRefreshing(false);
    },
    [user],
  );

  useEffect(() => {
    load();
  }, [load]);

  const { products, stores, subOrders } = data;

  const totals = {
    sales: panelStats.order?.revenue ?? null,
    waiting: panelStats.order?.counts.waiting ?? '—',
    inProgress: panelStats.order?.counts.inProgress ?? '—',
    delivered: panelStats.order?.counts.done ?? '—',
    lowStock: panelStats.product?.counts.lowStock ?? '—',
    items: panelStats.order?.counts.items ?? '—',
  };

  const actionQueue = useMemo(
    () =>
      subOrders
        .filter((sub) => ['awaiting_approval', 'preparing', 'ready_to_ship'].includes(sub.status))
        .slice(0, 5),
    [subOrders],
  );

  const chart = {
    days: (panelStats.order?.daily || []).map((row) => ({
      key: row.day,
      label: formatDayOfMonth(new Date(row.day + 'T12:00:00Z')),
      value: row.amount,
    })),
    max: Math.max(1, ...(panelStats.order?.daily || []).map((row) => row.amount || 0)),
  };

  const approve = (id) => {
    setBusyId(id);
    axios
      .put(`${API}/order/sub/${id}/approve`, {}, authHeaders())
      .then(() => load(true))
      .catch(() => {})
      .finally(() => setBusyId(''));
  };

  const nextStatus = (id, status) => {
    setBusyId(id);
    axios
      .put(`${API}/order/sub/${id}/status`, { status }, authHeaders())
      .then(() => load(true))
      .catch(() => {})
      .finally(() => setBusyId(''));
  };

  if (loading) {
    return (
      <div className="py-16">
        <Loading label={translateText('در حال بارگذاری پیشخوان فروشنده…')} />
      </div>
    );
  }

  const quickLinks = [
    {
      to: '/seller/products',
      label: translateText('محصولات من'),
      icon: Package,
      hint: translateText('{{v0}} کالا', { v0: toFa(panelStats.product?.counts.all ?? '—') }),
    },
    {
      to: '/seller/products/create',
      label: translateText('محصول جدید'),
      icon: Plus,
      hint: translateText('افزودن کالا'),
    },
    {
      to: '/seller/orders',
      label: translateText('سفارش‌ها'),
      icon: ShoppingBag,
      hint: translateText('{{v0}} در انتظار', { v0: toFa(totals.waiting) }),
    },
    {
      to: '/seller/stores',
      label: translateText('فروشگاه‌ها'),
      icon: Store,
      hint: translateText('{{v0}} فروشگاه', { v0: toFa(panelStats.store?.counts.all ?? '—') }),
    },
    {
      to: '/seller/plans',
      label: translateText('پلن و اشتراک'),
      icon: CreditCard,
      hint: translateText('ارتقای پلن'),
    },
    {
      to: '/seller/settings',
      label: translateText('تنظیمات فروشنده'),
      icon: Settings,
      hint: translateText('اطلاعات هویتی'),
    },
  ];

  return (
    <div className="space-y-5">
      {/* ───── هدر ───── */}
      <section
        className="card rounded-3xl overflow-hidden"
        style={{
          background:
            'linear-gradient(120deg, rgba(255,106,0,0.20), rgba(255,106,0,0.04) 45%, rgba(37,99,235,0.10))',
        }}
      >
        <div className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black"
              style={{
                background: 'rgba(10,23,54,0.35)',
                color: 'var(--primary-color)',
              }}
            >
              <Sparkles size={12} />
              {translateText(' پیشخوان فروشنده ')}
            </span>
            <h1 className="mt-2 text-lg sm:text-xl font-black">
              {greeting()}
              {translateText('، ')}
              {userDisplayName(user, translateText('فروشنده ژئوکالا'))}
            </h1>
            <p className="mt-1 text-xs muted">
              {formatDateLong(new Date())}
              {' • '}
              {totals.waiting > 0
                ? translateText('{{v0}} سفارش منتظر تأیید شماست', { v0: toFa(totals.waiting) })
                : translateText('همه‌ی سفارش‌ها بررسی شده‌اند')}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/seller/products/create"
              className="btn-ghost !py-2 !px-3 text-xs flex items-center gap-1.5"
            >
              <Plus size={14} />
              {translateText(' محصول جدید ')}
            </Link>
            <Link
              to="/seller/orders"
              className="btn-yellow !py-2 !px-3 text-xs flex items-center gap-1.5"
            >
              <ShoppingBag size={14} />
              {translateText(' سفارش‌ها ')}
            </Link>
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="btn-ghost !py-2 !px-2.5 text-xs flex items-center gap-1.5 disabled:opacity-60"
              title={translateText('به‌روزرسانی')}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </section>
      <StatsNotice error={statsError} stats={panelStats} />

      {/* ───── کارت‌های کلیدی ───── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <KpiTile
          label={translateText('فروش خالص')}
          value={compactMoney(totals.sales)}
          hint={translateText('{{v0}} قلم فروخته‌شده', { v0: toFa(totals.items) })}
          icon={CircleDollarSign}
          tint="#17994f"
        />
        <KpiTile
          label={translateText('سفارش‌ها')}
          value={toFa(panelStats.order?.counts.all ?? '—')}
          hint={translateText('{{v0}} تحویل‌شده', { v0: toFa(totals.delivered) })}
          icon={ShoppingBag}
          to="/seller/orders"
        />
        <KpiTile
          label={translateText('در انتظار تأیید')}
          value={toFa(totals.waiting)}
          hint={translateText('نیازمند اقدام')}
          icon={Clock3}
          tint="#c2740a"
          to="/seller/orders"
        />
        <KpiTile
          label={translateText('در حال پردازش')}
          value={toFa(totals.inProgress)}
          hint={translateText('آماده‌سازی/ارسال')}
          icon={TrendingUp}
          tint="#2563eb"
          to="/seller/orders"
        />
        <KpiTile
          label={translateText('محصولات')}
          value={toFa(panelStats.product?.counts.all ?? '—')}
          hint={translateText('{{v0}} کم‌موجود', { v0: toFa(totals.lowStock) })}
          icon={Package}
          tint={totals.lowStock ? '#e53935' : undefined}
          to="/seller/products"
        />
        <KpiTile
          label={translateText('فروشگاه‌ها')}
          value={toFa(panelStats.store?.counts.all ?? '—')}
          hint={translateText('زیرمجموعه‌ی شما')}
          icon={Store}
          tint="#7c3aed"
          to="/seller/stores"
        />
      </div>

      {/* ───── نمودار + صف اقدام ───── */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel
          title={translateText('روند فروش ۷ روز اخیر')}
          hint={translateText('مبلغ خالص سفارش‌ها')}
          icon={TrendingUp}
          className="lg:col-span-3"
        >
          <div className="flex items-end justify-between gap-2 h-40">
            {chart.days.map((day) => {
              const height = Math.max(6, Math.round((day.value / chart.max) * 100));
              return (
                <div
                  key={day.key}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                >
                  <span className="text-[9px] muted" dir="ltr">
                    {day.value > 0 ? compactMoney(day.value) : '—'}
                  </span>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${height}%`,
                      background:
                        day.value > 0
                          ? 'linear-gradient(180deg, var(--primary-color), rgba(255,106,0,0.35))'
                          : 'var(--card2)',
                    }}
                    title={`${day.label}: ${compactMoney(day.value)}`}
                  />
                  <span className="text-[10px] muted">{day.label}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel
          title={translateText('نیازمند اقدام شما')}
          hint={translateText('{{v0}} سفارش', { v0: toFa(totals.waiting + totals.inProgress) })}
          icon={Clock3}
          className="lg:col-span-2"
          action={
            <Link
              to="/seller/orders"
              className="text-[11px] font-bold"
              style={{ color: 'var(--primary-color)' }}
            >
              {translateText('همه ')}
            </Link>
          }
        >
          {actionQueue.length === 0 ? (
            <EmptyRow text={translateText('سفارشی در انتظار اقدام نیست.')} />
          ) : (
            <div className="space-y-2">
              {actionQueue.map((sub) => {
                const tone = toneOf(sub.status);
                const busy = busyId === sub._id;
                return (
                  <div key={sub._id} className="card2 rounded-xl p-2.5 flex items-center gap-2">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                      style={{ background: tone.bg, color: tone.color }}
                    >
                      <ShoppingBag size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-xs" dir="ltr">
                        #{sub.order_number || String(sub._id).slice(-8)}
                      </b>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] muted">
                        <span
                          className="shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 font-black"
                          style={{ background: tone.bg, color: tone.color }}
                        >
                          {statusFa(sub.status)}
                        </span>
                        <span className="truncate">{formatPrice(netOf(sub))}</span>
                      </div>
                    </div>
                    {sub.status === 'awaiting_approval' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => approve(sub._id)}
                        className="btn-yellow !py-1.5 !px-2 text-[11px] flex items-center gap-1 shrink-0 whitespace-nowrap disabled:opacity-60"
                      >
                        <Check size={12} />
                        {translateText(' تأیید ')}
                      </button>
                    )}
                    {sub.status === 'preparing' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => nextStatus(sub._id, 'ready_to_ship')}
                        className="btn-yellow !py-1.5 !px-2 text-[11px] shrink-0 whitespace-nowrap disabled:opacity-60"
                      >
                        {translateText('آماده ارسال ')}
                      </button>
                    )}
                    {sub.status === 'ready_to_ship' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => nextStatus(sub._id, 'shipped')}
                        className="btn-yellow !py-1.5 !px-2 text-[11px] shrink-0 whitespace-nowrap disabled:opacity-60"
                      >
                        {translateText('ثبت ارسال ')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* ───── محصولات و فروشگاه‌ها ───── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={translateText('محصولات اخیر')}
          hint={translateText('{{v0}} کالا', { v0: toFa(panelStats.product?.counts.all ?? '—') })}
          icon={Package}
          action={
            <Link
              to="/seller/products"
              className="text-[11px] font-bold"
              style={{ color: 'var(--primary-color)' }}
            >
              {translateText('مدیریت ')}
            </Link>
          }
        >
          {products.length === 0 ? (
            <EmptyRow text={translateText('هنوز محصولی ثبت نکرده‌اید.')} />
          ) : (
            <div className="space-y-2">
              {products.slice(0, 5).map((product) => {
                const stock = Number(product.stock ?? 0);
                return (
                  <Link
                    key={product._id}
                    to={`/seller/products/${product._id}`}
                    className="card2 rounded-xl p-2 flex items-center gap-2.5 hover:opacity-90"
                  >
                    <StorageImageComponent
                      file={productImages(product)[0]}
                      alt={product.name}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      compact
                    />
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-xs">{product.name}</b>
                      <span className="text-[10px] muted truncate block">
                        {translateText('موجودی: ')}
                        {toFa(stock)}
                        {stock <= 3 && (
                          <span
                            className="ms-1 inline-flex items-center gap-0.5"
                            style={{ color: '#e53935' }}
                          >
                            <AlertTriangle size={10} />
                            {translateText(' کم‌موجود ')}
                          </span>
                        )}
                      </span>
                    </div>
                    <ArrowLeft size={13} className="shrink-0 muted" />
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel
          title={translateText('فروشگاه‌های من')}
          hint={translateText('{{v0}} فروشگاه', { v0: toFa(panelStats.store?.counts.all ?? '—') })}
          icon={Store}
          action={
            <Link
              to="/seller/stores"
              className="text-[11px] font-bold"
              style={{ color: 'var(--primary-color)' }}
            >
              {translateText('مدیریت ')}
            </Link>
          }
        >
          {stores.length === 0 ? (
            <EmptyRow text={translateText('هنوز فروشگاهی نساخته‌اید.')} />
          ) : (
            <div className="space-y-2">
              {stores.slice(0, 4).map((store) => {
                const id = getId(store);
                const active = store.status === 'ENABLE';
                return (
                  <div key={id} className="card2 rounded-xl p-2.5 flex items-center gap-2.5">
                    <span
                      className="h-10 w-10 shrink-0 overflow-hidden rounded-lg"
                      style={{ background: 'var(--card)' }}
                    >
                      <StorageImageComponent
                        file={store.profile_image_id}
                        alt={store.name}
                        className="h-full w-full object-cover"
                        compact
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-xs">{store.name}</b>
                      <span className="text-[10px] muted flex items-center gap-1">
                        <BadgeCheck
                          size={10}
                          style={{ color: active ? '#17994f' : 'var(--muted)' }}
                        />
                        {statusFa(store.status)}
                      </span>
                    </div>
                    <Link
                      to={`/store/${id}`}
                      className="btn-ghost !p-1.5"
                      title={translateText('مشاهده صفحه فروشگاه')}
                    >
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* ───── دسترسی سریع ───── */}
      <Panel
        title={translateText('دسترسی سریع')}
        hint={translateText('بخش‌های پنل فروشنده')}
        icon={ExternalLink}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="card2 rounded-xl p-3 flex items-center gap-2.5 transition-transform hover:-translate-y-0.5"
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                style={{ background: 'var(--card)' }}
              >
                <link.icon size={15} style={{ color: 'var(--primary-color)' }} />
              </span>
              <div className="min-w-0">
                <b className="block truncate text-xs">{link.label}</b>
                <span className="text-[10px] muted truncate block">{link.hint}</span>
              </div>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export default CounterPage;
