import { language } from './runtime';
const codes = ['en', 'fa', 'ar', 'tr'];
const fields = [
  'name',
  'brand',
  'description',
  'short_description',
  'tags',
  'address',
  'firstname',
  'lastname',
  'store_name',
  'email',
  'phone',
  'fax',
  'planName',
];
export const isLanguageMap = (value) =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).length > 0 &&
  Object.keys(value).every((code) => codes.includes(code));
export const localizedField = (value) =>
  isLanguageMap(value)
    ? (value[language] ?? value.en ?? Object.values(value).find((v) => v != null) ?? '')
    : value;

// Editor tabs retain an in-memory view; the HTTP payload and database are field-first.
export function readContent(value) {
  if (Array.isArray(value)) return value.map(readContent);
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) return value;
  const result = {};
  const translations = {};
  for (const [field, text] of Object.entries(value)) {
    if (
      fields.includes(field) &&
      text &&
      Object.getPrototypeOf(text) === Object.prototype &&
      !Object.keys(text).length
    ) {
      result[field] = field === 'tags' ? [] : '';
    } else if (fields.includes(field) && isLanguageMap(text)) {
      result[field] = localizedField(text);
      for (const [code, v] of Object.entries(text))
        translations[code] = { ...translations[code], [field]: v };
    } else result[field] = readContent(text);
  }
  if (Object.keys(translations).length) result.translations = translations;
  return result;
}
export function writeContent(value) {
  if (Array.isArray(value)) return value.map(writeContent);
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) return value;
  const result = Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !['translations', 'translation_status'].includes(key))
      .map(([key, v]) => [key, writeContent(v)]),
  );
  for (const [code, values] of Object.entries(value.translations || {})) {
    if (values === null) {
      for (const field of fields)
        if (field in result)
          result[field] = { ...(isLanguageMap(result[field]) ? result[field] : {}), [code]: null };
      continue;
    }
    for (const [field, text] of Object.entries(values))
      if (fields.includes(field) && codes.includes(code))
        result[field] = { ...(isLanguageMap(result[field]) ? result[field] : {}), [code]: text };
  }
  return result;
}
