import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  Clock3,
  FileText,
  Headset,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import PageHeroComponent from '../../components/common/PageHeroComponent';
import ContactEmailScopeComponent from '../../components/contact/ContactEmailScopeComponent';
import { SUPPORT_EMAIL, INFO_EMAIL } from '../../config/contact';
import ContactPhoneComponent from '../../components/contact/ContactPhoneComponent';
import ContactFormComponent from '../../components/contact/ContactFormComponent';
import ContactOfficeComponent from '../../components/contact/ContactOfficeComponent';
import ContactDepartmentsComponent from '../../components/contact/ContactDepartmentsComponent';
import ContactFaqComponent from '../../components/contact/ContactFaqComponent';

const STATS = [
  {
    icon: Clock3,
    title: translateText('b2b.webSupport'),
    desc: translateText('b2b.webSupportDesc'),
  },
  { icon: Headset, title: translateText('v20.siteHelp'), desc: translateText('v20.website') },
  {
    icon: MessageSquare,
    title: translateText('v20.communication'),
    desc: translateText('v20.platform'),
  },
];

const DIRECT = [
  {
    icon: Mail,
    label: translateText('v20.login'),
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
  },
  {
    icon: Mail,
    label: translateText('v20.errors'),
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
  },
  {
    icon: Mail,
    label: translateText('v21.infoTitle'),
    value: INFO_EMAIL,
    href: `mailto:${INFO_EMAIL}`,
  },
  {
    icon: Mail,
    label: translateText('v20.privacy'),
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
  },
];

/*
 * صفحه‌ی «تماس با ما» — چیدمان دو ستونی مثل صفحه‌ی «درباره ما»:
 * بنر → کانال‌های ارتباطی → [فرم تماس | ستون اطلاعات چسبان] → شعبه‌ها → دپارتمان‌ها → پرسش‌ها → فراخوان
 */
function ContactPage() {
  return (
    <div className="pb-4">
      {/* بنر صفحه — همان بنر «درباره ما» */}
      <PageHeroComponent
        breadcrumb={translateText('تماس با ما')}
        badge={translateText('v20.team')}
        title={translateText('b2b.contactTitle')}
        description={translateText('b2b.contactIntro')}
        highlights={STATS.map((stat) => ({ icon: stat.icon, label: stat.title }))}
        actions={
          <>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Mail size={16} />
              {translateText('v20.siteHelp')}
            </a>
            <a
              href="#contact-form"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-[var(--text)] transition-colors"
              style={{
                background: 'var(--card2)',
                border: '1px solid var(--border)',
              }}
            >
              <MessageSquare size={16} />
              {translateText('ارسال پیام ')}
            </a>
          </>
        }
      />

      {/* کانال‌های ارتباطی — روی بنر می‌نشیند */}
      <div className="max-w-[1200px] mx-auto px-4 -mt-12 relative z-10">
        <ContactPhoneComponent />
      </div>

      {/* فرم تماس + ستون اطلاعات (بدون فضای خالی دو طرف فرم) */}
      <section className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-accent">{translateText('ارسال پیام')}</span>
            <h2 className="mt-1.5 font-black text-lg">{translateText('v20.formTitle')}</h2>
          </div>
          <p className="max-w-md text-xs muted leading-6">{translateText('v20.formIntro')}</p>
        </div>

        <div
          id="contact-form"
          className="grid items-start gap-4 scroll-mt-24 lg:grid-cols-[minmax(0,1fr)_360px]"
        >
          <div className="min-w-0">
            <ContactFormComponent />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            {/* تماس مستقیم */}
            <div data-testid="direct-contact" className="card rounded-3xl p-5">
              <h3 className="flex items-center gap-2 text-sm font-black">
                <Mail size={16} className="text-accent" />
                {translateText('تماس مستقیم ')}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {DIRECT.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.value + item.label}>
                      <a
                        href={item.href}
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-[var(--card2)]"
                      >
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                          style={{ background: 'var(--card2)' }}
                        >
                          <Icon size={14} className="text-accent" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[10px] muted">{item.label}</span>
                          <b className="block break-all text-xs tabular-nums" dir="ltr">
                            {item.value}
                          </b>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            <ContactEmailScopeComponent />

            {/* میان‌بُرها */}
            <div className="card rounded-3xl p-5">
              <h3 className="flex items-center gap-2 text-sm font-black">
                <ShieldCheck size={16} className="text-accent" />
                {translateText('قبل از تماس بخوانید ')}
              </h3>
              <div className="mt-3 space-y-2">
                <Link
                  to="/terms/customers"
                  className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors hover:bg-[var(--card2)]"
                >
                  <span className="flex items-center gap-2">
                    <FileText size={14} className="text-accent" />
                    {translateText('قوانین و مقررات مشتریان ')}
                  </span>
                  <ChevronLeft size={14} className="logical-icon muted" />
                </Link>
                <Link
                  to="/terms/buyers"
                  className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors hover:bg-[var(--card2)]"
                >
                  <span className="flex items-center gap-2">
                    <FileText size={14} className="text-accent" />
                    {translateText('قوانین خریداران ')}
                  </span>
                  <ChevronLeft size={14} className="logical-icon muted" />
                </Link>
                <Link
                  to="/orders"
                  className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors hover:bg-[var(--card2)]"
                >
                  <span className="flex items-center gap-2">
                    <MapPin size={14} className="text-accent" />
                    {translateText('پیگیری سفارش‌های من ')}
                  </span>
                  <ChevronLeft size={14} className="logical-icon muted" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* شعبه‌ها */}
      <section className="max-w-[1200px] mx-auto px-4 pb-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-accent">
              {translateText('v20.helpTitle')}
            </span>
            <h2 className="mt-1.5 font-black text-lg">{translateText('v20.noVisit')}</h2>
          </div>
          <p className="max-w-md text-xs muted leading-6">{translateText('v20.responsible')}</p>
        </div>
        <ContactOfficeComponent />
      </section>

      {/* دپارتمان‌ها */}
      <section className="max-w-[1200px] mx-auto px-4 pb-8">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <span className="text-[11px] font-bold text-accent">
              {translateText('v20.subjects')}
            </span>
            <h2 className="mt-1.5 font-black text-lg">{translateText('v20.helpTitle')}</h2>
            <p className="text-xs muted mt-1">{translateText('v20.subjectIntro')}</p>
          </div>
          <Link
            to="/about"
            className="text-xs font-bold text-accent inline-flex items-center gap-1"
          >
            {translateText('درباره تیم ما ')}
            <ChevronLeft className="logical-icon" size={14} />
          </Link>
        </div>
        <ContactDepartmentsComponent />
      </section>

      {/* پرسش‌های متداول */}
      <section className="max-w-[1200px] mx-auto px-4 pb-8">
        <ContactFaqComponent />
      </section>

      {/* فراخوان پایانی */}
      <section className="max-w-[1200px] mx-auto px-4 pb-4">
        <div
          className="rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-5"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,106,0,0.14), rgba(255,106,0,0.02)), var(--card)',
            border: '1px solid color-mix(in srgb, var(--primary-color) 32%, transparent)',
          }}
        >
          <div>
            <h2 className="font-black text-lg">
              {translateText('هنوز جواب سوالتان را پیدا نکردید؟')}
            </h2>
            <p className="text-xs muted mt-1.5 leading-6">{translateText('b2b.contactIntro')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Mail size={16} />
              {translateText('v20.siteHelp')}
            </a>
            <a
              href="mailto:info@geokala.ir"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              {translateText('b2b.emailAction')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactPage;
