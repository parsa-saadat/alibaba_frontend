import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Clock3, Headset, MessageSquare, Phone, Sparkles } from 'lucide-react';
import ContactPhoneComponent from '../../components/contact/ContactPhoneComponent';
import ContactFormComponent from '../../components/contact/ContactFormComponent';
import ContactOfficeComponent from '../../components/contact/ContactOfficeComponent';
import ContactDepartmentsComponent from '../../components/contact/ContactDepartmentsComponent';
import ContactFaqComponent from '../../components/contact/ContactFaqComponent';

const STATS = [
  { icon: Clock3, title: 'پاسخ‌دهی زیر ۲۴ ساعت', desc: 'به همه پیام‌ها' },
  { icon: Headset, title: 'پشتیبانی ۲۴/۷', desc: 'چت آنلاین همیشه فعال' },
  { icon: MessageSquare, title: '۹۸٪ رضایت', desc: 'از تجربه پشتیبانی' },
];

function ContactPage() {
  return (
    <div className="pb-4">
      {/* هدر صفحه */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at 15% 20%, rgba(255,214,10,0.16), transparent 45%), linear-gradient(135deg, var(--navy-mid), var(--navy-deep))',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-4 pt-6 pb-16">
          {/* مسیر */}
          <nav className="flex items-center gap-1.5 text-[11px] text-white/60">
            <Link to="/" className="hover:text-white transition-colors">
              خانه
            </Link>
            <ChevronLeft size={12} />
            <span className="text-white/90">تماس با ما</span>
          </nav>

          <div className="mt-6 max-w-2xl">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full px-3 py-1"
              style={{ background: 'rgba(255,214,10,0.14)', color: 'var(--primary-color)' }}
            >
              <Sparkles size={12} />
              تیم پشتیبانی علی‌بازار
            </span>
            <h1 className="font-black text-2xl sm:text-4xl text-white mt-3 leading-tight">
              هر سوالی دارید، ما همین‌جا هستیم
            </h1>
            <p className="text-xs sm:text-sm text-white/70 leading-6 mt-3">
              از خرید و پیگیری سفارش تا شروع فروش در علی‌بازار؛ کارشناسان ما در ۷ روز هفته پاسخ‌گوی
              شما هستند. سریع‌ترین راه را انتخاب کنید.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-5">
              <a href="tel:+982191009100" className="btn-yellow inline-flex items-center gap-2">
                <Phone size={16} />
                تماس با پشتیبانی
              </a>
              <a
                href="#contact-form"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }}
              >
                <MessageSquare size={16} />
                ارسال پیام
              </a>
            </div>
          </div>

          {/* شاخص‌های اعتماد */}
          <div className="hidden md:flex flex-wrap gap-6 mt-7">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.title} className="flex items-center gap-2.5">
                  <span
                    className="w-9 h-9 rounded-xl grid place-items-center"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--primary-color)' }}
                  >
                    <Icon size={17} />
                  </span>
                  <span>
                    <b className="block text-xs text-white">{stat.title}</b>
                    <span className="text-[10px] text-white/50">{stat.desc}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* راه‌های ارتباطی */}
      <div className="max-w-[1200px] mx-auto px-4 -mt-10 relative z-10">
        <ContactPhoneComponent />
      </div>

      {/* فرم + دفتر */}
      <section id="contact-form" className="max-w-[1200px] mx-auto px-4 py-8 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ContactFormComponent />
        </div>
        <ContactOfficeComponent />
      </section>

      {/* دپارتمان‌ها */}
      <section className="max-w-[1200px] mx-auto px-4 pb-8">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="font-black text-lg">با دپارتمان درست حرف بزنید</h2>
            <p className="text-xs muted mt-1">هر درخواست را مستقیم به تیم تخصصی خودش بفرستید</p>
          </div>
          <Link to="/about" className="text-xs font-bold text-yellow inline-flex items-center gap-1">
            درباره تیم ما
            <ChevronLeft size={14} />
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
            border: '1px solid rgba(255,214,10,0.3)',
          }}
        >
          <div>
            <h2 className="font-black text-lg">هنوز جواب سوالتان را پیدا نکردید؟</h2>
            <p className="text-xs muted mt-1.5 leading-6">
              کارشناسان ما شنبه تا پنجشنبه از ۸ صبح تا ۸ شب پاسخ‌گو هستند؛ چت آنلاین هم ۲۴ ساعته فعال
              است.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <a href="tel:+982191009100" className="btn-yellow inline-flex items-center gap-2">
              <Phone size={16} />
              ۰۲۱-۹۱۰۰۹۱۰۰
            </a>
            <a
              href="mailto:support@alibazar.ir"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              ایمیل به پشتیبانی
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactPage;
