import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

// پرسش‌های متداول صفحه تماس
const FAQS = [
  {
    q: 'سفارش من چه زمانی ارسال می‌شود؟',
    a: 'سفارش‌های ثبت‌شده تا ساعت ۱۴ در همان روز کاری و سفارش‌های بعد از آن، در اولین روز کاری بعد پردازش و تحویل پست یا پیک می‌شوند. زمان تحویل بین ۱ تا ۳ روز کاری است.',
  },
  {
    q: 'چطور فروشنده شوم؟',
    a: 'از منوی حساب کاربری وارد بخش «پنل فروشندگی» شوید، اطلاعات فروشگاه و مدارک را تکمیل کنید. بررسی درخواست حداکثر ۲ روز کاری زمان می‌برد و نتیجه از طریق ایمیل و پیامک اعلام می‌شود.',
  },
  {
    q: 'شرایط مرجوعی کالا چیست؟',
    a: 'تا ۷ روز پس از تحویل، در صورت باز نشدن پلمب و سالم بودن بسته‌بندی، امکان ثبت درخواست مرجوعی وجود دارد. برای کالاهای معیوب، هزینه ارسال برگشت با فروشنده است.',
  },
  {
    q: 'پرداخت‌ها چگونه انجام می‌شود؟',
    a: 'همه پرداخت‌ها از طریق درگاه بانکی معتبر و با پروتکل امن انجام می‌شود. مبلغ سفارش تا تأیید تحویل نزد علی‌بازار نگه داشته و سپس به فروشنده پرداخت می‌شود.',
  },
  {
    q: 'آیا امکان خرید عمده و صدور پیش‌فاکتور وجود دارد؟',
    a: 'بله. برای سفارش‌های عمده، از دکمه «درخواست پیش‌فاکتور» در صفحه محصول استفاده کنید یا مستقیم با تیم فروش از طریق partner@alibazar.ir در تماس باشید.',
  },
];

function ContactFaqComponent() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div id="faq" className="card rounded-3xl p-5 sm:p-7">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-9 h-9 rounded-xl grid place-items-center"
          style={{ background: 'rgba(255,214,10,0.14)', color: 'var(--primary-color)' }}
        >
          <HelpCircle size={18} />
        </span>
        <div>
          <h2 className="font-black text-lg leading-tight">پرسش‌های متداول</h2>
          <p className="text-[11px] muted">شاید پاسخ شما همین‌جا باشد</p>
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {FAQS.map((item, index) => {
          const open = openIndex === index;
          return (
            <div key={item.q} style={{ borderTop: index === 0 ? 'none' : '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? -1 : index)}
                className="w-full flex items-center justify-between gap-3 py-3.5 text-right"
                aria-expanded={open}
              >
                <span className={`text-sm ${open ? 'font-black' : 'font-bold'}`}>{item.q}</span>
                <ChevronDown
                  size={17}
                  className="shrink-0 muted transition-transform duration-200"
                  style={{ transform: open ? 'rotate(180deg)' : 'none' }}
                />
              </button>
              {open ? (
                <p className="text-xs muted leading-6 pb-4 pe-6">{item.a}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ContactFaqComponent;
