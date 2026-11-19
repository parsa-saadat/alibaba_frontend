import { useState } from 'react';
import { language } from '../i18n/runtime';
import { contentPlaceholder } from '../i18n/content-placeholders.mjs';
import { seedContent, contentPayload } from '../i18n/content-model.mjs';

export default function useLocalizedContent(form, setForm, fields, entity = 'product') {
  const [locale, setLocale] = useState(language);
  const prepared = seedContent(form, fields);
  const value = (field) => prepared.translations?.[locale]?.[field] ?? (field === 'tags' ? [] : '');
  const update = (field, next) =>
    setForm((previous) => {
      const current = seedContent(previous, fields);
      return {
        ...previous,
        translations: {
          ...current.translations,
          [locale]: { ...current.translations[locale], [field]: next === '' ? null : next },
        },
      };
    });
  return {
    locale,
    setLocale,
    value,
    update,
    placeholder: (field) => contentPlaceholder(locale, entity, field),
    dir: ['fa', 'ar'].includes(locale) ? 'rtl' : 'ltr',
    payload: () => contentPayload(prepared, fields),
    translations: prepared.translations,
  };
}
