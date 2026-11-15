import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, Flag, Target, Users } from 'lucide-react';

// سه تعهد اصلی برند
const COMMITMENTS = [
  'کالای اصل با گارانتی و مدارک رسمی',
  'قیمت شفاف و امکان مقایسه‌ی مشخصات فنی',
  'مشاوره و پشتیبانی فنی، حتی بعد از تحویل سفارش',
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
          از «سران آسیا» تا ژئو کالا
        </h2>

        <p className="text-sm muted leading-8 mt-4">
          شرکت بازرگانی فناوری سران ماهان آسیا فعالیت خود را در سال ۱۳۸۳ با نام «سران آسیا» آغاز
          کرد و خدمات خود را به شرکت «فناوری سران ماهان آسیا» منتقل نمود. این شرکت در زمینه‌ی
          واردات و تجارت تجهیزات نقشه‌برداری فعالیت می‌کند و محصولات آن از طریق{' '}
          <a
            href="https://parsigeo.ir/shop/"
            target="_blank"
            rel="noreferrer"
            className="font-bold hover-yellow transition-colors"
            style={{ color: 'var(--primary-color)' }}
          >
            پارسی‌ژئو
          </a>{' '}
          قابل مشاهده و خریداری است.
        </p>
        <p className="text-sm muted leading-8 mt-3">
          ژئو کالا بازارگاه تخصصی همین مجموعه در حوزه‌ی تجهیزات نقشه‌برداری است. تجربه‌ی سال‌ها
          واردات و پشتیبانی فنی را به یک بستر آنلاین آورده‌ایم تا مهندس نقشه‌بردار، پیمانکار و
          کارگاه عمرانی بتواند مدل‌ها و برندها را یک‌جا ببیند، مشخصات فنی را مقایسه کند و با
          اطمینان خرید کند.
        </p>

        <ul className="mt-5 space-y-2">
          {COMMITMENTS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs sm:text-sm leading-6">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-yellow" />
              {item}
            </li>
          ))}
        </ul>

        <div
          className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl px-3 py-2 text-[11px]"
          style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
        >
          <span className="muted">بنیان‌گذار مجموعه:</span>
          <b className="font-black">جواد علیزاده</b>
          <span className="muted">· از سال ۱۳۸۳ در حوزه‌ی تجهیزات نقشه‌برداری</span>
        </div>

        <Link
          to="/contact"
          className="inline-flex items-center gap-1 text-xs font-bold text-yellow mt-4"
        >
          گفتگو با تیم ژئو کالا
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
            رساندن تجهیزات نقشه‌برداری درست و اصل به دست متخصص ایرانی، با قیمت شفاف و مشاوره‌ی
            فنی واقعی؛ همان کاری که از سال ۱۳۸۳ انجام می‌دهیم.
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
            تبدیل‌شدن به مرجع اول خرید تجهیزات نقشه‌برداری در ایران؛ جایی که هر نقشه‌بردار،
            پیش از خرید، همه‌ی گزینه‌ها و مشخصات فنی را کنار هم ببیند.
          </p>
        </div>
      </div>
    </section>
  );
}

export default AboutStoryComponent;
