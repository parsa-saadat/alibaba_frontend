import en from './locales/en.json';
import fa from './locales/fa.json';
import ar from './locales/ar.json';
import tr from './locales/tr.json';
export const languages = ['en', 'fa', 'ar', 'tr'];
export const currencies = ['USD', 'IRT', 'IRR', 'EUR', 'TRY', 'AED'];
const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
export const language = languages.includes(read('app.language')) ? read('app.language') : 'en';
export const currency = currencies.includes(read('app.currency.v3'))
  ? read('app.currency.v3')
  : { en: 'USD', fa: 'IRT', ar: 'AED', tr: 'TRY' }[language];
export const direction = ['fa', 'ar'].includes(language) ? 'rtl' : 'ltr';
const dictionaries = { en, fa, ar, tr };
export function t(key, values = {}) {
  return (dictionaries[language]?.[key] ?? en[key] ?? key).replace(
    /\{\{\s*(\w+)\s*\}\}/g,
    (_, name) => String(values[name] ?? `{{${name}}}`),
  );
}
export function setPreferences(nextLanguage, nextCurrency) {
  if (!languages.includes(nextLanguage) || !currencies.includes(nextCurrency)) return;
  try {
    localStorage.setItem('app.language', nextLanguage);
    localStorage.setItem('app.currency.v3', nextCurrency);
  } catch {
    return;
  }
  // Full navigation clears locale-dependent module constants, data caches and auth views.
  window.location.reload();
}
export const numberingSystem = { fa: 'arabext', ar: 'arab', en: 'latn', tr: 'latn' }[language];
export const numberLocale = { fa: 'fa-IR', ar: 'ar-AE', en: 'en-US', tr: 'tr-TR' }[language];
export function localizeDigits(value) {
  const digits = { fa: '۰۱۲۳۴۵۶۷۸۹', ar: '٠١٢٣٤٥٦٧٨٩' }[language];
  const normalized = String(value ?? '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  return digits ? normalized.replace(/\d/g, (d) => digits[Number(d)]) : normalized;
}
export const formatNumber = (value, options = {}) =>
  new Intl.NumberFormat(numberLocale, { numberingSystem, ...options }).format(Number(value) || 0);
export const currencyLabel = (code = currency) =>
  code === 'IRT' ? { en: 'Toman', fa: 'تومان', ar: 'تومان', tr: 'Tümen' }[language] : code;
export function formatMoney(amount, code = currency, options = {}) {
  if (
    amount === null ||
    amount === undefined ||
    amount === '' ||
    !Number.isFinite(Number(amount)) ||
    !currencies.includes(code)
  )
    return '—';
  if (code === 'IRT')
    return `${formatNumber(amount, { maximumFractionDigits: 0, ...options })} ${{ fa: 'تومان', en: 'toman', ar: 'تومان', tr: 'tümen' }[language]}`;
  return new Intl.NumberFormat(numberLocale, {
    numberingSystem,
    style: 'currency',
    currency: code,
    maximumFractionDigits: code === 'IRR' ? 0 : 2,
    ...options,
  }).format(Number(amount) || 0);
}
if (typeof document !== 'undefined') {
  document.documentElement.lang = language;
  document.documentElement.dir = direction;
  const titles = {
    en: 'GeoCala | B2B Surveying Platform',
    fa: 'ژئوکالا | پلتفرم B2B تجهیزات نقشه‌برداری',
    ar: 'GeoCala | منصة B2B لمعدات المساحة',
    tr: 'GeoCala | B2B Ölçüm Platformu',
  };
  document.title = titles[language];
  document
    .querySelector('meta[property="og:site_name"]')
    ?.setAttribute('content', language === 'fa' ? 'ژئوکالا' : 'GeoCala');
  const descriptions = {
    en: 'GeoCala connects businesses with sellers and their products. It is a B2B platform, not a retailer, supplier or sales agency.',
    fa: 'ژئوکالا یک پلتفرم B2B برای معرفی فروشندگان و محصولات است؛ بستری برای ارتباط تجاری میان کسب‌وکارهاست؛ فروشگاه، تأمین‌کننده یا نمایندهٔ فروش کالا نیست.',
    ar: 'تربط GeoCala الشركات بالبائعين ومنتجاتهم. هي منصة B2B وليست متجراً أو مورّداً أو وكيلاً للمبيعات.',
    tr: 'GeoCala, işletmeleri satıcılar ve ürünleriyle buluşturur. Bir B2B platformudur; mağaza, tedarikçi veya satış temsilcisi değildir.',
  };
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]'])
    document.querySelector(selector)?.setAttribute('content', descriptions[language]);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', titles[language]);
}
