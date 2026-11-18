import useLocalizedContent from '../../hooks/useLocalizedContent';
import MoneyInput, { usePriceEntry } from './PriceInputComponent';
import { language } from '../../i18n/runtime';
import { cleanTranslations } from '../../i18n/translation-helpers';
import ContentLanguage from '../common/locale/ContentLanguageComponent';
import { t as translateText } from '../../i18n/runtime.js';
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, Upload, Plus, ArrowRight, Save, Star, Hash, KeyRound } from 'lucide-react';
import MarkdownEditorComponent, { isValidBackendMarkdown } from './MarkdownEditorComponent';
import ErrorBoundaryComponent from '../common/ErrorBoundaryComponent';
import StorageImageComponent from '../common/StorageImageComponent';
import ImageLightboxComponent from '../common/ImageLightboxComponent';
import JalaliDateTimePicker from '../common/JalaliDateTimePicker';
import { getToken, authHeaders } from '../../utils/helpers/storage';
import { getId } from '../../utils/helpers/response';
import { measurementValue, measurementUnit, toFa, formatPrice } from '../../utils/helpers/format';
import {
  faDigits,
  gregorianYearOfJalali,
  jalaliYearOfGregorian,
  parseLocalInputValue,
} from '../../utils/helpers/jalali';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

const DEFAULT_FORM = {
  name: '',
  store_id: '',
  category_id: '',
  brand: '',
  short_description: '',
  description: '',
  production: new Date().getFullYear(),
  images_id: [],
  price_amount: 100,
  translations: {},
  has_discount: false,
  discount_percentage: 10,
  discount_expiry: '',
  stock: 10,
  stock_status: 'IN_STOCK',
  status: 'ACTIVE',
  visibility: 'PUBLIC',
  warranty: false,
  tags: [],
  width_value: 10,
  width_unit: 'CM',
  height_value: 10,
  height_unit: 'CM',
  weight_value: 200,
  weight_unit: 'G',
};

function toDateInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 16);
}

/* سال‌های شمسی برای فیلد «سال تولید»؛ بک‌اند سال میلادی می‌خواهد (۱۹۰۰ تا امسال) */
const currentJalaliYear =
  language === 'fa' ? jalaliYearOfGregorian(new Date().getFullYear()) : new Date().getFullYear();
const JALALI_YEARS = Array.from({ length: 26 }, (_, i) => currentJalaliYear - i);

/* خلاصه‌ی خوانای تاریخ تخفیف برای زیر فیلد شمسی */
const expiryHint = (value) => {
  const date = parseLocalInputValue(value);
  if (!date) return translateText('بدون تاریخ انقضا (تخفیف همیشه فعال است)');
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (days < 0) return translateText('این تاریخ گذشته است؛ تخفیف روی سایت اعمال نمی‌شود');
  if (days === 0) return translateText('امروز منقضی می‌شود');
  return translateText('{{v0}} روز دیگر منقضی می‌شود', { v0: faDigits(days) });
};

