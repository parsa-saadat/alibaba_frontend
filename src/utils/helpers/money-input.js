// Formatting is string-based: grouping never rounds an existing USD value.
const systems = {
  en: { group: ',', decimal: '.', digits: '0123456789' },
  fa: { group: '٬', decimal: '٫', digits: '۰۱۲۳۴۵۶۷۸۹' },
  ar: { group: '٬', decimal: '٫', digits: '٠١٢٣٤٥٦٧٨٩' },
  tr: { group: '.', decimal: ',', digits: '0123456789' },
};
export const moneyInputSymbols = (lang = 'en') => systems[lang] || systems.en;
export const asciiMoneyDigits = (value) =>
  String(value ?? '')
    .replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
export function formatMoneyEntry(value, lang = 'en') {
  const { group, decimal, digits } = moneyInputSymbols(lang);
  const raw = asciiMoneyDigits(value);
  if (!raw) return '';
  const [integer, fraction] = raw.split('.');
  const result =
    (integer || '0').replace(/\B(?=(\d{3})+(?!\d))/g, group) +
    (raw.includes('.') ? decimal + (fraction || '') : '');
  return result.replace(/\d/g, (d) => digits[Number(d)]);
}
export function parseMoneyEntry(
  text,
  lang = 'en',
  selection = String(text).length,
  strictLocale = false,
) {
  const value = asciiMoneyDigits(text);
  // Reject negative, exponential or textual inputs, rather than silently changing their meaning.
  if (/[^\d.,٬٫;؛\s]/u.test(value)) return null;
  let decimal = value.includes('٫') ? '٫' : '.';
  if (lang === 'tr' && !value.includes('٫')) {
    if (value.includes(',')) decimal = ',';
    else {
      // Accept an ungrouped ASCII decimal pasted from another source as well.
      const dots = (value.match(/\./g) || []).length;
      const groupedInteger = /^[1-9]\d{0,2}\.\d{3}$/.test(value);
      decimal = !strictLocale && dots === 1 && !groupedInteger ? '.' : ',';
    }
  }
  const normalize = (s) =>
    [...s]
      .filter((c) => /\d/.test(c) || c === decimal)
      .join('')
      .replaceAll(decimal, '.');
  let raw = normalize(value);
  if ((raw.match(/\./g) || []).length > 1) return null;
  let caret = normalize(value.slice(0, selection)).length;
  if (raw.startsWith('.')) {
    raw = '0' + raw;
    caret++;
  }
  return { value: raw, caret };
}
export function moneyDisplayCaret(formatted, logicalCaret, lang) {
  if (!logicalCaret) return 0;
  const decimal = moneyInputSymbols(lang).decimal;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(asciiMoneyDigits(formatted[i])) || formatted[i] === decimal) seen++;
    if (seen >= logicalCaret) return i + 1;
  }
  return formatted.length;
}
export function moneyLogicalCaret(formatted, caret, lang) {
  const decimal = moneyInputSymbols(lang).decimal;
  return [...asciiMoneyDigits(formatted.slice(0, caret))].filter(
    (c) => /\d/.test(c) || c === decimal,
  ).length;
}
