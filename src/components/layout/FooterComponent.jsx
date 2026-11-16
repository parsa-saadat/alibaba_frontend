import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatJalaliYear } from '../../utils/helpers/format';
import {
  ArrowLeft,
  ArrowUp,
  BadgeCheck,
  Camera,
  ChevronDown,
  Crosshair,
  Globe,
  CreditCard,
  Headset,
  Mail,
  MapPin,
  Package,
  Phone,
  Ruler,
  Satellite,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Tablet,
  Truck,
} from 'lucide-react';
import BrandLogoComponent from '../common/BrandLogoComponent';
import { fetchCategories } from '../../utils/helpers/categories';
import { getId } from '../../utils/helpers/response';

/* ------------------------------------------------------------------ */
/* داده‌های ثابت                                                       */
/* ------------------------------------------------------------------ */

const CATEGORY_ICONS = [Satellite, Crosshair, Camera, Tablet, Ruler, Package];

const FALLBACK_CATEGORIES = [
  'جی‌پی‌اس ایستگاهی (RTK)',
  'دوربین نقشه‌برداری',
  'توتال استیشن',
  'کنترولر و دیتالاگر',
  'متر و اسکنر لیزری',
  'لوازم جانبی نقشه‌برداری',
];

const LINK_COLUMNS = [
  {
    title: 'خرید و سفارش',
    items: [
      { label: 'همه محصولات', to: '/products' },
      { label: 'تخفیف‌های فعال', to: '/products?discount=true' },
      { label: 'سبد خرید', to: '/cart' },
      { label: 'لیست علاقه‌مندی', to: '/favorites' },
      { label: 'مقایسه محصولات', to: '/compare' },
      { label: 'پیگیری سفارش‌ها', to: '/orders' },
    ],
  },
  {
    title: 'فروش در ژئو کالا',
    items: [
      { label: 'شروع فروش', to: '/seller' },
      { label: 'پنل فروشنده', to: '/seller' },
      { label: 'پلن‌ها و تعرفه', to: '/seller/plans' },
      { label: 'راهنمای فروش', to: '/guide/selling' },
      { label: 'قوانین فروشندگان', to: '/terms/sellers' },
    ],
  },
  {
    title: 'راهنما و پشتیبانی',
    items: [
      { label: 'تماس با ما', to: '/contact' },
      { label: 'درباره ژئو کالا', to: '/about' },
      { label: 'راهنمای خرید', to: '/guide/buying' },
      { label: 'سوالات متداول', to: '/contact#faq' },
      { label: 'قوانین مشتریان', to: '/terms/customers' },
      { label: 'قوانین خریداران', to: '/terms/buyers' },
      { label: 'حریم خصوصی', to: '/privacy' },
    ],
  },
];

const STATS = [
  { value: '۱۳۸۳', label: 'سال آغاز فعالیت' },
  { value: '۲', label: 'شعبه فعال' },
  { value: '۲۴/۷', label: 'پشتیبانی' },
];

const TRUST_ITEMS = [
  { icon: Truck, title: 'ارسال سریع', desc: 'تحویل ۱ تا ۳ روز کاری' },
  { icon: ShieldCheck, title: 'تضمین اصالت کالا', desc: 'ضمانت بازگشت وجه' },
  { icon: CreditCard, title: 'پرداخت امن', desc: 'درگاه بانکی معتبر' },
  { icon: Headset, title: 'پشتیبانی ۲۴ ساعته', desc: '۷ روز هفته، پاسخگو' },
];

const CONTACTS = [
  { icon: Phone, text: '۰۹۱۲۹۳۲۷۵۱۵ — شعبه تهران', href: 'tel:+989129327515' },
  { icon: Phone, text: '۰۹۱۰۲۴۰۱۰۰۷ — شعبه مازندران', href: 'tel:+989102401007' },
  { icon: Mail, text: 'info@geokala.ir', href: 'mailto:info@geokala.ir' },
  { icon: MapPin, text: 'تهران · مازندران، هچیرود' },
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

  const year = useMemo(() => formatJalaliYear(), []);

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
          className="flex flex-col gap-6 rounded-3xl p-5 sm:p-6 lg:p-8"
          style={{
            background: 'linear-gradient(135deg, var(--primary-color) 0%, #ffb800 100%)',
            color: 'var(--navy)',
          }}
        >
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
                <span className="block text-xs opacity-80">تجهیزات نقشه‌برداری خود را در ژئو کالا بفروشید</span>
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
            <Link to="/" className="inline-flex flex-col items-start gap-2">
              <BrandLogoComponent variant="full" size="md" tone="white" />
              <span className="text-[11px] text-[#8fa0c9]">
                بازارگاه تخصصی تجهیزات نقشه‌برداری
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-xs leading-6 text-[#8fa0c9]">
              ژئو کالا بازارگاه تخصصی تجهیزات نقشه‌برداری است؛ جی‌پی‌اس ایستگاهی، توتال استیشن، دوربین و
              کنترولر، با مشاوره‌ی فنی و ضمانت اصالت کالا. زیرمجموعه‌ی شرکت بازرگانی فناوری سران ماهان آسیا.
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
            © {year} ژئو کالا — تمامی حقوق محفوظ است. زیرمجموعه‌ی شرکت بازرگانی فناوری سران ماهان آسیا
          </p>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-[#8fa0c9]">
            <Link to="/terms/customers" className="transition-colors hover:text-white">
              قوانین مشتریان
            </Link>
            <Link to="/terms/buyers" className="transition-colors hover:text-white">
              قوانین خریداران
            </Link>
            <Link to="/terms/sellers" className="transition-colors hover:text-white">
              قوانین فروشندگان
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-white">حریم خصوصی</Link>
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