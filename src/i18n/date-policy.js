// Language does not uniquely identify nationality. These are explicit site defaults.
export const datePolicies = {
  fa: { locale: 'fa-IR', calendar: 'persian' },
  en: { locale: 'en-GB', calendar: 'gregory' },
  ar: { locale: 'ar-AE', calendar: 'gregory' },
  tr: { locale: 'tr-TR', calendar: 'gregory' },
};
export function datePolicy(language) {
  return datePolicies[language] || datePolicies.en;
}
export function dateFormatter(language, options = {}) {
  const policy = datePolicy(language);
  return new Intl.DateTimeFormat(policy.locale, {
    ...options,
    calendar: policy.calendar,
    numberingSystem: { fa: 'arabext', ar: 'arab', en: 'latn', tr: 'latn' }[language] || 'latn',
  });
}
