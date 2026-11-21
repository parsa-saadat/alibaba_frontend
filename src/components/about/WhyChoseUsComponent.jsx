import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { BadgeCheck, CreditCard, Headset, Scale, ShieldCheck, Truck, Users } from 'lucide-react';

// مزیت‌های ژئوکالا
const FEATURES = [
  {
    icon: BadgeCheck,
    title: translateText('b2b.sellers'),
    desc: translateText('b2b.sellersDesc'),
  },
  {
    icon: Scale,
    title: translateText('مقایسه‌ی مشخصات فنی'),
    desc: translateText(
      'مدل‌ها را کنار هم می‌گذارید و دقت، تعداد کانال، فرکانس، ایمو و باطری را مقایسه می‌کنید؛ نه فقط قیمت.',
    ),
  },
  {
    icon: Headset,
    title: translateText('b2b.compare'),
    desc: translateText('b2b.compareDesc'),
  },
  {
    icon: ShieldCheck,
    title: translateText('b2b.webSupport'),
    desc: translateText('b2b.webSupportDesc'),
  },
  {
    icon: Truck,
    title: translateText('b2b.multilingual'),
    desc: translateText('v21.languageDesc'),
  },
  {
    icon: CreditCard,
    title: translateText('b2b.account'),
    desc: translateText('v20.profileHelp'),
  },
];

function WhyChoseUsComponent() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-accent">
            <ShieldCheck size={13} />
            {translateText('چرا ژئوکالا ')}
          </span>
          <h2 className="font-black text-xl sm:text-2xl mt-1.5">
            {translateText('چیزی که ما را متفاوت می‌کند')}
          </h2>
        </div>
        <p className="text-xs muted max-w-md leading-6">{translateText('b2b.intro')}</p>
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
                style={{ background: 'rgba(255,106,0,0.14)', color: 'var(--primary-color)' }}
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
