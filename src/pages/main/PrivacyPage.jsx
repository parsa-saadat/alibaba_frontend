import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Lock } from 'lucide-react';
import LegalPageComponent from '../../components/legal/LegalPageComponent';

/*
 * حریم خصوصی — نسخه‌ی سطحی و کوتاه.
 * تنها تعهد جدی ما: اطلاعات شما در اختیار شخص یا شرکت دیگری قرار نمی‌گیرد.
 */

const SECTIONS = [
  {
    id: 'what',
    title: translateText("چه اطلاعاتی جمع می‌کنیم"),
    items: [
      translateText("اطلاعاتی که خودتان وارد می‌کنید: نام، شماره‌ی موبایل، ایمیل، آدرس تحویل و کد پستی."),
      translateText("اطلاعات سفارش: کالاهای خریداری‌شده، مبلغ و وضعیت پرداخت."),
      translateText("اطلاعات فنی مرورگر: نوع دستگاه و صفحه، برای اینکه سایت درست نمایش داده شود."),
    ],
  },
  {
    id: 'why',
    title: translateText("چرا این اطلاعات را لازم داریم"),
    items: [
      translateText("برای ثبت و ارسال سفارش و تماس درباره‌ی همان سفارش."),
      translateText("برای هماهنگی گارانتی و خدمات پس از فروش."),
      translateText("برای بهبود جستجو و نمایش محصولات مرتبط."),
    ],
  },
  {
    id: 'protect',
    title: translateText("تعهد ما درباره‌ی اطلاعات شما"),
    paragraphs: [
      translateText("اطلاعات شخصی شما در اختیار شخص یا شرکت دیگری قرار نمی‌گیرد و به فروش نمی‌رسد."),
    ],
    items: [
      translateText("اطلاعات تماس شما فقط برای همان سفارش در اختیار فروشنده‌ی مربوطه قرار می‌گیرد."),
      translateText("پرداخت‌ها در درگاه بانکی انجام می‌شود و اطلاعات کارت شما نزد ما ذخیره نمی‌شود."),
      translateText("دسترسی کارکنان به اطلاعات، محدود و فقط در حد انجام کار است."),
    ],
    note: translateText("تنها استثنا، الزام قانونی است: اگر مرجع قضایی یا قانونی به‌صورت رسمی اطلاعات را درخواست کند، طبق قانون عمل می‌کنیم."),
  },
  {
    id: 'cookies',
    title: translateText("کوکی و حافظه‌ی مرورگر"),
    items: [
      translateText("سبد خرید، لیست مقایسه، علاقه‌مندی‌ها و تم روشن/تاریک روی همان مرورگر ذخیره می‌شوند."),
      translateText("پاک کردن حافظه‌ی مرورگر باعث حذف این موارد می‌شود."),
      translateText("کوکی تبلیغاتی شخص ثالث روی سایت ما فعال نیست."),
    ],
  },
  {
    id: 'rights',
    title: translateText("حقوق شما"),
    items: [
      translateText("می‌توانید اطلاعات حساب خود را در بخش «پروفایل» ببینید و اصلاح کنید."),
      translateText("می‌توانید درخواست حذف حساب را از طریق پشتیبانی ثبت کنید."),
      translateText("برای هر پرسشی درباره‌ی اطلاعاتتان، از طریق ایمیل یا تلفن با ما در تماس باشید."),
    ],
  },
  {
    id: 'scope',
    title: translateText("محدوده‌ی مسئولیت"),
    paragraphs: [
      translateText("این متن برای شفاف‌سازی است و تعهدی بیش از آنچه در آن آمده ایجاد نمی‌کند. محتوای صفحات فروشندگان و لینک‌های بیرونی (مانند پارسی‌ژئو) در کنترل ما نیست و مسئولیت آن‌ها بر عهده‌ی همان سایت‌هاست."),
    ],
    note: translateText("در صورت تغییر مهم در این صفحه، نسخه‌ی جدید با تاریخ بازنگری در همین آدرس منتشر می‌شود."),
  },
];

function PrivacyPage() {
  return (
    <LegalPageComponent
      icon={Lock}
      badge={translateText("حریم خصوصی")}
      title={translateText("حریم خصوصی")}
      subtitle={translateText("خلاصه و روشن: چه اطلاعاتی از شما نگه می‌داریم، چرا لازم است و تعهد ما این است که آن را در اختیار کسی قرار ندهیم.")}
      updated={translateText("۱۴۰۵/۰۸/۲۰")}
      highlights={[
        translateText("اطلاعات شما در اختیار کسی قرار نمی‌گیرد"),
        translateText("اطلاعات کارت در سایت ذخیره نمی‌شود"),
        translateText("حذف حساب از طریق پشتیبانی"),
      ]}
      sections={SECTIONS}
      footerNote={translateText("اگر درباره‌ی اطلاعات شخصی خود نگرانی دارید یا می‌خواهید اطلاعاتی اصلاح یا حذف شود، با پشتیبانی تماس بگیرید.")}
    />
  );
}

export default PrivacyPage;
