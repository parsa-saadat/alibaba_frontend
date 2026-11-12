import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUp,
  BadgeCheck,
  ChevronDown,
  Coffee,
  Cpu,
  CreditCard,
  Globe,
  Headphones,
  Headset,
  Home,
  Laptop,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react';
import { fetchCategories } from '../../utils/helpers/categories';
import { getId } from '../../utils/helpers/response';

/* ------------------------------------------------------------------ */
/* داده‌های ثابت                                                       */
/* ------------------------------------------------------------------ */

const CATEGORY_ICONS = [Smartphone, Laptop, Headphones, Coffee, Home, Cpu];

const FALLBACK_CATEGORIES = [
  'گوشی موبایل و تبلت',
  'لپ‌تاپ و لوازم جانبی',
  'هدفون و تجهیزات صوتی',
  'لوازم خانگی و آشپزخانه',
  'قهوه‌ساز و نوشیدنی‌ساز',
  'خانه هوشمند',
];

const LINK_COLUMNS = [
  {
    title: 'خرید و سفارش',
    items: [
      { label: 'همه محصولات', to: '/products' },
      { label: 'تخفیف‌های امروز', to: '/products?sort=discount' },
      { label: 'فروشگاه‌ها', to: '/products' },
      { label: 'سبد خرید', to: '/cart' },
      { label: 'لیست علاقه‌مندی', to: '/favorites' },
      { label: 'مقایسه محصولات', to: '/compare' },
    ],
  },
  {
    title: 'فروش در علی‌بازار',
    items: [
      { label: 'شروع فروش', to: '/seller' },
      { label: 'پنل فروشندگان', to: '/seller' },
      { label: 'تعرفه و کمیسیون', to: '/seller' },
      { label: 'قوانین فروشندگان', to: '/about' },
      { label: 'بسته‌بندی و ارسال', to: '/about' },
    ],
  },
  {
    title: 'راهنما و پشتیبانی',
    items: [
      { label: 'تماس با ما', to: '/contact' },
      { label: 'درباره علی‌بازار', to: '/about' },
      { label: 'سوالات متداول', to: '/contact#faq' },
      { label: 'پیگیری سفارش‌ها', to: '/orders' },
      { label: 'شرایط بازگشت کالا', to: '/about' },
      { label: 'حریم خصوصی', to: '/about' },
    ],
  },
];

const STATS = [
  { value: '+۱۰۰ هزار', label: 'خریدار عمده' },
  { value: '+۵ هزار', label: 'فروشنده فعال' },
  { value: '۲۴/۷', label: 'پشتیبانی' },
];

const TRUST_ITEMS = [
  { icon: Truck, title: 'ارسال سریع', desc: 'تحویل ۱ تا ۳ روز کاری' },
  { icon: ShieldCheck, title: 'تضمین اصالت کالا', desc: 'ضمانت بازگشت وجه' },
  { icon: CreditCard, title: 'پرداخت امن', desc: 'درگاه بانکی معتبر' },
  { icon: Headset, title: 'پشتیبانی ۲۴ ساعته', desc: '۷ روز هفته، پاسخگو' },
];

const CONTACTS = [
  { icon: Phone, text: '۰۲۱-۹۱۰۰۹۱۰۰', href: 'tel:+982191009100' },
  { icon: Mail, text: 'support@alibazar.ir', href: 'mailto:support@alibazar.ir' },
  { icon: MapPin, text: 'تهران، خیابان ولیعصر، برج تجارت الکترونیک' },
];

/* ------------------------------------------------------------------ */
/* آیکون‌های برند                                                      */
/* ------------------------------------------------------------------ */

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const YoutubeIcon = (props) => (
  <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <rect x="2" y="5" width="20" height="14" rx="4" />
    <path d="M10.2 9.3 15 12l-4.8 2.7z" fill="currentColor" stroke="none" />
  </svg>
);

const SOCIALS = [
  { label: 'اینستاگرام', href: 'https://instagram.com', icon: InstagramIcon },
  { label: 'تلگرام', href: 'https://t.me', icon: (props) => <Send size={17} {...props} /> },
  { label: 'یوتیوب', href: 'https://youtube.com', icon: YoutubeIcon },
  { label: 'وبلاگ', href: '/about', icon: (props) => <Globe size={17} {...props} />, internal: true },
];

/* ------------------------------------------------------------------ */
/* کامپوننت‌های کمکی                                                   */
/* ------------------------------------------------------------------ */

