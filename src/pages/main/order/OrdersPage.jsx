import { CancellationInfo } from '../../../components/orders/OrderPartsComponent';
import {
  formatOrderPrice as formatPrice,
  formatCompactOrderPrice,
  orderItemName,
  orderItemUnitPrice,
} from '../../../utils/helpers/order';
import { t as translateText } from '../../../i18n/runtime.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Banknote,
  ChevronDown,
  ClipboardList,
  CreditCard,
  ExternalLink,
  MapPin,
  Package,
  PackageCheck,
  ReceiptText,
  RotateCcw,
  Store,
  Truck,
} from 'lucide-react';

import { useShop } from '../../../contexts/ShopContext';
import { authHeaders } from '../../../utils/helpers/storage';
import { toFa, formatDateTime, statusFa } from '../../../utils/helpers/format';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

/* رنگ وضعیت — سبز (نهایی) / کهربایی (در جریان) / قرمز (لغو) */
function statusTone(status = '') {
  if (['paid', 'delivered', 'finalized'].includes(status)) return '#17994f';
  if (['cancelled', 'rejected', 'failed'].includes(status)) return '#e53935';
  return '#ff6a00';
}

const FILTERS = [
  { key: 'all', label: translateText('همه سفارش‌ها') },
  { key: 'pending', label: translateText('در انتظار پرداخت') },
  { key: 'paid', label: translateText('پرداخت‌شده') },
];

function Chip({ tone, children }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black"
      style={{ background: `color-mix(in srgb, ${tone} 15%, transparent)`, color: tone }}
    >
      {children}
    </span>
  );
}

function SkeletonOrder() {
  return (
    <div className="card rounded-2xl p-4" aria-hidden="true">
      <div className="flex items-center justify-between gap-3">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-5 w-24" />
      </div>
      <div className="skeleton mt-3 h-3 w-2/3" />
      <div className="skeleton mt-2 h-3 w-1/2" />
    </div>
  );
}

function SummaryTile({ icon: Icon, value, label }) {
  return (
    <div
      className="flex min-w-0 items-center gap-2.5 rounded-2xl px-3 py-2.5"
      style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
        style={{
          background: 'color-mix(in srgb, var(--primary-color) 16%, transparent)',
          color: 'var(--accent-text)',
        }}
      >
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-black leading-tight">{value}</div>
        <div className="truncate text-[10px] muted">{label}</div>
      </div>
    </div>
  );
}

