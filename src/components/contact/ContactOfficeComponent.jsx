import React, { useState } from 'react';
import {
  Building2,
  Check,
  Clock3,
  Copy,
  MapPin,
  Navigation,
  Phone,
  Warehouse,
} from 'lucide-react';

/*
 * شعبه‌های ژئو کالا.
 * هر شعبه: تماس مستقیم، کپی شماره، و دکمه‌ی «مسیریابی» که نشانی را در نقشه باز می‌کند.
 */

const BRANCHES = [
  {
    id: 'tehran',
    icon: Building2,
    city: 'شعبه تهران',
    tag: 'دفتر مرکزی · فروش و مشاوره',
    person: 'آقای علیزاده',
    phone: '۰۹۱۲۹۳۲۷۵۱۵',
    tel: '+989129327515',
    address: 'تهران',
    note: 'بازدید حضوری با هماهنگی تلفنی قبلی',
    mapQuery: 'تهران',
    accent: 'rgba(255,214,10,0.16)',
  },
  {
    id: 'mazandaran',
    icon: Warehouse,
    city: 'شعبه مازندران',
    tag: 'انبار و دفتر فروش شرق مازندران',
    person: 'آقای علیزاده',
    phone: '۰۹۱۰۲۴۰۱۰۰۷',
    tel: '+989102401007',
    address: 'مازندران، هچیرود',
    note: 'تحویل حضوری و هماهنگی ارسال',
    mapQuery: 'هچیرود، مازندران',
    accent: 'rgba(23,153,79,0.16)',
  },
];

const mapUrl = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const HOURS = [
  { day: 'شنبه تا چهارشنبه', time: '۹:۰۰ – ۱۸:۰۰' },
  { day: 'پنجشنبه', time: '۹:۰۰ – ۱۴:۰۰' },
  { day: 'جمعه', time: 'تعطیل (فرم سایت فعال)' },
];

function BranchCard({ branch }) {
  const Icon = branch.icon;
  const [copied, setCopied] = useState(false);

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(branch.tel.replace('+98', '0'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="card flex flex-col overflow-hidden rounded-3xl">
      {/* سربرگ شعبه */}
      <div
        className="relative px-4 py-4"
        style={{
          background: `radial-gradient(circle at 15% 0%, ${branch.accent} 0%, transparent 60%), linear-gradient(135deg, var(--navy-mid), var(--navy-deep))`,
        }}
      >
        {/* شبکه‌ی نقشه */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
          }}
        />
        <div className="relative flex items-start gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
            style={{ background: 'var(--primary-color)', color: 'var(--navy)' }}
          >
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <b className="block text-sm font-black text-white">{branch.city}</b>
            <span className="mt-0.5 block text-[10px] leading-5 text-white/65">{branch.tag}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-2 text-xs leading-6">
          <MapPin size={14} className="mt-1 shrink-0 text-yellow" />
          <div className="min-w-0">
            <b className="block">{branch.address}</b>
            <span className="muted">{branch.note}</span>
          </div>
        </div>

        <div
          className="flex items-center justify-between gap-2 rounded-xl px-3 py-2"
          style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
        >
          <div className="min-w-0">
            <span className="block text-[10px] muted">تماس مستقیم · {branch.person}</span>
            <a href={`tel:${branch.tel}`} className="font-black text-sm hover-yellow" dir="ltr">
              {branch.phone}
            </a>
          </div>
          <button
            type="button"
            onClick={copyPhone}
            className="btn-ghost !p-2 shrink-0"
            aria-label="کپی شماره"
            title="کپی شماره"
          >
            {copied ? <Check size={14} style={{ color: '#17994f' }} /> : <Copy size={14} />}
          </button>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <a
            href={`tel:${branch.tel}`}
            className="btn-yellow inline-flex items-center justify-center gap-1.5 !py-2 text-[11px]"
          >
            <Phone size={13} />
            تماس
          </a>
          <a
            href={mapUrl(branch.mapQuery)}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-ghost inline-flex items-center justify-center gap-1.5 !py-2 text-[11px]"
          >
            <Navigation size={13} />
            مسیریابی
          </a>
        </div>
      </div>
    </article>
  );
}

function ContactOfficeComponent() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* شعبه‌ها */}
      <div className="card rounded-3xl p-4 sm:p-5 lg:col-span-2">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <b className="text-sm font-black">شعبه‌های ما</b>
            <span className="ms-2 text-[11px] muted">تهران · مازندران (هچیرود)</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] muted">
            <MapPin size={12} />
            برای هر شعبه دکمه‌ی مسیریابی فعال است
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {BRANCHES.map((branch) => (
            <BranchCard key={branch.id} branch={branch} />
          ))}
        </div>

        <p className="mt-3 text-[11px] leading-6 muted">
          برای بازدید حضوری یا تحویل دستگاه، قبل از مراجعه تماس بگیرید تا هماهنگی انجام شود.
        </p>
      </div>

      {/* ساعات کاری */}
      <div className="card rounded-3xl p-5">
        <b className="flex items-center gap-2 text-sm font-black">
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
        <p className="mt-2 text-[11px] leading-5 muted">
          پاسخ‌دهی به ایمیل‌ها و فرم سایت در روزهای کاری: کمتر از ۲۴ ساعت.
        </p>
      </div>
    </div>
  );
}

export default ContactOfficeComponent;
