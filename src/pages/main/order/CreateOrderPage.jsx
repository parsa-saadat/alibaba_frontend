import { formatOrderPrice } from '../../../utils/helpers/order';
import { t as translateText } from '../../../i18n/runtime.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Home,
  Loader2,
  Lock,
  MapPin,
  Package,
  Plus,
  ReceiptText,
  ShieldCheck,
  StickyNote,
  Store,
  Trash2,
} from 'lucide-react';

import { useShop } from '../../../contexts/ShopContext';
import { authHeaders } from '../../../utils/helpers/storage';
import StorageImageComponent from '../../../components/common/StorageImageComponent';
import AddressFormModalComponent from '../../../components/address/AddressFormModalComponent';
import { formatPrice, finalPrice, toFa, productImages } from '../../../utils/helpers/format';
import { getItemQuantity, getCartCurrency } from '../../../utils/helpers/cart';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

const EMPTY = {
  full_name: '',
  province: '',
  city: '',
  neighborhood: '',
  full_address: '',
  building_number: '',
  unit: '',
  postal_code: '',
};

const STEPS = [
  { key: 'address', label: translateText('آدرس و ثبت سفارش') },
  { key: 'pay', label: translateText('پرداخت') },
  { key: 'done', label: translateText('پایان') },
];

/* رنگ‌ها فقط از متغیرهای تم می‌آیند تا در تم روشن و تاریک یکسان باشد */
const ACCENT = { background: 'var(--primary-color)', color: 'var(--on-primary' };
const ACCENT_SOFT = {
  background: 'color-mix(in srgb, var(--primary-color) 16%, transparent)',
  color: 'var(--accent-text)',
};

