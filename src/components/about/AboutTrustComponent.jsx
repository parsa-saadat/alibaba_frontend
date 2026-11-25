import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, CreditCard, Headset, RotateCcw, ShieldCheck } from 'lucide-react';

// تضمین برای فروشنده‌های مورد اعتماد
const GUARANTEES = [
  {
    icon: ShieldCheck,
    title: translateText('b2b.sellers'),
    desc: translateText('b2b.sellersDesc'),
  },
  { icon: RotateCcw, title: translateText('b2b.compare'), desc: translateText('b2b.compareDesc') },
  {
    icon: CreditCard,
    title: translateText('b2b.multilingual'),
    desc: translateText('v21.languageDesc'),
  },
  {
    icon: Headset,
    title: translateText('b2b.webSupport'),
    desc: translateText('b2b.webSupportDesc'),
  },
];

// لینک‌های حقوقی و راهنما
const LINKS = [
  { label: translateText('قوانین مشتریان'), to: '/terms/customers' },
  { label: translateText('قوانین خریداران'), to: '/terms/buyers' },
  { label: translateText('قوانین فروشندگان'), to: '/terms/sellers' },
  { label: translateText('حریم خصوصی'), to: '/privacy' },
  { label: translateText('شرایط بازگشت کالا'), to: '/terms/buyers#returns' },
  { label: translateText('راهنمای خرید'), to: '/guide/buying' },
  { label: translateText('راهنمای فروش در ژئوکالا'), to: '/guide/selling' },
  { label: translateText('سوالات متداول'), to: '/contact#faq' },
];

function AboutTrustComponent() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 pb-10 grid gap-4 lg:grid-cols-3">
      {/* تضمین‌ها */}
      <div className="lg:col-span-2 card rounded-3xl p-6 sm:p-7 flex flex-col">
        <b className="font-black text-sm">{translateText('v20.features')}</b>
        <p className="text-xs muted mt-1 leading-6">{translateText('v20.noRetail')}</p>

        <div className="grid gap-4 sm:grid-cols-2 mt-5">
          {GUARANTEES.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-2.5">
                <span
                  className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
                  style={{ background: 'rgba(255,106,0,0.14)', color: 'var(--primary-color)' }}
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
          <span className="text-[11px] muted leading-6">{translateText('v20.termsShort')}</span>
          <Link
            to="/contact"
            className="text-[11px] font-bold text-accent inline-flex items-center gap-1 shrink-0"
          >
            {translateText('سوال دارم ')}
            <ChevronLeft className="logical-icon" size={12} />
          </Link>
        </div>
      </div>

      {/* نمادها و لینک‌ها */}
      <div className="flex flex-col gap-4">
        <div
          className="rounded-3xl p-6 text-[var(--text)]"
          style={{
            background: 'linear-gradient(150deg, var(--card2), var(--card))',
            border: '1px solid var(--border)',
          }}
        >
          <b className="block font-black text-sm">{translateText('v20.scope')}</b>
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className="text-[10px] px-2.5 py-1.5 rounded-lg"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--card2)',
                color: '#d4d4d4',
              }}
            >
              {translateText('v20.platform')}
            </span>
            <span
              className="text-[10px] px-2.5 py-1.5 rounded-lg"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--card2)',
                color: '#d4d4d4',
              }}
            >
              {translateText('v20.profiles')}
            </span>
            <span
              className="text-[10px] px-2.5 py-1.5 rounded-lg"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--card2)',
                color: '#d4d4d4',
              }}
            >
              {translateText('v20.website')}
            </span>
          </div>
          <p className="text-[11px] text-[var(--muted)] leading-6 mt-3">
            {translateText('v20.responsible')}
          </p>
        </div>

        <div className="card rounded-3xl p-6 flex-1">
          <b className="block font-black text-sm">{translateText('راهنما و قوانین')}</b>
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
