import { language } from '../../i18n/runtime';
import { isLanguageMap, readContent } from '../../i18n/content-fields';
export function displayText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (isLanguageMap(value))
    return displayText(value[language] ?? value.en ?? Object.values(value).find((v) => v != null));
  if (Array.isArray(value)) return value.map(displayText).filter(Boolean).join(' · ');
  if (typeof value === 'object')
    return ['province', 'city', 'full_address']
      .map((k) => displayText(value[k]))
      .filter(Boolean)
      .join('، ');
  return '';
}
export function storeDisplay(store) {
  const result = readContent(store || {});
  const info = isLanguageMap(result.contact_info)
    ? (result.contact_info[language] ??
      result.contact_info.en ??
      Object.values(result.contact_info)[0] ??
      {})
    : result.contact_info;
  return {
    ...result,
    name: displayText(result.name),
    status: displayText(result.status),
    description: displayText(result.description),
    address: displayText(result.address),
    contact_info: {
      ...info,
      email: displayText(info?.email),
      phone: displayText(info?.phone),
      fax: displayText(info?.fax),
      address: displayText(info?.address),
    },
  };
}
