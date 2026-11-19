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
import ContactPhoneComponent from '../../components/contact/ContactPhoneComponent';
import ContactFormComponent from '../../components/contact/ContactFormComponent';
import ContactOfficeComponent from '../../components/contact/ContactOfficeComponent';
import ContactDepartmentsComponent from '../../components/contact/ContactDepartmentsComponent';
import ContactFaqComponent from '../../components/contact/ContactFaqComponent';

const STATS = [
  { icon: Clock3, title: translateText("پاسخ زیر ۲۴ ساعت"), desc: translateText("به همه پیام‌ها") },
  { icon: Headset, title: translateText("مشاوره‌ی تخصصی"), desc: translateText("کارشناس نقشه‌برداری") },
  { icon: MessageSquare, title: translateText("دو شعبه‌ی فعال"), desc: translateText("تهران و مازندران") },
];

const HOURS = [
  { day: translateText("شنبه تا چهارشنبه"), time: translateText("۹:۰۰ تا ۱۸:۰۰") },
  { day: translateText("پنجشنبه"), time: translateText("۹:۰۰ تا ۱۴:۰۰") },
  { day: translateText("جمعه"), time: translateText("تعطیل — فرم و ایمیل فعال است") },
];

const DIRECT = [
  { icon: Phone, label: translateText("شعبه تهران"), value: translateText("۰۹۱۲۹۳۲۷۵۱۵"), href: 'tel:+989129327515' },
  { icon: Phone, label: translateText("شعبه مازندران (هچیرود)"), value: translateText("۰۹۱۰۲۴۰۱۰۰۷"), href: 'tel:+989102401007' },
  { icon: Mail, label: translateText("پشتیبانی"), value: 'info@geokala.ir', href: 'mailto:info@geokala.ir' },
  { icon: Mail, label: translateText("همکاری و نمایندگی"), value: 'partner@geokala.ir', href: 'mailto:partner@geokala.ir' },
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
        breadcrumb={translateText("تماس با ما")}
        badge={translateText("تیم فنی و پشتیبانی ژئوکالا")}
        title={translateText("مشاوره‌ی خرید تجهیزات نقشه‌برداری")}
        description={translateText("از انتخاب مدل درست جی‌پی‌اس یا توتال استیشن تا پیگیری سفارش و خدمات پس از فروش؛ کارشناسان ما در شعبه‌های تهران و هچیرود پاسخ‌گوی شما هستند.")}
        highlights={STATS.map((stat) => ({ icon: stat.icon, label: stat.title }))}
        actions={
          <>
            <a href="tel:+989129327515" className="btn-yellow inline-flex items-center gap-2">
              <Phone size={16} />{translateText("تماس با شعبه تهران ")}</a>
            <a
              href="#contact-form"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              <MessageSquare size={16} />{translateText("ارسال پیام ")}</a>
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
            <span className="text-[11px] font-bold text-yellow">{translateText("ارسال پیام")}</span>
            <h2 className="mt-1.5 font-black text-lg">{translateText("فرم تماس و پاسخ کارشناس")}</h2>
          </div>
          <p className="max-w-md text-xs muted leading-6">{translateText("دقیق‌ترین راه برای پیگیری مکتوب؛ پیام شما با شماره پیگیری در ایمیل ثبت می‌شود. ")}</p>
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
            <div className="card rounded-3xl p-5">
              <h3 className="flex items-center gap-2 text-sm font-black">
                <Phone size={16} className="text-yellow" />{translateText("تماس مستقیم ")}</h3>
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
                          <Icon size={14} className="text-yellow" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[10px] muted">{item.label}</span>
                          <b className="block truncate text-xs tabular-nums" dir="auto">
                            {item.value}
                          </b>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* ساعات کاری */}
            <div className="card rounded-3xl p-5">
              <h3 className="flex items-center gap-2 text-sm font-black">
                <Clock3 size={16} className="text-yellow" />{translateText("ساعات پاسخ‌دهی ")}</h3>
              <ul className="mt-3 space-y-2 text-xs">
                {HOURS.map((row) => (
                  <li key={row.day} className="flex items-center justify-between gap-2">
                    <span className="muted">{row.day}</span>
                    <b className="tabular-nums">{row.time}</b>
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-xl px-3 py-2 text-[11px] leading-6" style={{ background: 'var(--card2)' }}>{translateText("فرم تماس و ایمیل شبانه‌روزی ثبت می‌شود؛ پاسخ‌دهی در ساعات کاری انجام می‌گیرد. ")}</p>
            </div>

            {/* میان‌بُرها */}
            <div className="card rounded-3xl p-5">
              <h3 className="flex items-center gap-2 text-sm font-black">
                <ShieldCheck size={16} className="text-yellow" />{translateText("قبل از تماس بخوانید ")}</h3>
              <div className="mt-3 space-y-2">
                <Link
                  to="/terms/customers"
                  className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors hover:bg-[var(--card2)]"
                >
                  <span className="flex items-center gap-2">
                    <FileText size={14} className="text-yellow" />{translateText("قوانین و مقررات مشتریان ")}</span>
                  <ChevronLeft size={14} className="logical-icon muted" />
                </Link>
                <Link
                  to="/terms/buyers"
                  className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors hover:bg-[var(--card2)]"
                >
                  <span className="flex items-center gap-2">
                    <FileText size={14} className="text-yellow" />{translateText("قوانین خریداران ")}</span>
                  <ChevronLeft size={14} className="logical-icon muted" />
                </Link>
                <Link
                  to="/orders"
                  className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors hover:bg-[var(--card2)]"
                >
                  <span className="flex items-center gap-2">
                    <MapPin size={14} className="text-yellow" />{translateText("پیگیری سفارش‌های من ")}</span>
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
            <span className="text-[11px] font-bold text-yellow">{translateText("شعبه‌های ما")}</span>
            <h2 className="mt-1.5 font-black text-lg">{translateText("حضوری هم می‌توانید سر بزنید")}</h2>
          </div>
          <p className="max-w-md text-xs muted leading-6">{translateText("هر شعبه شماره‌ی مستقیم و دکمه‌ی مسیریابی دارد؛ پیش از مراجعه تماس بگیرید تا هماهنگی انجام شود. ")}</p>
        </div>
        <ContactOfficeComponent />
      </section>

      {/* دپارتمان‌ها */}
      <section className="max-w-[1200px] mx-auto px-4 pb-8">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <span className="text-[11px] font-bold text-yellow">{translateText("دپارتمان‌ها")}</span>
            <h2 className="mt-1.5 font-black text-lg">{translateText("با دپارتمان درست حرف بزنید")}</h2>
            <p className="text-xs muted mt-1">{translateText("هر درخواست را مستقیم به تیم تخصصی خودش بفرستید")}</p>
          </div>
          <Link to="/about" className="text-xs font-bold text-yellow inline-flex items-center gap-1">{translateText("درباره تیم ما ")}<ChevronLeft className="logical-icon" size={14} />
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
              'linear-gradient(135deg, rgba(255,214,10,0.14), rgba(255,214,10,0.02)), var(--card)',
            border: '1px solid color-mix(in srgb, var(--primary-color) 32%, transparent)',
          }}
        >
          <div>
            <h2 className="font-black text-lg">{translateText("هنوز جواب سوالتان را پیدا نکردید؟")}</h2>
            <p className="text-xs muted mt-1.5 leading-6">{translateText("کارشناسان ما شنبه تا پنجشنبه از ۹ صبح تا ۶ عصر پاسخ‌گو هستند؛ فرم همین صفحه هم شبانه‌روزی ثبت می‌شود. ")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <a href="tel:+989129327515" className="btn-yellow inline-flex items-center gap-2">
              <Phone size={16} />{translateText("۰۹۱۲۹۳۲۷۵۱۵ ")}</a>
            <a
              href="mailto:info@geokala.ir"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            >{translateText("ایمیل به پشتیبانی ")}</a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactPage;