// ستون لینک‌ها: در دسکتاپ همیشه باز، در موبایل آکاردئون
function FooterSection({ title, icon: Icon, items, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/[0.08] lg:border-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 py-4 text-right lg:pointer-events-none lg:mb-4 lg:py-0"
      >
        <span className="flex items-center gap-2 text-sm font-extrabold text-white">
          {Icon && <Icon size={16} style={{ color: 'var(--primary-color)' }} />}
          {title}
        </span>
        <ChevronDown
          size={16}
          className={`text-[#8fa0c9] transition-transform duration-300 lg:hidden ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out lg:visible lg:max-h-none lg:opacity-100 ${
          open ? 'max-h-[600px] opacity-100' : 'invisible max-h-0 opacity-0'
        }`}
      >
        <ul className="space-y-1 pb-4 lg:pb-0">
          {items.map((item, index) => (
            <li key={`${item.to}-${index}`}>
              <Link
                to={item.to}
                className="group flex items-center gap-2 py-1 text-[0.82rem] text-[#a9b6d8] transition-colors hover:text-white"
              >
                {item.Icon ? (
                  <item.Icon size={14} className="shrink-0" style={{ color: 'var(--primary-color)' }} />
                ) : (
                  <span
                    className="h-px w-2 shrink-0 transition-all duration-200 group-hover:w-4"
                    style={{ background: 'var(--primary-color)' }}
                  />
                )}
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// فرم خبرنامه (فعلاً UI است؛ به API خودت وصلش کن)
function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus({ type: 'error', text: 'لطفاً یک ایمیل معتبر وارد کنید.' });
      return;
    }

    // TODO: ارسال value به API خبرنامه
    setStatus({ type: 'success', text: 'عضویت شما ثبت شد. ممنون!' });
    setEmail('');
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Mail size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 opacity-60" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ایمیل خود را وارد کنید"
            className="w-full rounded-xl bg-white py-2.5 pe-3 ps-9 text-sm text-[#0a1736] outline-none ring-2 ring-transparent transition focus:ring-[var(--navy)]"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: 'var(--navy)' }}
        >
          عضویت
        </button>
      </form>
      {status && (
        <p className={`mt-2 text-xs font-medium ${status.type === 'error' ? 'text-red-800' : 'text-emerald-900'}`}>
          {status.text}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* فوتر اصلی                                                          */
/* ------------------------------------------------------------------ */

function FooterComponent() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    fetchCategories(controller.signal)
      .then((rows) => {
        if (!Array.isArray(rows)) return;
        setCategories(rows.filter((row) => getId(row)).slice(0, 6));
      })
      .catch(() => setCategories([]));
    return () => controller.abort();
  }, []);

  const categoryItems = useMemo(() => {
    if (!categories.length) {
      return FALLBACK_CATEGORIES.map((name, i) => ({
        label: name,
        to: '/products',
        Icon: CATEGORY_ICONS[i % CATEGORY_ICONS.length],
      }));
    }
    return categories.map((category, i) => ({
      label: category.name || 'دسته‌بندی',
      to: `/products?category_id=${getId(category)}`,
      Icon: CATEGORY_ICONS[i % CATEGORY_ICONS.length],
    }));
  }, [categories]);

  const year = useMemo(() => {
    try {
      return new Date().toLocaleDateString('fa-IR', { year: 'numeric' });
    } catch {
      return '۱۴۰۵';
    }
  }, []);

  return (
    <footer
      className="site-footer relative mt-16 overflow-x-clip pt-8 text-[#dfe6fb]"
      style={{ background: 'linear-gradient(180deg, #0c1a3d 0%, #060d21 100%)' }}
    >
      {/* درخشش‌های تزئینی */}
      <div
        aria-hidden
        className="pointer-events-none absolute -start-32 -top-32 h-72 w-72 rounded-full blur-3xl"
        style={{ background: 'rgba(255,214,10,0.10)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -end-40 bottom-0 h-96 w-96 rounded-full blur-3xl"
        style={{ background: 'rgba(80,120,255,0.12)' }}
      />

      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6">
        {/* کارت دعوت: خبرنامه و فروشندگان */}
        <div
          className="grid gap-6 rounded-3xl p-5 sm:p-6 lg:grid-cols-2 lg:items-center lg:gap-10 lg:p-8"
          style={{
            background: 'linear-gradient(135deg, var(--primary-color) 0%, #ffb800 100%)',
            color: 'var(--navy)',
          }}
        >
          <div>
            <h3 className="text-lg font-black sm:text-xl">عضویت در خبرنامه‌ی علی‌بازار</h3>
            <p className="mt-1 text-xs opacity-80 sm:text-sm">
              هر هفته تخفیف‌ها و پیشنهادهای ویژه‌ی عمده را زودتر از دیگران دریافت کنید.
            </p>
            <div className="mt-4">
              <Newsletter />
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 rounded-2xl bg-white/25 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                style={{ background: 'var(--navy)', color: 'var(--primary-color)' }}
              >
                <Store size={20} />
              </span>
              <div>
                <b className="block text-sm">کسب‌وکار دارید؟</b>
                <span className="block text-xs opacity-80">به بیش از ۱۰۰ هزار خریدار عمده دسترسی پیدا کنید</span>
              </div>
            </div>
            <Link
              to="/seller"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold transition hover:-translate-y-0.5"
              style={{ color: 'var(--navy)' }}
            >
              شروع فروش
              <ArrowLeft size={16} />
            </Link>
          </div>
        </div>

        {/* نوار تضمین‌ها */}
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06] transition hover:bg-white/[0.06]"
              >
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                  style={{ background: 'rgba(255,214,10,0.12)', color: 'var(--primary-color)' }}
                >
                  <Icon size={20} />
                </span>
                <div className="min-w-0">
                  <b className="block truncate text-xs text-white md:text-sm">{item.title}</b>
                  <span className="block truncate text-[11px] text-[#8fa0c9] md:text-xs">{item.desc}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* بدنه اصلی */}
        <div className="grid gap-x-8 gap-y-2 py-12 md:grid-cols-2 lg:grid-cols-12">
          {/* برند */}
          <div className="md:col-span-2 lg:col-span-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <span
                className="grid h-12 w-12 place-items-center rounded-2xl text-2xl font-black"
                style={{ background: 'var(--primary-color)', color: 'var(--navy)' }}
              >
                ع
              </span>
              <span>
                <b className="block text-lg leading-tight text-white">علی‌بازار</b>
                <span className="text-[11px] text-[#8fa0c9]">بازار داخلی ایران • بدون واردات و صادرات</span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-xs leading-6 text-[#8fa0c9]">
              یک بازار آنلاین B2B که تولیدکنندگان و عمده‌فروشان ایرانی را به خریداران سراسر کشور وصل می‌کند؛ با تضمین
              اصالت کالا، قیمت رقابتی و پشتیبانی واقعی.
            </p>

            {/* آمار */}
            <div className="mt-6 grid max-w-sm grid-cols-3 gap-2">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white/[0.04] px-2 py-3 text-center ring-1 ring-white/[0.06]">
                  <b className="block text-sm font-black" style={{ color: 'var(--primary-color)' }}>
                    {stat.value}
                  </b>
                  <span className="text-[10px] text-[#8fa0c9]">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* شبکه‌های اجتماعی */}
            <div className="mt-6 flex items-center gap-2">
              {SOCIALS.map((s) => {
                const Icon = s.icon;
                const className =
                  'grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-[#dfe6fb] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-[var(--navy)]';
                return s.internal ? (
                  <Link key={s.label} to={s.href} aria-label={s.label} className={className}>
                    <Icon />
                  </Link>
                ) : (
                  <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className={className}>
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>

          {/* دسته‌بندی‌ها */}
          <div className="lg:col-span-2">
            <FooterSection title="دسته‌بندی‌ها" icon={Sparkles} items={categoryItems} defaultOpen />
          </div>

          {/* ستون‌های ثابت */}
          {LINK_COLUMNS.map((column) => (
            <div key={column.title} className="lg:col-span-2">
              <FooterSection title={column.title} items={column.items} />
            </div>
          ))}
        </div>
      </div>

      {/* نوار تماس و نماد */}
      <div className="relative border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2">
            {CONTACTS.map((c) => {
              const Icon = c.icon;
              const content = (
                <>
                  <Icon size={14} className="shrink-0" style={{ color: 'var(--primary-color)' }} />
                  <span className="text-xs text-[#a9b6d8]">{c.text}</span>
                </>
              );
              return (
                <li key={c.text}>
                  {c.href ? (
                    <a href={c.href} className="flex items-center gap-2 transition-colors hover:text-white">
                      {content}
                    </a>
                  ) : (
                    <span className="flex items-center gap-2">{content}</span>
                  )}
                </li>
              );
            })}
          </ul>

          <span className="inline-flex w-max items-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 text-[11px] text-[#c9d4ef]">
            <BadgeCheck size={14} style={{ color: 'var(--primary-color)' }} />
            نماد اعتماد الکترونیکی
          </span>
        </div>
      </div>

      {/* نوار پایانی */}
      <div className="relative border-t border-white/[0.08] bg-black/20">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:justify-between">
          <p className="text-center text-[11px] text-[#8fa0c9] lg:text-right">
            © {year} علی‌بازار — تمامی حقوق محفوظ است.
          </p>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-[#8fa0c9]">
            <Link to="/about" className="transition-colors hover:text-white">قوانین و مقررات</Link>
            <Link to="/about" className="transition-colors hover:text-white">حریم خصوصی</Link>
            <Link to="/contact" className="transition-colors hover:text-white">تماس با ما</Link>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1 transition-colors hover:text-white"
            >
              بازگشت به بالا
              <ArrowUp size={12} />
            </button>
          </nav>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {['شتاب', 'زرین‌پال', 'ساماندهی'].map((gateway) => (
              <span
                key={gateway}
                className="rounded-lg border border-white/[0.12] bg-white/[0.03] px-2.5 py-1 text-[10px] text-[#c9d4ef]"
              >
                {gateway}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default FooterComponent;