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
      brand: 'Brand name in English (keep official spelling)',
      name: `Enter the ${name} name in English`,
      short_description: 'Write a short introduction in English',
      description: 'Write the description in English…',
      tags: 'Add a tag in English…',
      address: 'Enter the store address in English…',
    },
    fa: {
      brand: 'نام برند به فارسی؛ املای رسمی برند را حفظ کنید',
      name: `نام ${name} را به فارسی وارد کنید`,
      short_description: 'معرفی کوتاه را به فارسی بنویسید',
      description: 'توضیحات را به فارسی بنویسید…',
      tags: 'افزودن برچسب فارسی…',
      address: 'آدرس فروشگاه را به فارسی وارد کنید…',
    },
    ar: {
      brand: 'اسم العلامة بالعربية؛ حافظ على التهجئة الرسمية',
      name: `أدخل اسم ${name} بالعربية`,
      short_description: 'اكتب مقدمة قصيرة بالعربية',
      description: 'اكتب الوصف بالعربية…',
      tags: 'أضف وسماً بالعربية…',
      address: 'أدخل عنوان المتجر بالعربية…',
    },
    tr: {
      brand: 'Türkçe marka adı; resmî yazımı koruyun',
      name: `${name} adını Türkçe girin`,
      short_description: 'Kısa tanıtımı Türkçe yazın',
      description: 'Açıklamayı Türkçe yazın…',
      tags: 'Türkçe etiket ekleyin…',
      address: 'Mağaza adresini Türkçe girin…',
    },
  };

  return (placeholders[locale] || placeholders.en)[field] || '';
}
