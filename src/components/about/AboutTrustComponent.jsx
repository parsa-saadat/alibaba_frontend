import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, CreditCard, Headset, RotateCcw, ShieldCheck } from 'lucide-react';

// تضمین برای فروشنده‌های مورد اعتماد
const GUARANTEES = [
  { icon: ShieldCheck, title: translateText("ضمانت اصالت"), desc: translateText("کالای غیراصل برگشت داده می‌شود.") },
  { icon: RotateCcw, title: translateText("بازگشت ۷ روزه"), desc: translateText("تا ۷ روز پس از تحویل، با پلمب سالم.") },
  { icon: CreditCard, title: translateText("پرداخت محافظت‌شده"), desc: translateText("مبلغ تا تأیید تحویل نزد ما می‌ماند.") },
  { icon: Headset, title: translateText("مشاوره و پشتیبانی فنی"), desc: translateText("کارشناس نقشه‌برداری، قبل و بعد از خرید.") },
];

// لینک‌های حقوقی و راهنما
const LINKS = [
  { label: translateText("قوانین مشتریان"), to: '/terms/customers' },
  { label: translateText("قوانین خریداران"), to: '/terms/buyers' },
  { label: translateText("قوانین فروشندگان"), to: '/terms/sellers' },
  { label: translateText("حریم خصوصی"), to: '/privacy' },
  { label: translateText("شرایط بازگشت کالا"), to: '/terms/buyers#returns' },
  { label: translateText("راهنمای خرید"), to: '/guide/buying' },
  { label: translateText("راهنمای فروش در ژئو کالا"), to: '/guide/selling' },
  { label: translateText("سوالات متداول"), to: '/contact#faq' },
];

function AboutTrustComponent() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 pb-10 grid gap-4 lg:grid-cols-3">
      {/* تضمین‌ها */}
      <div className="lg:col-span-2 card rounded-3xl p-6 sm:p-7 flex flex-col">
        <b className="font-black text-sm">{translateText("تضمین برای فروشنده‌های مورد اعتماد")}</b>
        <p className="text-xs muted mt-1 leading-6">{translateText("این چهار قول، پایه‌ی اعتماد بازارگاه ما هستند و در همه‌ی سفارش‌ها اجرا می‌شوند. ")}</p>

        <div className="grid gap-4 sm:grid-cols-2 mt-5">
          {GUARANTEES.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-2.5">
                <span
                  className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
                  style={{ background: 'rgba(255,214,10,0.14)', color: 'var(--primary-color)' }}
                >
                  <Icon size={16} />
                </span>
                <span>
                  <b className="block text-xs font-black">{item.title}</b>
                  <span className="block text-[11px] muted leading-5 mt-0.5">{item.desc}</span>
                </span>
              </div>
            );
          })}
        </div>

        {/* یادآوری */}
        <div
          className="mt-auto pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span className="text-[11px] muted leading-6">{translateText("این تضمین‌ها در صفحه‌ی هر محصول و هنگام پرداخت هم نمایش داده می‌شوند. ")}</span>
          <Link to="/contact" className="text-[11px] font-bold text-yellow inline-flex items-center gap-1 shrink-0">{translateText("سوال دارم ")}<ChevronLeft className="logical-icon" size={12} />
          </Link>
        </div>
      </div>

      {/* نمادها و لینک‌ها */}
      <div className="flex flex-col gap-4">
        <div
          className="rounded-3xl p-6 text-white"
          style={{
            background: 'linear-gradient(150deg, var(--navy-soft), var(--navy-deep))',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <b className="block font-black text-sm">{translateText("مجوزها و نمادها")}</b>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[10px] px-2.5 py-1.5 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#c9d4ef' }}>{translateText("نماد اعتماد الکترونیکی")}</span>
            <span className="text-[10px] px-2.5 py-1.5 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#c9d4ef' }}>{translateText("ساماندهی رسانه‌های دیجیتال")}</span>
            <span className="text-[10px] px-2.5 py-1.5 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#c9d4ef' }}>{translateText("درگاه پرداخت شتاب")}</span>
          </div>
          <p className="text-[11px] text-white/60 leading-6 mt-3">{translateText("شماره‌ی مجوز و اطلاعات حقوقی کسب‌وکار در صفحه‌ی تماس در دسترس است. ")}</p>
        </div>

        <div className="card rounded-3xl p-6 flex-1">
          <b className="block font-black text-sm">{translateText("راهنما و قوانین")}</b>
          <ul className="mt-2">
            {LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="flex items-center justify-between gap-2 py-2 text-xs muted transition-colors hover:text-[var(--primary-color)]"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  {item.label}
                  <ChevronLeft className="logical-icon" size={13} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default AboutTrustComponent;
