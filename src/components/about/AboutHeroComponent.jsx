import React from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, ChevronLeft, Headset, ShieldCheck, Sparkles, Truck } from 'lucide-react';

// سه مزیت کوتاه زیر هدر صفحه
const HERO_HIGHLIGHTS = [
  { icon: ShieldCheck, label: 'فروشندگان احراز هویت‌شده' },
  { icon: Truck, label: 'ارسال به سراسر کشور' },
  { icon: Headset, label: 'پشتیبانی ۷ روز هفته' },
];

function AboutHeroComponent() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 12% 18%, rgba(255,214,10,0.16), transparent 45%), linear-gradient(135deg, var(--navy-mid), var(--navy-deep))',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 pt-6 pb-20">
        {/* مسیر */}
        <nav className="flex items-center gap-1.5 text-[11px] text-white/60">
          <Link to="/" className="hover:text-white transition-colors">
            خانه
          </Link>
          <ChevronLeft size={12} />
          <span className="text-white/90">درباره ما</span>
        </nav>

        <div className="mt-7 max-w-2xl">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full px-3 py-1"
            style={{ background: 'rgba(255,214,10,0.14)', color: 'var(--primary-color)' }}
          >
            <Sparkles size={12} />
            درباره علی‌بازار
          </span>

          <h1 className="font-black text-2xl sm:text-4xl text-white mt-3 leading-tight">
            بازار آنلاین کسب‌وکارهای ایرانی
          </h1>

          <p className="text-xs sm:text-sm text-white/70 leading-7 mt-3">
            علی‌بازار جایی است که تولیدکننده، عمده‌فروش و خریدار ایرانی بدون واسطه به هم می‌رسند؛
            بدون واردات و صادرات، با تمرکز روی کالای ساخت ایران، قیمت شفاف و ضمانت واقعی.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Link to="/products" className="btn-yellow inline-flex items-center gap-2">
              شروع خرید
              <ChevronLeft size={16} />
            </Link>
            <Link
              to="/seller"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              فروش در علی‌بازار
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6">
            {HERO_HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-white/70">
                  <Icon size={14} style={{ color: 'var(--primary-color)' }} />
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* نشان اعتماد گوشه‌ی بنر */}
      <span
        className="hidden lg:flex absolute left-10 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full items-center justify-center text-center"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,214,10,0.35)' }}
      >
        <span>
          <BadgeCheck size={30} className="mx-auto" style={{ color: 'var(--primary-color)' }} />
          <b className="block text-[11px] text-white mt-2 leading-5">
            بازار مورد اعتماد
            <br />
            کسب‌وکارهای ایرانی
          </b>
        </span>
      </span>
    </section>
  );
}

export default AboutHeroComponent;