function Stepper({ current = 0 }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px]">
      {STEPS.map((step, index) => {
        const active = index === current;
        const done = index < current;
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-black transition"
              style={
                active || done ? ACCENT : { background: 'var(--card2)', color: 'var(--muted)' }
              }
            >
              {done ? <Check size={12} /> : toFa(index + 1)}
            </span>
            <span className={active ? 'font-black' : 'muted'}>{step.label}</span>
            {index < STEPS.length - 1 && (
              <ChevronLeft size={13} className="logical-icon muted opacity-60" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function SectionCard({ icon: Icon, title, hint, action = null, children, className = '' }) {
  return (
    <section className={`card rounded-3xl p-4 sm:p-5 ${className}`}>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl"
            style={ACCENT_SOFT}
          >
            <Icon size={17} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-black sm:text-base">{title}</h2>
            {hint && <p className="mt-0.5 text-[11px] muted">{hint}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, required = false, children, className = '' }) {
  return (
    <label className={`block text-[11px] ${className}`}>
      <span className="mb-1 flex items-center gap-1 font-bold muted">
        {label}
        {required && <span style={{ color: 'var(--danger-color, #e53935)' }}>*</span>}
      </span>
      {children}
    </label>
  );
}

function CreateOrderPage() {
  const navigate = useNavigate();
  const { user, refreshCart } = useShop();

  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [savingAddress, setSavingAddress] = useState(false);
  /* بعد از ثبت سفارش (مرحله‌ی ۱) پر می‌شود و صفحه‌ی پرداخت (مرحله‌ی ۲) نشان داده می‌شود */
  const [placed, setPlaced] = useState(null);
  const [payingNow, setPayingNow] = useState(false);

  const load = useCallback(async () => {
    if (!user) return setLoading(false);
    try {
      const [a, c] = await Promise.all([
        axios.get(`${API}/users/${user._id}/address`, authHeaders()),
        axios.get(`${API}/user/${user._id}/cart?limit=100`, authHeaders()),
      ]);

      const list = Array.isArray(a.data.body) ? a.data.body : a.data.body?.data || [];
      setAddresses(list);
      const def = list.find((x) => x.is_default || x.address?.is_default) || list[0];
      setSelected((prev) => prev || def?._id || '');

      const raw = c.data.body;
      const rows = Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
      const detailed = await Promise.all(
        rows.map(async (row) => {
          const pid = row.product_id ?? row.product?._id ?? row.product;
          const p = await axios.get(`${API}/product/${pid}`).catch(() => null);
          if (!p?.data?.body) return null;
          return { ...row, quantity: getItemQuantity(row), product: p.data.body };
        }),
      );
      setItems(detailed.filter(Boolean));
    } catch (err) {
      console.error('Error loading checkout:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const subtotal = useMemo(
    () => items.reduce((sum, row) => sum + finalPrice(row.product) * (row.quantity || 0), 0),
    [items],
  );
  const cartCode = getCartCurrency(items);
  const itemCount = useMemo(
    () => items.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
    [items],
  );

  /* مرحله‌ی ۱: فقط ثبت سفارش (بدون پرداخت) */
  const submitOrder = async () => {
    if (!cartCode)
      return toast.error(translateText('ارز اقلام سبد یکسان نیست؛ سبد را دوباره بارگذاری کنید.'));
    if (!selected) return toast.error(translateText('یک آدرس انتخاب کنید'));
    if (!items.length) return toast.error(translateText('سبد خرید خالی است'));
    setPaying(true);
    try {
      const res = await axios.post(
        `${API}/order`,
        { address_id: selected, note: note || undefined },
        authHeaders(),
      );
      const body = res.data.body || {};
      const parent = body.parent || body;
      if (!parent?._id) throw new Error(translateText('شناسه‌ی سفارش دریافت نشد'));
      setPlaced({
        id: parent._id,
        number: parent.order_number,
        amount: parent.final_amount ?? parent.total_amount,
        count: itemCount,
      });
      refreshCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success(translateText('سفارش شما ثبت شد؛ حالا پرداخت را انجام دهید'));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || translateText('خطا در ثبت سفارش'));
    } finally {
      setPaying(false);
    }
  };

  /* مرحله‌ی ۲: پرداخت سفارش ثبت‌شده */
  const startPayment = async () => {
    if (!placed?.id) return;
    setPayingNow(true);
    try {
      const pay = await axios.post(`${API}/order/${placed.id}/pay/`, {}, authHeaders());
      const body = pay.data.body || {};
      const url =
        body.pay_url ||
        body.url ||
        body.payment_url ||
        (body.authority ? `https://sandbox.zarinpal.com/pg/StartPay/${body.authority}` : null);
      if (url && /^https?:/.test(url)) {
        window.location.href = url;
        return;
      }
      toast.info(translateText('درخواست پرداخت ثبت شد؛ وضعیت را در «سفارش‌های من» ببینید'));
      navigate(`/orders/${placed.id}`);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          translateText(
            'اتصال به درگاه ناموفق بود؛ از «سفارش‌های من» می‌توانید دوباره پرداخت کنید',
          ),
      );
    } finally {
      setPayingNow(false);
    }
  };

  /* ---------- حالت‌های خالی/بارگذاری ---------- */

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="card rounded-3xl p-8 text-center">
          <span
            className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
            style={ACCENT_SOFT}
          >
            <Lock size={24} />
          </span>
          <h1 className="mt-4 text-lg font-black">{translateText('برای تسویه حساب وارد شوید')}</h1>
          <p className="mt-2 text-xs muted">
            {translateText(
              'برای ثبت سفارش و پرداخت، ابتدا با شماره موبایل خود وارد حساب کاربری شوید. ',
            )}
          </p>
          <Link to="/auth/pre" className="btn-yellow mt-5 inline-flex">
            {translateText('ورود به حساب ')}
          </Link>
        </div>
      </main>
    );
  }

  if (placed) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-3 py-6 sm:px-4 sm:py-8">
        <header className="card rounded-3xl p-4 sm:p-5">
          <Stepper current={1} />
        </header>

        <section className="card rounded-3xl p-6 text-center sm:p-8">
          <span
            className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: 'rgba(23,153,79,0.14)', color: '#17994f' }}
          >
            <CheckCircle2 size={26} />
          </span>
          <h1 className="mt-4 text-lg font-black sm:text-xl">
            {translateText('سفارش شما ثبت شد')}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-xs leading-6 muted">
            {translateText(
              'سفارش با موفقیت ثبت شد. برای نهایی شدن و ارسال به فروشنده، پرداخت را انجام دهید. اگر الان نمی‌خواهید پرداخت کنید، بعداً هم از بخش «سفارش‌های من» می‌توانید پرداخت کنید. ',
            )}
          </p>

          <dl
            className="mx-auto mt-5 max-w-sm space-y-2 rounded-2xl p-4 text-xs"
            style={{ background: 'var(--card2)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <dt className="muted">{translateText('شماره سفارش')}</dt>
              <dd className="font-black" dir="ltr">
                {placed.number || String(placed.id).slice(-8)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="muted">{translateText('تعداد اقلام')}</dt>
              <dd className="font-bold">
                {toFa(placed.count)}
                {translateText(' عدد')}
              </dd>
            </div>
            <div
              className="flex items-center justify-between gap-2 border-t pt-2"
              style={{ borderColor: 'var(--border)' }}
            >
              <dt className="font-bold">{translateText('مبلغ قابل پرداخت')}</dt>
              <dd className="text-base font-black text-yellow">
                {placed.amount == null ? '—' : formatOrderPrice(placed.amount)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={startPayment}
              disabled={payingNow}
              className="btn-yellow inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {payingNow ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <CreditCard size={17} />
              )}
              {payingNow
                ? translateText('در حال انتقال به درگاه…')
                : translateText('پرداخت آنلاین')}
            </button>
            <Link
              to={`/orders/${placed.id}`}
              className="btn-ghost inline-flex items-center justify-center gap-2"
            >
              {translateText('پرداخت بعداً و مشاهده سفارش ')}
            </Link>
          </div>

          <p className="mt-4 flex items-start justify-center gap-1.5 text-[10px] leading-5 muted">
            <Lock size={12} className="mt-0.5 shrink-0" />
            {translateText(
              'پرداخت از طریق درگاه بانکی امن انجام می‌شود و اطلاعات کارت شما در سایت ذخیره نمی‌شود. ',
            )}
          </p>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4" aria-busy="true">
        <div className="skeleton h-28 rounded-3xl" />
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="skeleton h-56 rounded-3xl" />
            <div className="skeleton h-32 rounded-3xl" />
          </div>
          <div className="skeleton h-72 rounded-3xl" />
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="card rounded-3xl p-8 text-center">
          <span
            className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
            style={ACCENT_SOFT}
          >
            <Package size={24} />
          </span>
          <h1 className="mt-4 text-lg font-black">{translateText('سبد خرید شما خالی است')}</h1>
          <p className="mt-2 text-xs muted">
            {translateText(
              'برای تسویه حساب، ابتدا کالاهای مورد نظرتان را به سبد خرید اضافه کنید. ',
            )}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link to="/products" className="btn-yellow">
              {translateText('شروع خرید ')}
            </Link>
            <Link to="/favorites" className="btn-ghost">
              {translateText('علاقه‌مندی‌ها ')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-3 py-5 sm:px-4 sm:py-6">
      {/* ───── هدر ───── */}
      <header className="card relative overflow-hidden rounded-3xl p-4 sm:p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full blur-3xl"
          style={{ background: 'color-mix(in srgb, var(--primary-color) 12%, transparent)' }}
        />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <nav className="flex flex-wrap items-center gap-1.5 text-[11px] muted">
              <Link to="/" className="transition hover:opacity-70">
                {translateText('خانه ')}
              </Link>
              <ChevronLeft className="logical-icon" size={12} />
              <Link to="/cart" className="transition hover:opacity-70">
                {translateText('سبد خرید ')}
              </Link>
              <ChevronLeft className="logical-icon" size={12} />
              <span>{translateText('تسویه حساب')}</span>
            </nav>
            <h1 className="mt-2 text-lg font-black sm:text-xl md:text-2xl">
              {translateText('تسویه حساب و ثبت سفارش ')}
            </h1>
            <p className="mt-1 text-xs muted">
              {toFa(itemCount)}
              {translateText(' قلم کالا در ')}
              {toFa(items.length)}
              {translateText(' ردیف — اول سفارش ثبت می‌شود، بعد پرداخت را انجام می‌دهید. ')}
            </p>
          </div>

          <div className="shrink-0">
            <Stepper current={0} />
          </div>
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ───── ستون اصلی ───── */}
        <div className="min-w-0 space-y-4">
          <SectionCard
            icon={MapPin}
            title={translateText('آدرس تحویل')}
            hint={
              addresses.length
                ? translateText('یکی از آدرس‌های ثبت‌شده را انتخاب کنید')
                : translateText('برای ادامه، یک آدرس ثبت کنید')
            }
            action={
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="btn-ghost inline-flex items-center gap-1.5 !px-3 !py-1.5 text-[11px] sm:text-xs"
              >
                <Plus size={14} />
                {translateText('آدرس جدید ')}
              </button>
            }
          >
            {addresses.length === 0 ? (
              <div
                className="rounded-2xl p-5 text-center"
                style={{ background: 'var(--card2)', border: '1px dashed var(--border)' }}
              >
                <MapPin size={22} className="mx-auto muted" />
                <p className="mt-2 text-xs muted">
                  {translateText(
                    'هنوز آدرسی ثبت نکرده‌اید. با دکمه‌ی «آدرس جدید» اولین آدرس را اضافه کنید. ',
                  )}
                </p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {addresses.map((a) => {
                  const ad = a.address || a;
                  const active = selected === a._id;
                  const isDefault = a.is_default || ad.is_default;

                  return (
                    <label
                      key={a._id}
                      className="relative flex cursor-pointer gap-2.5 rounded-2xl p-3 transition focus-within:ring-2 focus-within:ring-[var(--primary-color)] focus-within:ring-offset-0"
                      style={{
                        border: `1px solid ${active ? 'var(--primary-color)' : 'var(--border)'}`,
                        background: active
                          ? 'color-mix(in srgb, var(--primary-color) 10%, transparent)'
                          : 'var(--card2)',
                      }}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={active}
                        onChange={() => setSelected(a._id)}
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full transition"
                        style={{
                          border: `1.5px solid ${active ? 'var(--primary-color)' : 'var(--muted)'}`,
                          background: active ? 'var(--primary-color)' : 'transparent',
                          color: 'var(--navy, #0a1736)',
                        }}
                      >
                        {active && <Check size={11} strokeWidth={3.5} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <b className="truncate text-xs">
                            {a.title || ad.full_name || translateText('آدرس')}
                          </b>
                          {isDefault && (
                            <span
                              className="rounded-full px-1.5 py-0.5 text-[9px] font-black"
                              style={ACCENT_SOFT}
                            >
                              {translateText('پیش‌فرض ')}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-[11px] muted">
                          <Home size={11} className="shrink-0" />
                          <span className="truncate">
                            {[ad.province, ad.city, ad.neighborhood]
                              .filter(Boolean)
                              .join(translateText('، '))}
                          </span>
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-5">
                          {ad.full_address}
                          {ad.building_number
                            ? translateText(' — پلاک {{v0}}', { v0: toFa(ad.building_number) })
                            : ''}
                          {ad.unit ? translateText('، واحد {{v0}}', { v0: toFa(ad.unit) }) : ''}
                        </p>
                        {ad.postal_code && (
                          <p className="mt-1 text-[10px] muted" dir="ltr">
                            {toFa(ad.postal_code)}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            icon={Package}
            title={translateText('اقلام سفارش ({{v0}})', { v0: toFa(items.length) })}
            hint={translateText('قیمت‌ها پس از اعمال تخفیف نمایش داده می‌شوند')}
          >
            <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {items.map(({ _id, product, quantity }) => {
                const unit = finalPrice(product);
                return (
                  <li key={_id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-theme">
                      <StorageImageComponent
                        compact
                        file={productImages(product)[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/product/${product._id}`}
                        className="line-clamp-2 text-xs font-bold leading-5 hover:underline sm:text-sm"
                      >
                        {product.name}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] muted">
                        <span className="inline-flex items-center gap-1">
                          <Store size={11} />
                          {product.store_name || translateText('فروشگاه')}
                        </span>
                        <span
                          className="rounded-full px-1.5 py-0.5"
                          style={{ background: 'var(--card2)' }}
                        >
                          {translateText('تعداد: ')}
                          {toFa(quantity)}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-end">
                      <b className="block text-xs font-black text-yellow sm:text-sm">
                        {formatPrice(unit * quantity, product.price?.currency)}
                      </b>
                      <span className="mt-0.5 block text-[10px] muted">
                        {translateText('هر عدد ')}
                        {formatPrice(unit, product.price?.currency)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </SectionCard>

          <SectionCard
            icon={StickyNote}
            title={translateText('یادداشت سفارش')}
            hint={translateText('اختیاری — برای فروشنده')}
          >
            <textarea
              className="input text-xs leading-6"
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={translateText('مثلاً ساعت مناسب تحویل یا توضیح بسته‌بندی…')}
            />
            <div className="mt-1 text-end text-[10px] muted">
              {toFa(note.length)}
              {translateText(' / ۵۰۰')}
            </div>
          </SectionCard>
        </div>

        {/* ───── خلاصه‌ی سفارش ───── */}
        <aside className="space-y-3 lg:sticky lg:top-28">
          <section className="card rounded-3xl p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-2xl" style={ACCENT_SOFT}>
                <ReceiptText size={17} />
              </span>
              <h2 className="text-sm font-black sm:text-base">{translateText('خلاصه‌ی سفارش')}</h2>
            </div>

            <dl className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="muted">{translateText('تعداد اقلام')}</dt>
                <dd className="font-bold">
                  {toFa(itemCount)}
                  {translateText(' عدد')}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="muted">{translateText('جمع کالاها')}</dt>
                <dd className="font-bold">{cartCode ? formatPrice(subtotal, cartCode) : '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="muted">{translateText('تخفیف')}</dt>
                <dd className="font-bold" style={{ color: '#17994f' }}>
                  {formatPrice(0, cartCode || undefined)}
                </dd>
              </div>
            </dl>

            <div
              className="mt-3 flex items-center justify-between gap-2 border-t pt-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="text-xs font-bold">{translateText('قابل پرداخت')}</span>
              <b className="text-base font-black text-yellow sm:text-lg">
                {cartCode ? formatPrice(subtotal, cartCode) : '—'}
              </b>
            </div>

            <p className="mt-3 text-[11px] leading-6 muted">
              {translateText(
                'مبلغ نمایش داده‌شده برآورد است؛ مبلغ نهایی پرداخت با ریال هنگام ثبت سفارش محاسبه می‌شود.',
              )}
            </p>
            {!cartCode && (
              <p role="alert" className="mt-2 text-xs text-red-500">
                {translateText('ارز اقلام سبد یکسان نیست؛ سبد را دوباره بارگذاری کنید.')}
              </p>
            )}
            <button
              type="button"
              disabled={paying || !selected || !cartCode}
              onClick={submitOrder}
              className="btn-yellow mt-4 flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paying ? <Loader2 size={17} className="animate-spin" /> : <ReceiptText size={17} />}
              {paying ? translateText('در حال ثبت سفارش…') : translateText('ثبت سفارش')}
            </button>

            {!selected && (
              <p className="mt-2 text-center text-[11px]" style={{ color: '#c2740a' }}>
                {translateText('برای ادامه، یک آدرس تحویل انتخاب کنید. ')}
              </p>
            )}

            <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-5 muted">
              <Lock size={12} className="mt-0.5 shrink-0" />
              {translateText(
                'با زدن «ثبت سفارش»، سفارش ثبت می‌شود و در مرحله‌ی بعد پرداخت را انجام می‌دهید؛ پرداخت از طریق درگاه بانکی امن است. ',
              )}
            </p>
          </section>

          <section className="card rounded-3xl p-4">
            <ul className="space-y-2.5 text-[11px]">
              <li className="flex items-start gap-2">
                <ShieldCheck size={14} className="mt-0.5 shrink-0" style={{ color: '#17994f' }} />
                <span>
                  <b className="block">{translateText('b2b.noGuarantee')}</b>
                  <span className="muted">{translateText('b2b.productTerms')}</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: '#17994f' }} />
                <span>
                  <b className="block">{translateText('b2b.noReturn')}</b>
                  <span className="muted">{translateText('b2b.responsibilityDesc')}</span>
                </span>
              </li>
            </ul>

            <Link
              to="/cart"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold"
              style={{ color: 'var(--accent-text)' }}
            >
              <ArrowLeft size={13} />
              {translateText('بازگشت به سبد خرید ')}
            </Link>
          </section>
        </aside>
      </div>

      {/* پاپ‌آپ ثبت نشانی — همان تجربه‌ی بخش «نشانی‌های من» */}
      <AddressFormModalComponent
        open={showForm}
        onClose={() => setShowForm(false)}
        userId={user?._id}
        makeDefault={addresses.length === 0}
        onSaved={() => load()}
      />
    </main>
  );
}

export default CreateOrderPage;
