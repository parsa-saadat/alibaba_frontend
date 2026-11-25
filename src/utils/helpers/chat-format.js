import { dateFormatter } from '../../i18n/date-policy';
import { language } from '../../i18n/runtime';
import { t as translateText } from '../../i18n/runtime.js';
import { localizedField } from '../../i18n/content-fields';

/*
 * نام شرکت‌کنندگان گفتگو ممکن است رشتهٔ ساده باشد (مسیر REST، جایی که
 * localize() روی سرور آن را تخت کرده) یا نقشهٔ زبان (رویدادهای WebSocket).
 * این تابع هر دو حالت را به یک رشتهٔ قابل‌نمایش تبدیل می‌کند.
 */
export const personName = (participant, fallback = '') =>
  nameText(participant?.display_name) || nameText(participant?.username) || fallback;

/** رشته یا نقشهٔ زبان→رشته (رویدادهای WebSocket) را به متن قابل‌نمایش تبدیل می‌کند. */
export const nameText = (value) => {
  if (typeof value === 'string') return value.trim();
  const resolved = localizedField(value);
  return typeof resolved === 'string' ? resolved.trim() : '';
};

/*
 * زمان‌های چت: ساعت برای امروز، «دیروز» و تاریخ کوتاه برای قدیمی‌تر.
 * همه از dateFormatter پروژه می‌آیند، پس تقویم و ارقام همان زبانِ رابط است.
 */
const toValidDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export const formatTime = (value) => {
  const date = toValidDate(value);
  return date ? dateFormatter(language, { hour: '2-digit', minute: '2-digit', hour12: false }).format(date) : '—';
};

/** فاصلهٔ روزها تا امروز؛ امروز ۰ است. */
export const daysAgo = (value) => {
  const date = toValidDate(value);
  if (!date) return 0;
  return Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
};

/** کلید روز برای گذاشتن تیتر تقسیم‌کننده بین پیام‌ها. */
export const dayKey = (value) => {
  const date = toValidDate(value);
  return date ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : '';
};

/* برچسب سطر فهرست گفتگو: ساعت / دیروز / ۳ روز پیش / تاریخ */
export const formatRelative = (value) => {
  const date = toValidDate(value);
  if (!date) return '—';
  const days = daysAgo(date);

  if (days <= 0) return formatTime(date);
  if (days === 1) return dateFormatter(language, { weekday: 'long' }).format(date);
  if (days < 7)
    return new Intl.RelativeTimeFormat(dateFormatter(language, {}).resolvedOptions().locale, {
      numeric: 'auto',
    }).format(-days, 'day');
  return dateFormatter(language, { day: '2-digit', month: 'short', year: days > 200 ? '2-digit' : undefined }).format(date);
};

/* پیش‌نمایش کوتاه برای اعلان پیام تازه */
export const previewOf = (message, max = 70) => {
  if (!message) return '';
  if (message.kind === 'deleted') return '';
  const body = nameText(message.body);
  if (body) return body.length > max ? `${body.slice(0, max - 1)}…` : body;
  return message.images?.length ? translateText('chat.imagePreview') : '';
};

/* تیتر تقسیم‌کنندهٔ روز در رشتهٔ گفتگو */
export const formatDayDivider = (value) => {
  const date = toValidDate(value);
  if (!date) return '';
  const days = daysAgo(date);
  if (days <= 0) return dateFormatter(language, { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  if (days === 1) return dateFormatter(language, { weekday: 'long' }).format(date);
  return dateFormatter(language, { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
};
