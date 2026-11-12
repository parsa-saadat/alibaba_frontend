import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Headset, Store } from 'lucide-react';

function AboutCtaComponent() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 pb-4">
      <div
        className="rounded-3xl p-6 sm:p-9 flex flex-col md:flex-row items-center justify-between gap-6"
        style={{
          background:
            'radial-gradient(circle at 85% 20%, rgba(255,214,10,0.18), transparent 45%), linear-gradient(135deg, var(--navy-mid), var(--navy-deep))',
          border: '1px solid rgba(255,214,10,0.28)',
        }}
      >
        <div className="max-w-xl">
          <h2 className="font-black text-lg sm:text-2xl text-white leading-tight">
            علی‌بازار برای رشد کسب‌وکار شماست
          </h2>
          <p className="text-xs sm:text-sm text-white/70 leading-7 mt-2">
            اگر تولیدکننده یا عمده‌فروش هستی، فروشگاهت را بساز و به خریداران سراسر کشور دسترسی پیدا
            کن. اگر خریدار هستی، از بین فروشندگان معتبر قیمت بگیر و مطمئن خرید کن.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link to="/seller" className="btn-yellow inline-flex items-center gap-2">
            <Store size={16} />
            فروشنده شوید
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }}
          >
            <Headset size={16} />
            گفتگو با ما
            <ChevronLeft size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default AboutCtaComponent;
