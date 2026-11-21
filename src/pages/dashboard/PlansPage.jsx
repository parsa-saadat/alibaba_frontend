import { currency as displayCurrency, formatMoney } from '../../i18n/runtime';
import StatTile from '../../components/panel/StatTileComponent';
import { localizeDigits } from '../../i18n/runtime';
import { toFa } from '../../utils/helpers/format';
import usePanelStats from '../../hooks/usePanelStats';
import StatsNotice from '../../components/panel/StatsNoticeComponent';
import useLocalizedContent from '../../hooks/useLocalizedContent';
import MoneyInput, { usePriceEntry } from '../../components/panel/PriceInputComponent';
import { dateFormatter } from '../../i18n/date-policy';
import gregorian_ar from 'react-date-object/locales/gregorian_ar';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import { language } from '../../i18n/runtime';
import { cleanTranslations } from '../../i18n/translation-helpers';
import ContentLanguage from '../../components/common/locale/ContentLanguageComponent';
import { t as translateText } from '../../i18n/runtime.js';
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import DatePicker from 'react-multi-date-picker';
import TimePicker from 'react-multi-date-picker/plugins/time_picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { formatDateTime, finalPrice, hasDiscount } from '../../utils/helpers/format';
import {
  AlertTriangle,
  CreditCard,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import { Loading } from '../../components/common/ScroolToTopComponent';
import PanelPageHeader from '../../components/panel/PanelPageHeaderComponent';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

const trCalendarLocale = {
  ...gregorian_en,
  name: 'gregorian_tr',
  months: Array.from({ length: 12 }, (_, month) =>
    ['long', 'short'].map((style) =>
      new Intl.DateTimeFormat('tr', { month: style }).format(new Date(2026, month, 1)),
    ),
  ),
  weekDays: Array.from({ length: 7 }, (_, day) =>
    ['long', 'short'].map((style) =>
      new Intl.DateTimeFormat('tr', { weekday: style }).format(new Date(2026, 0, 3 + day)),
    ),
  ),
};
const calendarLocale =
  language === 'fa'
    ? persian_fa
    : language === 'ar'
      ? gregorian_ar
      : language === 'tr'
        ? trCalendarLocale
        : gregorian_en;
const MIN_TOMAN = 0.01;

const EMPTY_PLAN = {
  translations: {},
  name: '',
  duration_days: '',
  unlimited: false,
  amount: '',
  max_products: '',
  max_shops: '',
  max_images_per_product: '',
  description: '',
  is_featured: false,
  inactive: false,
  sort_order: '',
  has_discount: false,
  discount_percentage: '',
  discount_expiry: null,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFaDigits = localizeDigits;
const toEnDigits = (s) =>
  String(s ?? '')
    .replace(/[۰-۹]/g, (d) => PERSIAN_DIGITS.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

const groupDigits = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, translateText('،'));
const faNum = (n) =>
  n === null || n === undefined || n === '' ? '—' : toFaDigits(groupDigits(Number(n)));

const fmtDate = (d) =>
  dateFormatter(language, { dateStyle: 'medium', timeStyle: 'short' }).format(d);

function planToForm(pl) {
  return {
    name: pl.name || '',
    translations: pl.translations || {},
    source_currency: (pl.base_price || pl.price)?.currency || 'USD',
    duration_days: pl.duration_days ?? '',
    unlimited: pl.duration_days === null,
    amount: String((pl.base_price || pl.price)?.amount || ''),
    max_products: pl.features?.max_products ?? '',
    max_shops: pl.features?.max_shops ?? '',
    max_images_per_product: pl.features?.max_images_per_product ?? '',
    description: pl.description || '',
    is_featured: Boolean(pl.is_featured),
    inactive: pl.status === 'INACTIVE',
    sort_order: pl.sort_order ?? '',
    has_discount: !!pl.discount,
    discount_percentage: pl.discount?.percentage ?? '',
    discount_expiry: pl.discount?.expirationDate ? new Date(pl.discount.expirationDate) : null,
  };
}

const DP_CSS = `
.plan-dp.rmdp-wrapper{background:var(--card)!important;color:inherit!important;border:1px solid rgba(128,128,128,.25)!important;border-radius:16px!important;box-shadow:0 12px 32px rgba(0,0,0,.35)!important;font-family:inherit!important;max-width:calc(100vw - 32px)!important}
.plan-dp .rmdp-calendar,.plan-dp .rmdp-day-picker,.plan-dp .rmdp-month-picker,.plan-dp .rmdp-year-picker,.plan-dp .rmdp-time-picker{background:transparent!important;color:inherit!important}
.plan-dp .rmdp-header-values,.plan-dp .rmdp-header-values span{color:inherit!important}
.plan-dp .rmdp-week-day{color:var(--primary-color)!important;font-weight:700}
.plan-dp .rmdp-day span{color:inherit}
.plan-dp .rmdp-day.rmdp-disabled,.plan-dp .rmdp-day.rmdp-disabled span{opacity:.3}
.plan-dp .rmdp-day:not(.rmdp-disabled):not(.rmdp-day-hidden) span:hover{background:var(--card2)!important;color:inherit!important}
.plan-dp .rmdp-day.rmdp-today span{background:var(--card2)!important;color:var(--primary-color)!important;font-weight:800}
.plan-dp .rmdp-day.rmdp-selected span:not(.highlight){background:var(--primary-color)!important;color:#1a1b1e!important;box-shadow:none!important;font-weight:800}
.plan-dp .rmdp-arrow{border-color:currentColor!important}
.plan-dp .rmdp-arrow-container:hover{background:var(--card2)!important;box-shadow:none!important}
.plan-dp .rmdp-border-top{border-color:rgba(128,128,128,.25)!important}
.plan-dp .rmdp-time-picker div input{background:var(--card2)!important;color:inherit!important;border-radius:8px}
.plan-dp .rmdp-action-button{color:var(--primary-color)!important}
.rmdp-container{width:100%}
`;

/** ورودی عددی با واحد داخل فیلد (سمت چپ) */
function UnitInput({ unit, className = '', ...props }) {
  return (
    <div className="relative min-w-0">
      <input className={`input !ps-14 ${className}`} {...props} />
      <span className="absolute start-3 top-1/2 -translate-y-1/2 text-[11px] muted pointer-events-none whitespace-nowrap">
        {unit}
      </span>
    </div>
  );
}

/** مودال تأیید حذف */
function ConfirmDeleteModal({ plan, busy, onCancel, onConfirm }) {
  useEffect(() => {
    if (!plan) return undefined;
    const onKey = (e) => e.key === 'Escape' && !busy && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [plan, busy, onCancel]);

  if (!plan) return null;
  return (
    <div
      className="fixed inset-0 z-[10000] grid place-items-center p-3 sm:p-4"
      style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div className="card rounded-3xl p-5 sm:p-6 w-full max-w-[92vw] sm:max-w-sm text-center shadow-2xl">
        <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-4 bg-red-500/15 text-red-400">
          <AlertTriangle size={26} />
        </div>
        <h3 className="font-black text-lg mb-2">{translateText('حذف پلن')}</h3>
        <p className="text-sm muted leading-7 mb-5 break-words">
          {translateText('آیا از حذف پلن ')}
          <b className="text-yellow">«{plan.name}»</b>
          {translateText(' مطمئن هستید؟ ')}
          <br />
          {translateText('این کار قابل بازگشت نیست. ')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn-ghost !py-2.5 text-sm"
          >
            {translateText('انصراف ')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="!py-2.5 text-sm font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {translateText(' در حال حذف… ')}
              </>
            ) : (
              <>
                <Trash2 size={15} />
                {translateText(' بله، حذف شود ')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
function PlansPage() {
  const { stats: panelStats, error: statsError, refresh: refreshStats } = usePanelStats(['plan']);
  const [plans, setPlans] = useState([]);
  const [displayPlans, setDisplayPlans] = useState({});
  const [priceDisplayError, setPriceDisplayError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN);
  const content = useLocalizedContent(planForm, setPlanForm, ['name', 'description'], 'plan');
  const [editingId, setEditingId] = useState('');
  const editingPlan = plans.find((plan) => plan._id === editingId);
  const priceEntry = usePriceEntry(
    editingPlan?.base_price || editingPlan?.price,
    editingId || 'new',
  );
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const set = (key, val) => setPlanForm((f) => ({ ...f, [key]: val }));

  const load = useCallback(async () => {
    refreshStats();
    setLoading(true);
    try {
      const res = await axios.get(`${API}/plan?lang=all&currency=USD`, {
        ...authHeaders(),
        params: { page: 1, limit: 100 },
      });
      const shown = await axios
        .get(`${API}/plan`, {
          ...authHeaders(),
          params: { page: 1, limit: 100, currency: displayCurrency },
        })
        .catch(() => null);
      setPriceDisplayError(!shown);
      const shownRows = shown?.data?.body?.data || shown?.data?.body || [];
      setDisplayPlans(
        Object.fromEntries(
          (Array.isArray(shownRows) ? shownRows : []).map((plan) => [String(plan._id), plan]),
        ),
      );
      const body = res.data?.body;
      setPlans(Array.isArray(body) ? body : body?.data || []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    priceEntry.retry();
    setPlanForm(EMPTY_PLAN);
    setEditingId('');
  };

  const startEdit = (pl) => {
    setEditingId(pl._id);
    setPlanForm(planToForm(pl));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildPayload = () => {
    const planForm = content.payload();
    const name = planForm.name.trim();
    if (!name) throw new Error(translateText('نام پلن الزامی است'));
    if (name.length > 50) throw new Error(translateText('نام پلن حداکثر ۵۰ کاراکتر باشد'));

    const submittedPrice = priceEntry.payload();

    let duration = null;
    if (!planForm.unlimited) {
      duration = planForm.duration_days === '' ? 30 : Number(planForm.duration_days);
      if (!Number.isInteger(duration) || duration < 1)
        throw new Error(translateText('مدت اعتبار معتبر نیست'));
    }

    const features = {
      max_products: planForm.max_products === '' ? 50 : Number(planForm.max_products),
      max_shops: planForm.max_shops === '' ? 1 : Number(planForm.max_shops),
      max_images_per_product:
        planForm.max_images_per_product === '' ? 5 : Number(planForm.max_images_per_product),
    };
    Object.values(features).forEach((v) => {
      if (!Number.isInteger(v) || v < 0)
        throw new Error(translateText('سقف‌ها باید عدد صحیح و حداقل ۰ باشند'));
    });

    const sort = planForm.sort_order === '' ? 0 : Number(planForm.sort_order);
    if (!Number.isInteger(sort) || sort < 0)
      throw new Error(translateText('ترتیب نمایش معتبر نیست'));

    let discount = null;
    if (planForm.has_discount) {
      const pct = Number(planForm.discount_percentage);
      if (!Number.isInteger(pct) || pct < 1 || pct > 100) {
        throw new Error(translateText('درصد تخفیف باید عدد صحیح بین ۱ تا ۱۰۰ باشد'));
      }
      const exp = planForm.discount_expiry;
      if (!exp || Number.isNaN(exp.getTime()) || exp <= new Date()) {
        throw new Error(translateText('تاریخ انقضای تخفیف باید در آینده باشد'));
      }
      discount = { percentage: pct, expirationDate: exp.toISOString() };
    }

    const payload = {
      name,
      duration_days: duration,
      price: submittedPrice,
      translations: cleanTranslations(planForm.translations),
      description: planForm.description.trim(),
      is_featured: Boolean(planForm.is_featured),
      status: planForm.inactive ? 'INACTIVE' : 'ACTIVE',
      sort_order: sort,
      features,
    };
    if (discount) payload.discount = discount;
    else if (editingId) payload.discount = null;
    return payload;
  };

  const submit = async (e) => {
    e.preventDefault();
    let payload;
    try {
      payload = buildPayload();
    } catch (err) {
      return toast.error(err.message);
    }
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API}/plan/${editingId}`, payload, authHeaders());
        toast.success(translateText('پلن ویرایش شد'));
      } else {
        await axios.post(`${API}/plan`, payload, authHeaders());
        toast.success(translateText('پلن جدید ساخته شد'));
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || translateText('خطا در ذخیره پلن'));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (pl) => {
    const next = pl.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    setBusyId(pl._id);
    try {
      await axios.put(`${API}/plan/${pl._id}`, { status: next }, authHeaders());
      toast.success(
        next === 'ACTIVE' ? translateText('پلن فعال شد') : translateText('پلن غیرفعال شد'),
      );
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || translateText('خطا در تغییر وضعیت'));
    } finally {
      setBusyId('');
    }
  };

  const confirmDelete = async () => {
    const pl = deleteTarget;
    if (!pl) return;
    setBusyId(pl._id);
    try {
      await axios.delete(`${API}/plan/${pl._id}`, authHeaders());
      toast.success(translateText('پلن حذف شد'));
      if (editingId === pl._id) resetForm();
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || translateText('خطا در حذف'));
    } finally {
      setBusyId('');
    }
  };

  if (loading && plans.length === 0) {
    return (
      <div className="py-16">
        <Loading label={translateText('در حال بارگذاری پلن‌ها…')} />
      </div>
    );
  }

  const tomanValue = Number(planForm.amount) || 0;

  return (
    <div className="space-y-5">
      <PanelPageHeader
        icon={Layers}
        title={translateText('پلن‌های فروشندگی')}
        subtitle={translateText('تعرفه‌ها، سقف محصول و دسترسی‌ها')}
        onRefresh={() => load()}
      />
      <StatsNotice error={statsError || priceDisplayError} stats={panelStats} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label={translateText('پلن\u200cها')}
          value={toFa(panelStats.plan?.counts.all ?? '—')}
        />
        <StatTile
          label={translateText('فعال')}
          value={toFa(panelStats.plan?.counts.active ?? '—')}
        />
        <StatTile
          label={translateText('غیرفعال')}
          value={toFa(panelStats.plan?.counts.inactive ?? '—')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] xl:grid-cols-[450px_minmax(0,1fr)] gap-4 lg:gap-5 items-start">
        <style>{DP_CSS}</style>

        {/* فرم */}
        <form
          onSubmit={submit}
          className="card rounded-2xl p-4 sm:p-5 space-y-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto min-w-0"
        >
          <ContentLanguage editor={content} />

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="font-black flex items-center gap-2 text-sm sm:text-base">
              <CreditCard size={18} className="text-yellow shrink-0" />
              <span className="break-words">
                {editingId ? translateText('ویرایش پلن اشتراک') : translateText('ایجاد پلن اشتراک')}
              </span>
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="btn-ghost !py-1 !px-2 text-xs flex items-center gap-1"
              >
                <X size={13} />
                {translateText(' لغو ')}
              </button>
            )}
          </div>

          <input
            className="input"
            maxLength={50}
            value={content.value('name')}
            dir={content.dir}
            aria-label={`${content.locale} name`}
            lang={content.locale}
            onChange={(e) => content.update('name', e.target.value)}
            placeholder={content.placeholder('name')}
          />

          <MoneyInput price={priceEntry} />

          <div className="grid grid-cols-2 gap-2">
            <UnitInput
              type="number"
              min={1}
              unit={translateText('روز')}
              placeholder={planForm.unlimited ? translateText('نامحدود') : translateText('مدت')}
              disabled={planForm.unlimited}
              value={planForm.unlimited ? '' : planForm.duration_days}
              onChange={(e) => set('duration_days', e.target.value)}
            />
            <label className="flex items-center gap-2 text-xs cursor-pointer min-w-0">
              <input
                type="checkbox"
                className="shrink-0"
                checked={planForm.unlimited}
                onChange={(e) => set('unlimited', e.target.checked)}
              />
              <span className="truncate">{translateText('مدت نامحدود')}</span>
            </label>
            <UnitInput
              type="number"
              min={0}
              unit={translateText('محصول')}
              placeholder={translateText('سقف محصولات')}
              value={planForm.max_products}
              onChange={(e) => set('max_products', e.target.value)}
            />
            <UnitInput
              type="number"
              min={0}
              unit={translateText('فروشگاه')}
              placeholder={translateText('سقف فروشگاه')}
              value={planForm.max_shops}
              onChange={(e) => set('max_shops', e.target.value)}
            />
            <UnitInput
              type="number"
              min={0}
              unit={translateText('تصویر')}
              placeholder={translateText('هر محصول')}
              value={planForm.max_images_per_product}
              onChange={(e) => set('max_images_per_product', e.target.value)}
            />
            <input
              className="input"
              type="number"
              min={0}
              placeholder={translateText('ترتیب نمایش')}
              value={planForm.sort_order}
              onChange={(e) => set('sort_order', e.target.value)}
            />
          </div>

          <textarea
            className="input"
            rows={3}
            value={content.value('description')}
            dir={content.dir}
            aria-label={`${content.locale} description`}
            lang={content.locale}
            onChange={(e) => content.update('description', e.target.value)}
            placeholder={content.placeholder('description')}
          />

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              className="shrink-0"
              checked={planForm.is_featured}
              onChange={(e) => set('is_featured', e.target.checked)}
            />
            {translateText('پلن ویژه (پیشنهادی) ')}
          </label>

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              className="shrink-0"
              checked={planForm.inactive}
              onChange={(e) => set('inactive', e.target.checked)}
            />
            {translateText('غیرفعال (به‌صورت پیش‌فرض پلن فعال است) ')}
          </label>

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              className="shrink-0"
              checked={planForm.has_discount}
              onChange={(e) => set('has_discount', e.target.checked)}
            />
            {translateText('تخفیف زمان‌دار ')}
          </label>

          {planForm.has_discount && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                className="input"
                type="number"
                min={1}
                max={100}
                placeholder={translateText('درصد تخفیف')}
                value={planForm.discount_percentage}
                onChange={(e) => set('discount_percentage', e.target.value)}
              />
              <DatePicker
                value={planForm.discount_expiry}
                onChange={(val) => set('discount_expiry', val ? val.toDate() : null)}
                calendar={language === 'fa' ? persian : undefined}
                locale={calendarLocale}
                format="YYYY/MM/DD HH:mm"
                plugins={[<TimePicker key="tp" position="bottom" hideSeconds />]}
                minDate={new Date()}
                calendarPosition="bottom-right"
                inputClass="input"
                containerStyle={{ width: '100%' }}
                className="plan-dp"
                placeholder={translateText('انقضای تخفیف')}
                portal
                zIndex={9999}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-yellow w-full flex items-center justify-center gap-1.5"
          >
            {editingId ? <Save size={16} /> : <Plus size={16} />}
            {saving
              ? translateText('در حال ذخیره…')
              : editingId
                ? translateText('ذخیره تغییرات')
                : translateText('افزودن پلن')}
          </button>
        </form>

        {/* لیست کارت‌ها */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
          {plans.length === 0 && (
            <div className="sm:col-span-2 rounded-2xl border border-dashed border-theme p-8 sm:p-10 text-center text-sm muted">
              {translateText('هنوز پلنی ساخته نشده است. ')}
            </div>
          )}

          {plans.map((pl) => {
            const shownPlan = displayPlans[String(pl._id)] || pl;
            const discounted = hasDiscount(shownPlan);
            const inactive = pl.status === 'INACTIVE';
            const busy = busyId === pl._id;
            const expDate = pl.discount?.expirationDate
              ? new Date(pl.discount.expirationDate)
              : null;
            const expired = expDate && expDate <= new Date();
            return (
              <div
                key={pl._id}
                className="card rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-4 min-w-0 overflow-hidden"
                style={{
                  borderColor: pl.is_featured ? 'var(--primary-color)' : undefined,
                  opacity: inactive ? 0.65 : 1,
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <b className="text-base sm:text-lg break-words min-w-0">{pl.name}</b>
                    <div className="flex items-center gap-1 shrink-0">
                      {pl.is_featured && (
                        <span className="chip on !cursor-default text-[11px]">
                          {translateText('ویژه')}
                        </span>
                      )}
                      {inactive && (
                        <span className="chip !cursor-default text-[11px]">
                          {translateText('غیرفعال')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 space-y-1 min-w-0">
                    {discounted && (
                      <del className="block text-xs muted break-words">
                        {formatMoney(shownPlan.price?.amount, shownPlan.price?.currency)}
                      </del>
                    )}
                    <strong className="block font-black text-xl sm:text-2xl text-yellow break-words">
                      {formatMoney(finalPrice(shownPlan), shownPlan.price?.currency)}
                    </strong>
                  </div>
                  <div className="text-xs muted mt-2 space-y-1">
                    <div>
                      {translateText('مدت اعتبار:')}{' '}
                      {pl.duration_days === null || pl.duration_days === undefined
                        ? translateText('نامحدود')
                        : translateText('{{v0}} روز', { v0: faNum(pl.duration_days) })}
                    </div>
                    <div>
                      {translateText('حداکثر محصول: ')}
                      {faNum(pl.features?.max_products)}
                      {translateText(' محصول')}
                    </div>
                    <div>
                      {translateText('حداکثر فروشگاه: ')}
                      {faNum(pl.features?.max_shops)}
                      {translateText(' فروشگاه')}
                    </div>
                    <div>
                      {translateText('تصویر هر محصول: ')}
                      {faNum(pl.features?.max_images_per_product)}
                      {translateText(' تصویر')}
                    </div>
                    {pl.discount && expDate && (
                      <div className={expired ? 'text-red-400' : 'text-emerald-400'}>
                        {translateText('تخفیف ')}
                        {faNum(pl.discount.percentage)}
                        {translateText('٪ تا ')}
                        {fmtDate(expDate)}
                        {expired && translateText(' (منقضی شده)')}
                      </div>
                    )}
                  </div>
                  {pl.description && (
                    <p className="text-xs muted mt-2 break-words">{pl.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => startEdit(pl)}
                    className="btn-ghost !py-2 !px-1 text-[11px] sm:text-xs flex items-center justify-center gap-1 min-w-0"
                  >
                    <Pencil size={13} className="shrink-0" />{' '}
                    <span className="truncate">{translateText('ویرایش')}</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggleStatus(pl)}
                    className="btn-ghost !py-2 !px-1 text-[11px] sm:text-xs flex items-center justify-center gap-1 min-w-0"
                  >
                    {inactive ? (
                      <Eye size={13} className="shrink-0" />
                    ) : (
                      <EyeOff size={13} className="shrink-0" />
                    )}
                    <span className="truncate">
                      {inactive ? translateText('فعال') : translateText('غیرفعال')}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setDeleteTarget(pl)}
                    className="btn-ghost !py-2 !px-1 text-[11px] sm:text-xs text-red-400 flex items-center justify-center gap-1 min-w-0"
                  >
                    <Trash2 size={13} className="shrink-0" />{' '}
                    <span className="truncate">{translateText('حذف')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <ConfirmDeleteModal
          plan={deleteTarget}
          busy={!!deleteTarget && busyId === deleteTarget._id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
}

export default PlansPage;
