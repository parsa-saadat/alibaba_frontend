import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingBag, Store, Users } from 'lucide-react';
import LegalPageComponent from '../../components/legal/LegalPageComponent';

/*
 * قوانین و مقررات — سه نسخه:
 *   /terms/customers → برای مشتریان (چارچوب کلی استفاده از فروشگاه)
 *   /terms/buyers    → برای خریداران (پرداخت، ارسال، بازگشت، گارانتی)
 *   /terms/sellers   → برای فروشندگان
 * متن‌ها عمومی و کوتاه‌اند و جای مشاوره‌ی حقوقی را نمی‌گیرند.
 */

/*
 * قوانین مشتریان — چارچوب کلی استفاده از فروشگاه (حساب، محتوا، نظرات،
 * مالکیت معنوی، پشتیبانی). قوانین خریداران به‌طور اختصاصی به فرایند خرید
 * (پرداخت، ارسال، بازگشت، گارانتی) می‌پردازد.
 */
const CUSTOMER_SECTIONS = [
  {
    id: 'cust-welcome',
    title: translateText("مشتری ژئوکالا کیست؟"),
    paragraphs: [
      translateText("b2b.intro"),
      translateText("b2b.legalIntro"),
    ],
    items: [
      translateText("استفاده از سایت به معنی پذیرش همین قوانین است."),
      translateText("عنوان‌های این صفحه برای خوانایی است و بخشی از تعهدات را محدود نمی‌کند."),
    ],
  },
  {
    id: 'cust-account',
    title: translateText("حساب کاربری و امنیت آن"),
    items: [
      translateText("ثبت‌نام با شماره‌ی موبایل انجام می‌شود؛ شماره باید متعلق به خود شما باشد."),
      translateText("مسئولیت همه‌ی فعالیت‌هایی که با حساب شما انجام می‌شود با شماست؛ رمز یک‌بارمصرف را با کسی به اشتراک نگذارید."),
      translateText("اگر گوشی یا سیم‌کارت شما در اختیار فرد دیگری قرار گرفته، پیش از هر اقدامی با پشتیبانی تماس بگیرید."),
      translateText("ساخت حساب با اطلاعات نادرست یا جعلی، و همچنین سوءاستفاده از کدهای تخفیف، موجب محدود شدن حساب می‌شود."),
    ],
  },
  {
    id: 'cust-content',
    title: translateText("محتوای سایت و مالکیت معنوی"),
    paragraphs: [
      translateText("متن‌ها، طراحی، لوگو و توضیحاتی که توسط تیم ژئوکالا تولید شده متعلق به این مجموعه است. تصاویر و مشخصات فنی هر کالا توسط فروشنده‌ی همان کالا ثبت می‌شود."),
    ],
    items: [
      translateText("کپی برداری تجاری از محتوای سایت بدون اجازه‌ی کتبی مجاز نیست."),
      translateText("استفاده از نام و نشان ژئوکالا در تبلیغات یا صفحات دیگر، نیازمند هماهنگی است."),
      translateText("اگر متوجه شدید محتوایی در سایت حق شما را نقض می‌کند، با مستندات به پشتیبانی اطلاع دهید تا بررسی شود."),
    ],
  },
  {
    id: 'cust-reviews',
    title: translateText("نظرات، امتیازها و گفت‌وگو با فروشنده"),
    items: [
      translateText("نظر و امتیاز باید تجربه‌ی واقعی خودتان از همان کالا باشد."),
      translateText("نوشتن نظر توهین‌آمیز، تهدید، اطلاعات شخصی دیگران یا تبلیغ رقبا حذف می‌شود."),
      translateText("b2b.buyerRules"),
      translateText("ژئوکالا می‌تواند نظرهای مشکوک را برای بررسی موقتاً نمایش ندهد."),
    ],
  },
  {
    id: 'cust-support',
    title: translateText("b2b.webSupport"),
    paragraphs: [
      translateText("b2b.webSupportDesc"),
    ],
    items: [
      translateText("v20.formIntro"),
      translateText("b2b.noServices"),
      translateText("b2b.emailDesc"),
    ],
  },
  {
    id: 'cust-privacy',
    title: translateText("حریم خصوصی و داده‌های شما"),
    paragraphs: [
      translateText("b2b.privacyShare"),
    ],
    items: [
      translateText("برای جزئیات کامل، صفحه‌ی «حریم خصوصی» را ببینید."),
      translateText("می‌توانید درخواست حذف حساب و داده‌هایتان را از طریق پشتیبانی ثبت کنید."),
    ],
  },
  {
    id: 'cust-limits',
    title: translateText("محدودیت مسئولیت و تغییر قوانین"),
    paragraphs: [
      translateText("b2b.responsibilityDesc"),
      translateText("این قوانین ممکن است برای شفافیت بیشتر به‌روزرسانی شود؛ نسخه‌ی معتبر همین صفحه است."),
    ],
    note: translateText("b2b.contactIntro"),
  },
];

