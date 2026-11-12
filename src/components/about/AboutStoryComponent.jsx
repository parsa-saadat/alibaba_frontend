import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, Flag, Target, Users } from 'lucide-react';

// سه تعهد اصلی برند
const COMMITMENTS = [
  'کالای ایرانی، بدون واسطه‌های اضافه',
  'قیمت شفاف و قابل مقایسه بین فروشندگان',
  'پاسخ‌گویی واقعی، حتی بعد از تحویل سفارش',
];

function AboutStoryComponent() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 py-10 grid gap-6 lg:grid-cols-3">
      {/* داستان */}
      <div className="lg:col-span-2 card rounded-3xl p-6 sm:p-8">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-yellow">
          <Flag size={13} />
          داستان ما
        </span>
        <h2 className="font-black text-xl sm:text-2xl mt-2 leading-tight">
          از یک ایده‌ی ساده تا بازار کسب‌وکارهای ایرانی
        </h2>

        <p className="text-sm muted leading-8 mt-4">
          علی‌بازار با این باور شروع شد که مشکل اصلی خرید عمده در ایران، «نبودنِ بازار» نیست؛
          «نبودنِ اعتماد» است. فروشنده‌ی واقعی پیدا نمی‌شد، قیمت‌ها مبهم بود و خریدار نمی‌دانست
          کالا اصیل است یا نه. ما یک بازارگاه ساختیم که در آن هر فروشنده احراز هویت می‌شود، هر
          قیمت قابل مقایسه است و هر سفارش تا تحویل پیگیری می‌شود.
        </p>
        <p className="text-sm muted leading-8 mt-3">
          امروز علی‌بازار میزبان فروشندگان کوچک و برندهای ایرانی است؛ از کارگاه‌های خانگی تا
          عمده‌فروشان بزرگ. همه‌ی سفارش‌ها به‌صورت خودکار بین فروشگاه‌ها تفکیک می‌شوند تا هر فروشنده
          دقیقاً همان بخشی را که مسئول آن است، آماده و ارسال کند.
        </p>

        <ul className="mt-5 space-y-2">
          {COMMITMENTS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs sm:text-sm leading-6">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-yellow" />
              {item}
            </li>
          ))}
        </ul>

        <Link
          to="/contact"
          className="inline-flex items-center gap-1 text-xs font-bold text-yellow mt-5"
        >
          گفتگو با تیم علی‌بازار
          <ChevronLeft size={14} />
        </Link>
      </div>

      {/* ماموریت و چشم‌انداز */}
      <div className="flex flex-col gap-4">
        <div
          className="rounded-3xl p-6 text-white"
          style={{
            background: 'linear-gradient(150deg, var(--navy-soft), var(--navy-deep))',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span
            className="w-10 h-10 rounded-xl grid place-items-center"
            style={{ background: 'rgba(255,214,10,0.16)', color: 'var(--primary-color)' }}
          >
            <Target size={18} />
          </span>
          <b className="block font-black text-sm mt-3">ماموریت ما</b>
          <p className="text-[11px] leading-6 text-white/70 mt-1.5">
            کوتاه‌کردن مسیر کالای ایرانی از تولیدکننده تا خریدار؛ با کمترین واسطه و بیشترین شفافیت.
          </p>
        </div>

        <div className="card rounded-3xl p-6 flex-1">
          <span
            className="w-10 h-10 rounded-xl grid place-items-center"
            style={{ background: 'rgba(255,214,10,0.14)', color: 'var(--primary-color)' }}
          >
            <Users size={18} />
          </span>
          <b className="block font-black text-sm mt-3">چشم‌انداز ما</b>
          <p className="text-[11px] muted leading-6 mt-1.5">
            تبدیل‌شدن به مرجع اول خرید عمده‌ی آنلاین در ایران؛ جایی که هر کسب‌وکار کوچک بتواند
            بدون سرمایه‌ی زیاد، وارد بازار شود و رشد کند.
          </p>
        </div>
      </div>
    </section>
  );
}

export default AboutStoryComponent;
