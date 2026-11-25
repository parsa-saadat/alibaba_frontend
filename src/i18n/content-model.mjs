export function seedContent(form, fields) {
  const translations = structuredClone(form.translations || {});
  for (const field of fields) {
    const value=form[field];
    if(value && typeof value==='object' && !Array.isArray(value)) {
      for(const code of ['en','fa','ar','tr']) if(typeof value[code]==='string' && translations[code]?.[field]===undefined)
        translations[code]={...translations[code],[field]:value[code]};
    }
    for(const code of ['en','fa','ar','tr']) {
      const value=translations[code]?.[field];
      if(value && typeof value==='object' && !Array.isArray(value)) {
        const text=value[code]??value.en??Object.values(value).find(v=>typeof v==='string');
        translations[code]={...translations[code],[field]:typeof text==='string'?text:null};
      }
    }
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
