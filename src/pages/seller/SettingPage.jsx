import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BadgeCheck, CalendarDays, Check, Clock, Image as ImageIcon, Info, Lock, Package, Settings, Sparkles, Store } from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import { authHeaders } from '../../utils/helpers/storage';
import { Loading } from '../../components/common/ScroolToTopComponent';
import JalaliDateTimePicker from '../../components/common/JalaliDateTimePicker';
import { toFa, faDigits, formatDate } from '../../utils/helpers/format';
import { isSellerIdentityLocked, isTrustedSeller } from '../../utils/helpers/user';
import { nationalIDValidator } from '../../utils/validators/national_id.validator';
import { cardNumberValidator } from '../../utils/validators/card_number.validator';
import { shebaNumberValidator } from '../../utils/validators/sheba_number.validator';
import PanelPageHeader from '../../components/panel/PanelPageHeaderComponent';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

const EMPTY_FORM = {
  seller_type: 'Individual_seller',
  national_ID: '',
  birth_date: '',
  province: '',
  city: '',
  full_address: '',
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
          seller_type: data.seller_type || 'Individual_seller',
          national_ID: data.national_ID || '',
          birth_date: data.birth_date || '',
          province: data.address?.province || '',
          city: data.address?.city || '',
          full_address: data.address?.full_address || '',
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

  /* بعد از تأیید فروشنده، فیلدهای هویتی قفل می‌شوند و فقط حساب تسویه قابل ویرایش است */
  const identityLocked = isSellerIdentityLocked(seller);
  const isApproved = seller?.seller_approved_status === true;
  const isActive = String(seller?.seller_active_status || '').toUpperCase() === 'ACTIVE';

  const save = (event) => {
    event.preventDefault();

    if (!cardNumberValidator(form.card_number)) {
      return toast.error('شماره کارت ۱۶ رقمی معتبر نیست');
    }
    if (!shebaNumberValidator(form.sheba_number)) {
      return toast.error('شماره شبا معتبر نیست (IR + ۲۴ رقم)');
    }

    const payload = {
      settlement_account: {
        type: 'card',
        card_number: form.card_number.replace(/[\s-]/g, ''),
        sheba_number: form.sheba_number.toUpperCase().replace(/\s/g, ''),
        firstname_lastname: form.firstname_lastname.trim(),
      },
    };

    /* فیلدهای هویتی فقط وقتی ارسال می‌شوند که قفل نباشند */
    if (!identityLocked) {
      if (!nationalIDValidator(form.national_ID)) {
        return toast.error('کد ملی معتبر ۱۰ رقمی وارد کنید');
      }
      payload.seller_type = form.seller_type;
      payload.national_ID = form.national_ID;
      if (form.birth_date) payload.birth_date = form.birth_date;
      payload.address = {
        province: form.province.trim(),
        city: form.city.trim(),
        full_address: form.full_address.trim(),
      };
    }

    axios
      .put(`${API}/seller/${user._id}`, payload, authHeaders())
      .then(() => {
        toast.success(
          identityLocked
            ? 'حساب تسویه به‌روزرسانی شد'
            : 'مشخصات فروشندگی به‌روزرسانی شد و در انتظار تأیید مدیر است',
        );
        refreshUser();
      })
      .catch((err) => {
        const status = err.response?.status;
        toast.error(
          status === 403
            ? 'اطلاعات هویتی بعد از تأیید فروشنده قابل ویرایش نیست؛ فقط حساب تسویه قابل تغییر است.'
            : err.response?.data?.message || 'خطا در ذخیره تنظیمات',
        );
      });
  };

  if (loading) {
    return (
      <div className="py-16">
        <Loading label="در حال دریافت مشخصات فروشنده…" />
      </div>
    );
  }

  /* کاربر فروشنده نیست */
  if (!seller?.is_seller) {
    return (
      <div className="card rounded-3xl p-8 max-w-2xl text-center">
        <Store size={32} className="mx-auto text-yellow" />
        <h2 className="font-black text-lg mt-3">هنوز فروشنده نیستید</h2>
        <p className="text-xs muted leading-6 mt-2">
          برای دسترسی به تنظیمات فروشندگی، ابتدا درخواست فروشنده ثبت کنید و پس از تأیید مدیر،
          فروشگاه خود را بسازید.
        </p>
        <Link to="/profile" className="btn-yellow inline-flex mt-4">
          ثبت درخواست فروشندگی
        </Link>
      </div>
    );
  }

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const lockedInput = identityLocked ? 'input mt-1 opacity-60 cursor-not-allowed' : 'input mt-1';

  return (
    <div className="space-y-4 max-w-3xl">
      <PanelPageHeader
        icon={Settings}
        title="تنظیمات فروشندگی"
        subtitle="مشخصات فروشگاه، اطلاعات هویتی و حساب تسویه"
      />

      <form onSubmit={save} className="card rounded-3xl p-6 space-y-4">
      {/* وضعیت فروشنده */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-black text-lg me-auto">تنظیمات فروشندگی</h2>
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
            isApproved ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
          }`}
        >
          {isApproved ? 'تأییدشده' : 'در انتظار تأیید'}
        </span>
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
            isActive ? 'bg-blue-500/15 text-blue-400' : 'bg-red-500/15 text-red-400'
          }`}
        >
          {isActive ? 'فعال' : 'غیرفعال'}
        </span>
        {isTrustedSeller(seller) && (
          <span className="chip !cursor-default !py-1 !px-2.5 text-[11px] flex items-center gap-1">
            <BadgeCheck size={12} className="text-yellow" />
            فروشنده مورد اعتماد
          </span>
        )}
      </div>

      {/* توضیح قفل هویت */}
      {identityLocked ? (
        <div
          className="rounded-2xl p-3.5 flex items-start gap-2 text-[11px] leading-6"
          style={{ background: 'rgba(255,214,10,0.1)', border: '1px solid rgba(255,214,10,0.3)' }}
        >
          <Lock size={15} className="mt-0.5 shrink-0 text-yellow" />
          <span>
            حساب شما تأیید شده است؛ بنابراین اطلاعات هویتی (نوع فروشنده، کد ملی، تاریخ تولد و نشانی)
            قفل شده‌اند. برای تغییر آن‌ها از طریق{' '}
            <Link to="/contact" className="font-bold text-yellow">
              پشتیبانی
            </Link>{' '}
            درخواست بدهید. فقط حساب تسویه قابل ویرایش است.
          </span>
        </div>
      ) : (
        <div className="text-[11px] muted leading-6 flex items-start gap-2">
          <Info size={14} className="mt-0.5 shrink-0 text-yellow" />
          پس از تأیید مدیر، اطلاعات هویتی قفل می‌شود و فقط حساب تسویه قابل ویرایش خواهد بود.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-xs muted">
          نوع فروشنده
          <select
            className={lockedInput}
            value={form.seller_type}
            onChange={set('seller_type')}
            disabled={identityLocked}
          >
            <option value="Individual_seller">فروشنده حقیقی</option>
            <option value="institutional_seller">فروشنده حقوقی</option>
          </select>
        </label>

        <label className="text-xs muted">
          کد ملی
          <input
            className={lockedInput}
            dir="ltr"
            value={form.national_ID}
            onChange={set('national_ID')}
            disabled={identityLocked}
            required={!identityLocked}
          />
        </label>

        <div className="text-xs muted">
          تاریخ تولد (شمسی)
          {identityLocked ? (
            <div className={`${lockedInput} mt-1`} dir="ltr">
              {form.birth_date ? faDigits(form.birth_date) : '—'}
            </div>
          ) : (
            <JalaliDateTimePicker
              value={form.birth_date}
              onChange={(next) => set('birth_date')({ target: { value: next } })}
              placeholder="۱۳۷۲/۰۴/۱۵"
              withTime={false}
              valueFormat="jalali"
            />
          )}
        </div>

        <label className="text-xs muted">
          استان
          <input
            className={lockedInput}
            value={form.province}
            onChange={set('province')}
            disabled={identityLocked}
          />
        </label>

        <label className="text-xs muted">
          شهر
          <input
            className={lockedInput}
            value={form.city}
            onChange={set('city')}
            disabled={identityLocked}
          />
        </label>

        <label className="text-xs muted sm:col-span-2">
          آدرس کامل
          <input
            className={lockedInput}
            value={form.full_address}
            onChange={set('full_address')}
            disabled={identityLocked}
          />
        </label>
      </div>

      {/* حساب تسویه — همیشه قابل ویرایش */}
      <div className="pt-1">
        <h3 className="font-black text-sm">حساب تسویه</h3>
        <p className="text-[11px] muted mt-1 mb-3">
          واریز مبلغ فروش به این حساب انجام می‌شود؛ همیشه قابل ویرایش است.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs muted">
            صاحب حساب تسویه
            <input
              className="input mt-1"
              value={form.firstname_lastname}
              onChange={set('firstname_lastname')}
              required
            />
          </label>
          <label className="text-xs muted">
            شماره کارت ۱۶ رقمی
            <input
              className="input mt-1"
              dir="ltr"
              value={form.card_number}
              onChange={set('card_number')}
              required
            />
          </label>
          <label className="text-xs muted sm:col-span-2">
            شماره شبا (IR...)
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

      <button type="submit" className="btn-yellow">
        ذخیره تنظیمات
      </button>
      </form>
    </div>
  );
}

export default SettingPage;

/* ------------------------------------------------------------------ */
/* کارت «پلن فعال» — به جای شناسه‌ی خام، پلن را خوانا نشان می‌دهد        */
/* ------------------------------------------------------------------ */

const toToman = (amount, currency) =>
  Math.round(currency === 'IRR' ? Number(amount || 0) / 10 : Number(amount || 0));

const durationLabelOf = (days) => {
  if (days === null || days === undefined) return 'نامحدود';
  const n = Number(days);
  if (!Number.isFinite(n) || n <= 0) return 'نامحدود';
  if (n === 30) return 'ماهانه';
  if (n === 90) return 'سه‌ماهه';
  if (n === 180) return 'شش‌ماهه';
  if (n === 365) return 'سالانه';
  return `${toFa(n)} روزه`;
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
          پلن فعالی ندارید
        </div>
        <p className="text-xs muted mt-2 leading-6">
          برای انتشار محصول باید یکی از پلن‌های فروشندگی را فعال کنید.
        </p>
        <Link to="/seller/plans" className="btn-yellow !py-2 text-sm mt-3 inline-flex">
          مشاهده و خرید پلن
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
  const currency = plan?.price?.currency || 'IRR';
  const priceToman = plan?.price ? toToman(plan.price.amount, currency) : null;

  return (
    <div className="card rounded-2xl p-4 sm:p-5" style={{ border: '1px solid var(--border)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="flex items-center gap-1.5 text-[11px] muted">
            <Sparkles size={13} style={{ color: 'var(--primary-color)' }} />
            پلن فعال شما
          </span>
          <h3 className="font-black text-lg mt-1 truncate">{plan?.name || 'پلن فعال'}</h3>
          {plan?.description && (
            <p className="text-xs muted mt-1 leading-6 line-clamp-2">{plan.description}</p>
          )}
        </div>

        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black shrink-0"
          style={
            expired
              ? { background: 'rgba(194,116,10,0.15)', color: '#c2740a' }
              : { background: 'rgba(23,153,79,0.14)', color: '#17994f' }
          }
        >
          <Check size={12} />
          {expired ? 'منقضی شده' : 'فعال'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
        <PlanStat icon={Clock} label="مدت اعتبار" value={durationLabelOf(durationDays)} />
        <PlanStat
          icon={CalendarDays}
          label="شروع"
          value={validStart ? formatDate(validStart) : '—'}
        />
        <PlanStat
          icon={CalendarDays}
          label="پایان"
          value={expires ? formatDate(expires) : 'نامحدود'}
        />
        <PlanStat
          icon={Package}
          label={daysLeft !== null && !expired ? 'روز باقی‌مانده' : 'هزینه‌ی پلن'}
          value={
            daysLeft !== null && !expired
              ? `${toFa(daysLeft)} روز`
              : priceToman !== null
                ? `${toFa(priceToman.toLocaleString('en-US'))} تومان`
                : '—'
          }
        />
      </div>

      {(f.max_products || f.max_shops || f.max_images_per_product) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
          {f.max_products ? (
            <span className="chip !cursor-default !py-1 !px-2.5 inline-flex items-center gap-1">
              <Package size={12} />
              تا {toFa(f.max_products)} محصول
            </span>
          ) : null}
          {f.max_shops ? (
            <span className="chip !cursor-default !py-1 !px-2.5 inline-flex items-center gap-1">
              <Store size={12} />
              تا {toFa(f.max_shops)} فروشگاه
            </span>
          ) : null}
          {f.max_images_per_product ? (
            <span className="chip !cursor-default !py-1 !px-2.5 inline-flex items-center gap-1">
              <ImageIcon size={12} />
              تا {toFa(f.max_images_per_product)} تصویر برای هر محصول
            </span>
          ) : null}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link to="/seller/plans" className="btn-yellow !py-2 text-xs sm:text-sm">
          {expired ? 'تمدید پلن' : 'ارتقا یا تمدید'}
        </Link>
        <span className="text-[11px] muted">
          {expired
            ? 'اعتبار پلن تمام شده است؛ برای انتشار محصول پلن را تمدید کنید.'
            : 'برای تغییر پلن، گزینه‌های موجود را ببینید.'}
        </span>
      </div>
    </div>
  );
}
