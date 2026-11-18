import { dateFormatter } from '../../i18n/date-policy';
import { language } from '../../i18n/runtime';
import { t as translateText } from '../../i18n/runtime.js';
/*
 * تاریخ شمسی (جلالی) — تبدیل دوطرفه با میلادی، بدون هیچ کتابخانه‌ی اضافه
 * --------------------------------------------------------------------
 * بک‌اند تاریخ‌ها را میلادی می‌گیرد (`discount.expirationDate` یک ISO است و
 * `production` یک سال میلادی بین ۱۹۰۰ و سال جاری). کاربر فارسی‌زبان باید همه‌چیز
 * را شمسی ببیند و وارد کند؛ این فایل تنها جایی است که تبدیل انجام می‌شود.
 *
 * الگوریتم: چرخه‌ی ۳۳ ساله، معتبر برای بازه‌ی ۱۹۰۰ تا ۲۱۰۰ میلادی.
 */

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export const faDigits = (value) => language === 'fa' ? String(value ?? '').replace(/\d/g, (d) => FA_DIGITS[+d]) : String(value ?? '');
export const enDigits = (value) =>
  String(value ?? '')
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

export const pad2 = (n) => String(n).padStart(2, '0');

/* ---------------- تبدیل‌ها ---------------- */

export function toJalali(gy, gm, gd) {
  const gDaysInMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  let year = gy - (gy <= 1600 ? 621 : 1600);
  const gy2 = gm > 2 ? year + 1 : year;
  let days =
    365 * year +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    gDaysInMonth[gm - 1];

  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

export function toGregorian(jy, jm, jd) {
  let gy = jy <= 979 ? 621 : 1600;
  let year = jy - (jy <= 979 ? 0 : 979);
  let days =
    365 * year +
    Math.floor(year / 33) * 8 +
    Math.floor(((year % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days >= 36525) {
    days -= 1;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days += 1;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days >= 366) {
    days -= 1;
    gy += Math.floor(days / 365);
    days %= 365;
  }
  let gd = 1 + days;
  const leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  const monthDays = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 1;
  while (gm < 13 && gd > monthDays[gm]) {
    gd -= monthDays[gm];
    gm += 1;
  }
  return { gy, gm, gd };
}

/* طول ماه شمسی: ۶ ماه اول ۳۱، ۶ ماه بعد ۳۰ و اسفند ۲۹ یا ۳۰ */
export function jalaliMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  const g = toGregorian(jy + 1, 1, 1);
  const d = new Date(g.gy, g.gm - 1, g.gd);
  d.setDate(d.getDate() - 1); // آخرین روز سال شمسی
  const last = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return last.jm === 12 ? last.jd : 29;
}

export const JALALI_MONTHS = [
  translateText("فروردین"),
  translateText("اردیبهشت"),
  translateText("خرداد"),
  translateText("تیر"),
  translateText("مرداد"),
  translateText("شهریور"),
  translateText("مهر"),
  translateText("آبان"),
  translateText("آذر"),
  translateText("دی"),
  translateText("بهمن"),
  translateText("اسفند"),
];

/* شنبه‌اول هفته — ۰ = شنبه */
export const JALALI_WEEKDAYS = [translateText("ش"), translateText("ی"), translateText("د"), translateText("س"), translateText("چ"), translateText("پ"), translateText("ج")];

/* jsDay (۰=یکشنبه) → ستون در جدول شمسی (۰=شنبه) */
export const weekdayColumn = (jsDay) => (jsDay + 1) % 7;

/* ---------------- کار با Date و رشته‌های فرم ---------------- */

export const jalaliOfDate = (date) => toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());

export const jalaliLabel = ({ jy, jm, jd }) => `${faDigits(jy)}/${faDigits(pad2(jm))}/${faDigits(pad2(jd))}`;

export const jalaliDateLabel = (date) => {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return translateText("ثبت نشده");
  return dateFormatter(language, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
};

export const jalaliDateTimeLabel = (date) => {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return translateText("ثبت نشده");
  return dateFormatter(language, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(value);
};

/* مقدار «YYYY-MM-DDTHH:mm» که input datetime-local و کد فعلی انتظار دارد */
export const toLocalInputValue = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(
    date.getHours(),
  )}:${pad2(date.getMinutes())}`;

export const parseLocalInputValue = (raw) => {
  if (!raw) return null;
  const match = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!match) {
    const fallback = new Date(raw);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  const [, y, m, d, h, mi] = match;
  const value = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(mi), 0, 0);
  return Number.isNaN(value.getTime()) ? null : value;
};

/* ساخت مقدار فرم از تاریخ شمسی انتخاب‌شده */
export const fromJalaliParts = (jy, jm, jd, hour = 0, minute = 0) => {
  const g = toGregorian(jy, jm, jd);
  return toLocalInputValue(new Date(g.gy, g.gm - 1, g.gd, hour, minute, 0, 0));
};

/* سال شمسی ↔ سال میلادی (برای فیلد «سال تولید» بک‌اند) */
export const gregorianYearOfJalali = (jy) => toGregorian(jy, 1, 1).gy;
export const jalaliYearOfGregorian = (gy) => toJalali(gy, 7, 1).jy;
