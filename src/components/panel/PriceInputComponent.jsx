import { useEffect, useRef, useState } from 'react';
import GroupedMoneyInput from './GroupedMoneyInput';
import axios from 'axios';
import { API } from '../../config/api';
import {
  language,
  formatMoney,
  currencyLabel,
  currency as selectedCurrency,
} from '../../i18n/runtime';
export const preferredCurrency = selectedCurrency;
const phrases = {
  en: {
    label: 'Price',
    currency: 'Input currency',
    info: 'The server converts your entry at the current rate and stores only USD. An unchanged existing price keeps its exact USD value.',
    loading: 'Getting the current conversion rate…',
    error: 'Conversion is unavailable. Retry or choose USD; no estimated rate is used.',
    retry: 'Retry',
    preview: 'USD estimate',
    min: 'Enter a positive amount',
  },
  fa: {
    label: 'قیمت',
    currency: 'ارز ورودی',
    info: 'سرور مبلغ را با نرخ روز تبدیل و فقط دلار ذخیره می‌کند. قیمت قبلیِ ویرایش‌نشده، دقیقاً با مقدار دلاری خودش حفظ می‌شود.',
    loading: 'در حال دریافت تبدیل روز…',
    error:
      'تبدیل ارز در دسترس نیست؛ دوباره تلاش کنید یا دلار را انتخاب کنید. نرخ تخمینی استفاده نمی‌شود.',
    retry: 'تلاش دوباره',
    preview: 'معادل تقریبی دلار',
    min: 'مبلغی بیشتر از صفر وارد کنید',
  },
  ar: {
    label: 'السعر',
    currency: 'عملة الإدخال',
    info: 'يحوّل الخادم المبلغ بالسعر الحالي ويحفظه بالدولار فقط. يحتفظ السعر غير المعدّل بقيمته الأصلية بالدولار.',
    loading: 'جارٍ جلب التحويل الحالي…',
    error: 'التحويل غير متاح. حاول مجدداً أو اختر الدولار؛ لا يُستخدم سعر تقديري.',
    retry: 'إعادة المحاولة',
    preview: 'تقدير بالدولار',
    min: 'أدخل مبلغاً موجباً',
  },
  tr: {
    label: 'Fiyat',
    currency: 'Giriş para birimi',
    info: 'Sunucu tutarı güncel kurla dönüştürüp yalnızca USD kaydeder. Değişmeyen fiyatın özgün USD değeri korunur.',
    loading: 'Güncel kur alınıyor…',
    error: 'Dönüşüm kullanılamıyor. Tekrar deneyin veya USD seçin; tahmini kur kullanılmaz.',
    retry: 'Tekrar dene',
    preview: 'Tahmini USD karşılığı',
    min: 'Pozitif bir tutar girin',
  },
};
async function conversion(amount, from, to, signal) {
  const response = await axios.post(
    `${API}/fx/convert`,
    { amount, from, to },
    { signal, timeout: 12000 },
  );
  if (!response.data?.success || !Number.isFinite(response.data.body?.amount))
    throw new Error('Conversion unavailable');
  return response.data.body;
}
export function usePriceEntry(basePrice, entityKey = 'new') {
  const [entry, setEntry] = useState({
    amount: '',
    currency: preferredCurrency,
    ready: false,
    dirty: false,
    error: false,
  });
  const [retry, setRetry] = useState(0);
  const version = useRef(0);
  const baseAmount = basePrice?.amount,
    baseCurrency = basePrice?.currency;
  useEffect(() => {
    const controller = new AbortController();
    const current = ++version.current;
    if (!Number.isFinite(baseAmount)) {
      setEntry({
        amount: '',
        currency: preferredCurrency,
        ready: true,
        dirty: false,
        error: false,
      });
      return () => controller.abort();
    }
    setEntry({ amount: '', currency: preferredCurrency, ready: false, dirty: false, error: false });
    const load =
      baseCurrency === preferredCurrency
        ? Promise.resolve({ amount: baseAmount })
        : conversion(baseAmount, baseCurrency, preferredCurrency, controller.signal);
    load
      .then((result) => {
        if (version.current === current)
          setEntry({
            amount: String(result.amount),
            currency: preferredCurrency,
            ready: true,
            dirty: false,
            error: false,
          });
      })
      .catch(() => {
        if (!controller.signal.aborted && version.current === current)
          setEntry({
            amount: '',
            currency: preferredCurrency,
            ready: false,
            dirty: false,
            error: true,
          });
      });
    return () => controller.abort();
  }, [entityKey, baseAmount, baseCurrency, retry]);
  const setAmount = (amount) =>
    setEntry((previous) => ({ ...previous, amount, dirty: true, error: false }));
  const setCurrency = async (currency) => {
    const current = ++version.current;
    const source =
      !entry.dirty && Number.isFinite(baseAmount)
        ? { amount: baseAmount, currency: baseCurrency }
        : { amount: Number(entry.amount), currency: entry.currency };
    if (!entry.amount && !Number.isFinite(baseAmount)) {
      setEntry({ ...entry, amount: '', currency, ready: true, error: false });
      return;
    }
    setEntry({ ...entry, currency, amount: '', ready: false, error: false });
    try {
      const result =
        source.currency === currency
          ? { amount: source.amount }
          : await conversion(source.amount, source.currency, currency);
      if (version.current === current)
        setEntry({ ...entry, amount: String(result.amount), currency, ready: true, error: false });
    } catch {
      if (version.current === current)
        setEntry({ ...entry, amount: '', currency, ready: false, error: true });
    }
  };
  const payload = () => {
    if (!entry.ready || entry.error) throw new Error(phrases[language].error);
    if (!entry.dirty && baseCurrency === 'USD' && Number.isFinite(baseAmount))
      return { amount: baseAmount, currency: 'USD' };
    const amount = Number(entry.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error(phrases[language].min);
    return { amount, currency: entry.currency };
  };
  return { entry, setAmount, setCurrency, payload, retry: () => setRetry((v) => v + 1) };
}
export default function MoneyInput({ price }) {
  const ui = phrases[language];
  const { entry } = price;
  const [estimate, setEstimate] = useState(null);
  useEffect(() => {
    setEstimate(null);
    if (!entry.ready || !entry.amount || Number(entry.amount) <= 0) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (entry.currency === 'USD') {
        setEstimate(Number(entry.amount));
        return;
      }
      conversion(Number(entry.amount), entry.currency, 'USD', controller.signal)
        .then((result) => setEstimate(result.amount))
        .catch(() => {});
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [entry.amount, entry.currency, entry.ready]);
  return (
    <section className="money-input" data-testid="money-input">
      <div className="money-input__controls">
        <label>
          <span>{ui.label}</span>
          <GroupedMoneyInput
            className="input"
            aria-label="Price amount"
            value={entry.amount}
            disabled={!entry.ready}
            onValueChange={price.setAmount}
            required
          />
        </label>
        <label>
          <span>{ui.currency}</span>
          <select
            className="input"
            dir="ltr"
            aria-label="Price input currency"
            value={entry.currency}
            onChange={(e) => price.setCurrency(e.target.value)}
          >
            {['IRT', 'USD', 'TRY', 'AED', 'EUR', 'IRR'].map((code) => (
              <option key={code} value={code}>
                {code === 'IRT' ? `${currencyLabel(code)} (IRT)` : code}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="money-input__help">{ui.info}</p>
      {!entry.ready && !entry.error && <p role="status">{ui.loading}</p>}
      {entry.error && (
        <div role="alert" className="money-input__error">
          {ui.error}
          <button className="btn-ghost" type="button" onClick={price.retry}>
            {ui.retry}
          </button>
        </div>
      )}
      {estimate !== null && (
        <output className="money-input__estimate">
          {ui.preview}: <b dir="ltr">{formatMoney(estimate, 'USD')}</b>
        </output>
      )}
    </section>
  );
}
