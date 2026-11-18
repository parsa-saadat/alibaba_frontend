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
export function formatMoney(amount, code = currency) {
  if (code === 'IRT')
    return `${new Intl.NumberFormat(language, { maximumFractionDigits: 0 }).format(Number(amount || 0))} ${{ fa: 'تومان', en: 'toman', ar: 'تومان', tr: 'tümen' }[language]}`;
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: code === 'IRR' ? 0 : 2,
  }).format(Number(amount || 0));
}
if (typeof document !== 'undefined') {
  document.documentElement.lang = language;
  document.documentElement.dir = direction;
  const titles = {
    en: 'GeoCala | Surveying Equipment',
    fa: 'ژئو کالا | تجهیزات نقشه‌برداری',
    ar: 'جيوكالا | معدات المساحة',
    tr: 'GeoCala | Harita Ölçüm Ekipmanları',
  };
  document.title = titles[language];
  const descriptions = {
    en: 'Surveying equipment marketplace: total stations, GNSS and accessories.',
    fa: 'بازارگاه تجهیزات نقشه‌برداری، توتال استیشن، جی‌ان‌اس‌اس و لوازم جانبی.',
    ar: 'سوق معدات المساحة والمحطات الشاملة وأجهزة الملاحة وملحقاتها.',
    tr: 'Harita ölçüm ekipmanları, total station, GNSS ve aksesuar pazaryeri.',
  };
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]'])
    document.querySelector(selector)?.setAttribute('content', descriptions[language]);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', titles[language]);
}
