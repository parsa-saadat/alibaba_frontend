import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, ShoppingBag, Store, Truck } from 'lucide-react';

// مسیر خریدار
const BUYER_STEPS = [
  { icon: Search, title: 'کالا را پیدا کن', desc: 'جستجو بین محصولات یا مقایسه‌ی قیمت فروشندگان مختلف.' },
  { icon: ShoppingBag, title: 'سفارش بده', desc: 'سبد خرید را کامل کن و با درگاه امن پرداخت کن.' },
  { icon: Truck, title: 'تحویل بگیر', desc: 'سفارش خودکار بین فروشگاه‌ها تفکیک و ارسال می‌شود.' },
];

// مسیر فروشنده
const SELLER_STEPS = [
  { icon: Store, title: 'درخواست بده', desc: 'ثبت‌نام فروشنده و ارسال مدارک برای تأیید.' },
  { icon: ShoppingBag, title: 'فروشگاه بساز', desc: 'پلن مناسب را انتخاب کن و محصولاتت را ثبت کن.' },
  { icon: Truck, title: 'بفروش و ارسال کن', desc: 'سفارش‌های خودت را آماده کن؛ تسویه خودکار انجام می‌شود.' },
];

function StepRow({ step, index, last }) {
  const Icon = step.icon;
  return (
    <div className="flex gap-3">
      {/* شماره و خط اتصال */}
      <div className="flex flex-col items-center shrink-0">
        <span
          className="w-9 h-9 rounded-xl grid place-items-center text-xs font-black"
          style={{ background: 'rgba(255,214,10,0.14)', color: 'var(--primary-color)' }}
        >
          <Icon size={17} />
        </span>
        {!last ? <span className="flex-1 w-px my-1" style={{ background: 'var(--border)' }} /> : null}
      </div>
      <div className={last ? 'pb-1' : 'pb-5'}>
        <b className="text-sm font-black">
          {index}. {step.title}
        </b>
        <p className="text-xs muted leading-6 mt-0.5">{step.desc}</p>
      </div>
    </div>
  );
}

function AboutHowItWorksComponent() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 pb-10">
      <div className="mb-5">
        <span className="text-[11px] font-bold text-yellow">فرایند کار</span>
        <h2 className="font-black text-xl sm:text-2xl mt-1.5">علی‌بازار چطور کار می‌کند؟</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* خریدار */}
        <div className="card rounded-3xl p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <b className="font-black text-sm">اگر خریدار هستی</b>
            <Link to="/products" className="text-[11px] font-bold text-yellow inline-flex items-center gap-1">
              شروع خرید
              <ChevronLeft size={12} />
            </Link>
          </div>
          {BUYER_STEPS.map((step, index) => (
            <StepRow key={step.title} step={step} index={index + 1} last={index === BUYER_STEPS.length - 1} />
          ))}
        </div>

        {/* فروشنده */}
        <div className="card rounded-3xl p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <b className="font-black text-sm">اگر فروشنده هستی</b>
            <Link to="/seller" className="text-[11px] font-bold text-yellow inline-flex items-center gap-1">
              ثبت‌نام فروشنده
              <ChevronLeft size={12} />
            </Link>
          </div>
          {SELLER_STEPS.map((step, index) => (
            <StepRow key={step.title} step={step} index={index + 1} last={index === SELLER_STEPS.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default AboutHowItWorksComponent;
