import React from 'react';
import {
  BadgeCheck,
  CreditCard,
  Headset,
  Scale,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react';

// مزیت‌های ژئو کالا
const FEATURES = [
  {
    icon: BadgeCheck,
    title: 'کالای اصل با گارانتی',
    desc: 'تجهیزات از مسیر واردات رسمی مجموعه تأمین می‌شوند؛ اصالت، سریال و مدارک گارانتی بررسی می‌شود.',
  },
  {
    icon: Scale,
    title: 'مقایسه‌ی مشخصات فنی',
    desc: 'مدل‌ها را کنار هم می‌گذارید و دقت، تعداد کانال، فرکانس، ایمو و باطری را مقایسه می‌کنید؛ نه فقط قیمت.',
  },
  {
    icon: Headset,
    title: 'مشاوره‌ی تخصصی پیش از خرید',
    desc: 'کارشناس نقشه‌برداری کمک می‌کند دستگاه مناسب پروژه‌تان را انتخاب کنید، نه گران‌ترین را.',
  },
  {
    icon: ShieldCheck,
    title: 'پشتیبانی و کالیبراسیون',
    desc: 'آموزش راه‌اندازی، به‌روزرسانی نرم‌افزار و خدمات پس از فروش، زیر نظر همان تیم فنی.',
  },
  {
    icon: Truck,
    title: 'ارسال به سراسر کشور',
    desc: 'بسته‌بندی مخصوص تجهیزات دقیق و ارسال به سراسر کشور، از شعبه‌ی تهران و مازندران.',
  },
  {
    icon: CreditCard,
    title: 'پرداخت امن',
    desc: 'پرداخت از طریق درگاه بانکی معتبر انجام می‌شود و اطلاعات کارت شما ذخیره نمی‌شود.',
  },
];

function WhyChoseUsComponent() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-yellow">
            <ShieldCheck size={13} />
            چرا ژئو کالا
          </span>
          <h2 className="font-black text-xl sm:text-2xl mt-1.5">چیزی که ما را متفاوت می‌کند</h2>
        </div>
        <p className="text-xs muted max-w-md leading-6">
          ما یک لیست آگهی نیستیم؛ بازارگاه تخصصی یک مجموعه‌ی قدیمی در حوزه‌ی نقشه‌برداری، با دانش فنی
          و پشتیبانی مسئول.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="card rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-1"
            >
              <span
                className="w-11 h-11 rounded-xl grid place-items-center"
                style={{ background: 'rgba(255,214,10,0.14)', color: 'var(--primary-color)' }}
              >
                <Icon size={20} />
              </span>
              <b className="block font-black text-sm mt-3">{feature.title}</b>
              <p className="text-xs muted leading-6 mt-1.5">{feature.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default WhyChoseUsComponent;
