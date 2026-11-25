import { formatMoney } from '../../i18n/runtime';
import { t as translateText } from '../../i18n/runtime.js';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  Image as ImageIcon,
  Package,
  Settings,
  Sparkles,
  Store,
} from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import { authHeaders } from '../../utils/helpers/storage';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { toFa, formatDate } from '../../utils/helpers/format';
import { isTrustedSeller } from '../../utils/helpers/user';
import { cardNumberValidator } from '../../utils/validators/card_number.validator';
import { shebaNumberValidator } from '../../utils/validators/sheba_number.validator';
import PanelPageHeader from '../../components/panel/PanelPageHeaderComponent';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

const EMPTY_FORM = {
  card_number: '',
  sheba_number: '',
  firstname_lastname: '',
};

function SettingPage() {
  const { user, refreshUser } = useShop();
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  /* جزئیات پلن فعال — شناسه‌ی خام پلن هیچ‌جا به کاربر نشان داده نمی‌شود */
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);

  /*
   * اطلاعات فروشنده از روت کاربر خوانده می‌شود (روت /seller/:id فقط برای ادمین است).
   * برای خود کاربر، GET /user/:id اطلاعات کامل (شامل فیلدهای فروشندگی) را برمی‌گرداند.
   */
  useEffect(() => {
    if (!user) return setLoading(false);
    const controller = new AbortController();

    axios
      .get(`${API}/user/${user._id}`, { ...authHeaders(), signal: controller.signal })
      .then((res) => {
        const data = res.data?.body;
        if (!data) return;
        setSeller(data);
        setForm({
          card_number: data.settlement_account?.card_number || '',
          sheba_number: data.settlement_account?.sheba_number || '',
          firstname_lastname: data.settlement_account?.firstname_lastname || '',
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [user]);

  /*
   * جزئیات پلن فعال: از روت عمومی `GET /plan/:id` خوانده می‌شود تا به جای
   * شناسه‌ی خام، نام/مدت/تاریخ/امکانات پلن نمایش داده شود.
   */
  useEffect(() => {
    const raw = seller?.seller_plan?.plan_id;
    const id = raw ? (typeof raw === 'string' ? raw : raw._id || raw.id) : '';
    if (!id) {
      setPlan(null);
      return undefined;
    }

    const controller = new AbortController();
    setPlanLoading(true);

    axios
      .get(`${API}/plan/${id}`, { ...authHeaders(), signal: controller.signal, timeout: 15000 })
      .then((res) => {
        const data = res.data?.body;
        if (data && typeof data === 'object') setPlan(data);
      })
      .catch(() => setPlan(null))
      .finally(() => {
        if (!controller.signal.aborted) setPlanLoading(false);
      });

    return () => controller.abort();
  }, [seller]);

  const isApproved = seller?.seller_approved_status === true;
  const isActive = String(seller?.seller_active_status || '').toUpperCase() === 'ACTIVE';

  const save = (event) => {
    event.preventDefault();

    if (!form.firstname_lastname.trim()) return toast.error(translateText('نام صاحب حساب الزامی است'));
    if (!cardNumberValidator(form.card_number)) {
      return toast.error(translateText('شماره کارت ۱۶ رقمی معتبر نیست'));
    }
    if (!shebaNumberValidator(form.sheba_number)) {
      return toast.error(translateText('شماره شبا معتبر نیست (IR + ۲۴ رقم)'));
    }

    const payload = {
      settlement_account: {
        type: 'card',
        card_number: form.card_number.replace(/[\s-]/g, ''),
        sheba_number: form.sheba_number.toUpperCase().replace(/\s/g, ''),
        firstname_lastname: form.firstname_lastname.trim(),
      },
    };

    axios
      .put(`${API}/seller/${user._id}`, payload, authHeaders())
      .then(() => {
        toast.success(translateText('حساب تسویه به‌روزرسانی شد'));
        refreshUser();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || translateText('خطا در ذخیره تنظیمات'));
      });
  };

  if (loading) {
    return (
      <div className="py-16">
        <Loading label={translateText('در حال دریافت مشخصات فروشنده…')} />
      </div>
    );
  }

  /* کاربر فروشنده نیست */
  if (!seller?.is_seller) {
    return (
      <div className="card rounded-3xl p-8 max-w-2xl text-center">
        <Store size={32} className="mx-auto text-accent" />
        <h2 className="font-black text-lg mt-3">{translateText('هنوز فروشنده نیستید')}</h2>
        <p className="text-xs muted leading-6 mt-2">
          {translateText(
            'برای دسترسی به تنظیمات فروشندگی، ابتدا درخواست فروشنده ثبت کنید و پس از تأیید مدیر، فروشگاه خود را بسازید. ',
          )}
        </p>
        <Link to="/account" className="btn-primary inline-flex mt-4">
          {translateText('ثبت درخواست فروشندگی ')}
        </Link>
      </div>
    );
  }

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  return (
    <div className="space-y-4 max-w-3xl">
      <PanelPageHeader
        icon={Settings}
        title={translateText('تنظیمات فروشندگی')}
        subtitle={translateText('حساب تسویه و وضعیت فروشندگی')}
      />

      <form onSubmit={save} className="card rounded-3xl p-6 space-y-4">
        {/* وضعیت فروشنده */}
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-black text-lg me-auto">{translateText('تنظیمات فروشندگی')}</h2>
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              isApproved ? 'bg-emerald-500/15 text-emerald-400' : 'bg-orange-500/15 text-orange-400'
            }`}
          >
            {isApproved ? translateText('تأییدشده') : translateText('در انتظار تأیید')}
          </span>
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              isActive ? 'bg-blue-500/15 text-blue-400' : 'bg-red-500/15 text-red-400'
            }`}
          >
            {isActive ? translateText('فعال') : translateText('غیرفعال')}
          </span>
          {isTrustedSeller(seller) && (
            <span className="chip !cursor-default !py-1 !px-2.5 text-[11px] flex items-center gap-1">
              <BadgeCheck size={12} className="text-accent" />
              {translateText('فروشنده مورد اعتماد ')}
            </span>
          )}
        </div>

        {/* حساب تسویه — همیشه قابل ویرایش */}
        <div className="pt-1">
          <h3 className="font-black text-sm">{translateText('حساب تسویه')}</h3>
          <p className="text-[11px] muted mt-1 mb-3">
            {translateText('واریز مبلغ فروش به این حساب انجام می‌شود؛ همیشه قابل ویرایش است. ')}
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs muted">
              {translateText('صاحب حساب تسویه ')}
              <input
                className="input mt-1"
                value={form.firstname_lastname}
                onChange={set('firstname_lastname')}
                required
              />
            </label>
            <label className="text-xs muted">
              {translateText('شماره کارت ۱۶ رقمی ')}
              <input
                className="input mt-1"
                dir="ltr"
                value={form.card_number}
                onChange={set('card_number')}
                required
              />
            </label>
            <label className="text-xs muted sm:col-span-2">
              {translateText('شماره شبا (IR...) ')}
              <input
                className="input mt-1"
                dir="ltr"
                value={form.sheba_number}
                onChange={set('sheba_number')}
                required
              />
            </label>
          </div>
        </div>

        <ActivePlanCard
          plan={plan}
          loading={planLoading}
          startAt={seller?.seller_plan?.start_at}
          hasPlan={Boolean(seller?.seller_plan?.plan_id)}
        />

        <button type="submit" className="btn-primary">
          {translateText('ذخیره تنظیمات ')}
        </button>
      </form>
    </div>
  );
}

export default SettingPage;

/* ------------------------------------------------------------------ */
/* کارت «پلن فعال» — به جای شناسه‌ی خام، پلن را خوانا نشان می‌دهد        */
/* ------------------------------------------------------------------ */

const durationLabelOf = (days) => {
  if (days === null || days === undefined) return translateText('نامحدود');
  const n = Number(days);
  if (!Number.isFinite(n) || n <= 0) return translateText('نامحدود');
  if (n === 30) return translateText('ماهانه');
  if (n === 90) return translateText('سه‌ماهه');
  if (n === 180) return translateText('شش‌ماهه');
  if (n === 365) return translateText('سالانه');
  return translateText('{{v0}} روزه', { v0: toFa(n) });
};

function PlanStat({ icon: Icon, label, value }) {
  return (
    <div className="card2 rounded-xl px-3 py-2.5 min-w-0">
      <span className="flex items-center gap-1.5 text-[10px] muted">
        <Icon size={12} />
        {label}
      </span>
      <b className="block mt-1 text-sm truncate">{value}</b>
    </div>
  );
}

function ActivePlanCard({ plan, loading, startAt, hasPlan }) {
  if (!hasPlan) {
    return (
      <div className="card rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 font-black text-sm">
          <Sparkles size={16} style={{ color: 'var(--primary-color)' }} />
          {translateText('پلن فعالی ندارید ')}
        </div>
        <p className="text-xs muted mt-2 leading-6">
          {translateText('برای انتشار محصول باید یکی از پلن‌های فروشندگی را فعال کنید. ')}
        </p>
        <Link to="/seller/plans" className="btn-primary !py-2 text-sm mt-3 inline-flex">
          {translateText('مشاهده و خرید پلن ')}
        </Link>
      </div>
    );
  }

  if (loading && !plan) {
    return (
      <div className="card rounded-2xl p-4 sm:p-5 space-y-3" aria-busy="true">
        <div className="skeleton h-5 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="skeleton h-14" />
          <div className="skeleton h-14" />
          <div className="skeleton h-14" />
          <div className="skeleton h-14" />
        </div>
      </div>
    );
  }

  const durationDays = plan?.duration_days ?? null;
  const start = startAt ? new Date(startAt) : null;
  const validStart = start && !Number.isNaN(start.getTime()) ? start : null;
  const expires =
    validStart && durationDays !== null && Number(durationDays) > 0
      ? new Date(validStart.getTime() + Number(durationDays) * 86400000)
      : null;
  const daysLeft = expires ? Math.ceil((expires.getTime() - Date.now()) / 86400000) : null;
  const expired = daysLeft !== null && daysLeft <= 0;

  const f = plan?.features || {};
  const planAmount = plan?.price?.amount ?? null;

  return (
    <div className="card rounded-2xl p-4 sm:p-5" style={{ border: '1px solid var(--border)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="flex items-center gap-1.5 text-[11px] muted">
            <Sparkles size={13} style={{ color: 'var(--primary-color)' }} />
            {translateText('پلن فعال شما ')}
          </span>
          <h3 className="font-black text-lg mt-1 truncate">
            {plan?.name || translateText('پلن فعال')}
          </h3>
          {plan?.description && (
            <p className="text-xs muted mt-1 leading-6 line-clamp-2">{plan.description}</p>
          )}
        </div>

        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black shrink-0"
          style={
            expired
              ? { background: 'rgba(255,106,0,0.15)', color: '#ff6a00' }
              : { background: 'rgba(23,153,79,0.14)', color: '#17994f' }
          }
        >
          <Check size={12} />
          {expired ? translateText('منقضی شده') : translateText('فعال')}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
        <PlanStat
          icon={Clock}
          label={translateText('مدت اعتبار')}
          value={durationLabelOf(durationDays)}
        />
        <PlanStat
          icon={CalendarDays}
          label={translateText('شروع')}
          value={validStart ? formatDate(validStart) : '—'}
        />
        <PlanStat
          icon={CalendarDays}
          label={translateText('پایان')}
          value={expires ? formatDate(expires) : translateText('نامحدود')}
        />
        <PlanStat
          icon={Package}
          label={
            daysLeft !== null && !expired
              ? translateText('روز باقی‌مانده')
              : translateText('هزینه‌ی پلن')
          }
          value={
            daysLeft !== null && !expired
              ? translateText('{{v0}} روز', { v0: toFa(daysLeft) })
              : planAmount !== null
                ? formatMoney(plan.price.amount, plan.price.currency)
                : '—'
          }
        />
      </div>

      {(f.max_products || f.max_shops || f.max_images_per_product) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
          {f.max_products ? (
            <span className="chip !cursor-default !py-1 !px-2.5 inline-flex items-center gap-1">
              <Package size={12} />
              {translateText('تا ')}
              {toFa(f.max_products)}
              {translateText(' محصول ')}
            </span>
          ) : null}
          {f.max_shops ? (
            <span className="chip !cursor-default !py-1 !px-2.5 inline-flex items-center gap-1">
              <Store size={12} />
              {translateText('تا ')}
              {toFa(f.max_shops)}
              {translateText(' فروشگاه ')}
            </span>
          ) : null}
          {f.max_images_per_product ? (
            <span className="chip !cursor-default !py-1 !px-2.5 inline-flex items-center gap-1">
              <ImageIcon size={12} />
              {translateText('تا ')}
              {toFa(f.max_images_per_product)}
              {translateText(' تصویر برای هر محصول ')}
            </span>
          ) : null}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link to="/seller/plans" className="btn-primary !py-2 text-xs sm:text-sm">
          {expired ? translateText('تمدید پلن') : translateText('ارتقا یا تمدید')}
        </Link>
        <span className="text-[11px] muted">
          {expired
            ? translateText('اعتبار پلن تمام شده است؛ برای انتشار محصول پلن را تمدید کنید.')
            : translateText('برای تغییر پلن، گزینه‌های موجود را ببینید.')}
        </span>
      </div>
    </div>
  );
}
