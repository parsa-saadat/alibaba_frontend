import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Check,
  Package,
  Store,
  ImageIcon,
  Clock,
  Sparkles,
  Loader2,
  RefreshCw,
  Crown,
  Timer,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
} from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import { useShop } from '../../contexts/ShopContext';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
const PAY_PREFIX = import.meta.env.VITE_PAYMENT_PREFIX || '';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
const faNumber = new Intl.NumberFormat('fa-IR');
const fa = (n) => faNumber.format(Number(n) || 0);
const fa2 = (n) => String(n).padStart(2, '0').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

/** تبدیل هر مبلغ به تومان */
const toToman = (amount, currency) =>
  Math.round(currency === 'IRR' ? Number(amount) / 10 : Number(amount));

const ERROR_FA = {
  'This plan is already active': 'این پلن هم‌اکنون برای شما فعال است',
  'Plan is not active': 'این پلن دیگر در دسترس نیست',
  'Plan not found': 'پلن پیدا نشد',
  'Payment gateway is not available': 'درگاه پرداخت در دسترس نیست، کمی بعد دوباره تلاش کنید',
  'Payment configuration is incomplete': 'پیکربندی درگاه پرداخت ناقص است. با پشتیبانی تماس بگیرید',
  'Failed to generate payment link': 'ساخت لینک پرداخت ناموفق بود',
  'Payment was cancelled by user': 'پرداخت توسط شما لغو شد',
  'Payment not found': 'تراکنش پیدا نشد',
  'Authentication required': 'ابتدا وارد حساب کاربری شوید',
};

const faError = (err, fallback) => {
  const msg = err?.response?.data?.message;
  return ERROR_FA[msg] || (typeof msg === 'string' ? msg : '') || fallback;
};

function durationLabel(days) {
  if (days === null || days === undefined) return 'نامحدود';
  if (days === 30) return 'ماهانه';
  if (days === 90) return '۳ ماهه';
  if (days === 180) return '۶ ماهه';
  if (days === 365) return 'سالانه';
  return `${fa(days)} روزه`;
}

/** تخفیف فقط وقتی معتبر است که درصد > 0 و تاریخ انقضا نگذشته باشد */
function getPricing(plan, now) {
  const currency = plan.price?.currency || 'IRR';
  const amount = toToman(plan.price?.amount || 0, currency);
  const d = plan.discount;
  const pct = Number(d?.percentage) || 0;
  const expires = d?.expirationDate ? new Date(d.expirationDate) : null;
  const valid =
    pct > 0 && expires && !Number.isNaN(expires.getTime()) && expires.getTime() > now;
  const final = valid ? Math.round((amount * (100 - pct)) / 100) : amount;
  return { amount, final, hasDiscount: valid, pct, expires };
}

/** اگر این پلن الان برای کاربر فعال است، تاریخ پایانش را برمی‌گرداند */
function getActiveInfo(user, plan) {
  const sp = user?.seller_plan;
  if (!sp?.plan_id) return null;
  if (String(sp.plan_id?._id ?? sp.plan_id) !== String(plan._id)) return null;
  const start = new Date(sp.start_at).getTime();
  if (!Number.isFinite(start)) return null;
  if (plan.duration_days === null) return { expires: null };
  const expires = start + plan.duration_days * 86400000;
  return expires > Date.now() ? { expires: new Date(expires) } : null;
}

/** زمان فعلی که هر ثانیه به‌روز می‌شود (فقط وقتی active باشد) */
function useNow(active) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

/* ------------------------------------------------------------------ */
/* Parts                                                                */
/* ------------------------------------------------------------------ */
function Feature({ icon: Icon, children }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span
        className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
        style={{ background: 'var(--card2)', color: 'var(--primary-color)' }}
      >
        <Icon size={15} />
      </span>
      <span>{children}</span>
    </li>
  );
}

