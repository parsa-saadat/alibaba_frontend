import { dateFormatter } from '../../i18n/date-policy';
import { language, currency, formatMoney } from '../../i18n/runtime';
import { t as translateText } from '../../i18n/runtime.js';
import { getId, isDirectImage } from './response.js';
import {
  JALALI_MONTHS,
  faDigits,
  jalaliOfDate,
  jalaliYearOfGregorian,
  toGregorian,
} from './jalali.js';

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/* برای استفاده‌ی مستقیم در فرم‌ها */
export { faDigits };
const UNITS = { CM: translateText("سانتی‌متر"), M: translateText("متر"), G: translateText("گرم"), KG: translateText("کیلوگرم") };

export const toFa = (value) => language === 'fa' ? String(value ?? '').replace(/\d/g, (digit) => FA_DIGITS[+digit]) : String(value ?? '');

export const formatPrice = (amount, code = currency) => formatMoney(amount, code);

export const finalPrice = (product) => {
  if (!product) return 0;
  const amount = Number(product.price?.amount || 0);
  const percentage = Number(product.discount?.percentage || 0);
  const expiry = product.discount?.expirationDate;
  const active = percentage > 0 && (!expiry || new Date(expiry) > new Date());
  const scale = product.price?.currency === 'IRR' ? 1 : 100;
  return active ? Math.round(amount * (1 - percentage / 100) * scale) / scale : amount;
};

export const hasDiscount = (product) =>
  Number(product?.discount?.percentage || 0) > 0 &&
  (!product.discount?.expirationDate || new Date(product.discount.expirationDate) > new Date());

export const ratingOf = (product) => {
  const rating = Number(product?.rating || 0);
  return rating > 5 ? rating / 10 : rating;
};

export const measurementValue = (measurement) => {
  const value =
    typeof measurement === 'object' && measurement !== null
      ? (measurement.value ?? measurement.amount ?? measurement.$numberDecimal)
      : measurement;
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const measurementUnit = (measurement, fallback = '') => {
  const unit = measurement?.unit ?? fallback;
  return typeof unit === 'string' ? unit : '';
};

export const formatMeasurement = (measurement, fallbackUnit = '') => {
  const value = measurementValue(measurement);
  if (value === null) return translateText("ثبت نشده");
  const unit = measurementUnit(measurement, fallbackUnit).toUpperCase();
  const number = toFa(value.toLocaleString('en-US', { maximumFractionDigits: 6 }));
  return `${number} ${UNITS[unit] || unit}`.trim();
};

export const formatDimensions = (dimensions) => {
  if (!dimensions || typeof dimensions !== 'object') return translateText("ثبت نشده");
  const parts = ['length', 'width', 'height']
    .filter((axis) => measurementValue(dimensions[axis]) !== null)
    .map((axis) => formatMeasurement(dimensions[axis], dimensions.unit));
  return parts.length ? parts.join(' × ') : translateText("ثبت نشده");
};

export const formatWeight = (weight) => formatMeasurement(weight);

export const productImages = (product) => {
  const images = product?.images_id ?? product?.images ?? [];
  return Array.isArray(images)
    ? images.filter((image) => getId(image) || isDirectImage(image))
    : [];
};

export const productImage = (product) => productImages(product).find(isDirectImage) || '';

/*
 * تاریخ‌های سایت همه شمسی و با یک قالب یکسان نمایش داده می‌شوند:
 *   formatDate       → ۱۴۰۵/۰۸/۲۲
 *   formatDateTime   → ۱۴۰۵/۰۸/۲۲ — ۱۴:۳۰
 *   formatDateLong   → شنبه ۲۲ آبان ۱۴۰۵
 * منبع تبدیل، utils/helpers/jalali.js است (همان که تقویم فرم محصول از آن استفاده می‌کند).
 */
const WEEKDAY_FA = [translateText("یکشنبه"), translateText("دوشنبه"), translateText("سه‌شنبه"), translateText("چهارشنبه"), translateText("پنجشنبه"), translateText("جمعه"), translateText("شنبه")];

const validDate = (date) => {
  const value = date instanceof Date ? date : new Date(date);
  return Number.isNaN(value.getTime()) ? null : value;
};

const localizedDate = (date, options) => {
  const value = date ? validDate(date) : null;
  return value ? dateFormatter(language, options).format(value) : translateText("ثبت نشده");
};
export const formatDate = date => localizedDate(date, { year: 'numeric', month: '2-digit', day: '2-digit' });
export const formatDateTime = date => localizedDate(date, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
export const formatDateLong = date => localizedDate(date, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
export const formatDayOfMonth = date => localizedDate(date, { day: 'numeric' });
// Retain the public helper name for callers; year follows the selected calendar.
export const formatJalaliYear = (date = new Date()) => localizedDate(date, { year: 'numeric' });

/* سال تولید محصول در بک‌اند میلادی ذخیره می‌شود؛ نمایش شمسی است */
export const formatProductionYear = (year) => {
  const value = Number(year);
  if (!Number.isFinite(value) || value <= 0) return translateText("ثبت نشده");
  return language === 'fa' ? faDigits(jalaliYearOfGregorian(value)) : String(value);
};

/* سال شمسی → سال میلادی (برای پارامترهای فیلتر بک‌اند) */
export const productionYearForApi = (jalaliYear) => {
  if (language !== 'fa') return String(jalaliYear || '');
  const value = Number(String(jalaliYear).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  if (!Number.isFinite(value) || value <= 0) return '';
  return String(toGregorian(value, 1, 1).gy);
};

export const STATUS_FA = {
  awaiting_approval: translateText("در انتظار تأیید فروشنده"),
  preparing: translateText("در حال آماده‌سازی"),
  ready_to_ship: translateText("آماده ارسال"),
  shipped: translateText("ارسال شده"),
  delivered: translateText("تحویل داده شده"),
  cancelled: translateText("لغو شده"),
  rejected: translateText("رد شده"),
  finalized: translateText("نهایی شده"),
  awaiting_payment: translateText("در انتظار پرداخت"),
  paid: translateText("پرداخت شده"),
  unpaid: translateText("پرداخت نشده"),
  pending: translateText("در انتظار پرداخت"),
  failed: translateText("ناموفق"),
  ACTIVE: translateText("فعال"),
  INACTIVE: translateText("غیرفعال"),
  ENABLE: translateText("فعال"),
  DISABLE: translateText("غیرفعال"),
  ROOT_DISABLE: translateText("مسدود توسط مدیریت"),
  IN_STOCK: translateText("موجود"),
  OUT_OF_STOCK: translateText("ناموجود"),
  PUBLIC: translateText("عمومی"),
  PRIVATE: translateText("خصوصی"),
  Individual_seller: translateText("فروشنده حقیقی"),
  institutional_seller: translateText("فروشنده حقوقی"),
};

export const statusFa = (status) => (status ? (STATUS_FA[status] ?? status) : '—');

// Existing identity API stores a Jalali date string; localize display without changing storage.
export const formatStoredBirthDate = value => {
  if (!value) return '—';
  const normalized = String(value).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const parts = normalized.split('/').map(Number);
  if (parts.length !== 3 || parts.some(n=>!Number.isFinite(n))) return String(value);
  const {gy,gm,gd} = toGregorian(parts[0],parts[1],parts[2]);
  return formatDate(new Date(gy,gm-1,gd));
};
