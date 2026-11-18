import { language } from './runtime';

export const automaticText = {
  en: {
    button: 'Fill missing translations',
    loading: 'Translating…',
    hint: 'Uses the selected language; existing translations stay untouched. Text is sent to the translation provider.',
    done: 'Translations added. Review before saving.',
    error: 'Translation failed. Your content is unchanged; try again.',
    empty: 'Write content in the selected language first.',
    changed: 'Source changed while translating. Please try again.',
    full: 'Other languages already have this content.',
  },
  fa: {
    button: 'تکمیل خودکار ترجمه‌ها',
    loading: 'در حال ترجمه…',
    hint: 'مبنا زبان انتخابی است؛ ترجمه‌های موجود حفظ می‌شوند. متن برای سرویس ترجمه ارسال می‌شود.',
    done: 'ترجمه‌ها اضافه شدند؛ پیش از ذخیره بازبینی کنید.',
    error: 'ترجمه انجام نشد؛ متن شما تغییر نکرد. دوباره تلاش کنید.',
    empty: 'ابتدا متن زبان انتخابی را بنویسید.',
    changed: 'متن مبنا هنگام ترجمه تغییر کرد؛ دوباره تلاش کنید.',
    full: 'این محتوا در زبان‌های دیگر تکمیل شده است.',
  },
  ar: {
    button: 'إكمال الترجمات تلقائياً',
    loading: 'جارٍ الترجمة…',
    hint: 'تُستخدم اللغة المحددة مع الحفاظ على الترجمات الموجودة. يُرسل النص إلى خدمة الترجمة.',
    done: 'أُضيفت الترجمات. راجعها قبل الحفظ.',
    error: 'تعذرت الترجمة. لم يتغير المحتوى؛ حاول مجدداً.',
    empty: 'اكتب المحتوى باللغة المحددة أولاً.',
    changed: 'تغير النص الأصلي؛ حاول مجدداً.',
    full: 'هذا المحتوى مكتمل في اللغات الأخرى.',
  },
  tr: {
    button: 'Eksik çevirileri tamamla',
    loading: 'Çevriliyor…',
    hint: 'Seçili dil kaynak alınır; mevcut çeviriler korunur. Metin çeviri hizmetine gönderilir.',
    done: 'Çeviriler eklendi. Kaydetmeden önce inceleyin.',
    error: 'Çeviri başarısız. İçerik değişmedi; tekrar deneyin.',
    empty: 'Önce seçili dilde içerik yazın.',
    changed: 'Kaynak metin değişti; tekrar deneyin.',
    full: 'Diğer dillerde bu içerik zaten mevcut.',
  },
}[language];
