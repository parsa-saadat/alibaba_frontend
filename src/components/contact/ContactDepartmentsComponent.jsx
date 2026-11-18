import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { ChevronLeft, Handshake, ShieldAlert, ShoppingBag, Store } from 'lucide-react';

// دپارتمان‌های پاسخ‌گو — هر بخش ایمیل و ساعت پاسخ‌دهی جداگانه دارد
const DEPARTMENTS = [
  {
    icon: ShoppingBag,
    title: translateText("فروش و سفارش"),
    desc: translateText("استعلام قیمت، ثبت سفارش و پیگیری ارسال"),
    email: 'sales@geokala.ir',
    response: translateText("پاسخ تا ۴ ساعت کاری"),
  },
  {
    icon: Store,
    title: translateText("پشتیبانی فنی"),
    desc: translateText("راه‌اندازی، کالیبراسیون و خدمات پس از فروش"),
    email: 'support@geokala.ir',
    response: translateText("پاسخ تا ۸ ساعت کاری"),
  },
  {
    icon: Handshake,
    title: translateText("همکاری و نمایندگی"),
    desc: translateText("نمایندگی فروش، تأمین و همکاری تجاری"),
    email: 'partner@geokala.ir',
    response: translateText("پاسخ تا ۲ روز کاری"),
  },
  {
    icon: ShieldAlert,
    title: translateText("رسیدگی به شکایات"),
    desc: translateText("گزارش تخلف، اصالت کالا و اختلاف سفارش"),
    email: 'trust@geokala.ir',
    response: translateText("بررسی حداکثر ۴۸ ساعت"),
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
              <ChevronLeft className="logical-icon" size={12} />
            </span>
            <span className="text-[10px] muted mt-auto pt-2">{item.response}</span>
          </a>
        );
      })}
    </div>
  );
}

export default ContactDepartmentsComponent;
