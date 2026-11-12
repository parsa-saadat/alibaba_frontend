import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, CreditCard, Headset, RotateCcw, ShieldCheck } from 'lucide-react';

// تضمین‌های علی‌بازار
const GUARANTEES = [
  { icon: ShieldCheck, title: 'ضمانت اصالت', desc: 'کالای غیراصل برگشت داده می‌شود.' },
  { icon: RotateCcw, title: 'بازگشت ۷ روزه', desc: 'تا ۷ روز پس از تحویل، بدون دلیل خاص.' },
  { icon: CreditCard, title: 'پرداخت محافظت‌شده', desc: 'مبلغ تا تأیید تحویل نزد ما می‌ماند.' },
  { icon: Headset, title: 'پشتیبانی ۲۴/۷', desc: 'چت آنلاین همیشه و تلفن در ساعات کاری.' },
];

// لینک‌های حقوقی و راهنما
const LINKS = [
  { label: 'قوانین و مقررات', to: '/about' },
  { label: 'حریم خصوصی', to: '/about' },
  { label: 'شرایط بازگشت کالا', to: '/contact#faq' },
  { label: 'سوالات متداول', to: '/contact#faq' },
];

function AboutTrustComponent() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 pb-10 grid gap-4 lg:grid-cols-3">
      {/* تضمین‌ها */}
      <div className="lg:col-span-2 card rounded-3xl p-6 sm:p-7 flex flex-col">
        <b className="font-black text-sm">تضمین‌های علی‌بازار</b>
        <p className="text-xs muted mt-1 leading-6">
          این چهار قول، پایه‌ی اعتماد بازارگاه ما هستند و در همه‌ی سفارش‌ها اجرا می‌شوند.
        </p>

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
          <span className="text-[11px] muted leading-6">
            این تضمین‌ها در صفحه‌ی هر محصول و هنگام پرداخت هم نمایش داده می‌شوند.
          </span>
          <Link to="/contact" className="text-[11px] font-bold text-yellow inline-flex items-center gap-1 shrink-0">
            سوال دارم
            <ChevronLeft size={12} />
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
          <b className="block font-black text-sm">مجوزها و نمادها</b>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[10px] px-2.5 py-1.5 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#c9d4ef' }}>نماد اعتماد الکترونیکی</span>
            <span className="text-[10px] px-2.5 py-1.5 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#c9d4ef' }}>ساماندهی رسانه‌های دیجیتال</span>
            <span className="text-[10px] px-2.5 py-1.5 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#c9d4ef' }}>درگاه پرداخت شتاب</span>
          </div>
          <p className="text-[11px] text-white/60 leading-6 mt-3">
            شماره‌ی مجوز و اطلاعات حقوقی کسب‌وکار در صفحه‌ی تماس در دسترس است.
          </p>
        </div>

        <div className="card rounded-3xl p-6 flex-1">
          <b className="block font-black text-sm">راهنما و قوانین</b>
          <ul className="mt-2">
            {LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="flex items-center justify-between gap-2 py-2 text-xs muted transition-colors hover:text-[var(--primary-color)]"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  {item.label}
                  <ChevronLeft size={13} />
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
