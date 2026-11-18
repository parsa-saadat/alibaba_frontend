import useLocalizedContent from '../../hooks/useLocalizedContent';
import { createPortal } from 'react-dom';
import { language as currentLocale } from '../../i18n/runtime';
import { cleanTranslations } from '../../i18n/translation-helpers';
import ContentLanguage from '../common/locale/ContentLanguageComponent';
import { t as translateText } from '../../i18n/runtime.js';
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, Upload, Store } from 'lucide-react';
import StorageImageComponent from '../common/StorageImageComponent';
import ImageLightboxComponent from '../common/ImageLightboxComponent';
import { getToken, authHeaders, getUser } from '../../utils/helpers/storage';
import { getId } from '../../utils/helpers/response';
import { validateEmailSyntax } from '../../utils/validators/email.validator';
import { validateIRPhoneSyntax } from '../../utils/validators/phone.validator';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

const EMPTY = {
  translations: {},
  name: '',
  description: '',
  status: 'ENABLE',
  profile_image_id: '',
  banner_image_id: '',
  email: '',
  phone: '',
  address: '',
};

function StoreEditorModalComponent({
  store = null,
  isAdmin = false,
  users = [],
  defaultOwnerId = '',
  onClose,
  onSaved,
}) {
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const key = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', key);
      previous?.focus?.();
    };
  }, [onClose]);
  const currentUser = getUser();
  const [form, setForm] = useState(EMPTY);
  const content = useLocalizedContent(form, setForm, ['name', 'description'], 'store');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [zoomFile, setZoomFile] = useState(null);
  /*
   * انتخاب مالک فروشگاه (فقط ادمین، هنگام ساخت)
   * 'self'  = فروشگاه برای خود مدیر
   * 'other' = جستجو و انتخاب هر کاربر دیگر
   */
  const [ownerMode, setOwnerMode] = useState(defaultOwnerId ? 'other' : 'self');
  const [ownerId, setOwnerId] = useState(defaultOwnerId);
  const [owner, setOwner] = useState(null);
  const [ownerQuery, setOwnerQuery] = useState('');
  const [ownerResults, setOwnerResults] = useState([]);
  const [ownerSearching, setOwnerSearching] = useState(false);
  const [ownerCapacity, setOwnerCapacity] = useState(null);
  const [createdStatus, setCreatedStatus] = useState('ENABLE');
  const profileRef = useRef(null);
  const bannerRef = useRef(null);

  useEffect(() => {
    if (!store) {
      setForm(EMPTY);
      setOwnerMode(defaultOwnerId ? 'other' : 'self');
      setOwnerId(defaultOwnerId || getId(currentUser) || '');
      setOwner(null);
      setOwnerQuery('');
      setCreatedStatus('ENABLE');
      return;
    }
    setForm({
      name: store.name || '',
      translations: store.translations || {},
      description: store.description || '',
      status: store.status || 'ENABLE',
      profile_image_id: getId(store.profile_image_id) || '',
      banner_image_id: getId(store.banner_image_id) || '',
      email: store.contact_info?.email || '',
      phone: store.contact_info?.phone || store.contact_info?.fax || '',
      address: store.contact_info?.address || '',
    });
  }, [store]);

  /*
   * ظرفیت پلن مالک انتخابی (فقط ادمین): تعداد فروشگاه‌های فعلی و سقف پلن.
   * ساخت فروشگاه توسط ادمین از محدودیت پلن عبور می‌کند، ولی این اطلاعات
   * نمایش داده می‌شود تا مدیر بداند کاربر در چه وضعیتی است.
   */
  useEffect(() => {
    if (!isAdmin || store || !ownerId) {
      setOwnerCapacity(null);
      return undefined;
    }
    const planId = getId(owner?.seller_plan?.plan_id);
    let cancelled = false;

    Promise.all([
      axios
        .get(`${API}/perm/stores`, { ...authHeaders(), params: { user_id: ownerId, limit: 100 } })
        .catch(() => null),
      planId
        ? axios.get(`${API}/plan/${planId}`, authHeaders()).catch(() => null)
        : Promise.resolve(null),
    ]).then(([storesRes, planRes]) => {
      if (cancelled) return;
      const body = storesRes?.data?.body;
      const list = body?.data || body || [];
      const planBody = planRes?.data?.body;
      const plan = planBody?.plan || planBody?.data || planBody || null;
      setOwnerCapacity({
        used: Array.isArray(list) ? list.length : 0,
        max: Number(plan?.features?.max_shops ?? 0),
        planName: plan?.name || '',
      });
    });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, store, ownerId, owner]);

  /* جستجوی کاربر برای انتخاب مالک فروشگاه (سمت سرور) */
  useEffect(() => {
    if (!isAdmin || store || ownerMode !== 'other') return undefined;
    const q = ownerQuery.trim();
    const controller = new AbortController();
    setOwnerSearching(true);
    const timer = setTimeout(() => {
      axios
        .get(`${API}/user`, {
          ...authHeaders(),
          params: { limit: 12, desc: 1, ...(q ? { search: q } : {}) },
          signal: controller.signal,
        })
        .catch(() => null)
        .then((res) => {
          if (controller.signal.aborted) return;
          const body = res?.data?.body;
          setOwnerResults(body?.data || body || []);
        })
        .finally(() => {
          if (!controller.signal.aborted) setOwnerSearching(false);
        });
    }, 260);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isAdmin, store, ownerMode, ownerQuery]);

  const pickOwner = (u) => {
    setOwner(u);
    setOwnerId(getId(u));
    setOwnerQuery('');
  };

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
        toast.success(translateText('تصویر آپلود شد'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || translateText('خطا در آپلود تصویر'));
    } finally {
      setUploading('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = content.payload();
    if (store?.status === 'ROOT_DISABLE' && !isAdmin)
      return toast.error(translateText('این فروشگاه توسط مدیریت مسدود شده است'));
    if (!form.name.trim()) return toast.error(translateText('نام فروشگاه الزامی است'));
    if (form.name.trim().length > 50)
      return toast.error(translateText('نام فروشگاه حداکثر ۵۰ کاراکتر است'));
    if (form.description.trim().length > 255)
      return toast.error(translateText('توضیحات فروشگاه حداکثر ۲۵۵ کاراکتر است'));
    if (!form.phone.trim()) return toast.error(translateText('شماره تماس فروشگاه الزامی است'));
    if (!validateEmailSyntax(form.email.trim())) {
      return toast.error(translateText('ایمیل تماس معتبر وارد کنید'));
    }
    if (!validateIRPhoneSyntax(form.phone.trim())) {
      return toast.error(translateText('شماره موبایل تماس باید با 09 و ۱۱ رقم باشد'));
    }

    const contact_info = { email: form.email.trim() };
    if (form.phone.trim()) contact_info.phone = form.phone.trim();
    if (form.address.trim()) contact_info.address = form.address.trim();

    if (isAdmin && !store && ownerMode === 'other' && !ownerId) {
      return toast.error(translateText('مالک فروشگاه را انتخاب کنید'));
    }

    const payload = {
      name: form.name.trim(),
      translations: cleanTranslations(form.translations),
      description: form.description.trim() || undefined,
      contact_info,
    };
    if (form.profile_image_id) payload.profile_image_id = form.profile_image_id;
    if (form.banner_image_id) payload.banner_image_id = form.banner_image_id;
    if (store) payload.status = form.status;
    /*
     * ادمین می‌تواند فروشگاه را برای خودش یا هر کاربر دیگری بسازد
     * (اگر user_id فرستاده نشود، بک‌اند مالک را خود مدیر می‌گذارد).
     */
    if (isAdmin && !store) {
      if (ownerMode === 'other' && ownerId) payload.user_id = ownerId;
      if (createdStatus) payload.status = createdStatus;
    }

    setSaving(true);
    try {
      const req = store
        ? axios.put(`${API}/store/${getId(store)}`, payload, authHeaders())
        : axios.post(`${API}/store`, payload, authHeaders());
      await req;
      toast.success(store ? translateText('فروشگاه ویرایش شد') : translateText('فروشگاه جدید ایجاد شد'));
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || translateText('خطا در ذخیره فروشگاه'));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="store-editor-overlay fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="store-editor-dialog card rounded-3xl p-6 w-full max-w-2xl space-y-4"
      >
        <div className="flex items-center justify-between gap-2 border-b border-theme pb-3">
          <h2 className="font-black text-lg flex items-center gap-2">
            <Store size={20} className="text-yellow" />
            <span>
              {store
                ? translateText('ویرایش فروشگاه: {{v0}}', { v0: store.name })
                : translateText('ایجاد فروشگاه جدید')}
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost !p-2"
            aria-label={translateText('بستن')}
          >
            <X size={17} />
          </button>
        </div>

        {/* مالک فروشگاه + وضعیت اولیه — فقط ادمین و فقط هنگام ساخت */}
        {isAdmin && !store ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setOwnerMode('self');
                  setOwner(null);
                  setOwnerId(getId(currentUser));
                  setOwnerQuery('');
                }}
                className={`chip !py-1.5 !px-3 text-[11px] ${ownerMode === 'self' ? 'on' : ''}`}
              >
                {translateText('برای خودم ')}
              </button>
              <button
                type="button"
                onClick={() => setOwnerMode('other')}
                className={`chip !py-1.5 !px-3 text-[11px] ${ownerMode === 'other' ? 'on' : ''}`}
              >
                {translateText('برای کاربر دیگر ')}
              </button>
            </div>

            {ownerMode === 'other' ? (
              <div className="space-y-2">
                <input
                  className="input !py-2 text-xs"
                  placeholder={translateText('جستجوی نام، نام کاربری یا موبایل مالک…')}
                  value={ownerQuery}
                  onChange={(e) => setOwnerQuery(e.target.value)}
                />

                {owner && !ownerQuery ? (
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: 'var(--card2)' }}
                  >
                    <span className="min-w-0 flex-1 text-xs truncate">
                      <b>
                        {[owner.firstname, owner.lastname].filter(Boolean).join(' ') ||
                          owner.username}
                      </b>
                      <span className="muted" dir="ltr">
                        {' '}
                        • {owner.phone}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setOwner(null);
                        setOwnerId('');
                      }}
                      className="btn-ghost !py-1 !px-2 text-[11px]"
                    >
                      {translateText('تغییر ')}
                    </button>
                  </div>
                ) : (
                  <div
                    className="max-h-40 overflow-y-auto rounded-xl border border-theme"
                    style={{ background: 'var(--card2)' }}
                  >
                    {ownerSearching ? (
                      <div className="px-3 py-2 text-[11px] muted">{translateText('در حال جستجو…')}</div>
                    ) : ownerResults.length === 0 ? (
                      <div className="px-3 py-2 text-[11px] muted">
                        {translateText('کاربری پیدا نشد.')}
                      </div>
                    ) : (
                      ownerResults.map((u) => (
                        <button
                          key={getId(u)}
                          type="button"
                          onClick={() => pickOwner(u)}
                          className="w-full px-3 py-2 text-start text-[11px] hover:bg-white/5 flex items-center justify-between gap-2 border-b border-theme last:border-0"
                        >
                          <span className="min-w-0 truncate">
                            {[u.firstname, u.lastname].filter(Boolean).join(' ') ||
                              u.username ||
                              translateText('کاربر')}
                          </span>
                          <span className="muted shrink-0" dir="ltr">
                            {u.phone || u.username}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] muted">
                {translateText('فروشگاه به نام خود شما (')}
                {currentUser?.username || translateText('مدیر')}
                {translateText(') ساخته می‌شود. ')}
              </p>
            )}

            {ownerId && ownerCapacity ? (
              <p
                className="rounded-xl px-3 py-2 text-[11px]"
                style={{
                  background:
                    ownerCapacity.max > 0 && ownerCapacity.used >= ownerCapacity.max
                      ? 'rgba(229,57,53,0.10)'
                      : 'var(--card2)',
                }}
              >
                {ownerCapacity.max > 0 ? (
                  <>
                    {translateText('پلن')}
                    {ownerCapacity.planName ? ` «${ownerCapacity.planName}»` : ''}
                    {translateText(': ظرفیت')} {ownerCapacity.used.toLocaleString(currentLocale)}
                    {translateText(' از')} {ownerCapacity.max.toLocaleString(currentLocale)}
                    {translateText(' فروشگاه ')}
                    {ownerCapacity.used >= ownerCapacity.max
                      ? translateText(
                          ' — ظرفیت پلن این کاربر پر است؛ ساخت فروشگاه با دسترسی مدیر انجام می‌شود.',
                        )
                      : ''}
                  </>
                ) : (
                  translateText(
                    'این کاربر پلن فروشندگی فعالی ندارد؛ ساخت فروشگاه با دسترسی مدیر مجاز است.',
                  )
                )}
              </p>
            ) : null}

            <label className="text-xs muted block">
              {translateText('وضعیت فروشگاه در ابتدا ')}
              <select
                className="input mt-1 !py-2"
                value={createdStatus}
                onChange={(e) => setCreatedStatus(e.target.value)}
              >
                <option value="ENABLE">{translateText('فعال')}</option>
                <option value="DISABLE">{translateText('غیرفعال')}</option>
              </select>
            </label>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="relative h-32 rounded-2xl overflow-hidden border border-theme bg-navy">
            {form.banner_image_id ? (
              <StorageImageComponent
                file={form.banner_image_id}
                alt={translateText('بنر فروشگاه')}
                className="w-full h-full object-cover"
                onZoom={(f, a) => setZoomFile({ file: f, alt: a })}
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-xs text-gray-300">
                {translateText('بدون تصویر بنر ')}
              </div>
            )}
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              disabled={uploading === 'banner_image_id'}
              className="absolute bottom-2 start-2 btn-yellow !py-1.5 !px-3 text-xs flex items-center gap-1 shadow"
            >
              <Upload size={13} />
              {uploading === 'banner_image_id' ? translateText('در حال آپلود…') : translateText('آپلود بنر')}
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
                  alt={translateText('لوگوی فروشگاه')}
                  className="w-full h-full object-cover"
                  onZoom={(f, a) => setZoomFile({ file: f, alt: a })}
                />
              ) : (
                <div className="w-full h-full grid place-items-center font-black text-brand-yellow">
                  {form.name?.[0] || translateText('ف')}
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
                {uploading === 'profile_image_id'
                  ? translateText('در حال آپلود…')
                  : translateText('انتخاب تصویر پروفایل / لوگو')}
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

        <ContentLanguage editor={content} />
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs muted sm:col-span-2">
            {translateText('نام فروشگاه ')}
            <input
              className="input mt-1"
              value={content.value('name')}
              dir={content.dir}
              aria-label={`${content.locale} name`}
              lang={content.locale}
              onChange={(e) => content.update('name', e.target.value)}
              placeholder={content.placeholder('name')}
            />
          </label>

          <label className="text-xs muted">
            {translateText('ایمیل تماس (الزامی) ')}
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
            {translateText('موبایل تماس (09xxxxxxxxx) ')}
            <input
              className="input mt-1"
              dir="ltr"
              placeholder="0912xxxxxxx"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>

          <label className="text-xs muted sm:col-span-2">
            {translateText('آدرس فروشگاه ')}
            <input
              className="input mt-1"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>

          <label className="text-xs muted sm:col-span-2">
            {translateText('توضیحات فروشگاه ')}
            <textarea
              className="input mt-1"
              rows={3}
              value={content.value('description')}
              dir={content.dir}
              aria-label={`${content.locale} description`}
              lang={content.locale}
              onChange={(e) => content.update('description', e.target.value)}
              placeholder={content.placeholder('description')}
            />
          </label>

          {store && (
            <label className="text-xs muted sm:col-span-2">
              {translateText('وضعیت فروشگاه ')}
              <select
                className="input mt-1"
                value={form.status}
                disabled={!isAdmin && store.status === 'ROOT_DISABLE'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ENABLE">{translateText('فعال')}</option>
                <option value="DISABLE">{translateText('غیرفعال (موقتاً بسته)')}</option>
                {(isAdmin || store.status === 'ROOT_DISABLE') && (
                  <option value="ROOT_DISABLE" disabled={!isAdmin}>
                    {translateText('مسدود توسط مدیریت ')}
                  </option>
                )}
              </select>
              {form.status === 'ROOT_DISABLE' && (
                <span className="mt-1.5 block text-[11px]" style={{ color: '#e53935' }}>
                  {isAdmin
                    ? translateText(
                        'فروشگاه مسدود است؛ فروشنده نمی‌تواند آن را ویرایش یا فعال کند و کالاهایش خرید نمی‌شود.',
                      )
                    : translateText(
                        'این فروشگاه توسط مدیریت مسدود شده است؛ برای رفع مسدودی با پشتیبانی تماس بگیرید.',
                      )}
                </span>
              )}
            </label>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-theme">
          <button type="button" onClick={onClose} className="btn-ghost !py-2 text-sm">
            {translateText('انصراف ')}
          </button>
          <button type="submit" disabled={saving} className="btn-yellow !py-2 text-sm">
            {saving
              ? translateText('در حال ذخیره…')
              : store
                ? translateText('ذخیره تغییرات')
                : translateText('ساخت فروشگاه')}
          </button>
        </div>

        <ImageLightboxComponent
          file={zoomFile?.file}
          alt={zoomFile?.alt}
          onClose={() => setZoomFile(null)}
        />
      </form>
    </div>,
    document.body,
  );
}

export default StoreEditorModalComponent;