const BUYER_SECTIONS = [
  {
    id: 'account',
    title: translateText("حساب کاربری و اطلاعات ثبت‌نام"),
    paragraphs: [
      translateText("برای ثبت سفارش باید با شماره‌ی موبایل خود ثبت‌نام کنید. شماره‌ی موبایل، ابزار شناسایی شما در ژئوکالا است؛ پس آن را در اختیار دیگران نگذارید."),
    ],
    items: [
      translateText("اطلاعاتی که وارد می‌کنید باید صحیح و به نام خودتان باشد."),
      translateText("مسئولیت سفارش‌هایی که با حساب شما ثبت می‌شود با شماست."),
      translateText("اگر متوجه استفاده‌ی غیرمجاز از حسابتان شدید، سریع به پشتیبانی اطلاع دهید."),
    ],
  },
  {
    id: 'products',
    title: translateText("مشخصات کالا و قیمت‌ها"),
    paragraphs: [
      translateText("مشخصات فنی، تصاویر و قیمت هر کالا توسط فروشنده ثبت می‌شود و ژئوکالا آن را در ساختار یکسان نمایش می‌دهد تا مقایسه آسان شود."),
    ],
    items: [
      translateText("v20.priceTerms"),
      translateText("b2b.buyerRules"),
      translateText("تصاویر ممکن است جنبه‌ی نمایشی داشته باشند؛ ملاک، مشخصات فنی درج‌شده در صفحه‌ی محصول است."),
    ],
  },
  {
    id: 'order',
    title: translateText("ثبت سفارش و پرداخت"),
    items: [
      translateText("سفارش پس از پرداخت اینترنتی نهایی می‌شود؛ پرداخت فقط از طریق درگاه بانکی معتبر انجام می‌شود."),
      translateText("ژئوکالا هرگز شماره‌ی کارت یا رمز دوم شما را درخواست نمی‌کند؛ هیچ پرداختی را خارج از درگاه سایت انجام ندهید."),
      translateText("شماره‌ی پیگیری سفارش در بخش «سفارش‌های من» قابل مشاهده است."),
      translateText("v20.failedPayment"),
    ],
  },
  {
    id: 'shipping',
    title: translateText("ارسال و تحویل"),
    paragraphs: [
      translateText("b2b.noReturn"),
    ],
    items: [
      translateText("هنگام تحویل، بسته را از نظر سالم بودن ظاهر و مطابقت با سفارش بررسی کنید."),
      translateText("b2b.productTerms"),
      translateText("برای تجهیزات حساس (جی‌پی‌اس ایستگاهی، توتال استیشن، دوربین) توصیه می‌شود تحویل در محل و تست اولیه انجام شود."),
    ],
  },
  {
    id: 'returns',
    title: translateText("بازگشت کالا و انصراف"),
    items: [
      translateText("b2b.noReturn"),
      translateText("b2b.check"),
      translateText("b2b.productTerms"),
      translateText("b2b.responsibilityDesc"),
    ],
  },
  {
    id: 'warranty',
    title: translateText("گارانتی و خدمات پس از فروش"),
    paragraphs: [
      translateText("b2b.productTerms"),
    ],
    items: [
      translateText("b2b.check"),
      translateText("b2b.noServices"),
    ],
  },
  {
    id: 'compare',
    title: translateText("مقایسه، علاقه‌مندی و نظرات"),
    items: [
      translateText("لیست مقایسه و علاقه‌مندی روی همان مرورگر شما ذخیره می‌شود و پاک کردن حافظه‌ی مرورگر آن را حذف می‌کند."),
      translateText("در نوشتن نظر، ادب و صحت اطلاعات را رعایت کنید؛ نظرات توهین‌آمیز یا تبلیغاتی حذف می‌شوند."),
    ],
  },
  {
    id: 'changes',
    title: translateText("تغییر قوانین"),
    paragraphs: [
      translateText("این قوانین ممکن است برای شفافیت بیشتر به‌روزرسانی شود. نسخه‌ی معتبر، همین صفحه است و تاریخ آخرین بازنگری در بالای صفحه درج می‌شود."),
    ],
    note: translateText("b2b.check"),
  },
];

