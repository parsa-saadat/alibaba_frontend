const entityNames = {
  en: { product: 'product', category: 'category', store: 'store', plan: 'plan' },
  fa: { product: 'محصول', category: 'دسته‌بندی', store: 'فروشگاه', plan: 'پلن' },
  ar: { product: 'المنتج', category: 'الفئة', store: 'المتجر', plan: 'الخطة' },
  tr: { product: 'Ürün', category: 'Kategori', store: 'Mağaza', plan: 'Plan' },
};

export function contentPlaceholder(locale, entity, field) {
  const name = entityNames[locale]?.[entity] || entityNames.en.product;
  const placeholders = {
    en: {
      name: `Enter the ${name} name in English`,
      short_description: 'Write a short introduction in English',
      description: 'Write the description in English…',
      tags: 'Add a tag in English…',
    },
    fa: {
      name: `نام ${name} را به فارسی وارد کنید`,
      short_description: 'معرفی کوتاه را به فارسی بنویسید',
      description: 'توضیحات را به فارسی بنویسید…',
      tags: 'افزودن برچسب فارسی…',
    },
    ar: {
      name: `أدخل اسم ${name} بالعربية`,
      short_description: 'اكتب مقدمة قصيرة بالعربية',
      description: 'اكتب الوصف بالعربية…',
      tags: 'أضف وسماً بالعربية…',
    },
    tr: {
      name: `${name} adını Türkçe girin`,
      short_description: 'Kısa tanıtımı Türkçe yazın',
      description: 'Açıklamayı Türkçe yazın…',
      tags: 'Türkçe etiket ekleyin…',
    },
  };

  return (placeholders[locale] || placeholders.en)[field] || '';
}