function Countdown({ expires, now }) {
  const diff = Math.max(0, expires.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const clock = `${fa2(hours)}:${fa2(minutes)}:${fa2(seconds)}`;

  return (
    <div className="mt-2 flex items-center gap-1.5 text-[11px] muted">
      <Timer size={12} />
      <span>پایان تخفیف تا</span>
      {days > 0 && <span>{fa(days)} روز و</span>}
      <span dir="ltr" className="font-black tabular-nums" style={{ color: 'var(--primary-color)' }}>
        {clock}
      </span>
    </div>
  );
}

function PlanCard({ plan, active, busy, disabled, onBuy }) {
  const hasDiscountData = Number(plan.discount?.percentage) > 0 && !!plan.discount?.expirationDate;
  const now = useNow(hasDiscountData);
  const p = getPricing(plan, now);
  const f = plan.features || {};

  return (
    <div
      className="card rounded-3xl p-6 flex flex-col relative overflow-hidden transition hover:-translate-y-1"
      style={{ border: plan.is_featured ? '2px solid var(--primary-color)' : undefined }}
    >
      {plan.is_featured && (
        <div
          className="absolute top-0 left-0 px-4 py-1.5 text-[11px] font-black rounded-br-2xl flex items-center gap-1"
          style={{ background: 'var(--primary-color)', color: '#0a1736' }}
        >
          <Crown size={12} /> پیشنهادی
        </div>
      )}

      <div className={plan.is_featured ? 'mt-6' : ''}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-black text-lg">{plan.name}</h3>
          <span className="chip !py-0.5 !px-2.5 text-[11px] !cursor-default flex items-center gap-1">
            <Clock size={11} /> {durationLabel(plan.duration_days)}
          </span>
        </div>
        {plan.description && (
          <p className="text-xs muted mt-2 leading-6 line-clamp-3">{plan.description}</p>
        )}
      </div>

      <div className="mt-5 mb-5 pb-5 border-b border-theme">
        {p.hasDiscount && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs muted line-through">{fa(p.amount)} تومان</span>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
              {fa(p.pct)}٪ تخفیف
            </span>
          </div>
        )}
        <div className="flex items-baseline gap-1.5">
          <span className="font-black text-3xl text-yellow">{fa(p.final)}</span>
          <span className="text-xs muted">تومان</span>
        </div>
        {p.hasDiscount && p.expires && <Countdown expires={p.expires} now={now} />}
      </div>

      <ul className="space-y-3 flex-1 mb-6">
        <Feature icon={Package}>
          تا <b>{fa(f.max_products)}</b> محصول
        </Feature>
        <Feature icon={Store}>
          تا <b>{fa(f.max_shops)}</b> فروشگاه
        </Feature>
        <Feature icon={ImageIcon}>
          تا <b>{fa(f.max_images_per_product)}</b> تصویر برای هر محصول
        </Feature>
        <Feature icon={Check}>فعال‌سازی آنی پس از پرداخت</Feature>
      </ul>

      {active && (
        <div className="text-[11px] text-emerald-400 font-bold text-center mb-2">
          پلن فعلی شما
          {active.expires && ` • تا ${active.expires.toLocaleDateString('fa-IR')}`}
        </div>
      )}

      <button
        type="button"
        onClick={() => onBuy(plan)}
        disabled={disabled || !!active}
        className={`${plan.is_featured ? 'btn-yellow' : 'btn-ghost'} w-full flex items-center justify-center gap-2 disabled:opacity-60`}
      >
        {busy ? (
          <>
            <Loader2 size={16} className="animate-spin" /> در حال انتقال به درگاه…
          </>
        ) : active ? (
          'فعال است'
        ) : (
          'خرید و فعال‌سازی'
        )}
      </button>
    </div>
  );
}

