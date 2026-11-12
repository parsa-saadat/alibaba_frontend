import React from 'react';
import { Clock3, ExternalLink, MapPin, Navigation } from 'lucide-react';

// ساعات پاسخ‌دهی
const HOURS = [
  { day: 'شنبه تا چهارشنبه', time: '۹:۰۰ – ۱۸:۰۰' },
  { day: 'پنجشنبه', time: '۹:۰۰ – ۱۴:۰۰' },
  { day: 'جمعه', time: 'تعطیل (چت آنلاین فعال)' },
];

function ContactOfficeComponent() {
  return (
    <div className="flex flex-col gap-4">
      {/* نقشه / موقعیت دفتر */}
      <div className="card rounded-3xl overflow-hidden">
        <div
          className="relative h-44 sm:h-52"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, rgba(255,214,10,0.18), transparent 55%), linear-gradient(135deg, var(--navy-mid), var(--navy-deep))',
          }}
        >
          {/* خطوط نقشه */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '38px 38px',
            }}
          />
          {/* خیابان‌های شاخص */}
          <div className="absolute left-0 right-0" style={{ top: '58%', height: 10, background: 'rgba(255,255,255,0.10)' }} />
          <div className="absolute top-0 bottom-0" style={{ left: '34%', width: 8, background: 'rgba(255,255,255,0.08)' }} />

          {/* نشان موقعیت */}
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <span
                className="w-12 h-12 rounded-full grid place-items-center mx-auto shadow-lg"
                style={{ background: 'var(--primary-color)', color: 'var(--navy)' }}
              >
                <MapPin size={22} />
              </span>
              <b className="block text-xs mt-2 text-white">دفتر مرکزی علی‌بازار</b>
              <span className="text-[10px] text-white/60">تهران، خیابان ولیعصر</span>
            </div>
          </div>

          <a
            href="https://maps.google.com/?q=Tehran+Valiasr"
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[11px] font-bold rounded-lg px-2.5 py-1.5"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', backdropFilter: 'blur(4px)' }}
          >
            مسیریابی
            <ExternalLink size={12} />
          </a>
        </div>

        <div className="p-5">
          <b className="text-sm font-black flex items-center gap-2">
            <Navigation size={15} className="text-yellow" />
            نشانی دفتر
          </b>
          <p className="text-xs muted leading-6 mt-1.5">
            تهران، خیابان ولیعصر، بالاتر از پارک‌وی، برج تجارت الکترونیک، طبقه ۹، واحد ۹۰۴
          </p>
          <p className="text-[11px] muted mt-1">کد پستی: ۱۹۶۸۷۴۳۱۱۲</p>
        </div>
      </div>

      {/* ساعات کاری */}
      <div className="card rounded-3xl p-5">
        <b className="text-sm font-black flex items-center gap-2">
          <Clock3 size={15} className="text-yellow" />
          ساعات پاسخ‌دهی
        </b>
        <div className="mt-2">
          {HOURS.map((row, index) => (
            <div
              key={row.day}
              className="flex items-center justify-between gap-2 py-2 text-xs"
              style={{ borderTop: index === 0 ? 'none' : '1px solid var(--border)' }}
            >
              <span className="muted">{row.day}</span>
              <span className="font-bold" dir="ltr">
                {row.time}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] muted leading-5 mt-2">
          میانگین زمان پاسخ‌دهی به ایمیل‌ها در روزهای کاری: کمتر از ۲۴ ساعت.
        </p>
      </div>
    </div>
  );
}

export default ContactOfficeComponent;
