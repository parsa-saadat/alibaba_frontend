import React from 'react';
import { ChevronLeft, Handshake, ShieldAlert, ShoppingBag, Store } from 'lucide-react';

// دپارتمان‌های پاسخ‌گو — هر بخش ایمیل و ساعت پاسخ‌دهی جداگانه دارد
const DEPARTMENTS = [
  {
    icon: ShoppingBag,
    title: 'پشتیبانی خریداران',
    desc: 'سفارش، پرداخت، ارسال و مرجوعی',
    email: 'buyer@alibazar.ir',
    response: 'پاسخ تا ۴ ساعت کاری',
  },
  {
    icon: Store,
    title: 'پشتیبانی فروشندگان',
    desc: 'ثبت‌نام فروشنده، محصولات و تسویه',
    email: 'seller@alibazar.ir',
    response: 'پاسخ تا ۸ ساعت کاری',
  },
  {
    icon: Handshake,
    title: 'همکاری و تبلیغات',
    desc: 'تبلیغات، اسپانسری و همکاری تجاری',
    email: 'partner@alibazar.ir',
    response: 'پاسخ تا ۲ روز کاری',
  },
  {
    icon: ShieldAlert,
    title: 'رسیدگی به شکایات',
    desc: 'گزارش تخلف، اصالت کالا و اختلاف',
    email: 'trust@alibazar.ir',
    response: 'بررسی حداکثر ۴۸ ساعت',
  },
];

function ContactDepartmentsComponent() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {DEPARTMENTS.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.title}
            href={`mailto:${item.email}`}
            className="card rounded-2xl p-4 flex flex-col gap-1 transition-transform duration-200 hover:-translate-y-1"
          >
            <span className="text-yellow">
              <Icon size={20} />
            </span>
            <b className="text-sm font-black mt-1">{item.title}</b>
            <span className="text-[11px] muted leading-5">{item.desc}</span>
            <span className="text-[11px] mt-2 flex items-center gap-1" dir="ltr">
              {item.email}
              <ChevronLeft size={12} />
            </span>
            <span className="text-[10px] muted mt-auto pt-2">{item.response}</span>
          </a>
        );
      })}
    </div>
  );
}

export default ContactDepartmentsComponent;