function ActivePlanBanner({ user, plans, onBuy, buyingId }) {
  const sp = user?.seller_plan;
  const planId = sp?.plan_id ? String(sp.plan_id?._id ?? sp.plan_id) : null;
  const plan = planId ? plans.find((p) => String(p._id) === planId) : null;

  const isForever = plan?.duration_days === null;
  const startMs = sp?.start_at ? new Date(sp.start_at).getTime() : NaN;
  const hasFinite = !isForever && plan && Number.isFinite(startMs);
  const now = useNow(hasFinite);

  if (!plan) return null;

  // ─── پلن دائمی ───
  if (isForever) {
    return (
      <div
        className="card rounded-3xl p-5 flex items-center gap-4"
        style={{ border: '2px solid var(--primary-color)' }}
      >
        <div
          className="w-12 h-12 rounded-2xl grid place-items-center shrink-0"
          style={{ background: 'var(--primary-color)', color: '#0a1736' }}
        >
          <Crown size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-sm flex items-center gap-2">
            پلن فعلی: {plan.name}
          </div>
          <div className="text-xs muted mt-1">
            پلن دائمی — بدون محدودیت زمانی
          </div>
        </div>
        <span
          className="text-[11px] px-2.5 py-1 rounded-full font-black shrink-0"
          style={{ background: 'var(--primary-color)', color: '#0a1736' }}
        >
          فعال
        </span>
      </div>
    );
  }

  // ─── پلن زمان‌دار ───
  const expires = startMs + plan.duration_days * 86400000;
  const diff = expires - now;
  const expired = diff <= 0;

  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const seconds = Math.floor((abs % 60000) / 1000);

  const critical = !expired && days < 1;
  const warning = !expired && days < 3;

  const color = expired
    ? '#f87171'
    : critical
      ? '#f87171'
      : warning
        ? '#f59e0b'
        : '#34d399';

  let mainText;
  if (expired) {
    mainText = 'پلن شما منقضی شده است';
  } else if (days > 0) {
    mainText = `${fa(days)} روز و ${fa(hours)} ساعت و ${fa(minutes)} دقیقه باقی‌مانده`;
  } else if (hours > 0) {
    mainText = `${fa(hours)} ساعت و ${fa(minutes)} دقیقه و ${fa(seconds)} ثانیه باقی‌مانده`;
  } else {
    mainText = `${fa(minutes)} دقیقه و ${fa(seconds)} ثانیه باقی‌مانده`;
  }

  return (
    <div
      className="card rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
      style={{ border: `2px solid ${color}40` }}
    >
      <div
        className="w-12 h-12 rounded-2xl grid place-items-center shrink-0"
        style={{ background: `${color}22`, color }}
      >
        {expired ? <AlertTriangle size={22} /> : <Timer size={22} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-black text-sm">
          پلن فعلی: {plan.name}
        </div>

        <div
          className="text-xs mt-1.5 font-bold flex items-center gap-1.5"
          style={{ color }}
        >
          <Clock size={12} />
          <span dir="rtl">{mainText}</span>
        </div>

        <div className="text-[11px] muted mt-1">
          تاریخ پایان:{' '}
          <span className="font-bold" dir="ltr">
            {new Date(expires).toLocaleDateString('fa-IR')}
          </span>
        </div>
      </div>

      {(expired || warning) && (
        <button
          type="button"
          onClick={() => onBuy?.(plan)}
          disabled={!!buyingId}
          className="btn-yellow text-xs !py-2 !px-4 shrink-0 flex items-center gap-1.5"
        >
          {buyingId === plan._id ? (
            <>
              <Loader2 size={13} className="animate-spin" /> در حال انتقال…
            </>
          ) : (
            <>
              <RefreshCw size={13} /> تمدید / خرید پلن جدید
            </>
          )}
        </button>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card rounded-3xl p-6 animate-pulse space-y-4">
      <div className="h-5 w-1/2 rounded bg-current opacity-10" />
      <div className="h-3 w-3/4 rounded bg-current opacity-10" />
      <div className="h-9 w-2/3 rounded bg-current opacity-10 mt-6" />
      <div className="space-y-3 pt-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-4 w-full rounded bg-current opacity-10" />
        ))}
      </div>
      <div className="h-10 w-full rounded-xl bg-current opacity-10 mt-4" />
    </div>
  );
}

