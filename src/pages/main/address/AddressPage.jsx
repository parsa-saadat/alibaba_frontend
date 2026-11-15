import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Hash,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

import { useShop } from '../../../contexts/ShopContext';
import { authHeaders } from '../../../utils/helpers/storage';
import { toFa } from '../../../utils/helpers/format';
import AddressFormModalComponent from '../../../components/address/AddressFormModalComponent';

const API =
  import.meta.env.VITE_APP_API_URL ||
  import.meta.env.VITE_API_URL ||
  '/api';

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

const FIELDS = [
  { key: 'full_name', label: 'نام و نام خانوادگی گیرنده', col: 2, placeholder: 'مثلاً علی کریمی' },
  { key: 'province', label: 'استان', placeholder: 'تهران' },
  { key: 'city', label: 'شهر', placeholder: 'تهران' },
  { key: 'neighborhood', label: 'محله', placeholder: 'ونک' },
  { key: 'postal_code', label: 'کد پستی (۱۰ رقم)', placeholder: '1435896321', ltr: true, numeric: true, maxLength: 10 },
  { key: 'full_address', label: 'نشانی کامل', col: 2, placeholder: 'خیابان، کوچه، پلاک و نشانه‌های محلی' },
  { key: 'building_number', label: 'پلاک', numeric: true },
  { key: 'unit', label: 'واحد', numeric: true },
];

/* ------------------------------------------------------------------ */
/* اجزای کوچک                                                          */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="card rounded-2xl p-4" aria-hidden="true">
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton mt-3 h-3 w-4/5" />
      <div className="skeleton mt-2 h-3 w-3/5" />
      <div className="mt-4 flex gap-2">
        <div className="skeleton h-8 w-20" />
        <div className="skeleton h-8 w-16" />
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="card rounded-3xl px-6 py-14 text-center">
      <span
        className="mx-auto grid h-16 w-16 place-items-center rounded-2xl"
        style={{ background: 'color-mix(in srgb, var(--primary-color) 16%, transparent)' }}
      >
        <MapPin size={28} style={{ color: 'var(--accent-text)' }} />
      </span>
      <h2 className="mt-4 text-base font-black">هنوز نشانی‌ای ثبت نکرده‌اید</h2>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-6 muted">
        برای ثبت سفارش، دست‌کم یک نشانی تحویل لازم است. نشانی را یک‌بار ثبت کنید تا در خریدهای بعدی
        سریع‌تر باشد.
      </p>
      <button type="button" onClick={onAdd} className="btn-yellow mt-5 inline-flex items-center gap-2 !py-2.5">
        <Plus size={16} />
        افزودن نشانی
      </button>
    </div>
  );
}

