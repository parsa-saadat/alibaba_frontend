const filled = (value) =>
  Array.isArray(value) ? value.length > 0 : typeof value === 'string' && !!value.trim();
export function sourceContent(translations, locale, fields) {
  return Object.fromEntries(
    fields
      .filter((field) => filled(translations?.[locale]?.[field]))
      .map((field) => [field, translations[locale][field]]),
  );
}
export function mergeGenerated(translations, generated) {
  const next = structuredClone(translations || {});
  let count = 0;
  for (const [locale, fields] of Object.entries(generated || {}))
    for (const [field, value] of Object.entries(fields || {})) {
      if (!filled(next[locale]?.[field]) && filled(value)) {
        next[locale] = { ...next[locale], [field]: value };
        count++;
      }
    }
  return { translations: next, count };
}
