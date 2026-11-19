import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, ShoppingBag, Store } from 'lucide-react';
import LegalPageComponent from '../../components/legal/LegalPageComponent';

/*
 * راهنما — دو نسخه:
 *   /guide/buying  → راهنمای خرید
 *   /guide/selling → راهنمای فروش در ژئوکالا
 * با همان قالب صفحه‌های قوانین ساخته شده تا ظاهر یکدست باشد.
 */

const BUYING_SECTIONS = [
  {
    id: 'find',
    title: translateText("پیدا کردن کالا"),
    items: [
      translateText("از منوی دسته‌بندی‌ها یا جستجوی بالای سایت کالا را پیدا کنید."),
      translateText("در صفحه‌ی هر کالا مشخصات، عکس‌ها و اطلاعات فروشنده را ببینید."),
      translateText("برای مقایسه، کالاها را به «مقایسه» اضافه کنید؛ برای بعداً، به «علاقه‌مندی‌ها»."),
    ],
  },
  {
    id: 'cart',
    title: translateText("سبد خرید و آدرس"),
    items: [
      translateText("کالا را به سبد اضافه کنید و تعدادش را در صفحه‌ی سبد تنظیم کنید."),
      translateText("برای ادامه باید با شماره‌ی موبایل وارد شده باشید."),
      translateText("در مرحله‌ی تسویه، یکی از آدرس‌های ثبت‌شده را انتخاب کنید یا آدرس جدید بسازید."),
    ],
  },
  {
    id: 'order-pay',
    title: translateText("ثبت سفارش و پرداخت"),
    paragraphs: [
      translateText("ثبت سفارش و پرداخت دو مرحله‌ی جدا هستند. اول سفارش ثبت می‌شود، بعد با دکمه‌ی «پرداخت آنلاین» به درگاه بانکی می‌روید."),
    ],
    items: [
      translateText("اگر همان لحظه پرداخت نکردید، از «سفارش‌های من» می‌توانید بعداً پرداخت کنید."),
      translateText("هر سفارش ممکن است به چند مرسوله (یکی برای هر فروشگاه) تقسیم شود."),
    ],
  },
  {
    id: 'track',
    title: translateText("پیگیری سفارش"),
    items: [
      translateText("وضعیت هر مرسوله (در انتظار تأیید، آماده‌سازی، ارسال، تحویل) در «سفارش‌های من» دیده می‌شود."),
      translateText("تا پیش از ارسال می‌توانید مرسوله را لغو کنید؛ شرایط بازپرداخت در قوانین خریداران آمده است."),
    ],
  },
  {
    id: 'help',
    title: translateText("نیاز به کمک دارید؟"),
    paragraphs: [
      translateText("پاسخ سوال‌های رایج در بخش سوالات متداول صفحه‌ی «تماس با ما» هست؛ اگر پیدا نکردید با پشتیبانی تماس بگیرید."),
    ],
  },
];

const SELLING_SECTIONS = [
  {
    id: 'request',
    title: translateText("ثبت درخواست فروشندگی"),
    items: [
      translateText("وارد حساب شوید و از صفحه‌ی «پروفایل»، فرم «درخواست فروشندگی» را پر کنید."),
      translateText("اطلاعات لازم: نوع فروشنده، کد ملی، تاریخ تولد، آدرس، اطلاعات حساب تسویه، عکس کارت ملی و سلفی احراز هویت."),
      translateText("بعد از ارسال، درخواست شما در انتظار بررسی مدیر قرار می‌گیرد."),
    ],
  },
  {
    id: 'approval',
    title: translateText("تأیید و ورود به پنل"),
    items: [
      translateText("پنل فروشنده فقط برای فروشنده‌ی تأییدشده باز است."),
      translateText("بعد از تأیید، سایت نشست شما را خودکار به‌روز می‌کند؛ اگر پنل باز نشد، یک‌بار خارج و دوباره وارد شوید."),
    ],
  },
  {
    id: 'plan',
    title: translateText("تهیه‌ی پلن"),
    paragraphs: [
      translateText("برای ساخت فروشگاه و محصول به یک پلن فعال نیاز دارید. تعداد فروشگاه و محصول مجاز، به پلن شما بستگی دارد."),
    ],
    items: [
      translateText("از «پلن و اشتراک» در پنل، پلن مناسب را بخرید."),
      translateText("با تمام شدن اعتبار پلن، ساخت فروشگاه و محصول جدید تا تمدید متوقف می‌شود."),
    ],
  },
  {
    id: 'store-product',
    title: translateText("ساخت فروشگاه و محصول"),
    items: [
      translateText("اول از بخش «فروشگاه‌ها» فروشگاه بسازید، بعد از «محصولات من» کالا اضافه کنید."),
      translateText("عکس‌های واضح، مشخصات دقیق و موجودی درست، شانس فروش را بالا می‌برد."),
      translateText("فروشگاهی که مدیریت مسدود کرده باشد (وضعیت «مسدود توسط مدیریت») را خودتان نمی‌توانید فعال کنید."),
    ],
  },
  {
    id: 'orders',
    title: translateText("مدیریت سفارش‌ها"),
    items: [
      translateText("سفارش تازه را در «سفارش‌ها» تأیید کنید، سپس مراحل آماده‌سازی، آماده ارسال، ارسال و تحویل را ثبت کنید."),
      translateText("لغو سفارش دلیل لازم دارد و به مشتری اطلاع داده می‌شود."),
    ],
  },
];

const TABS = [
  { key: 'buying', label: translateText("راهنمای خرید"), to: '/guide/buying' },
  { key: 'selling', label: translateText("راهنمای فروش"), to: '/guide/selling' },
];

const CONTENT = {
  buying: {
    icon: ShoppingBag,
    badge: translateText("برای خریداران"),
    title: translateText("راهنمای خرید از ژئوکالا"),
    subtitle: translateText("از پیدا کردن کالا تا ثبت سفارش، پرداخت و پیگیری؛ کوتاه و گام‌به‌گام."),
    highlights: [translateText("ثبت سفارش و پرداخت جداست"), translateText("پرداخت بعداً هم ممکن است"), translateText("پیگیری هر مرسوله")],
    sections: BUYING_SECTIONS,
  },
  selling: {
    icon: Store,
    badge: translateText("برای فروشندگان"),
    title: translateText("راهنمای فروش در ژئوکالا"),
    subtitle: translateText("از درخواست فروشندگی تا ساخت فروشگاه، محصول و مدیریت سفارش‌ها."),
    highlights: [translateText("تأیید مدیر لازم است"), translateText("برای محصول، پلن فعال لازم است"), translateText("مدیریت سفارش از پنل")],
    sections: SELLING_SECTIONS,
  },
};

function GuidePage() {
  const { topic } = useParams();
  const key = topic && CONTENT[topic] ? topic : 'buying';
  const content = CONTENT[key];

  return (
    <LegalPageComponent
      crumb={translateText("راهنما")}
      tabs={TABS}
      activeTab={key}
      icon={content.icon || BookOpen}
      badge={content.badge}
      title={content.title}
      subtitle={content.subtitle}
      highlights={content.highlights}
      sections={content.sections}
    />
  );
}

export default GuidePage;