function Field({ field, value, onChange }) {
  return (
    <label className={field.col === 2 ? 'sm:col-span-2' : ''}>
      <span className="mb-1.5 block text-[11px] font-bold muted">{field.label}</span>
      <input
        className="input !py-2.5 text-sm"
        dir={field.ltr ? 'ltr' : undefined}
        inputMode={field.numeric ? 'numeric' : undefined}
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* صفحه نشانی‌ها                                                       */
/* ------------------------------------------------------------------ */

function AddressPage() {
  const { user } = useShop();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const userId = user?._id;

  const loadAddresses = useCallback(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    axios
      .get(`${API}/users/${userId}/address`, authHeaders())
      .then((res) => {
        const body = res.data?.body;
        setAddresses(Array.isArray(body) ? body : body?.data || []);
      })
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const closeForm = () => {
    setFormOpen(false);
    setForm(EMPTY);
    setFormError('');
  };

  const submit = (event) => {
    event.preventDefault();
    if (!userId) return;

    const required = FIELDS.filter((f) => f.key !== 'unit');
    const missing = required.find((f) => !String(form[f.key] || '').trim());
    if (missing) {
      setFormError(`«${missing.label}» را وارد کنید.`);
      return;
    }
    if (form.postal_code && !/^\d{10}$/.test(String(form.postal_code).trim())) {
      setFormError('کد پستی باید ۱۰ رقم باشد.');
      return;
    }

    setFormError('');
    setSaving(true);

    axios
      .post(
        `${API}/users/${userId}/address`,
        {
          address: {
            full_name: form.full_name.trim(),
            province: form.province.trim(),
            city: form.city.trim(),
            neighborhood: form.neighborhood.trim(),
            full_address: form.full_address.trim(),
            building_number: Number(form.building_number) || 0,
            unit: Number(form.unit) || 0,
            postal_code: String(form.postal_code).trim(),
            is_default: addresses.length === 0,
          },
        },
        authHeaders(),
      )
      .then(() => {
        toast.success('نشانی ثبت شد');
        closeForm();
        loadAddresses();
      })
      .catch((err) => setFormError(err.response?.data?.message || 'ثبت نشانی ناموفق بود.'))
      .finally(() => setSaving(false));
  };

  const remove = () => {
    if (!userId || !deleteTarget) return;
    const id = deleteTarget._id;
    setBusyId(id);
    axios
      .delete(`${API}/users/${userId}/address/${id}`, authHeaders())
      .then(() => {
        toast.success('نشانی حذف شد');
        setDeleteTarget(null);
        loadAddresses();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'حذف نشانی ناموفق بود'))
      .finally(() => setBusyId(''));
  };

  const makeDefault = (item) => {
    if (!userId) return;
    const ad = item.address || item;
    setBusyId(item._id);
    axios
      .put(
        `${API}/users/${userId}/address/${item._id}`,
        {
          address: {
            full_name: ad.full_name || '',
            province: ad.province || '',
            city: ad.city || '',
            neighborhood: ad.neighborhood || '',
            full_address: ad.full_address || '',
            building_number: Number(ad.building_number) || 0,
            unit: Number(ad.unit) || 0,
            postal_code: ad.postal_code || '',
            is_default: true,
          },
        },
        authHeaders(),
      )
      .then(() => {
        toast.success('نشانی پیش‌فرض تغییر کرد');
        loadAddresses();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'تغییر پیش‌فرض ناموفق بود'))
      .finally(() => setBusyId(''));
  };

  const copyAddress = async (item) => {
    const ad = item.address || item;
    const text = [
      ad.full_name,
      `${ad.province || ''}، ${ad.city || ''}، ${ad.neighborhood || ''}`,
      ad.full_address,
      `پلاک ${ad.building_number || '-'}، واحد ${ad.unit || '-'}`,
      `کد پستی ${ad.postal_code || '-'}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item._id);
      setTimeout(() => setCopiedId(''), 1500);
    } catch {
      toast.error('کپی نشد؛ دستی انتخاب کنید.');
    }
  };

  const normalised = useMemo(
    () => addresses.map((item) => ({ ...item, ad: item.address || item })),
    [addresses],
  );

  /* ---------------- حالت‌های بدون کاربر ---------------- */

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <div className="card rounded-3xl p-10 text-center">
          <span
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: 'color-mix(in srgb, var(--primary-color) 16%, transparent)' }}
          >
            <MapPin size={28} style={{ color: 'var(--accent-text)' }} />
          </span>
          <h1 className="mt-4 text-base font-black">برای مدیریت نشانی‌ها وارد شوید</h1>
          <p className="mt-2 text-xs muted">پس از ورود می‌توانید نشانی‌های تحویل سفارش را ثبت و ویرایش کنید.</p>
          <Link to="/auth/pre" className="btn-yellow mt-5 inline-flex items-center gap-2">
            ورود به حساب
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-5 sm:px-4 sm:py-6">
      {/* هدر صفحه */}
      <header className="card mb-4 flex flex-col gap-3 rounded-3xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
            style={{ background: 'color-mix(in srgb, var(--primary-color) 16%, transparent)' }}
          >
            <MapPin size={20} style={{ color: 'var(--accent-text)' }} />
          </span>
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-lg font-black sm:text-xl">
              نشانی‌های من
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-black"
                style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
              >
                {toFa(normalised.length)}
              </span>
            </h1>
            <p className="mt-0.5 text-[11px] muted">نشانی پیش‌فرض در ثبت سفارش به‌صورت خودکار انتخاب می‌شود.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="btn-yellow inline-flex items-center justify-center gap-1.5 !py-2.5 text-sm"
        >
          <Plus size={16} />
          افزودن نشانی جدید
        </button>
      </header>

      {/* لیست */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : normalised.length === 0 ? (
        <EmptyState onAdd={() => setFormOpen(true)} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {normalised.map((item) => {
            const ad = item.ad;
            const isDefault = ad.is_default === true;
            const busy = busyId === item._id;

            return (
              <article
                key={item._id}
                className="card flex flex-col rounded-2xl p-4 transition hover:border-[var(--primary-color)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Building2 size={15} className="shrink-0" style={{ color: 'var(--accent-text)' }} />
                    <h2 className="truncate text-sm font-black">{ad.full_name || 'نشانی بدون نام'}</h2>
                  </div>
                  {isDefault && (
                    <span
                      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                      style={{ background: '#17994f' }}
                    >
                      <CheckCircle2 size={11} />
                      پیش‌فرض
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs leading-6" style={{ color: 'var(--text)' }}>
                  {[ad.province, ad.city, ad.neighborhood].filter(Boolean).join('، ')}
                </p>
                <p className="mt-0.5 text-xs leading-6 muted">{ad.full_address || '—'}</p>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] muted">
                  <span className="inline-flex items-center gap-1">
                    پلاک <b style={{ color: 'var(--text)' }}>{toFa(ad.building_number ?? '-')}</b>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    واحد <b style={{ color: 'var(--text)' }}>{toFa(ad.unit ?? '-')}</b>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Hash size={11} className="shrink-0" />
                    <b style={{ color: 'var(--text)' }} dir="ltr">
                      {toFa(ad.postal_code || '-')}
                    </b>
                  </span>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-theme pt-3">
                  <button
                    type="button"
                    onClick={() => setEditTarget(item)}
                    className="btn-ghost inline-flex items-center gap-1 !py-1.5 !px-2.5 text-[11px]"
                  >
                    <Pencil size={12} />
                    ویرایش
                  </button>

                  {!isDefault && (
                    <button
                      type="button"
                      onClick={() => makeDefault(item)}
                      disabled={busy}
                      className="btn-ghost inline-flex items-center gap-1 !py-1.5 !px-2.5 text-[11px] disabled:opacity-50"
                    >
                      <Check size={12} />
                      پیش‌فرض
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => copyAddress(item)}
                    className="btn-ghost inline-flex items-center gap-1 !py-1.5 !px-2.5 text-[11px]"
                  >
                    {copiedId === item._id ? (
                      <Check size={12} className="text-emerald-500" />
                    ) : (
                      <Copy size={12} />
                    )}
                    {copiedId === item._id ? 'کپی شد' : 'کپی'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="btn-ghost ms-auto inline-flex items-center gap-1 !p-2 text-[11px] text-rose-500"
                    aria-label="حذف نشانی"
                    title="حذف نشانی"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* مودال ویرایش نشانی (پاپ‌آپ، بدون تغییر صفحه) */}
      <AddressFormModalComponent
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        userId={userId}
        addressId={editTarget?._id}
        initial={editTarget}
        makeDefault={Boolean(editTarget?.is_default || editTarget?.address?.is_default)}
        onSaved={() => {
          setEditTarget(null);
          loadAddresses();
        }}
      />

      {/* مودال افزودن نشانی */}
      {formOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-address-title"
        >
          <button
            type="button"
            aria-label="بستن فرم نشانی"
            onClick={closeForm}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <form
            onSubmit={submit}
            className="card relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border p-4 shadow-2xl sm:rounded-3xl sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-theme pb-3">
              <h2 id="add-address-title" className="flex items-center gap-2 text-base font-black">
                <MapPin size={17} style={{ color: 'var(--accent-text)' }} />
                نشانی جدید
              </h2>
              <button type="button" onClick={closeForm} aria-label="بستن" className="btn-ghost !p-2">
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <Field
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  onChange={(key, value) => {
                    setFormError('');
                    setForm((prev) => ({ ...prev, [key]: value }));
                  }}
                />
              ))}
            </div>

            {formError && (
              <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-3 py-2 text-[11px] font-bold text-rose-500">
                <AlertCircle size={13} className="shrink-0" />
                {formError}
              </p>
            )}

            <div className="mt-4 flex items-center gap-2 border-t border-theme pt-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-yellow inline-flex flex-1 items-center justify-center gap-2 !py-2.5 text-sm disabled:opacity-60"
              >
                {saving ? 'در حال ذخیره…' : 'ذخیره نشانی'}
              </button>
              <button type="button" onClick={closeForm} className="btn-ghost !py-2.5 text-sm">
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* تأیید حذف */}
      {deleteTarget && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-address-title"
        >
          <button
            type="button"
            aria-label="بستن"
            onClick={() => setDeleteTarget(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="card relative z-10 w-full max-w-sm rounded-3xl border p-5 text-center shadow-2xl">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/12">
              <Trash2 size={20} className="text-rose-500" />
            </span>
            <h2 id="delete-address-title" className="mt-3 text-sm font-black">
              حذف این نشانی؟
            </h2>
            <p className="mt-1.5 text-[11px] leading-6 muted">
              «{deleteTarget.ad?.full_name || 'نشانی'}» برای همیشه حذف می‌شود. این کار قابل بازگشت نیست.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={remove}
                disabled={busyId === deleteTarget._id}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-500 py-2.5 text-sm font-black text-white transition hover:bg-rose-600 disabled:opacity-60"
              >
                <Trash2 size={15} />
                حذف کن
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="btn-ghost flex-1 !py-2.5 text-sm"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddressPage;
