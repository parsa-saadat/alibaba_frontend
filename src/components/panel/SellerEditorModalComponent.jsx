import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  IdCard,
  Loader2,
  MapPin,
  RotateCcw,
  Save,
  ShieldCheck,
  ShieldOff,
  User,
  X,
} from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import { nationalIDValidator } from '../../utils/validators/national_id.validator';
import { cardNumberValidator } from '../../utils/validators/card_number.validator';
import { shebaNumberValidator } from '../../utils/validators/sheba_number.validator';
import { validateEmailSyntax } from '../../utils/validators/email.validator';
import { toFa } from '../../utils/helpers/format';
import { userFullName } from '../../utils/helpers/user';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

const SELLER_TYPES = [
  ['Individual_seller', 'فروشنده حقیقی'],
  ['institutional_seller', 'فروشنده حقوقی'],
];

/* ------------------------------------------------------------------ */
/* تبدیل رکورد فروشنده به «فرم تخت»                                    */
/* ------------------------------------------------------------------ */
const toForm = (seller) => ({
  username: seller?.username || '',
  firstname: seller?.firstname || '',
  lastname: seller?.lastname || '',
  email: seller?.email || '',
  phone: seller?.phone || '',
  seller_type: seller?.seller_type || 'Individual_seller',
  national_ID: seller?.national_ID || '',
  birth_date: seller?.birth_date || '',
  identity_image_id: seller?.identity_image_id || '',
  identity_verification_image_id: seller?.identity_verification_image_id || '',
  province: seller?.address?.province || '',
  city: seller?.address?.city || '',
  full_address: seller?.address?.full_address || '',
  account_type: seller?.settlement_account?.type || 'card',
  card_number: seller?.settlement_account?.card_number || '',
  sheba_number: seller?.settlement_account?.sheba_number || '',
  firstname_lastname: seller?.settlement_account?.firstname_lastname || '',
  seller_approved_status: seller?.seller_approved_status === true,
  seller_active_status: seller?.seller_active_status || 'INACTIVE',
  seller_trust: seller?.seller_trust === true,
});

const ADDRESS_KEYS = ['province', 'city', 'full_address'];
const ACCOUNT_KEYS = ['account_type', 'card_number', 'sheba_number', 'firstname_lastname'];
/* فقط این دو فیلد بولی‌اند؛ seller_active_status رشته است ('ACTIVE' | 'INACTIVE').
   قبلاً هر سه در یک لیست بودند و تغییر «فعال/غیرفعال» هرگز به‌عنوان تغییر شناسایی
   نمی‌شد (Boolean('ACTIVE') === Boolean('INACTIVE')) و ذخیره نمی‌شد. */
const BOOLEAN_KEYS = ['seller_approved_status', 'seller_trust'];

/* ------------------------------------------------------------------ */
/* اعتبارسنجی — فقط روی فیلدهایی که ادمین واقعاً تغییر داده است        */
/* مقدارهای قدیمی/دمویی که دست نخورده‌اند ذخیره را بلاک نمی‌کنند        */
/* ------------------------------------------------------------------ */
const RULES = {
  username: {
    label: 'نام کاربری',
    test: (v) => (v.trim().length >= 3 ? '' : 'نام کاربری حداقل ۳ نویسه باشد.'),
  },
  email: {
    label: 'ایمیل',
    test: (v) => (!v.trim() || validateEmailSyntax(v.trim()) ? '' : 'ایمیل معتبر نیست.'),
  },
  seller_type: {
    label: 'نوع فروشنده',
    test: (v) => (v ? '' : 'نوع فروشنده را انتخاب کنید.'),
  },
  national_ID: {
    label: 'کد ملی',
    test: (v) => (nationalIDValidator(v.trim()) ? '' : 'کد ملی معتبر نیست (۱۰ رقم با رقم کنترل درست).'),
  },
  birth_date: {
    label: 'تاریخ تولد',
    test: (v) =>
      /^\d{4}\/\d{1,2}\/\d{1,2}$/.test(v.trim()) ? '' : 'قالب تاریخ تولد: ۱۳۷۲/۰۴/۱۵',
  },
  province: { label: 'استان', test: (v) => (v.trim() ? '' : 'استان الزامی است.') },
  city: { label: 'شهر', test: (v) => (v.trim() ? '' : 'شهر الزامی است.') },
  full_address: { label: 'نشانی کامل', test: (v) => (v.trim() ? '' : 'نشانی کامل الزامی است.') },
  card_number: {
    label: 'شماره کارت',
    test: (v) => (cardNumberValidator(v.replace(/[\s-]/g, '')) ? '' : 'شماره کارت ۱۶ رقمی معتبر نیست.'),
  },
  sheba_number: {
    label: 'شماره شبا',
    test: (v) => (shebaNumberValidator(v.trim()) ? '' : 'شبا باید با IR شروع شود و ۲۴ رقم داشته باشد.'),
  },
  firstname_lastname: {
    label: 'نام صاحب حساب',
    test: (v) => (v.trim() ? '' : 'نام صاحب حساب الزامی است.'),
  },
};

