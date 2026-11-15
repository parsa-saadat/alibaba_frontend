import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Headset, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { toFa } from '../../utils/helpers/format';

// مسیر رشد ژئو کالا (بدون برچسب گام/تاریخ؛ فقط شماره‌ی مرحله)
const MILESTONES = [
  { title: 'نقشه‌برداری', desc: 'آغاز فعالیت مجموعه در حوزه‌ی نقشه‌برداری و تجهیزات نقشه‌برداری.' },
  { title: 'واردات تجهیزات نقشه‌برداری', desc: 'انتقال خدمات به «فناوری سران ماهان آسیا» و گسترش ساختار واردات و پشتیبانی فنی.' },
  { title: 'فروش تجهیزات نقشه‌برداری', desc: 'راه‌اندازی پارسی‌ژئو برای عرضه‌ی جی‌پی‌اس ایستگاهی و تجهیزات نقشه‌برداری.' },
  { title: 'تاسیس سایت ژئوکالا', desc: 'راه‌اندازی بازارگاه تخصصی ژئو کالا برای دیدن، مقایسه و خرید تجهیزات، با پشتیبانی همان تیم فنی.' },
];

// سه معیار تصمیم‌گیری در محصول
const PILLARS = [
  { icon: ShieldCheck, label: 'کالای اصل و ضمانت‌دار' },
  { icon: TrendingUp, label: 'مشخصات فنی قابل مقایسه' },
  { icon: Headset, label: 'مشاوره و پشتیبانی تخصصی' },
];

function AboutTimelineComponent() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <span className="text-[11px] font-bold text-yellow">مسیر ما</span>
          <h2 className="font-black text-xl sm:text-2xl mt-1.5">مسیری که از ۱۳۸۳ تا امروز آمده‌ایم</h2>
        </div>
        <p className="text-xs muted max-w-md leading-6">
          از واردات تجهیزات نقشه‌برداری تا راه‌اندازی بازارگاهی تخصصی برای خریداران و فروشندگان این حوزه.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* خط زمانی */}
        <div className="lg:col-span-2 card rounded-3xl p-6 sm:p-8">
          {MILESTONES.map((item, index) => {
            const last = index === MILESTONES.length - 1;
            return (
              <div key={item.title} className="flex gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-lg text-[11px] font-black tabular-nums"
                    style={{ background: 'rgba(255,214,10,0.14)', color: 'var(--primary-color)' }}
                  >
                    {toFa(index + 1)}
                  </span>
                  {!last ? (
                    <span className="flex-1 w-px my-1.5" style={{ background: 'var(--border)' }} />
                  ) : null}
                </div>

                <div className={last ? 'pb-0' : 'pb-5'}>
                  <b className="text-sm font-black block">{item.title}</b>
                  <p className="text-xs muted leading-6 mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* امروز */}
        <div
          className="rounded-3xl p-6 sm:p-7 text-white flex flex-col justify-between"
          style={{
            background:
              'radial-gradient(circle at 80% 15%, rgba(255,214,10,0.18) 0%, rgba(255,214,10,0) 50%), linear-gradient(150deg, var(--navy-soft), var(--navy-deep))',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div>
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full px-3 py-1"
              style={{ background: 'rgba(255,214,10,0.14)', color: 'var(--primary-color)' }}
            >
              <Sparkles size={12} />
              امروز
            </span>
            <b className="block font-black text-lg mt-3 leading-tight">
              تخصص فنی، پشت هر سفارش این بازارگاه است
            </b>
            <p className="text-[11px] text-white/70 leading-6 mt-2">
              تمرکز ما روی سه چیز است: کالای اصل و ضمانت‌دار، مشخصات فنی قابل مقایسه و مشاوره‌ی
              تخصصی. هر قابلیت جدید با همین سه معیار سنجیده می‌شود.
            </p>

            <ul className="mt-4 space-y-2">
              {PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <li key={pillar.label} className="flex items-center gap-2 text-[11px] text-white/80">
                    <span
                      className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--primary-color)' }}
                    >
                      <Icon size={13} />
                    </span>
                    {pillar.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-xs font-bold mt-5"
            style={{ color: 'var(--primary-color)' }}
          >
            دیدن تجهیزات نقشه‌برداری
            <ChevronLeft size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default AboutTimelineComponent;
