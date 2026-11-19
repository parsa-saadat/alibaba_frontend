import { useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { Globe2, ChevronDown, Check, ArrowRightLeft, X } from 'lucide-react';
import { languages, currencies, language, currency, setPreferences } from '../../../i18n/runtime';
import LocaleFlag from './LocaleFlagComponent';
const names = { en: 'English', fa: 'فارسی', ar: 'العربية', tr: 'Türkçe' };
const symbols = { USD: '$', IRT: 'ت', IRR: '﷼', TRY: '₺', AED: 'د.إ', EUR: '€' };
const ui = {
  en: {
    title: 'Make yourself at home',
    hint: 'Choose your language and the currency you want to see.',
    lang: 'Language',
    money: 'Display currency',
    apply: 'Apply preferences',
    cancel: 'Cancel',
    main: 'Shop in the world’s leading languages',
    admin: 'Workspace preferences',
    seller: 'Your selling workspace',
    auth: 'Choose your language',
    close: 'Close',
  },
  fa: {
    title: 'به زبان خودتان، با ارز دلخواه',
    hint: 'زبان رابط و ارز نمایش قیمت‌ها را انتخاب کنید.',
    lang: 'زبان نمایش',
    money: 'ارز نمایش قیمت',
    apply: 'اعمال تنظیمات',
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
  const id = useId();
  const dialog = useRef(null);
  const trigger = useRef(null);
  const [draft, setDraft] = useState({ language, currency });
  const open = () => {
    setDraft({ language, currency });
    dialog.current?.showModal();
  };
  const close = () => {
    dialog.current?.close();
    trigger.current?.focus();
  };
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
        className="regional-trigger"
        onClick={open}
        aria-haspopup="dialog"
        aria-label={`${ui.lang}: ${names[language]} · ${ui.money}: ${currency}`}
      >
        <LocaleFlag code={language} />
        <span className="regional-trigger__language">{names[language]}</span>
        <span className="regional-trigger__divider" />
        <span className="regional-trigger__money" dir="ltr">
          <b>{symbols[currency]}</b> {currency}
        </span>
        <ChevronDown size={13} />
      </button>
      {createPortal(
        <dialog
          ref={dialog}
          className="regional-dialog"
          aria-labelledby={`regional-title-${id}`}
          onClick={(e) => {
            if (e.target === dialog.current) close();
          }}
          onCancel={() => trigger.current?.focus()}
          dir={['fa', 'ar'].includes(language) ? 'rtl' : 'ltr'}
        >
          <header>
            <span className="regional-dialog__icon">
              <Globe2 size={24} />
            </span>
            <button className="regional-close" type="button" aria-label={ui.close} onClick={close}>
              <X size={19} />
            </button>
            <h2 id={`regional-title-${id}`}>{ui.title}</h2>
            <p>{ui.hint}</p>
          </header>
          <div className="regional-dialog__body">
            <section>
              <h3>
                <Globe2 size={15} />
                {ui.lang}
              </h3>
              <div className="regional-options" role="group" aria-label={ui.lang}>
                {languages.map((code) => (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={draft.language === code}
                    onClick={() =>
                      setDraft((previous) => ({
                        ...previous,
                        language: code,
                        currency: { en: 'USD', fa: 'IRT', tr: 'TRY', ar: 'AED' }[code],
                      }))
                    }
                  >
                    <LocaleFlag code={code} />
                    <span lang={code}>{names[code]}</span>
                    {draft.language === code && <Check size={15} />}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ArrowRightLeft size={15} />
                {ui.money}
              </h3>
              <div
                className="regional-options regional-options--money"
                role="group"
                aria-label={ui.money}
              >
                {currencies.map((code) => (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={draft.currency === code}
                    onClick={() => setDraft((previous) => ({ ...previous, currency: code }))}
                  >
                    <span className="currency-symbol">{symbols[code]}</span>
                    <span>
                      <b dir="ltr">{code}</b>
                      <small>{moneyNames[code]}</small>
                    </span>
                    {draft.currency === code && <Check size={15} />}
                  </button>
                ))}
              </div>
            </section>
          </div>
          <footer>
            <button className="regional-cancel" type="button" onClick={close}>
              {ui.cancel}
            </button>
            <button
              className="regional-apply"
              type="button"
              onClick={() => {
                if (draft.language === language && draft.currency === currency) {
                  close();
                  return;
                }
                setPreferences(draft.language, draft.currency);
              }}
            >
              {ui.apply}
              <Check size={16} />
            </button>
          </footer>
        </dialog>,
        document.body,
      )}
    </div>
  );
}
