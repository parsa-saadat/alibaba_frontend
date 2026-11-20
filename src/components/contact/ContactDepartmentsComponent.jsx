import { SUPPORT_EMAIL, INFO_EMAIL } from '../../config/contact';
import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { ChevronLeft, Handshake, ShieldAlert, ShoppingBag, Store } from 'lucide-react';

// دپارتمان‌های پاسخ‌گو — هر بخش ایمیل و ساعت پاسخ‌دهی جداگانه دارد
const DEPARTMENTS = [
  {
    icon: ShoppingBag,
    title: translateText('v20.login'),
    desc: translateText('b2b.webSupportDesc'),
    email: SUPPORT_EMAIL,
    response: translateText('v20.noTime'),
  },
  {
    icon: Store,
    title: translateText('v20.errors'),
    desc: translateText('v20.issueHelp'),
    email: SUPPORT_EMAIL,
    response: translateText('v20.noTime'),
  },
  {
    icon: Handshake,
    title: translateText('v20.privacy'),
    desc: translateText('v20.profileHelp'),
    email: SUPPORT_EMAIL,
    response: translateText('v20.noTime'),
  },
  {
    icon: ShieldAlert,
    title: translateText('v20.suggestions'),
    desc: translateText('v20.siteHelp'),
    email: INFO_EMAIL,
    response: translateText('v20.noTime'),
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