/* ------------------------------------------------------------------ */
/* اجزای فرم                                                           */
/* ------------------------------------------------------------------ */

function Field({ id, label, hint, error, className = '', legacy = false, children }) {
  return (
    <div className={`block ${className}`} id={id}>
      <label className="mb-1 block text-[11px] font-bold muted" htmlFor={`in-${id}`}>
        {label}
      </label>
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] font-bold text-red-400">{error}</span>
      ) : legacy ? (
        <span className="mt-1 block text-[10px] text-amber-400">
          مقدار فعلی معتبر نیست؛ چون تغییرش ندادی ذخیره را بلاک نمی‌کند.
        </span>
      ) : (
        hint && <span className="mt-1 block text-[10px] muted">{hint}</span>
      )}
    </div>
  );
}

function SectionCard({ icon: Icon, title, desc, children }) {
  return (
    <section className="card2 rounded-2xl p-3 sm:p-4">
      <header className="mb-3 flex items-start gap-2">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-yellow"
          style={{ background: 'rgba(255,214,10,0.12)' }}
        >
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <b className="block text-sm">{title}</b>
          {desc && <span className="block text-[11px] muted">{desc}</span>}
        </div>
      </header>
      {children}
    </section>
  );
}

function Toggle({ checked, onChange, title, desc, disabled = false }) {
  const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const knob = checked
    ? rtl
      ? { right: '1.375rem' }
      : { left: '1.375rem' }
    : rtl
      ? { right: '0.125rem' }
      : { left: '0.125rem' };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border border-theme px-3 py-2 text-right transition ${
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-[var(--primary-color)]'
      }`}
    >
      <span className="min-w-0">
        <b className="block text-xs">{title}</b>
        {desc && <span className="block text-[10px] muted">{desc}</span>}
      </span>
      <span
        className="relative grid h-6 w-11 shrink-0 place-items-center rounded-full transition-colors"
        style={{ background: checked ? 'var(--primary-color)' : 'rgba(130,140,170,0.35)' }}
      >
        <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={knob} />
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* مودال ویرایش فروشنده (پنل ادمین)                                     */
/* ------------------------------------------------------------------ */

function SellerEditorModalComponent({ seller, onClose, onSaved }) {
  const [initial, setInitial] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!seller) return;
    const fresh = toForm(seller);
    setInitial(fresh);
    setForm(fresh);
    setErrors({});
    setServerError('');
  }, [seller]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !saving && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const isBool = (key) => BOOLEAN_KEYS.includes(key);

  const isDirty = (key) => {
    if (!initial || !form) return false;
    if (isBool(key)) return Boolean(form[key]) !== Boolean(initial[key]);
    return String(form[key] ?? '').trim() !== String(initial[key] ?? '').trim();
  };

  const dirtyKeys = useMemo(() => {
    if (!form) return [];
    return Object.keys(form).filter((key) => key !== 'phone' && isDirty(key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, initial]);

  const set = (key) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev));
    setServerError('');
  };

  const title = useMemo(() => userFullName(seller) || seller?.username || 'فروشنده', [seller]);

  if (!seller || !form || !initial) return null;

  /* مقدار نامعتبرِ دست‌نخورده (داده‌ی قدیمی/دمویی) فقط هشدار می‌گیرد، بلاک نمی‌کند */
  const isLegacyInvalid = (key) =>
    Boolean(!isDirty(key) && RULES[key] && RULES[key].test(String(form[key] ?? '')));

  const validate = () => {
    const next = {};

    dirtyKeys.forEach((key) => {
      const rule = RULES[key];
      if (!rule) return;
      const message = rule.test(String(form[key] ?? ''));
      if (message) next[key] = message;
    });

    /* قاعده‌ی وابستگی وضعیت‌ها */
    if (form.seller_trust && !form.seller_approved_status)
      next.seller_trust = 'فقط فروشنده‌ی تأییدشده می‌تواند «مورد اعتماد» شود.';

    setErrors(next);
    return next;
  };

  const buildPayloads = () => {
    const userPatch = {};
    ['username', 'firstname', 'lastname', 'email'].forEach((key) => {
      if (isDirty(key)) userPatch[key] = String(form[key]).trim();
    });

    const sellerPatch = {};

    ['seller_type', 'national_ID', 'birth_date', 'identity_image_id', 'identity_verification_image_id'].forEach(
      (key) => {
        if (isDirty(key)) sellerPatch[key] = String(form[key]).trim();
      },
    );

    if (ADDRESS_KEYS.some(isDirty))
      sellerPatch.address = {
        province: form.province.trim(),
        city: form.city.trim(),
        full_address: form.full_address.trim(),
      };

    if (ACCOUNT_KEYS.some(isDirty))
      sellerPatch.settlement_account = {
        type: form.account_type || 'card',
        card_number: form.card_number.replace(/[\s-]/g, ''),
        sheba_number: form.sheba_number.trim().toUpperCase(),
        firstname_lastname: form.firstname_lastname.trim(),
      };

    if (isDirty('seller_approved_status'))
      sellerPatch.seller_approved_status = Boolean(form.seller_approved_status);
    if (isDirty('seller_active_status'))
      sellerPatch.seller_active_status = form.seller_active_status;
    if (isDirty('seller_trust')) sellerPatch.seller_trust = Boolean(form.seller_trust);

    return { userPatch, sellerPatch };
  };

  const focusFirstError = (keys) => {
    const first = keys[0];
    if (!first) return;
    document.getElementById(`f-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setServerError('');

    if (!dirtyKeys.length) {
      toast.info('تغییری اعمال نشده است.');
      return;
    }

    const nextErrors = validate();
    const errorKeys = Object.keys(nextErrors);
    if (errorKeys.length) {
      focusFirstError(errorKeys);
      setServerError(
        `این فیلدها را اصلاح کن: ${errorKeys.map((key) => RULES[key]?.label || key).join('، ')}`,
      );
      return;
    }

    const { userPatch, sellerPatch } = buildPayloads();
    const id = seller._id;
    const jobs = [];

    const userKeys = Object.keys(userPatch);
    const sellerKeys = Object.keys(sellerPatch);

    if (userKeys.length)
      jobs.push({
        label: 'اطلاعات حساب کاربری',
        keys: userKeys,
        run: () => axios.put(`${API}/user/${id}`, userPatch, authHeaders()),
      });

    if (sellerKeys.length)
      jobs.push({
        label: 'اطلاعات فروشندگی',
        keys: sellerKeys.flatMap((key) =>
          key === 'address' ? ADDRESS_KEYS : key === 'settlement_account' ? ACCOUNT_KEYS : [key],
        ),
        run: () => axios.put(`${API}/seller/${id}`, sellerPatch, authHeaders()),
      });

    if (!jobs.length) {
      toast.info('تغییری برای ذخیره وجود ندارد.');
      return;
    }

    setSaving(true);
    try {
      const results = await Promise.allSettled(jobs.map((job) => job.run()));
      const failures = results
        .map((result, index) => ({ result, job: jobs[index] }))
        .filter(({ result }) => result.status === 'rejected')
        .map(
          ({ result, job }) =>
            `${job.label}: ${result.reason?.response?.data?.message || result.reason?.message || 'خطای نامشخص'}`,
        );

      const succeeded = results.length - failures.length;
      if (succeeded > 0) {
        /* کلیدهای ذخیره‌شده را با فرم هم‌تراز می‌کنیم تا دوباره ارسال نشوند */
        const applied = {};
        results.forEach((result, index) => {
          if (result.status === 'fulfilled')
            jobs[index].keys.forEach((key) => {
              applied[key] = form[key];
            });
        });
        setInitial((prev) => ({ ...prev, ...applied }));
        onSaved?.();
      }

      if (failures.length === 0) {
        toast.success('اطلاعات فروشنده ذخیره شد');
        onClose?.();
        return;
      }

      const message = failures.join(' • ');
      setServerError(message);
      if (succeeded > 0) {
        toast.warn('بخشی از تغییرات ذخیره شد؛ جزئیات در بالای فرم.');
      } else {
        toast.error('ذخیره نشد؛ پیام خطا در بالای فرم است.');
      }
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setForm(initial);
    setErrors({});
    setServerError('');
  };

  const trustBlocked = form.seller_trust && !form.seller_approved_status;

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`ویرایش فروشنده ${title}`}
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose?.()}
    >
      <form
        onSubmit={submit}
        className="card flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl"
        dir="rtl"
      >
        {/* سرصفحه */}
        <div
          className="flex shrink-0 items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-6"
          style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))' }}
        >
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-black sm:text-lg">
              ویرایش فروشنده
              {dirtyKeys.length > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: 'rgba(255,214,10,0.16)', color: 'var(--primary-color)' }}
                >
                  {toFa(dirtyKeys.length)} تغییر
                </span>
              )}
            </h2>
            <p className="mt-0.5 truncate text-xs muted">
              {title}
              {seller.phone ? ` • ${toFa(seller.phone)}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn-ghost !p-2"
            aria-label="بستن"
          >
            <X size={16} />
          </button>
        </div>

        {/* پیام خطای سرور / خلاصه‌ی اعتبارسنجی */}
        {serverError && (
          <div
            className="mx-4 mt-3 flex shrink-0 items-start gap-2 rounded-xl px-3 py-2 text-[11px] font-bold text-red-300 sm:mx-6"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}
            role="alert"
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span className="leading-5">{serverError}</span>
          </div>
        )}

        {/* بدنه‌ی اسکرول‌شو */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 sm:px-6">
          {/* حساب کاربری */}
          <SectionCard
            icon={User}
            title="حساب کاربری"
            desc="نام و نام خانوادگی در پروفایل، فروشگاه و نوبار نمایش داده می‌شود"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="firstname" label="نام">
                <input
                  id="in-firstname"
                  className="input"
                  value={form.firstname}
                  onChange={set('firstname')}
                />
              </Field>
              <Field id="lastname" label="نام خانوادگی">
                <input
                  id="in-lastname"
                  className="input"
                  value={form.lastname}
                  onChange={set('lastname')}
                />
              </Field>
              <Field id="username" label="نام کاربری" hint="یکتا؛ با آن وارد می‌شود" error={errors.username}>
                <input
                  id="in-username"
                  className="input"
                  dir="ltr"
                  value={form.username}
                  onChange={set('username')}
                />
              </Field>
              <Field id="email" label="ایمیل" error={errors.email}>
                <input
                  id="in-email"
                  className="input"
                  dir="ltr"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="name@example.com"
                />
              </Field>
              <Field id="phone" label="موبایل (ثابت)" hint="شماره‌ی ورود کاربر است و اینجا تغییر نمی‌کند">
                <input
                  id="in-phone"
                  className="input opacity-60"
                  dir="ltr"
                  value={toFa(form.phone)}
                  readOnly
                />
              </Field>
            </div>
          </SectionCard>

          {/* هویتی */}
          <SectionCard
            icon={IdCard}
            title="اطلاعات هویتی"
            desc="ادمین محدودیت «قفل هویت بعد از تأیید» را ندارد"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="seller_type" label="نوع فروشنده" error={errors.seller_type}>
                <select
                  id="in-seller_type"
                  className="input"
                  value={form.seller_type}
                  onChange={set('seller_type')}
                >
                  {SELLER_TYPES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                id="national_ID"
                label="کد ملی"
                hint="۱۰ رقم با رقم کنترل"
                error={errors.national_ID}
                legacy={isLegacyInvalid('national_ID')}
              >
                <input
                  id="in-national_ID"
                  className="input"
                  dir="ltr"
                  inputMode="numeric"
                  value={form.national_ID}
                  onChange={set('national_ID')}
                />
              </Field>

              <Field
                id="birth_date"
                label="تاریخ تولد"
                hint="قالب: ۱۳۷۲/۰۴/۱۵"
                error={errors.birth_date}
                legacy={isLegacyInvalid('birth_date')}
              >
                <input
                  id="in-birth_date"
                  className="input"
                  dir="ltr"
                  placeholder="1372/04/15"
                  value={form.birth_date}
                  onChange={set('birth_date')}
                />
              </Field>

              <Field
                id="identity_image_id"
                label="شناسه‌ی تصویر کارت ملی"
                hint="شناسه‌ی فایل در /storage (یا آدرس کامل تصویر)"
              >
                <input
                  id="in-identity_image_id"
                  className="input"
                  dir="ltr"
                  value={form.identity_image_id}
                  onChange={set('identity_image_id')}
                />
              </Field>

              <Field
                id="identity_verification_image_id"
                label="شناسه‌ی تصویر سلفی احراز"
                hint="شناسه‌ی فایل در /storage (یا آدرس کامل تصویر)"
                className="sm:col-span-2"
              >
                <input
                  id="in-identity_verification_image_id"
                  className="input"
                  dir="ltr"
                  value={form.identity_verification_image_id}
                  onChange={set('identity_verification_image_id')}
                />
              </Field>
            </div>
          </SectionCard>

          {/* نشانی */}
          <SectionCard icon={MapPin} title="نشانی فروشنده">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="province" label="استان" error={errors.province}>
                <input
                  id="in-province"
                  className="input"
                  value={form.province}
                  onChange={set('province')}
                />
              </Field>
              <Field id="city" label="شهر" error={errors.city}>
                <input id="in-city" className="input" value={form.city} onChange={set('city')} />
              </Field>
              <Field
                id="full_address"
                label="نشانی کامل"
                error={errors.full_address}
                className="sm:col-span-2"
              >
                <textarea
                  id="in-full_address"
                  className="input min-h-20"
                  value={form.full_address}
                  onChange={set('full_address')}
                />
              </Field>
            </div>
          </SectionCard>

          {/* حساب تسویه */}
          <SectionCard
            icon={CreditCard}
            title="حساب تسویه"
            desc="فقط ادمین می‌تواند بعد از تأیید هم تغییر دهد"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                id="card_number"
                label="شماره کارت"
                hint="۱۶ رقم، الگوریتم لان"
                error={errors.card_number}
                legacy={isLegacyInvalid('card_number')}
              >
                <input
                  id="in-card_number"
                  className="input"
                  dir="ltr"
                  inputMode="numeric"
                  value={form.card_number}
                  onChange={set('card_number')}
                />
              </Field>
              <Field
                id="sheba_number"
                label="شماره شبا"
                hint="IR + ۲۴ رقم"
                error={errors.sheba_number}
                legacy={isLegacyInvalid('sheba_number')}
              >
                <input
                  id="in-sheba_number"
                  className="input"
                  dir="ltr"
                  value={form.sheba_number}
                  onChange={set('sheba_number')}
                  placeholder="IR000000000000000000000000"
                />
              </Field>
              <Field
                id="firstname_lastname"
                label="نام صاحب حساب"
                error={errors.firstname_lastname}
                className="sm:col-span-2"
              >
                <input
                  id="in-firstname_lastname"
                  className="input"
                  value={form.firstname_lastname}
                  onChange={set('firstname_lastname')}
                />
              </Field>
            </div>
          </SectionCard>

          {/* وضعیت‌ها */}
          <SectionCard icon={ShieldCheck} title="وضعیت فروشندگی">
            <div className="grid gap-2 sm:grid-cols-3">
              <Toggle
                checked={form.seller_approved_status}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    seller_approved_status: value,
                    /* رد تأیید → غیرفعال و بی‌اعتماد */
                    seller_active_status: value ? prev.seller_active_status : 'INACTIVE',
                    seller_trust: value ? prev.seller_trust : false,
                  }))
                }
                title="تأییدشده"
                desc="با تأیید، هویت قفل می‌شود"
              />
              <Toggle
                checked={form.seller_active_status === 'ACTIVE'}
                onChange={(value) => set('seller_active_status')(value ? 'ACTIVE' : 'INACTIVE')}
                title="فعال"
                desc="امکان ثبت محصول"
              />
              <Toggle
                checked={form.seller_trust}
                onChange={(value) => set('seller_trust')(value)}
                disabled={!form.seller_approved_status}
                title="مورد اعتماد"
                desc={trustBlocked ? 'ابتدا تأییدشده کن' : 'نشان اعتماد در فروشگاه'}
              />
            </div>
          </SectionCard>
        </div>

        {/* نوار پایانی */}
        <div
          className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6"
          style={{ borderTop: '1px solid var(--border, rgba(255,255,255,0.08))' }}
        >
          <div className="flex items-center gap-1.5 text-[11px] muted">
            {form.seller_trust ? (
              <BadgeCheck size={13} className="text-yellow" />
            ) : (
              <ShieldOff size={13} />
            )}
            {form.seller_trust ? 'نشان اعتماد فعال' : 'بدون نشان اعتماد'}
            <span className="mx-1">•</span>
            {dirtyKeys.length ? `${toFa(dirtyKeys.length)} تغییر ذخیره‌نشده` : 'همه‌چیز ذخیره شده'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={!dirtyKeys.length || saving}
              className="btn-ghost inline-flex items-center gap-1.5 !py-2 text-xs disabled:opacity-40"
            >
              <RotateCcw size={13} />
              بازنشانی
            </button>
            <button type="button" onClick={onClose} className="btn-ghost !py-2 text-sm">
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving || !dirtyKeys.length}
              className="btn-yellow inline-flex items-center gap-1.5 !py-2 text-sm disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default SellerEditorModalComponent;