function PaymentBanner({ result, onClose }) {
  if (!result) return null;
  const cfg = {
    verifying: { icon: Loader2, spin: true, color: 'var(--primary-color)', title: 'در حال تأیید پرداخت…' },
    success: { icon: CheckCircle2, color: '#34d399', title: 'پرداخت موفق بود و پلن شما فعال شد' },
    cancelled: { icon: XCircle, color: '#f59e0b', title: 'پرداخت انجام نشد یا لغو شد' },
    error: { icon: XCircle, color: '#f87171', title: result.message || 'تأیید پرداخت ناموفق بود' },
  }[result.type];
  const Icon = cfg.icon;

  return (
    <div className="card rounded-2xl p-4 flex items-center gap-3" style={{ borderColor: cfg.color }}>
      <Icon size={22} className={cfg.spin ? 'animate-spin' : ''} style={{ color: cfg.color }} />
      <div className="flex-1 min-w-0">
        <div className="font-black text-sm">{cfg.title}</div>
        {result.type === 'success' && result.refId && (
          <div className="text-xs muted mt-1">
            کد پیگیری: <span dir="ltr" className="font-black">{result.refId}</span>
          </div>
        )}
      </div>
      {result.type !== 'verifying' && (
        <button type="button" onClick={onClose} className="btn-ghost !p-1.5" aria-label="بستن">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
function PlansPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useShop();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [buyingId, setBuyingId] = useState('');
  const [result, setResult] = useState(null);
  const verifiedRef = useRef(false);

  const loadPlans = useCallback(() => {
    setLoading(true);
    setError(false);
    axios
      .get(`${API}/plan`, { ...authHeaders(), params: { page: 1, limit: 100 } })
      .then((res) => {
        const body = res.data?.body;
        const list = Array.isArray(body) ? body : body?.data || [];
        setPlans(list.filter((p) => !p.status || p.status === 'ACTIVE'));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  /* بازگشت از درگاه: ?Authority=...&Status=OK|NOK */
  useEffect(() => {
    const authority = searchParams.get('Authority');
    const status = searchParams.get('Status');
    if (!authority || verifiedRef.current) return;
    verifiedRef.current = true;
    setSearchParams({}, { replace: true });

    if (status !== 'OK') {
      setResult({ type: 'cancelled' });
      return;
    }
    setResult({ type: 'verifying' });
    axios
      .get(`${API}${PAY_PREFIX}/plan/pay/verify`, {
        params: { Authority: authority, Status: status },
      })
      .then((res) => {
        const b = res.data?.body || {};
        setResult({ type: 'success', refId: b.ref_id });
        refreshUser?.();
      })
      .catch((err) =>
        setResult({ type: 'error', message: faError(err, 'تأیید پرداخت ناموفق بود') }),
      );
  }, [searchParams, setSearchParams, refreshUser]);

  const buyPlan = (plan) => {
    if (!user) {
      toast.info('برای خرید پلن ابتدا وارد حساب کاربری شوید');
      return navigate('/auth/pre');
    }
    setBuyingId(plan._id);
    axios
      .post(`${API}${PAY_PREFIX}/plan/${plan._id}/pay`, {}, authHeaders())
      .then((res) => {
        const b = res.data?.body ?? res.data?.data ?? {};
        const url = b.url || b.pay_url || b.payment_url;
        if (url && /^https?:/.test(url)) {
          window.location.href = url;
          return;
        }
        toast.error('لینک پرداخت دریافت نشد');
        setBuyingId('');
      })
      .catch((err) => {
        toast.error(faError(err, 'خطا در شروع پرداخت'));
        setBuyingId('');
      });
  };

  return (
    <div className="space-y-6">
      <PaymentBanner result={result} onClose={() => setResult(null)} />

      {!loading && (
        <ActivePlanBanner
          user={user}
          plans={plans}
          onBuy={buyPlan}
          buyingId={buyingId}
        />
      )}

      <div className="card rounded-3xl p-6 text-center">
        <div
          className="w-12 h-12 rounded-2xl grid place-items-center mx-auto mb-3"
          style={{ background: 'var(--primary-color)', color: '#0a1736' }}
        >
          <Sparkles size={22} />
        </div>
        <h1 className="font-black text-xl">پلن‌های فروشندگی</h1>
        <p className="text-xs muted mt-2 max-w-xl mx-auto leading-6">
          پلن مناسب کسب‌وکار خود را انتخاب کنید. بعد از پرداخت، محدودیت‌های فروشگاه و محصولات شما
          بلافاصله بر اساس پلن به‌روزرسانی می‌شود.
        </p>
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="card rounded-3xl p-10 text-center">
          <p className="muted mb-4 text-sm">دریافت پلن‌ها با خطا مواجه شد.</p>
          <button type="button" onClick={loadPlans} className="btn-ghost inline-flex items-center gap-2 text-sm">
            <RefreshCw size={15} /> تلاش دوباره
          </button>
        </div>
      )}

      {!loading && !error && plans.length === 0 && (
        <div className="rounded-3xl border border-dashed border-theme p-10 text-center text-sm muted">
          در حال حاضر پلن فعالی برای خرید وجود ندارد.
        </div>
      )}

      {!loading && !error && plans.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((pl) => (
            <PlanCard
              key={pl._id}
              plan={pl}
              active={getActiveInfo(user, pl)}
              busy={buyingId === pl._id}
              disabled={!!buyingId || result?.type === 'verifying'}
              onBuy={buyPlan}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PlansPage;