import { direction as i18nDirection } from '../../i18n/runtime';
import { t as translateText } from '../../i18n/runtime.js';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader2, MapPin, Save, X } from 'lucide-react';
import { API } from '../../config/api';
import { authHeaders } from '../../utils/helpers/storage';

/*
 * پاپ‌آپ ثبت نشانی
 * ----------------
 * هرجا کاربر باید نشانی وارد کند (تسویه حساب، پروفایل، ...) همین مودال باز می‌شود؛
 * دقیقاً مثل بخش «نشانی‌های من». فرم داخل صفحه باز نمی‌شود تا صفحه شلوغ و بلند نشود.
 */

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
  { key: 'full_name', label: translateText("نام و نام خانوادگی گیرنده"), placeholder: translateText("مثلاً سارا محمدی"), span: 2, autoComplete: 'name' },
  { key: 'province', label: translateText("استان"), placeholder: translateText("تهران"), autoComplete: 'address-level1' },
  { key: 'city', label: translateText("شهر"), placeholder: translateText("تهران"), autoComplete: 'address-level2' },
  { key: 'neighborhood', label: translateText("محله"), placeholder: translateText("ولنجک") },
  { key: 'postal_code', label: translateText("کد پستی (۱۰ رقم)"), placeholder: '1234567890', ltr: true, numeric: true, maxLength: 10 },
  { key: 'full_address', label: translateText("نشانی کامل"), placeholder: translateText("خیابان، کوچه، ساختمان"), span: 2, autoComplete: 'street-address' },
  { key: 'building_number', label: translateText("پلاک"), placeholder: '12', ltr: true, numeric: true },
  { key: 'unit', label: translateText("واحد"), placeholder: '3', ltr: true, numeric: true },
];

function AddressFormModalComponent({
  open,
  onClose,
  userId,
  makeDefault = false,
  onSaved,
  /* حالت ویرایش: نشانی موجود (فیلدهای address یا خود شیء) و شناسه‌اش */
  initial = null,
  addressId = null,
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(addressId);

  /* با هر بار باز شدن: در حالت ویرایش مقادیر موجود، در غیر این صورت فرم خالی */
  useEffect(() => {
    if (!open) return;
    const src = initial?.address || initial || null;
    setForm(
      src
        ? {
            full_name: src.full_name || '',
            province: src.province || '',
            city: src.city || '',
            neighborhood: src.neighborhood || '',
            full_address: src.full_address || '',
            building_number: src.building_number ? String(src.building_number) : '',
            unit: src.unit ? String(src.unit) : '',
            postal_code: src.postal_code || '',
          }
        : EMPTY,
    );
    setErrors({});
    setSaving(false);
  }, [open, initial, addressId]);

  /* بستن با ESC و قفل اسکرول پس‌زمینه */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev));
  };

  const validate = () => {
    const next = {};
    if (form.full_name.trim().length < 3) next.full_name = translateText("نام گیرنده را کامل وارد کنید.");
    if (!form.province.trim()) next.province = translateText("استان را وارد کنید.");
    if (!form.city.trim()) next.city = translateText("شهر را وارد کنید.");
    if (!form.neighborhood.trim()) next.neighborhood = translateText("محله را وارد کنید.");
    if (!form.full_address.trim()) next.full_address = translateText("نشانی کامل را وارد کنید.");
    if (!/^\d{10}$/.test(String(form.postal_code).replace(/\D/g, ''))) {
      next.postal_code = translateText("کد پستی باید ۱۰ رقم باشد.");
    }
    if (!Number(form.building_number)) next.building_number = translateText("پلاک معتبر نیست.");
    if (!Number(form.unit)) next.unit = translateText("واحد معتبر نیست.");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (event) => {
    event.preventDefault();
    if (!userId) {
      toast.error(translateText("برای ثبت نشانی باید وارد حساب شوید."));
      return;
    }
    if (!validate()) {
      toast.error(translateText("لطفاً موارد مشخص‌شده را اصلاح کنید."));
      return;
    }

    const payload = {
      address: {
        full_name: form.full_name.trim(),
        province: form.province.trim(),
        city: form.city.trim(),
        neighborhood: form.neighborhood.trim(),
        full_address: form.full_address.trim(),
        building_number: Number(form.building_number),
        unit: Number(form.unit),
        postal_code: String(form.postal_code).replace(/\D/g, ''),
        is_default: makeDefault,
      },
    };

    setSaving(true);
    const request = isEdit
      ? axios.put(`${API}/users/${userId}/address/${addressId}`, payload, authHeaders())
      : axios.post(`${API}/users/${userId}/address`, payload, authHeaders());

    request
      .then((res) => {
        toast.success(isEdit ? translateText("نشانی ویرایش شد") : translateText("نشانی ثبت شد"));
        onSaved?.(res?.data?.body || null);
        onClose?.();
      })
      .catch((err) => toast.error(err.response?.data?.message || translateText("ثبت نشانی ناموفق بود.")))
      .finally(() => setSaving(false));
  };

  return (
    <div
      dir={i18nDirection}
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-modal-title"
    >
      <button
        type="button"
        aria-label={translateText("بستن فرم نشانی")}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <form
        onSubmit={submit}
        className="card relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-4 shadow-2xl sm:rounded-3xl sm:p-5"
        noValidate
      >
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-theme pb-3">
          <h2 id="address-modal-title" className="flex items-center gap-2 text-base font-black">
            <MapPin size={17} style={{ color: 'var(--accent-text)' }} />
            {isEdit ? translateText("ویرایش نشانی") : translateText("نشانی جدید")}
          </h2>
          <button type="button" onClick={onClose} aria-label={translateText("بستن")} className="btn-ghost !p-2">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map((field) => {
            const error = errors[field.key];
            return (
              <label key={field.key} className={field.span === 2 ? 'block sm:col-span-2' : 'block'}>
                <span className="mb-1.5 block text-[11px] font-bold">{field.label}</span>
                <input
                  className="input !py-2 text-xs"
                  value={form[field.key]}
                  onChange={(e) => setField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  dir={field.ltr ? 'ltr' : undefined}
                  inputMode={field.numeric ? 'numeric' : undefined}
                  maxLength={field.maxLength}
                  autoComplete={field.autoComplete}
                  style={error ? { borderColor: 'var(--color-danger)' } : undefined}
                />
                {error ? (
                  <span className="mt-1 block text-[11px]" style={{ color: 'var(--color-danger)' }}>
                    {error}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-theme pt-3">
          <button type="button" onClick={onClose} className="btn-ghost !py-2 text-xs">{translateText("انصراف ")}</button>
          <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2 !py-2 text-xs disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? translateText("در حال ذخیره…") : isEdit ? translateText("ذخیره تغییرات") : translateText("ذخیره نشانی")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddressFormModalComponent;