function ProductEditorComponent({
  product = null,
  stores = [],
  categories = [],
  isAdmin = false,
  onCancel,
  onSaved,
}) {
  const priceEntry = usePriceEntry(product?.base_price || product?.price, product?._id || 'new');
  const [form, setForm] = useState(DEFAULT_FORM);
  const content = useLocalizedContent(form, setForm, [
    'name',
    'short_description',
    'description',
    'tags',
  ]);
  const [tagInput, setTagInput] = useState('');
  useEffect(() => setTagInput(''), [content.locale]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [zoomFile, setZoomFile] = useState(null);
  const [imageIdOpen, setImageIdOpen] = useState(false);
  const [imageIdInput, setImageIdInput] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (!product) {
      setForm({
        ...DEFAULT_FORM,
        store_id: stores.find((s) => !s.status || s.status === 'ENABLE')
          ? getId(stores.find((s) => !s.status || s.status === 'ENABLE'))
          : '',
        category_id: categories[0] ? getId(categories[0]) : '',
      });
      return;
    }
    const pct = product.discount?.percentage || 0;
    setForm({
      name: product.name || '',
      store_id: getId(product.store_id) || '',
      category_id: getId(product.category_id) || '',
      brand: product.brand || '',
      short_description: product.short_description || product.name || '',
      description: product.description || DEFAULT_FORM.description,
      production: product.production || new Date().getFullYear(),
      images_id: Array.isArray(product.images_id)
        ? product.images_id.map(getId).filter(Boolean)
        : [],
      price_amount: (product.base_price || product.price)?.amount ?? 100,
      translations: product.translations || {},
      has_discount: pct > 0,
      discount_percentage: pct || 10,
      discount_expiry: toDateInputValue(product.discount?.expirationDate),
      stock: product.stock ?? 0,
      stock_status: product.stock_status || 'IN_STOCK',
      status: product.status || 'ACTIVE',
      visibility: product.visibility || 'PUBLIC',
      warranty: Boolean(product.warranty),
      tags: Array.isArray(product.tags) ? product.tags : [],
      width_value: measurementValue(product.dimensions?.width) ?? 10,
      width_unit: measurementUnit(product.dimensions?.width, 'CM').toUpperCase() || 'CM',
      height_value: measurementValue(product.dimensions?.height) ?? 10,
      height_unit: measurementUnit(product.dimensions?.height, 'CM').toUpperCase() || 'CM',
      weight_value: measurementValue(product.weight) ?? 200,
      weight_unit: measurementUnit(product.weight, 'G').toUpperCase() || 'G',
    });
  }, [product, stores, categories]);

  const uploadImages = async (files) => {
    if (!files?.length) return [];
    setUploading(true);
    try {
      const fd = new FormData();
      [...files].forEach((f) => fd.append('files', f));
      const res = await axios.post(`${API}/storage`, fd, {
        headers: { Authorization: getToken(), 'Content-Type': 'multipart/form-data' },
      });
      return (res.data.body || []).map((f) => f._id);
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    try {
      const ids = await uploadImages(e.target.files);
      if (ids.length) {
        setForm((prev) => ({ ...prev, images_id: [...prev.images_id, ...ids] }));
        toast.success(translateText('تصاویر آپلود شد'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || translateText('خطا در آپلود تصویر'));
    }
    e.target.value = '';
  };

  /* جابه‌جایی تصویر به جایگاه اول = انتخاب به‌عنوان «تصویر اصلی» محصول */
  const makeMainImage = (index) => {
    if (index <= 0) return;
    setForm((prev) => {
      const next = [...prev.images_id];
      const [picked] = next.splice(index, 1);
      return { ...prev, images_id: [picked, ...next] };
    });
    toast.success(translateText('تصویر اصلی محصول تغییر کرد'));
  };

  /* افزودن تصویر با آیدی فایل در فضای ذخیره‌سازی (فقط مدیر) */
  const addImageById = () => {
    const ids = imageIdInput
      .split(/[\s,،\n]+/)
      .map((token) => token.trim())
      .map((token) => token.split('/').filter(Boolean).pop() || '')
      .filter(Boolean);

    if (!ids.length) return toast.error(translateText('آیدی تصویر را وارد کنید'));
    if (!/^[a-zA-Z0-9_-]{6,64}$/.test(ids[0])) {
      return toast.error(translateText('آیدی تصویر معتبر نیست (حداقل ۶ کاراکتر حرف/رقم)'));
    }
    const fresh = ids.filter((id) => !form.images_id.includes(id));
    if (!fresh.length) return toast.error(translateText('این تصویر از قبل در گالری هست'));
    const room = 20 - form.images_id.length;
    if (room <= 0) return toast.error(translateText('حداکثر ۲۰ تصویر مجاز است'));

    setForm((prev) => ({ ...prev, images_id: [...prev.images_id, ...fresh.slice(0, room)] }));
    setImageIdInput('');
    toast.success(
      fresh.length > 1 ? translateText('تصاویر اضافه شدند') : translateText('تصویر اضافه شد'),
    );
  };

  const handleMarkdownUpload = async (file) => {
    try {
      const [id] = await uploadImages([file]);
      return id ? `${API}/storage/${id}` : '';
    } catch (err) {
      toast.error(err.response?.data?.message || translateText('خطا در آپلود تصویر'));
      return '';
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (content.value('tags').length >= 20)
      return toast.warn(translateText('حداکثر ۲۰ برچسب مجاز است'));
    if (!content.value('tags').includes(t)) {
      content.update('tags', [...content.value('tags'), t]);
    }
    setTagInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = content.payload();
    if (!form.name.trim()) return toast.error(translateText('نام محصول الزامی است'));
    if (!product && !form.store_id) return toast.error(translateText('انتخاب فروشگاه الزامی است'));
    if (!form.category_id) return toast.error(translateText('انتخاب دسته‌بندی الزامی است'));
    if (!form.brand.trim()) return toast.error(translateText('نام برند الزامی است'));
    if (!form.short_description.trim()) return toast.error(translateText('توضیح کوتاه الزامی است'));
    if (!isValidBackendMarkdown(form.description)) {
      return toast.error(
        translateText(
          'توضیحات محصول باید شامل حداقل یک عنصر Markdown (تیتر ##، لیست - یا متن **ضخیم**) باشد',
        ),
      );
    }
    if (!form.images_id.length)
      return toast.error(translateText('حداقل یک تصویر برای محصول آپلود کنید'));

    let submittedPrice;
    try {
      submittedPrice = priceEntry.payload();
    } catch (error) {
      return toast.error(error.message);
    }

    let discountPayload = null;
    if (form.has_discount) {
      const pct = Number(form.discount_percentage);
      if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
        return toast.error(translateText('درصد تخفیف باید بین ۱ تا ۱۰۰ باشد'));
      }
      if (!form.discount_expiry || new Date(form.discount_expiry) <= new Date()) {
        return toast.error(translateText('تاریخ انقضای تخفیف باید در آینده باشد'));
      }
      discountPayload = {
        percentage: pct,
        expirationDate: new Date(form.discount_expiry).toISOString(),
      };
    }

    const basePayload = {
      name: form.name.trim(),
      category_id: form.category_id,
      brand: form.brand.trim(),
      short_description: form.short_description.trim(),
      description: form.description,
      production: Number(form.production),
      images_id: form.images_id,
      price: submittedPrice,
      translations: cleanTranslations(form.translations),
      discount: discountPayload,
      stock: Number(form.stock),
      warranty: Boolean(form.warranty),
      tags: form.tags,
      dimensions: {
        width: { value: Number(form.width_value), unit: form.width_unit },
        height: { value: Number(form.height_value), unit: form.height_unit },
      },
      weight: { value: Number(form.weight_value), unit: form.weight_unit },
    };

    if (!product) {
      basePayload.store_id = form.store_id;
      basePayload.visibility = form.visibility;
    } else {
      /* بک‌اند اجازه نمی‌دهد وضعیت موجودی با تعداد موجودی نخواند؛ وضعیت را از تعداد می‌گیریم */
      const derivedStock = Number(form.stock) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';
      if (derivedStock !== product.stock_status || Number(form.stock) !== Number(product.stock)) {
        basePayload.stock_status = derivedStock;
      }
      if (String(form.visibility).toLowerCase() !== String(product.visibility).toLowerCase()) {
        basePayload.visibility = form.visibility;
      }
      if (String(form.status).toLowerCase() !== String(product.status).toLowerCase()) {
        basePayload.status = form.status;
      }
    }

    setSaving(true);
    try {
      const req = product
        ? axios.put(`${API}/product/${getId(product)}`, basePayload, authHeaders())
        : axios.post(`${API}/product`, basePayload, authHeaders());
      await req;
      toast.success(
        product ? translateText('محصول با موفقیت ویرایش شد') : translateText('محصول جدید ثبت شد'),
      );
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || translateText('خطا در ذخیره محصول'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ContentLanguage editor={content} />

      <div
        className="product-editor-heading flex items-center justify-between gap-3 flex-wrap card rounded-2xl p-4"
        style={{ backgroundColor: 'var(--card)' }}
      >
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-ghost !p-2"
              aria-label={translateText('بازگشت')}
            >
              <ArrowRight size={18} />
            </button>
          )}
          <div>
            <h2 className="font-black text-lg">
              {product
                ? translateText('ویرایش محصول: {{v0}}', { v0: product.name })
                : translateText('ایجاد محصول جدید')}
            </h2>
            <p className="text-xs muted">
              {isAdmin
                ? translateText('ویرایش مستقیم محصول توسط مدیر سیستم')
                : translateText('تکمیل مشخصات، تصاویر و توضیحات Markdown')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-ghost !py-2 text-sm">
              {translateText('انصراف ')}
            </button>
          )}
          <button
            type="submit"
            disabled={saving || uploading}
            className="btn-yellow !py-2 text-sm flex items-center gap-1.5"
          >
            <Save size={15} />{' '}
            {saving
              ? translateText('در حال ذخیره…')
              : product
                ? translateText('ذخیره تغییرات')
                : translateText('انتشار محصول')}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          <div className="card rounded-2xl p-5 space-y-4">
            <h3 className="font-black text-sm">{translateText('مشخصات اصلی')}</h3>
            <label className="block text-xs muted">
              {translateText('نام محصول ')}
              <input
                className="input mt-1.5"
                value={content.value('name')}
                dir={content.dir}
                aria-label={`${content.locale} name`}
                lang={content.locale}
                onChange={(e) => content.update('name', e.target.value)}
                placeholder={content.placeholder('name')}
              />
            </label>
            <label className="block text-xs muted">
              {translateText('معرفی کوتاه (حداکثر ۵۰۰ کاراکتر) ')}
              <input
                className="input mt-1.5"
                value={content.value('short_description')}
                dir={content.dir}
                aria-label={`${content.locale} short_description`}
                lang={content.locale}
                onChange={(e) => content.update('short_description', e.target.value)}
                placeholder={content.placeholder('short_description')}
              />
            </label>
          </div>

          <div className="card rounded-2xl p-5 space-y-3">
            <h3 className="font-black text-sm">{translateText('توضیحات کامل محصول')}</h3>
            {/*
              اگر ویرایشگر بصری به هر دلیلی خطا بدهد، فرم نباید از کار بیفتد؛
              یک ناحیه‌ی متن خام Markdown جای آن می‌نشیند.
            */}
            <ErrorBoundaryComponent
              resetKey={(product ? getId(product) : 'new-product') + content.locale}
              fallback={
                <div className="space-y-2">
                  <p className="text-[11px] leading-6" style={{ color: '#e0a800' }}>
                    {translateText('ویرایشگر بصری باز نشد؛ متن Markdown را همین‌جا ویرایش کنید. ')}
                  </p>
                  <textarea
                    rows={12}
                    className="input font-mono text-xs leading-6"
                    value={content.value('description')}
                    dir={content.dir}
                    aria-label={`${content.locale} description`}
                    lang={content.locale}
                    onChange={(e) => content.update('description', e.target.value)}
                    placeholder={content.placeholder('description')}
                  />
                </div>
              }
            >
              <MarkdownEditorComponent
                direction={content.dir}
                placeholder={content.placeholder('description')}
                value={content.value('description')}
                dir={content.dir}
                aria-label={`${content.locale} description`}
                lang={content.locale}
                onChange={(val) => content.update('description', val)}
                onUploadImage={handleMarkdownUpload}
              />
            </ErrorBoundaryComponent>
          </div>

          <div className="card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-black text-sm">
                  {translateText('گالری تصاویر محصول (')}
                  {toFa(form.images_id.length)}
                  {translateText(' / ۲۰) ')}
                </h3>
                <p className="mt-1 text-[10px] muted">
                  {translateText(
                    'اولین تصویر، تصویر اصلی محصول است؛ با دکمه‌ی «اصلی کن» هر تصویر دیگری را جلو بیندازید. ',
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setImageIdOpen((v) => !v)}
                    className="btn-ghost !py-2 text-xs flex items-center gap-1.5"
                    aria-expanded={imageIdOpen}
                  >
                    <Hash size={14} />
                    {translateText(' افزودن با آیدی ')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="btn-ghost !py-2 text-xs flex items-center gap-1.5"
                >
                  <Upload size={14} />{' '}
                  {uploading ? translateText('در حال آپلود…') : translateText('آپلود تصویر')}
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleGalleryUpload}
              />
            </div>

            {/* افزودن تصویر با آیدی — فقط مدیر سیستم */}
            {isAdmin && imageIdOpen && (
              <div className="card2 rounded-xl p-3 space-y-2">
                <label className="block text-[11px] muted">
                  {translateText(
                    'آیدی فایل تصویر در فضای ذخیره‌سازی (چند آیدی را با فاصله یا کاما جدا کنید) ',
                  )}
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    className="input flex-1 min-w-[200px] font-mono text-xs"
                    dir="ltr"
                    placeholder={translateText('مثلاً 65f1c0a9b2d3e4f5a6b7c8d9')}
                    value={imageIdInput}
                    onChange={(e) => setImageIdInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addImageById();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addImageById}
                    className="btn-yellow !py-2 text-xs flex items-center gap-1.5"
                  >
                    <KeyRound size={14} />
                    {translateText(' افزودن ')}
                  </button>
                </div>
                <p className="text-[10px] muted leading-5">
                  {translateText(
                    'آدرس کامل تصویر هم پذیرفته می‌شود؛ فقط بخش آخر آدرس به‌عنوان آیدی ذخیره می‌شود. ',
                  )}
                </p>
              </div>
            )}

            {form.images_id.length === 0 ? (
              <div className="rounded-xl border border-dashed border-theme p-8 text-center text-xs muted">
                {translateText('هنوز تصویری انتخاب نشده است. روی «آپلود تصویر» بزنید. ')}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {form.images_id.map((id, idx) => (
                  <div
                    key={`${id}-${idx}`}
                    className="relative aspect-square rounded-xl overflow-hidden border border-theme"
                  >
                    <StorageImageComponent
                      file={id}
                      alt={translateText('تصویر {{v0}}', { v0: idx + 1 })}
                      className="w-full h-full object-cover"
                      onZoom={(f, a) => setZoomFile({ file: f, alt: a })}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          images_id: prev.images_id.filter((_, i) => i !== idx),
                        }))
                      }
                      className="absolute top-1 start-1 bg-black/75 text-white rounded-full p-1 hover:bg-red-600"
                      aria-label={translateText('حذف تصویر')}
                    >
                      <X size={12} />
                    </button>

                    {idx === 0 ? (
                      <span
                        className="absolute bottom-1 end-1 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--primary-color)', color: '#0a1736' }}
                      >
                        <Star size={10} />
                        {translateText(' اصلی ')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makeMainImage(idx)}
                        className="absolute bottom-1 end-1 inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white transition hover:bg-[var(--primary-color)] hover:!text-[#0a1736]"
                        aria-label={translateText('انتخاب به‌عنوان تصویر اصلی')}
                        title={translateText('انتخاب به‌عنوان تصویر اصلی')}
                      >
                        <Star size={10} />
                        {translateText(' اصلی کن ')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5 min-w-0">
          <div className="card rounded-2xl p-5 space-y-3">
            <h3 className="font-black text-sm">{translateText('انتشار و دسته‌بندی')}</h3>

            {!product ? (
              <label className="block text-xs muted">
                {translateText('فروشگاه ')}
                <select
                  className="input mt-1"
                  value={form.store_id}
                  onChange={(e) => setForm({ ...form, store_id: e.target.value })}
                  required
                >
                  <option value="">{translateText('انتخاب فروشگاه')}</option>
                  {stores.map((s) => (
                    <option
                      key={getId(s)}
                      value={getId(s)}
                      disabled={s.status && s.status !== 'ENABLE'}
                    >
                      {s.name}
                      {s.status === 'ROOT_DISABLE'
                        ? translateText(' (مسدود)')
                        : s.status === 'DISABLE'
                          ? translateText(' (غیرفعال)')
                          : ''}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="card2 rounded-xl p-3 text-xs">
                <span className="muted block">{translateText('فروشگاه')}</span>
                <b className="mt-0.5 block">
                  {stores.find((s) => getId(s) === form.store_id)?.name ||
                    product.store_name ||
                    '—'}
                </b>
              </div>
            )}

            <label className="block text-xs muted">
              {translateText('دسته‌بندی ')}
              <select
                className="input mt-1"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                required
              >
                <option value="">{translateText('انتخاب دسته‌بندی')}</option>
                {categories.map((c) => (
                  <option key={getId(c)} value={getId(c)}>
                    {c.parent_id ? `— ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs muted">
                {translateText('برند ')}
                <input
                  className="input mt-1"
                  placeholder={translateText('برند')}
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  required
                />
              </label>
              <label className="text-xs muted">
                {language === 'fa'
                  ? translateText('سال تولید (شمسی) ')
                  : translateText('سال تولید')}
                <select
                  className="input mt-1"
                  value={
                    language === 'fa'
                      ? jalaliYearOfGregorian(Number(form.production) || new Date().getFullYear())
                      : Number(form.production)
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      production:
                        language === 'fa'
                          ? gregorianYearOfJalali(Number(e.target.value))
                          : Number(e.target.value),
                    })
                  }
                >
                  {JALALI_YEARS.map((jy) => (
                    <option key={jy} value={jy}>
                      {faDigits(jy)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs muted">
                {translateText('نمایش ')}
                <select
                  className="input mt-1"
                  value={String(form.visibility).toUpperCase()}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                >
                  <option value="PUBLIC">{translateText('عمومی')}</option>
                  <option value="PRIVATE">{translateText('خصوصی')}</option>
                </select>
              </label>
              {product && (
                <label className="text-xs muted">
                  {translateText('وضعیت انتشار ')}
                  <select
                    className="input mt-1"
                    value={String(form.status).toUpperCase()}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="ACTIVE">{translateText('فعال')}</option>
                    <option value="INACTIVE">{translateText('غیرفعال')}</option>
                  </select>
                </label>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={form.warranty}
                onChange={(e) => setForm({ ...form, warranty: e.target.checked })}
              />
              {translateText('دارای گارانتی ')}
            </label>
          </div>

          <div className="card rounded-2xl p-5 space-y-3">
            <h3 className="font-black text-sm">{translateText('قیمت، تخفیف و موجودی')}</h3>
            <MoneyInput price={priceEntry} />

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs muted">
                {translateText('موجودی انبار ')}
                <input
                  className="input mt-1"
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                />
              </label>
              {product && (
                <label className="text-xs muted">
                  {translateText('وضعیت موجودی ')}
                  <select
                    className="input mt-1"
                    value={form.stock_status}
                    onChange={(e) => setForm({ ...form, stock_status: e.target.value })}
                  >
                    <option value="IN_STOCK">{translateText('موجود')}</option>
                    <option value="OUT_OF_STOCK">{translateText('ناموجود')}</option>
                  </select>
                </label>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={form.has_discount}
                onChange={(e) => setForm({ ...form, has_discount: e.target.checked })}
              />
              {translateText('اعمال تخفیف زمان‌دار ')}
            </label>

            {form.has_discount && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="text-xs muted">
                  {translateText('درصد تخفیف ')}
                  <input
                    className="input mt-1"
                    type="number"
                    min={1}
                    max={100}
                    value={form.discount_percentage}
                    onChange={(e) => setForm({ ...form, discount_percentage: e.target.value })}
                  />
                </label>
                <div className="text-xs muted">
                  {translateText('انقضای تخفیف (شمسی) ')}
                  <JalaliDateTimePicker
                    value={form.discount_expiry}
                    onChange={(next) => setForm({ ...form, discount_expiry: next })}
                    placeholder={translateText('مثلاً ۱۴۰۵/۰۹/۰۱')}
                  />
                  <span className="mt-1 block text-[10px] muted leading-5">
                    {expiryHint(form.discount_expiry)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="card rounded-2xl p-5 space-y-3">
            <h3 className="font-black text-sm">{translateText('ابعاد، وزن و برچسب‌ها')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs muted">
                {translateText('عرض (')}
                {form.width_unit})
                <input
                  className="input mt-1"
                  type="number"
                  step="any"
                  value={form.width_value}
                  onChange={(e) => setForm({ ...form, width_value: e.target.value })}
                />
              </label>
              <label className="text-xs muted">
                {translateText('ارتفاع (')}
                {form.height_unit})
                <input
                  className="input mt-1"
                  type="number"
                  step="any"
                  value={form.height_value}
                  onChange={(e) => setForm({ ...form, height_value: e.target.value })}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs muted">
                {translateText('وزن ')}
                <input
                  className="input mt-1"
                  type="number"
                  step="any"
                  value={form.weight_value}
                  onChange={(e) => setForm({ ...form, weight_value: e.target.value })}
                />
              </label>
              <label className="text-xs muted">
                {translateText('واحد وزن ')}
                <select
                  className="input mt-1"
                  value={form.weight_unit}
                  onChange={(e) => setForm({ ...form, weight_unit: e.target.value })}
                >
                  <option value="G">{translateText('گرم (G)')}</option>
                  <option value="KG">{translateText('کیلوگرم (KG)')}</option>
                </select>
              </label>
            </div>

            <div>
              <span className="text-xs muted block mb-1">{translateText('برچسب‌ها')}</span>
              <div className="flex gap-2">
                <input
                  className="input text-xs"
                  placeholder={content.placeholder('tags')}
                  dir={content.dir}
                  lang={content.locale}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <button type="button" onClick={addTag} className="btn-ghost !px-3">
                  <Plus size={15} />
                </button>
              </div>
              {content.value('tags').length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {content.value('tags').map((t) => (
                    <span key={t} className="chip !py-0.5 !px-2 text-xs flex items-center gap-1">
                      {t}
                      <button
                        type="button"
                        onClick={() =>
                          content.update(
                            'tags',
                            content.value('tags').filter((x) => x !== t),
                          )
                        }
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ImageLightboxComponent
        file={zoomFile?.file}
        alt={zoomFile?.alt}
        onClose={() => setZoomFile(null)}
      />
    </form>
  );
}

export default ProductEditorComponent;
