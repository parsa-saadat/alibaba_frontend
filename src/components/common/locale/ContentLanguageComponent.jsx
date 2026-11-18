import { Check, Languages, Sparkles, LoaderCircle } from 'lucide-react';
import LocaleFlag from './LocaleFlagComponent';
import { language, languages } from '../../../i18n/runtime';
import { automaticText } from '../../../i18n/editor-messages';

const names = { en: 'English', fa: 'فارسی', ar: 'العربية', tr: 'Türkçe' };
const labels = { en: 'Content language', fa: 'زبان محتوا', ar: 'لغة المحتوى', tr: 'İçerik dili' };

export default function ContentLanguageComponent({ editor, compact = false }) {
  return (
    <div
      className={`content-language ${compact ? 'content-language--compact' : ''}`}
      data-testid="content-language"
    >
      <span className="content-language__title">
        <Languages size={18} />
        {labels[language]}
      </span>
      <button
        type="button"
        className="auto-translate-button"
        data-testid="auto-translate"
        disabled={editor.translating}
        onClick={editor.autoTranslate}
      >
        {editor.translating ? (
          <LoaderCircle size={15} className="animate-spin" />
        ) : (
          <Sparkles size={15} />
        )}
        <span>{editor.translating ? automaticText.loading : automaticText.button}</span>
      </button>
      <div className="content-language__tabs" role="group" aria-label={labels[language]} dir="ltr">
        {languages.map((lang) => (
          <button
            key={lang}
            type="button"
            aria-pressed={editor.locale === lang}
            onClick={() => editor.setLocale(lang)}
            lang={lang}
          >
            <LocaleFlag code={lang} />
            <span>{names[lang]}</span>
            {editor.locale === lang ? (
              <Check size={14} />
            ) : (
              <span className="content-language__dot" />
            )}
          </button>
        ))}
      </div>
      <p className="auto-translate-hint">{automaticText.hint}</p>
      {editor.translationStatus && (
        <p className="auto-translate-status" role="status" aria-live="polite">
          {automaticText[editor.translationStatus]}
        </p>
      )}
    </div>
  );
}
