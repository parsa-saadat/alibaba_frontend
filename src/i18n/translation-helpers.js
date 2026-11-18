export function cleanTranslations(translations = {}) {
  const result = {};

  for (const [locale, fields] of Object.entries(translations)) {
    if (fields === null) {
      result[locale] = null;
      continue;
    }

    result[locale] = {};
    for (const [field, value] of Object.entries(fields)) {
      const isText = typeof value === 'string' && value.trim();
      if (value === null || Array.isArray(value) || isText) {
        result[locale][field] = value;
      }
    }
  }

  return result;
}
