import { language } from '../../i18n/runtime';
export default function StatsNotice({ error, stats = {} }) {
  if (!error && !Object.values(stats).some((value) => value?.error_code)) return null;
  return (
    <p role="status" className="card rounded-xl p-3 text-xs text-amber-600 dark:text-amber-300">
      {
        {
          en: 'Some statistics or exchange rates are unavailable. Missing amounts are not shown as zero. Refresh to retry.',
          fa: 'بخشی از آمار یا نرخ ارز در دسترس نیست؛ مبلغ نامشخص صفر نمایش داده نمی‌شود. برای تلاش دوباره به‌روزرسانی کنید.',
          ar: 'بعض الإحصاءات أو أسعار الصرف غير متاحة. لن تظهر المبالغ غير المعروفة كصفر. حدّث لإعادة المحاولة.',
          tr: 'Bazı istatistikler veya döviz kurları kullanılamıyor. Bilinmeyen tutarlar sıfır gösterilmez. Yenilemek için tekrar deneyin.',
        }[language]
      }
    </p>
  );
}
