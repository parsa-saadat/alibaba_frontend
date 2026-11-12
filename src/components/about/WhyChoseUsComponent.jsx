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

// مزیت‌های علی‌بازار
const FEATURES = [
  {
    icon: BadgeCheck,
    title: 'ضمانت اصالت کالا',
    desc: 'هر فروشنده قبل از فعالیت احراز هویت می‌شود و کالای غیراصیل از چرخه حذف می‌گردد.',
  },
  {
    icon: Scale,
    title: 'قیمت شفاف و قابل مقایسه',
    desc: 'قیمت یک کالا را بین فروشندگان مختلف می‌بینی؛ بدون قیمت پنهان و هزینه‌ی غافلگیرکننده.',
  },
  {
    icon: Truck,
    title: 'ارسال به سراسر کشور',
    desc: 'تحویل ۱ تا ۳ روز کاری در شهرهای بزرگ و پوشش پستی همه‌ی استان‌ها.',
  },
  {
    icon: CreditCard,
    title: 'حفاظت از پرداخت',
    desc: 'پرداخت از طریق درگاه بانکی امن انجام می‌شود و تا تأیید تحویل نزد علی‌بازار می‌ماند.',
  },
  {
    icon: Users,
    title: 'همراه کسب‌وکارهای کوچک',
    desc: 'کارگاه‌های خانگی و تولیدکنندگان کوچک هم فضای فروش و دیده‌شدن دارند.',
  },
  {
    icon: Headset,
    title: 'پشتیبانی واقعی',
    desc: 'چت آنلاین ۲۴ ساعته، تلفن در ساعات کاری و پیگیری سفارش تا لحظه‌ی تحویل.',
  },
];

function WhyChoseUsComponent() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-yellow">
            <ShieldCheck size={13} />
            چرا علی‌بازار
          </span>
          <h2 className="font-black text-xl sm:text-2xl mt-1.5">چیزی که ما را متفاوت می‌کند</h2>
        </div>
        <p className="text-xs muted max-w-md leading-6">
          ما یک لیست آگهی نیستیم؛ یک بازارگاه با قواعد روشن، فروشنده‌ی احرازشده و پشتیبانی مسئول.
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