const SELLER_SECTIONS = [
  {
    id: 'register',
    title: translateText("ثبت‌نام و احراز هویت فروشنده"),
    items: [
      translateText("ثبت‌نام فروشنده با ارسال مدارک هویتی و صنفی انجام می‌شود و پس از بررسی تیم ژئوکالا فعال می‌گردد."),
      translateText("اطلاعات مدارک باید با صاحب فروشگاه یکی باشد؛ در غیر این صورت درخواست رد می‌شود."),
      translateText("v20.planLimits"),
    ],
  },
  {
    id: 'plans',
    title: translateText("پلن‌ها، تعرفه و کمیسیون"),
    paragraphs: [
      translateText("فروش در ژئوکالا بر اساس پلن انتخابی شما انجام می‌شود. تعرفه‌ی هر پلن و سقف تعداد محصول در صفحه‌ی پلن‌ها آمده است."),
    ],
    items: [
      translateText("v20.planTerms"),
      translateText("v20.planChange"),
      translateText("مبالغ تسویه به شماره‌ی شبای ثبت‌شده در پنل واریز می‌شود؛ مسئولیت صحت شبا با فروشنده است."),
    ],
  },
  {
    id: 'listing',
    title: translateText("ثبت محصول و صحت اطلاعات"),
    items: [
      translateText("نام، برند، مدل، مشخصات فنی، تصویر و موجودی باید واقعی و مطابق کالای تحویلی باشد."),
      translateText("استفاده از تصویر یا توضیح محصول برند دیگر، بدون حق فروش، ممنوع است."),
      translateText("قیمت باید نهایی و بدون هزینه‌ی پنهان باشد؛ قیمت‌های غیرواقعی برای جلب کلیک حذف می‌شوند."),
      translateText("برای هر محصول دسته‌بندی درست را انتخاب کنید تا در جستجو و مقایسه درست دیده شود."),
    ],
    note: translateText("محصولات نقشه‌برداری باید با ذکر مدل دقیق و لوازم همراه (باتری، شارژر، کابل، کیف) ثبت شوند."),
  },
  {
    id: 'stock',
    title: translateText("موجودی و پردازش سفارش"),
    items: [
      translateText("موجودی را به‌روز نگه دارید؛ اگر کالایی ناموجود شد، وضعیت آن را تغییر دهید."),
      translateText("سفارش‌ها باید در بازه‌ی اعلام‌شده آماده‌سازی و تحویل شرکت حمل شوند."),
      translateText("b2b.sellerRules"),
    ],
  },
  {
    id: 'packing',
    title: translateText("بسته‌بندی و ارسال"),
    items: [
      translateText("بسته‌بندی باید متناسب با تجهیزات حساس باشد (فوم، جعبه‌ی سخت، برچسب شکننده)."),
      translateText("کالا باید با لوازم جانبی و مدارک کامل ارسال شود."),
      translateText("مسئولیت آسیب حین ارسال ناشی از بسته‌بندی نامناسب با فروشنده است."),
    ],
  },
  {
    id: 'warranty-seller',
    title: translateText("گارانتی و بازگشت کالا"),
    items: [
      translateText("شرایط گارانتی باید در صفحه‌ی محصول شفاف ذکر شود."),
      translateText("b2b.noReturn"),
      translateText("b2b.responsibilityDesc"),
    ],
  },
  {
    id: 'behavior',
    title: translateText("رفتار حرفه‌ای و ممنوعیت‌ها"),
    items: [
      translateText("فروش کالای تقلبی، کارکرده به‌جای نو یا بدون مجوز قانونی ممنوع است."),
      translateText("درخواست پرداخت خارج از درگاه سایت از خریدار ممنوع است."),
      translateText("توهین، تهدید یا ارسال پیام تبلیغاتی انبوه به خریداران باعث تعلیق فروشگاه می‌شود."),
      translateText("تکرار تخلف یا شکایت مستند خریداران می‌تواند به تعلیق یا حذف فروشگاه منجر شود."),
    ],
  },
  {
    id: 'changes-seller',
    title: translateText("تغییر شرایط و تعلیق"),
    paragraphs: [
      translateText("b2b.sellerRules"),
      translateText("این قوانین ممکن است به‌روزرسانی شود؛ نسخه‌ی معتبر همین صفحه است."),
    ],
  },
];

