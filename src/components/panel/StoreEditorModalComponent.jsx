import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, Upload, Store } from 'lucide-react';
import StorageImageComponent from '../common/StorageImageComponent';
import ImageLightboxComponent from '../common/ImageLightboxComponent';
import { getToken, authHeaders } from '../../utils/helpers/storage';
import { getId } from '../../utils/helpers/response';
import { validateEmailSyntax } from '../../utils/validators/email.validator';
import { validateIRPhoneSyntax } from '../../utils/validators/phone.validator';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

const EMPTY = {
  name: '',
  description: '',
  status: 'ENABLE',
  profile_image_id: '',
  banner_image_id: '',
  email: '',
  phone: '',
  address: '',
};

function StoreEditorModalComponent({ store = null, isAdmin = false, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [zoomFile, setZoomFile] = useState(null);
  const profileRef = useRef(null);
  const bannerRef = useRef(null);

  useEffect(() => {
    if (!store) {
      setForm(EMPTY);
      return;
    }
    setForm({
      name: store.name || '',
      description: store.description || '',
      status: store.status || 'ENABLE',
      profile_image_id: getId(store.profile_image_id) || '',
      banner_image_id: getId(store.banner_image_id) || '',
      email: store.contact_info?.email || '',
      phone: store.contact_info?.phone || store.contact_info?.fax || '',
      address: store.contact_info?.address || '',
    });
  }, [store]);

  const uploadSingle = async (e, field) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(field);
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await axios.post(`${API}/storage`, fd, {
        headers: { Authorization: getToken(), 'Content-Type': 'multipart/form-data' },
      });
      const id = res.data.body?.[0]?._id;
      if (id) {
        setForm((prev) => ({ ...prev, [field]: id }));
        toast.success('تصویر آپلود شد');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطا در آپلود تصویر');
    } finally {
      setUploading('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('نام فروشگاه الزامی است');
    if (!validateEmailSyntax(form.email.trim())) {
      return toast.error('ایمیل تماس معتبر وارد کنید');
    }
    if (form.phone.trim() && !validateIRPhoneSyntax(form.phone.trim())) {
      return toast.error('شماره موبایل تماس باید با 09 و ۱۱ رقم باشد');
    }

    const contact_info = { email: form.email.trim() };
    if (form.phone.trim()) contact_info.phone = form.phone.trim();
    if (form.address.trim()) contact_info.address = form.address.trim();

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      contact_info,
    };
    if (form.profile_image_id) payload.profile_image_id = form.profile_image_id;
    if (form.banner_image_id) payload.banner_image_id = form.banner_image_id;
    if (store) payload.status = form.status;

    setSaving(true);
    try {
      const req = store
        ? axios.put(`${API}/store/${getId(store)}`, payload, authHeaders())
        : axios.post(`${API}/store`, payload, authHeaders());
      await req;
      toast.success(store ? 'فروشگاه ویرایش شد' : 'فروشگاه جدید ایجاد شد');
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطا در ذخیره فروشگاه');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="card rounded-3xl p-6 w-full max-w-xl space-y-4 my-8"
      >
        <div className="flex items-center justify-between gap-2 border-b border-theme pb-3">
          <h2 className="font-black text-lg flex items-center gap-2">
            <Store size={20} className="text-yellow" />
            <span>{store ? `ویرایش فروشگاه: ${store.name}` : 'ایجاد فروشگاه جدید'}</span>
          </h2>
          <button type="button" onClick={onClose} className="btn-ghost !p-2" aria-label="بستن">
            <X size={17} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="relative h-32 rounded-2xl overflow-hidden border border-theme bg-navy">
            {form.banner_image_id ? (
              <StorageImageComponent
                file={form.banner_image_id}
                alt="بنر فروشگاه"
                className="w-full h-full object-cover"
                onZoom={(f, a) => setZoomFile({ file: f, alt: a })}
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-xs text-gray-300">
                بدون تصویر بنر
              </div>
            )}
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              disabled={uploading === 'banner_image_id'}
              className="absolute bottom-2 left-2 btn-yellow !py-1.5 !px-3 text-xs flex items-center gap-1 shadow"
            >
              <Upload size={13} />
              {uploading === 'banner_image_id' ? 'در حال آپلود…' : 'آپلود بنر'}
            </button>
            <input
              ref={bannerRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => uploadSingle(e, 'banner_image_id')}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-theme shrink-0 bg-navy">
              {form.profile_image_id ? (
                <StorageImageComponent
                  file={form.profile_image_id}
                  alt="لوگوی فروشگاه"
                  className="w-full h-full object-cover"
                  onZoom={(f, a) => setZoomFile({ file: f, alt: a })}
                />
              ) : (
                <div className="w-full h-full grid place-items-center font-black text-brand-yellow">
                  {form.name?.[0] || 'ف'}
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => profileRef.current?.click()}
                disabled={uploading === 'profile_image_id'}
                className="btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1"
              >
                <Upload size={13} />
                {uploading === 'profile_image_id' ? 'در حال آپلود…' : 'انتخاب تصویر پروفایل / لوگو'}
              </button>
              <input
                ref={profileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadSingle(e, 'profile_image_id')}
              />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs muted sm:col-span-2">
            نام فروشگاه
            <input
              className="input mt-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>

          <label className="text-xs muted">
            ایمیل تماس (الزامی)
            <input
              className="input mt-1"
              dir="ltr"
              type="email"
              placeholder="shop@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>

          <label className="text-xs muted">
            موبایل تماس (09xxxxxxxxx)
            <input
              className="input mt-1"
              dir="ltr"
              placeholder="0912xxxxxxx"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>

          <label className="text-xs muted sm:col-span-2">
            آدرس فروشگاه
            <input
              className="input mt-1"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>

          <label className="text-xs muted sm:col-span-2">
            توضیحات فروشگاه
            <textarea
              className="input mt-1"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          {store && (
            <label className="text-xs muted sm:col-span-2">
              وضعیت فروشگاه
              <select
                className="input mt-1"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ENABLE">فعال (ENABLE)</option>
                <option value="DISABLE">غیرفعال (DISABLE)</option>
                {isAdmin && <option value="ROOT_DISABLE">غیرفعال ریشه‌ای توسط ادمین (ROOT_DISABLE)</option>}
              </select>
            </label>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-theme">
          <button type="button" onClick={onClose} className="btn-ghost !py-2 text-sm">
            انصراف
          </button>
          <button type="submit" disabled={saving} className="btn-yellow !py-2 text-sm">
            {saving ? 'در حال ذخیره…' : store ? 'ذخیره تغییرات' : 'ساخت فروشگاه'}
          </button>
        </div>

        <ImageLightboxComponent
          file={zoomFile?.file}
          alt={zoomFile?.alt}
          onClose={() => setZoomFile(null)}
        />
      </form>
    </div>
  );
}

export default StoreEditorModalComponent;
