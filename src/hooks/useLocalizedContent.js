import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API } from '../config/api';
import { authHeaders } from '../utils/helpers/storage';
import { language, languages } from '../i18n/runtime';
import { contentPlaceholder } from '../i18n/content-placeholders.mjs';
import { sourceContent, mergeGenerated } from '../i18n/auto-translate.mjs';
import { seedContent, contentPayload } from '../i18n/content-model.mjs';

export default function useLocalizedContent(form, setForm, fields, entity = 'product') {
  const [locale, setLocale] = useState(language);
  const [translating, setTranslating] = useState(false);
  const [translationStatus, setTranslationStatus] = useState('');
  const latestFormRef = useRef(form);
  latestFormRef.current = form;
  const activeRequestRef = useRef(null);
  useEffect(() => () => activeRequestRef.current?.abort(), []);
  const preparedForm = seedContent(form, fields);
  const value = (field) =>
    preparedForm.translations?.[locale]?.[field] ?? (field === 'tags' ? [] : '');
  const update = (field, next) =>
    setForm((previous) => {
      const preparedForm = seedContent(previous, fields);
      return {
        ...previous,
        translations: {
          ...preparedForm.translations,
          [locale]: { ...preparedForm.translations[locale], [field]: next === '' ? null : next },
        },
      };
    });
  const autoTranslate = async () => {
    if (activeRequestRef.current) return;
    const source = sourceContent(preparedForm.translations, locale, fields);
    if (!Object.keys(source).length) {
      setTranslationStatus('empty');
      return;
    }
    const targets = languages.filter(
      (lang) =>
        lang !== locale &&
        Object.keys(source).some((field) => {
          const targetValue = preparedForm.translations?.[lang]?.[field];
          return Array.isArray(targetValue) ? !targetValue.length : !targetValue?.trim();
        }),
    );
    if (!targets.length) {
      setTranslationStatus('full');
      return;
    }
    // Ignore a late response when the editor has changed since the request.
    const sourceFingerprint = JSON.stringify(source);
    const initialIdentity = form._id || form.store_id || null;
    const controller = new AbortController();
    activeRequestRef.current = controller;
    setTranslating(true);
    setTranslationStatus('');
    try {
      const response = await axios.post(
        `${API}/i18n/translate`,
        { entity, source: locale, contents: source, targets },
        { ...authHeaders(), signal: controller.signal, timeout: 65000 },
      );
      if (!response.data?.success || !response.data?.body?.translations)
        throw Error('Invalid translation response');
      const current = seedContent(latestFormRef.current, fields);
      if (
        JSON.stringify(sourceContent(current.translations, locale, fields)) !== sourceFingerprint ||
        (latestFormRef.current._id || latestFormRef.current.store_id || null) !== initialIdentity
      ) {
        setTranslationStatus('changed');
        return;
      }
      setForm((previous) => {
        const current = seedContent(previous, fields);
        const result = mergeGenerated(current.translations, response.data.body.translations);
        return { ...previous, translations: result.translations };
      });
      setTranslationStatus('done');
    } catch (error) {
      if (!controller.signal.aborted) setTranslationStatus('error');
    } finally {
      activeRequestRef.current = null;
      if (!controller.signal.aborted) setTranslating(false);
    }
  };
  return {
    locale,
    setLocale,
    value,
    update,
    placeholder: (field) => contentPlaceholder(locale, entity, field),
    autoTranslate,
    translating,
    translationStatus,
    dir: ['fa', 'ar'].includes(locale) ? 'rtl' : 'ltr',
    payload: () => contentPayload(preparedForm, fields),
    translations: preparedForm.translations,
  };
}