function OrdersPage() {
  const { user } = useShop();
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [payBusy, setPayBusy] = useState('');

  const load = useCallback(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    axios
      .get(`${API}/orders?limit=50`, authHeaders())
      .then((res) => {
        const body = res.data?.body;
        setOrders(Array.isArray(body) ? body : body?.data || []);
      })
      .catch(() => setError(translateText('دریافت سفارش‌ها ناموفق بود.')))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const payStatusOf = (order) => order.payment?.status || order.payment_status || 'pending';

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((order) => {
      const status = payStatusOf(order);
      if (filter === 'paid') return status === 'paid';
      return status !== 'paid';
    });
  }, [orders, filter]);

  const stats = useMemo(() => {
    const paid = orders.filter((o) => payStatusOf(o) === 'paid');
    const spent = paid.reduce(
      (sum, o) => sum + Number(o.final_amount ?? o.total_amount ?? o.amount ?? 0),
      0,
    );
    return { count: orders.length, paid: paid.length, spent };
  }, [orders]);

  const payOrder = (orderId) => {
    setPayBusy(orderId);
    axios
      .post(`${API}/order/${orderId}/pay/`, {}, authHeaders())
      .then((res) => {
        const body = res.data?.body || {};
        const url =
          body.pay_url ||
          body.url ||
          (body.authority ? `https://sandbox.zarinpal.com/pg/StartPay/${body.authority}` : null);
        if (url && /^https?:/.test(url)) window.location.href = url;
        else toast.info(translateText('درخواست پرداخت ارسال شد'));
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || translateText('خطا در شروع پرداخت')),
      )
      .finally(() => setPayBusy(''));
  };

  /* ---------------- بدون کاربر ---------------- */
  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <div className="card rounded-3xl p-10 text-center">
          <span
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: 'color-mix(in srgb, var(--primary-color) 16%, transparent)' }}
          >
            <ReceiptText size={28} style={{ color: 'var(--accent-text)' }} />
          </span>
          <h1 className="mt-4 text-base font-black">
            {translateText('برای دیدن سفارش‌ها وارد شوید')}
          </h1>
          <p className="mt-2 text-xs muted">
            {translateText('وضعیت سفارش‌ها، مرسوله‌ها و پرداخت‌ها در این بخش نمایش داده می‌شود.')}
          </p>
          <Link to="/auth/pre" className="btn-primary mt-5 inline-flex items-center gap-2">
            {translateText('ورود به حساب ')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-5 sm:px-4 sm:py-6">
      {/* هدر */}
      <header className="card rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
              style={{ background: 'color-mix(in srgb, var(--primary-color) 16%, transparent)' }}
            >
              <ReceiptText size={20} style={{ color: 'var(--accent-text)' }} />
            </span>
            <div>
              <h1 className="flex items-center gap-2 text-lg font-black sm:text-xl">
                {translateText('سفارش‌های من ')}
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-black"
                  style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
                >
                  {toFa(stats.count)}
                </span>
              </h1>
              <p className="mt-0.5 text-[11px] muted">
                {translateText('وضعیت پرداخت، مرسوله‌ها و فاکتور هر سفارش')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={load}
            className="btn-ghost inline-flex items-center justify-center gap-1.5 !py-2 text-xs"
          >
            <RotateCcw size={14} />
            {translateText('بروزرسانی ')}
          </button>
        </div>

        {stats.count > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <SummaryTile
              icon={Package}
              value={toFa(stats.count)}
              label={translateText('کل سفارش‌ها')}
            />
            <SummaryTile
              icon={PackageCheck}
              value={toFa(stats.paid)}
              label={translateText('پرداخت‌شده')}
            />
            <SummaryTile
              icon={Banknote}
              value={formatCompactOrderPrice(stats.spent)}
              label={translateText('مجموع خرید')}
            />
          </div>
        )}

        {stats.count > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {FILTERS.map((item) => {
              const active = filter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  aria-pressed={active}
                  className="rounded-full px-3 py-1.5 text-[11px] font-bold transition"
                  style={
                    active
                      ? { background: 'var(--primary-color)', color: 'var(--on-primary' }
                      : { background: 'var(--card2)', border: '1px solid var(--border)' }
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* لیست */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <>
            <SkeletonOrder />
            <SkeletonOrder />
          </>
        ) : error ? (
          <div className="card rounded-3xl p-10 text-center">
            <p className="text-sm muted">{error}</p>
            <button
              type="button"
              onClick={load}
              className="btn-primary mt-4 inline-flex items-center gap-2"
            >
              <RotateCcw size={15} />
              {translateText('تلاش دوباره ')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card rounded-3xl px-6 py-14 text-center">
            <span
              className="mx-auto grid h-16 w-16 place-items-center rounded-2xl"
              style={{ background: 'color-mix(in srgb, var(--primary-color) 16%, transparent)' }}
            >
              <ClipboardList size={28} style={{ color: 'var(--accent-text)' }} />
            </span>
            <h2 className="mt-4 text-base font-black">
              {orders.length === 0
                ? translateText('هنوز سفارشی ثبت نکرده‌اید')
                : translateText('سفارشی با این فیلتر نیست')}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-6 muted">
              {orders.length === 0
                ? translateText(
                    'اولین خریدتان را انجام دهید تا وضعیت سفارش و مرسوله‌ها اینجا نمایش داده شود.',
                  )
                : translateText('فیلتر را عوض کنید تا سفارش‌های دیگر را ببینید.')}
            </p>
            {orders.length === 0 ? (
              <Link to="/products" className="btn-primary mt-5 inline-flex items-center gap-2">
                {translateText('شروع خرید ')}
              </Link>
            ) : (
              <button type="button" onClick={() => setFilter('all')} className="btn-ghost mt-5">
                {translateText('نمایش همه سفارش‌ها ')}
              </button>
            )}
          </div>
        ) : (
          filtered.map((order) => {
            const payStatus = payStatusOf(order);
            const isPaid = payStatus === 'paid';
            const subs = order.sub_orders || [];
            const isOpen = expanded === order._id;
            const itemCount = subs.reduce((sum, sub) => sum + (sub.items?.length || 0), 0);
            const preview = subs
              .flatMap((sub) => sub.items || [])
              .slice(0, 2)
              .map((item) => orderItemName(item))
              .filter(Boolean);

            return (
              <article key={order._id} className="card overflow-hidden rounded-2xl">
                {/* ردیف اصلی */}
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : order._id)}
                  aria-expanded={isOpen}
                  className="flex w-full flex-col gap-3 p-4 text-start transition hover:bg-black/[0.03] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                      style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
                    >
                      <Package size={17} style={{ color: 'var(--accent-text)' }} />
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black" dir="ltr">
                          #{order.order_number || String(order._id).slice(-8)}
                        </span>
                        <Chip tone={statusTone(payStatus)}>
                          {isPaid ? translateText('پرداخت‌شده') : translateText('در انتظار پرداخت')}
                        </Chip>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] muted">
                        <span>{formatDateTime(order.created_at)}</span>
                        <span>•</span>
                        <span>
                          {toFa(subs.length)}
                          {translateText(' مرسوله')}
                        </span>
                        <span>•</span>
                        <span>
                          {toFa(itemCount)}
                          {translateText(' قلم کالا')}
                        </span>
                        {order.payment?.ref_id && (
                          <>
                            <span>•</span>
                            <span dir="ltr">
                              {translateText('رهگیری: ')}
                              {order.payment.ref_id}
                            </span>
                          </>
                        )}
                      </div>
                      {preview.length > 0 && (
                        <p className="mt-1 line-clamp-1 text-[11px] muted">
                          {preview.join(translateText('، '))}
                          {itemCount > preview.length ? translateText(' و …') : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <div className="text-end">
                      <div className="text-base font-black" style={{ color: 'var(--accent-text)' }}>
                        {formatPrice(order.final_amount ?? order.total_amount ?? order.amount)}
                      </div>
                      {Number(order.total_discount) > 0 && (
                        <div className="mt-0.5 text-[10px] muted">
                          {translateText('تخفیف: ')}
                          {formatPrice(order.total_discount)}
                        </div>
                      )}
                    </div>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {/* جزئیات */}
                {isOpen && (
                  <div className="border-t border-theme p-4">
                    {/* اکشن‌ها */}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {!isPaid && (
                        <button
                          type="button"
                          onClick={() => payOrder(order._id)}
                          disabled={payBusy === order._id}
                          className="btn-primary inline-flex items-center gap-1.5 !py-2 text-xs disabled:opacity-60"
                        >
                          <CreditCard size={14} />
                          {payBusy === order._id
                            ? translateText('در حال انتقال…')
                            : translateText('پرداخت آنلاین')}
                        </button>
                      )}
                      <Link
                        to={`/order/${order._id}`}
                        className="btn-ghost inline-flex items-center gap-1.5 !py-2 text-xs"
                      >
                        <ExternalLink size={14} />
                        {translateText('مشاهده فاکتور ')}
                      </Link>
                    </div>

                    {/* مرسوله‌ها */}
                    <div className="space-y-2">
                      {subs.map((sub) => (
                        <div
                          key={sub._id}
                          className="rounded-2xl p-3"
                          style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold muted">
                                <Store size={12} />
                                {translateText('مرسوله ')}
                              </span>
                              <span className="text-xs font-black" dir="ltr">
                                #{sub.order_number || String(sub._id).slice(-6)}
                              </span>
                              <Chip tone={statusTone(sub.status)}>{statusFa(sub.status)}</Chip>
                            </div>
                            <span
                              className="text-xs font-black"
                              style={{ color: 'var(--accent-text)' }}
                            >
                              {formatPrice(
                                (sub.amount ?? sub.subtotal ?? 0) - (sub.discount_applied ?? 0),
                              )}
                            </span>
                          </div>

                          {(sub.items || []).length > 0 && (
                            <ul className="mt-2 divide-y" style={{ borderColor: 'var(--border)' }}>
                              {sub.items.map((item, index) => (
                                <li
                                  key={`${sub._id}-${index}`}
                                  className="flex items-center justify-between gap-2 py-1.5 text-[11px]"
                                  style={{ borderColor: 'var(--border)' }}
                                >
                                  <span className="min-w-0 flex-1 truncate">
                                    {orderItemName(item)}
                                  </span>
                                  <span className="shrink-0 muted">
                                    ×{toFa(item.quantity ?? 1)}
                                  </span>
                                  {(item.unit_price != null || item.price?.amount != null) && (
                                    <span className="w-24 shrink-0 text-end font-bold">
                                      {formatPrice(orderItemUnitPrice(item))}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}

                          <CancellationInfo sub={sub} />
                          {sub.shipping_address && (
                            <p
                              className="mt-2 flex items-start gap-1 border-t pt-2 text-[10px] muted"
                              style={{ borderColor: 'var(--border)' }}
                            >
                              <MapPin size={11} className="mt-0.5 shrink-0" />
                              <span className="leading-5">
                                {[
                                  sub.shipping_address.province,
                                  sub.shipping_address.city,
                                  sub.shipping_address.full_address,
                                ]
                                  .filter(Boolean)
                                  .join(translateText('، '))}
                              </span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* جمع سفارش */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-theme px-3 py-2 text-[11px]">
                      <span className="inline-flex items-center gap-1 muted">
                        <Truck size={13} />
                        {Number(order.total_discount) > 0
                          ? translateText('با احتساب تخفیف')
                          : translateText('مبلغ نهایی')}
                      </span>
                      <span className="font-black">
                        {formatPrice(order.final_amount ?? order.total_amount ?? order.amount)}
                      </span>
                    </div>

                    {order.customer_notes && (
                      <p
                        className="mt-2 rounded-xl px-3 py-2 text-[11px] muted"
                        style={{ background: 'var(--card2)' }}
                      >
                        {translateText('یادداشت شما: ')}
                        {order.customer_notes}
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

export default OrdersPage;
