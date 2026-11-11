import React from 'react';
import { ShieldCheck, Truck, Users, TrendingUp } from 'lucide-react';

const FEATURES = [
  { icon: ShieldCheck, title: 'ضمانت اصالت', desc: 'همه فروشندگان احراز هویت می‌شوند' },
  { icon: Truck, title: 'ارسال سراسری', desc: 'تحویل سریع به همه استان‌ها' },
  { icon: Users, title: 'هزاران فروشنده', desc: 'از کسب‌وکارهای کوچک تا برندها' },
  { icon: TrendingUp, title: 'قیمت شفاف', desc: 'مقایسه قیمت بین فروشگاه‌ها' },
];

function WhyChoseUsComponent() {
  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="card rounded-3xl p-6 text-center">
            <f.icon size={30} className="mx-auto mb-3 text-yellow" />
            <div className="font-black">{f.title}</div>
            <div className="text-sm muted mt-1">{f.desc}</div>
          </div>
        ))}
      </div>
      <div className="card rounded-3xl p-8 mt-8 leading-8 muted">
        <h2 className="font-black text-xl mb-3" style={{ color: 'var(--text)' }}>
          چطور کار می‌کنیم؟
        </h2>
        <p>
          خریدار کالا را انتخاب می‌کند، سفارش ثبت می‌شود و به‌صورت خودکار بین فروشگاه‌های مختلف تفکیک
          (ساب‌سفارش) می‌گردد. هر فروشنده سفارش خودش را آماده، ارسال و تحویل می‌دهد. پرداخت از طریق
          درگاه زرین‌پال انجام می‌شود.
        </p>
        <p className="mt-3">
          فروشندگان پس از ثبت درخواست و تأیید ادمین، پلن مناسب انتخاب می‌کنند، فروشگاه می‌سازند و
          محصولاتشان را مدیریت می‌کنند.
        </p>
      </div>
    </>
  );
}

export default WhyChoseUsComponent;