const TABS = [
  { label: translateText("قوانین مشتریان"), to: '/terms/customers', key: 'customers' },
  { label: translateText("قوانین خریداران"), to: '/terms/buyers', key: 'buyers' },
  { label: translateText("قوانین فروشندگان"), to: '/terms/sellers', key: 'sellers' },
];

const CONTENT = {
  customers: {
    icon: Users,
    badge: translateText("برای مشتریان"),
    title: translateText("قوانین و مقررات مشتریان"),
    subtitle:
      translateText("b2b.legalIntro"),
    highlights: [
      translateText("استفاده از سایت = پذیرش قوانین"),
      translateText("حساب کاربری امن و شخصی"),
      translateText("نظرات واقعی و محترمانه"),
      translateText("b2b.webSupport"),
    ],
    sections: CUSTOMER_SECTIONS,
  },
  buyers: {
    icon: ShoppingBag,
    badge: translateText("برای خریداران"),
    title: translateText("قوانین و مقررات خریداران"),
    subtitle:
      translateText("این صفحه شرایط ثبت سفارش، پرداخت، ارسال و بازگشت کالا را برای خریداران ژئوکالا توضیح می‌دهد؛ کوتاه و روشن، بدون بندهای پیچیده."),
    highlights: [
      translateText("پرداخت فقط از درگاه بانکی سایت"),
      translateText("v20.conditions"),
      translateText("b2b.noGuarantee"),
      translateText("v20.siteHelp"),
    ],
    sections: BUYER_SECTIONS,
  },
  sellers: {
    icon: Store,
    badge: translateText("برای فروشندگان"),
    title: translateText("قوانین و مقررات فروشندگان"),
    subtitle:
      translateText("b2b.sellerRules"),
    highlights: [
      translateText("احراز هویت و تأیید مدارک"),
      translateText("پلن‌ها و تعرفه"),
      translateText("تسویه به شبای ثبت‌شده"),
      translateText("امکان تعلیق در صورت تخلف"),
    ],
    sections: SELLER_SECTIONS,
  },
};

function TermsPage() {
  const { audience } = useParams();
  const key = audience && CONTENT[audience] ? audience : 'customers';
  const content = CONTENT[key];

  return (
    <LegalPageComponent
      tabs={TABS}
      activeTab={key}
      icon={content.icon}
      badge={content.badge}
      title={content.title}
      subtitle={content.subtitle}
      updated={translateText("۱۴۰۵/۰۸/۲۰")}
      highlights={content.highlights}
      sections={content.sections}
    />
  );
}

export default TermsPage;
