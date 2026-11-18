export function seedContent(form, fields) {
  const translations = structuredClone(form.translations || {});
  for (const field of fields) {
    const hasTranslation = Object.values(translations).some((v) => v && Object.hasOwn(v, field));
    if (!hasTranslation && form[field]?.length) {
      translations.en = { ...translations.en, [field]: form[field] };
    }
  }
  return { ...form, translations };
}
export function contentPayload(form, fields) {
  const result = { ...form };
  for (const field of fields) {
    const values = ['en', 'fa', 'ar', 'tr'].map((lang) => form.translations?.[lang]?.[field]);
    result[field] =
      values.find((v) => (Array.isArray(v) ? v.length : typeof v === 'string' && v.trim())) ??
      (field === 'tags' ? [] : '');
  }
  return result;
}
