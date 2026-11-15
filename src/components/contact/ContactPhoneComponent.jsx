import React from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { Clock3, Copy, Handshake, Headset, Mail, PackageSearch } from 'lucide-react';

// راه‌های ارتباطی — هر کارت یک کانال ارتباطی است
const CHANNELS = [
  {
    icon: Headset,
    title: 'مشاوره‌ی فنی خرید',
    value: 'انتخاب دستگاه و استعلام قیمت',
    hint: 'راهنمایی برای انتخاب مدل مناسب پروژه',
    action: 'درخواست مشاوره',
    anchor: '#contact-form',
  },
  {
    icon: PackageSearch,
    title: 'پیگیری سفارش',
    value: 'با کد سفارش، در بخش سفارش‌های من',
    hint: 'وضعیت پردازش و ارسال، لحظه‌ای',
    action: 'پیگیری سفارش',
    to: '/orders',
  },
  {
    icon: Mail,
    title: 'ایمیل',
    value: 'info@geokala.ir',
    copy: 'info@geokala.ir',
    href: 'mailto:info@geokala.ir',
    hint: 'پاسخ‌دهی حداکثر تا ۲۴ ساعت کاری',
    action: 'ارسال ایمیل',
  },
  {
    icon: Handshake,
    title: 'همکاری و نمایندگی',
    value: 'partner@geokala.ir',
    copy: 'partner@geokala.ir',
    href: 'mailto:partner@geokala.ir',
    hint: 'فروشندگان، نمایندگان و تأمین‌کنندگان',
    action: 'ارسال درخواست',
  },
];

function ContactPhoneComponent() {
  // کپی مقدار کارت در کلیپ‌بورد
  const copyValue = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('در حافظه کپی شد');
    } catch {
      toast.error('امکان کپی خودکار نیست، مقدار را دستی انتخاب کنید.');
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CHANNELS.map((channel) => {
        const Icon = channel.icon;
        return (
          <div
            key={channel.title}
            className="card rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className="w-11 h-11 rounded-xl grid place-items-center shrink-0"
                style={{ background: 'rgba(255,214,10,0.14)', color: 'var(--primary-color)' }}
              >
                <Icon size={21} />
              </span>
              {channel.copy ? (
                <button
                  type="button"
                  onClick={() => copyValue(channel.copy)}
                  className="muted hover-yellow transition-colors"
                  aria-label="کپی"
                  title="کپی"
                >
                  <Copy size={15} />
                </button>
              ) : null}
            </div>

            <b className="block mt-3 text-sm font-black">{channel.title}</b>
            <div className="text-sm mt-1 leading-6 break-words" dir="auto">
              {channel.href ? (
                <a href={channel.href} className="hover-yellow transition-colors">
                  {channel.value}
                </a>
              ) : (
                channel.value
              )}
            </div>
            <span className="flex items-center gap-1 text-[11px] muted mt-1 leading-5">
              <Clock3 size={12} />
              {channel.hint}
            </span>

            {channel.href ? (
              <a href={channel.href} className="inline-block mt-3 text-xs font-bold text-yellow">
                {channel.action}
              </a>
            ) : channel.to ? (
              <Link to={channel.to} className="mt-3 inline-block text-xs font-bold text-yellow">
                {channel.action}
              </Link>
            ) : (
              <a href={channel.anchor} className="mt-3 inline-block text-xs font-bold text-yellow">
                {channel.action}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ContactPhoneComponent;
