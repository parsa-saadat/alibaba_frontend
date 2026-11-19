import { Check, Languages } from 'lucide-react';
import LocaleFlag from './LocaleFlagComponent';
import { language, languages } from '../../../i18n/runtime';

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
      <div className="content-language__tabs" role="group" aria-label={labels[language]} dir="ltr">
        {languages.map((code) => (
          <button
            key={code}
            type="button"
            aria-pressed={editor.locale === code}
            onClick={() => editor.setLocale(code)}
            lang={code}
          >
            <LocaleFlag code={code} />
            <span>{names[code]}</span>
            {editor.locale === code ? (
              <Check size={14} />
            ) : (
              <span className="content-language__dot" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
