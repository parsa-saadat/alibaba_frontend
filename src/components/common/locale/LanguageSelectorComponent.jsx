import { useEffect, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { Globe2, ChevronDown, X } from 'lucide-react';
import { languages, currencies, language, currency, setPreferences } from '../../../i18n/runtime';
const names = { en: 'English', fa: 'فارسی', ar: 'العربية', tr: 'Türkçe' };
const ui = {
  en: {
    title: 'Set language and currency',
    hint: 'Select your preferred language and currency. You can update the settings at any time.',
    lang: 'Language',
    money: 'Display currency',
    apply: 'Save',
    cancel: 'Cancel',
    main: 'Shop in the world’s leading languages',
    admin: 'Workspace preferences',
    seller: 'Your selling workspace',
    auth: 'Choose your language',
    close: 'Close',
  },
  fa: {
    title: 'تنظیم زبان و ارز',
    hint: 'زبان رابط و ارز نمایش قیمت‌ها را انتخاب کنید.',
    lang: 'زبان نمایش',
    money: 'ارز نمایش قیمت',
    apply: 'ذخیره',
    cancel: 'انصراف',
    main: 'خرید با زبان‌های روز دنیا',
    admin: 'تنظیمات محیط مدیریت',
    seller: 'تنظیمات محیط فروشندگی',
    auth: 'زبان خودتان را انتخاب کنید',
    close: 'بستن',
  },
  ar: {
    title: 'بلغتك وعملتك المفضلة',
    hint: 'اختر لغة الواجهة وعملة عرض الأسعار.',
    lang: 'لغة العرض',
    money: 'عملة العرض',
    apply: 'تطبيق التفضيلات',
    cancel: 'إلغاء',
    main: 'تسوّق بلغات العالم',
    admin: 'تفضيلات الإدارة',
    seller: 'تفضيلات مساحة البائع',
    auth: 'اختر لغتك',
    close: 'إغلاق',
  },
  tr: {
    title: 'Kendi diliniz, tercih ettiğiniz para birimi',
    hint: 'Arayüz dilini ve fiyatların para birimini seçin.',
    lang: 'Görüntüleme dili',
    money: 'Para birimi',
    apply: 'Tercihleri uygula',
    cancel: 'İptal',
    main: 'Dünyanın önde gelen dillerinde alışveriş',
    admin: 'Yönetim tercihleri',
    seller: 'Satıcı alanı tercihleri',
    auth: 'Dilinizi seçin',
    close: 'Kapat',
  },
}[language];
const moneyNames = {
  en: {
    USD: 'US Dollar',
    IRT: 'Iranian toman',
    IRR: 'Iranian rial',
    TRY: 'Turkish lira',
    AED: 'UAE dirham',
    EUR: 'Euro',
  },
  fa: {
    USD: 'دلار آمریکا',
    IRT: 'تومان',
    IRR: 'ریال ایران',
    TRY: 'لیر ترکیه',
    AED: 'درهم امارات',
    EUR: 'یورو',
  },
  ar: {
    USD: 'دولار أمريكي',
    IRT: 'تومان إيراني',
    IRR: 'ريال إيراني',
    TRY: 'ليرة تركية',
    AED: 'درهم إماراتي',
    EUR: 'يورو',
  },
  tr: {
    USD: 'ABD doları',
    IRT: 'İran tümeni',
    IRR: 'İran riyali',
    TRY: 'Türk lirası',
    AED: 'BAE dirhemi',
    EUR: 'Euro',
  },
}[language];
export default function LanguageSelector({ variant = 'main', placement = 'bar', compact = false }) {
  const id = useId(),
    dialog = useRef(null),
    trigger = useRef(null);
  const [draft, setDraft] = useState({ language, currency });
  const [position, setPosition] = useState({ top: 60, left: 12 });
  const place = () => {
    const r = trigger.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(356, innerWidth - 24);
    const height = dialog.current?.getBoundingClientRect().height || 350;
    const below = innerHeight - r.bottom - 22;
    const above = r.top - 22;
    const useBelow = below >= height || below >= above;
    const available = Math.max(100, useBelow ? below : above);
    setPosition({
      left: Math.max(12, Math.min(r.right - width, innerWidth - width - 12)),
      top: useBelow ? r.bottom + 10 : Math.max(12, r.top - Math.min(height, available) - 10),
      maxHeight: available,
    });
  };
  const close = () => {
    dialog.current?.close();
    trigger.current?.focus();
  };
  useEffect(() => {
    const update = () => {
      if (dialog.current?.open) place();
    };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return (
    <div
      className={`locale-selector regional-bar regional-bar--${variant} regional-placement--${placement} ${compact ? 'regional-compact' : ''}`}
    >
      <div className="regional-bar__caption">
        <Globe2 size={15} />
        <span>{ui[variant] || ui.main}</span>
      </div>
      <button
        ref={trigger}
        type="button"
        className="regional-trigger locale-compact-trigger"
        onClick={() => {
          setDraft({ language, currency });
          place();
          dialog.current?.showModal();
          requestAnimationFrame(place);
        }}
        aria-haspopup="dialog"
        aria-label={`${ui.lang}: ${names[language]} · ${ui.money}: ${currency}`}
      >
        <Globe2 size={19} />
        <span>
          {names[language]}
          <span aria-hidden="true"> · </span>
          {currency}
        </span>
        <ChevronDown size={13} />
      </button>
      {createPortal(
        <dialog
          ref={dialog}
          className="locale-popover"
          style={{ top: position.top, left: position.left, maxHeight: position.maxHeight }}
          dir={['fa', 'ar'].includes(language) ? 'rtl' : 'ltr'}
          aria-labelledby={`locale-title-${id}`}
          onClick={(e) => {
            if (e.target === dialog.current) {
              const r = e.currentTarget.getBoundingClientRect();
              if (
                e.clientX < r.left ||
                e.clientX > r.right ||
                e.clientY < r.top ||
                e.clientY > r.bottom
              )
                close();
            }
          }}
          onCancel={() => trigger.current?.focus()}
        >
          <button
            className="locale-popover-close"
            type="button"
            aria-label={ui.close}
            onClick={close}
          >
            <X size={16} />
          </button>
          <h2 id={`locale-title-${id}`}>{ui.title}</h2>
          <p>{ui.hint}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.language === language && draft.currency === currency) close();
              else setPreferences(draft.language, draft.currency);
            }}
          >
            <label htmlFor={`locale-language-${id}`}>{ui.lang}</label>
            <select
              id={`locale-language-${id}`}
              value={draft.language}
              onChange={(e) => setDraft((v) => ({ ...v, language: e.target.value }))}
            >
              {languages.map((code) => (
                <option key={code} value={code}>
                  {names[code]}
                </option>
              ))}
            </select>
            <label htmlFor={`locale-currency-${id}`}>{ui.money}</label>
            <select
              id={`locale-currency-${id}`}
              value={draft.currency}
              onChange={(e) => setDraft((v) => ({ ...v, currency: e.target.value }))}
            >
              {currencies.map((code) => (
                <option key={code} value={code}>
                  {code} - {moneyNames[code]}
                </option>
              ))}
            </select>
            <button type="submit" className="locale-save">
              {ui.apply}
            </button>
          </form>
        </dialog>,
        document.body,
      )}
    </div>
  );
}
