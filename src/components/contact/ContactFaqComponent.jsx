import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { toFa } from '../../utils/helpers/format';

// پرسش‌های متداول صفحه تماس
const FAQS = [
  {
    q: 'سفارش من چه زمانی ارسال می‌شود؟',
    a: 'سفارش‌های ثبت‌شده تا ساعت ۱۴ در همان روز کاری و سفارش‌های بعد از آن، در اولین روز کاری بعد پردازش و تحویل پست یا پیک می‌شوند. زمان تحویل بین ۱ تا ۳ روز کاری است.',
  },
  {
    q: 'دستگاه‌ها اصل هستند و گارانتی دارند؟',
    a: 'بله. تجهیزات از مسیر واردات رسمی شرکت بازرگانی فناوری سران ماهان آسیا تأمین می‌شوند؛ سریال و مدارک گارانتی همراه کالا ارائه می‌شود و اصالت کالا در فاکتور قید می‌گردد.',
  },
  {
    q: 'در انتخاب دستگاه مشاوره می‌دهید؟',
    a: 'بله. کارشناس فنی ما بر اساس نوع پروژه (نقشه‌برداری ثبتی، راه و شهرسازی، معدن، کشاورزی دقیق) مدل مناسب را پیشنهاد می‌دهد. کافی است با شعبه تهران یا مازندران تماس بگیرید یا فرم همین صفحه را پر کنید.',
  },
  {
    q: 'شرایط مرجوعی کالا چیست؟',
    a: 'تا ۷ روز پس از تحویل، در صورت باز نشدن پلمب و سالم بودن بسته‌بندی، امکان ثبت درخواست مرجوعی وجود دارد. برای کالاهای معیوب، هزینه ارسال برگشت با فروشنده است.',
  },
  {
    q: 'پرداخت‌ها چگونه انجام می‌شود؟',
    a: 'همه پرداخت‌ها از طریق درگاه بانکی معتبر و با پروتکل امن انجام می‌شود. اطلاعات کارت شما ذخیره نمی‌شود و سفارش تا لحظه‌ی تحویل قابل پیگیری است.',
  },
  {
    q: 'آیا امکان خرید عمده و صدور پیش‌فاکتور وجود دارد؟',
    a: 'بله. برای خرید چنددستگاهی یا خرید پروژه‌ای، از دکمه «درخواست پیش‌فاکتور» در صفحه محصول استفاده کنید یا با تیم فروش به نشانی sales@geokala.ir در تماس باشید.',
  },
];

/*
 * آکاردئون پرسش‌های متداول
 * ------------------------
 * - باز/بسته شدن نرم: همه‌ی پاسخ‌ها همیشه در DOM هستند و فقط ارتفاعشان با
 *   `grid-template-rows: 0fr → 1fr` (به‌همراه `overflow: hidden` داخلی) باز و
 *   بسته می‌شود؛ پس انیمیشن بدون اندازه‌گیری جاوااسکریپتی نرم اجرا می‌شود.
 * - رنگ‌ها فقط از متغیرهای تم (`--card`, `--card2`, `--border`, `--text`,
 *   `--muted`, `--primary-color`, `--accent-text`) می‌آیند تا در تم روشن و
 *   تاریک خوانا و هم‌شکل باشند (قبلاً متن زرد روی زمینه‌ی روشن دیده نمی‌شد).
 */
function ContactFaqComponent() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div id="faq" className="card rounded-3xl p-4 sm:p-6 scroll-mt-24">
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
          style={{
            background: 'color-mix(in srgb, var(--primary-color) 16%, transparent)',
            color: 'var(--accent-text)',
          }}
          aria-hidden="true"
        >
          <HelpCircle size={19} />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-black leading-tight">پرسش‌های متداول</h2>
          <p className="mt-0.5 text-[11px] muted">شاید پاسخ شما همین‌جا باشد</p>
        </div>
      </div>

      <div className="space-y-2">
        {FAQS.map((item, index) => {
          const open = openIndex === index;
          const panelId = `faq-panel-${index}`;
          const buttonId = `faq-button-${index}`;

          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-2xl transition-colors duration-300"
              style={{
                border: '1px solid var(--border)',
                background: open ? 'var(--card2)' : 'transparent',
              }}
            >
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? -1 : index)}
                className="flex w-full items-start justify-between gap-3 px-3.5 py-3 text-start transition-colors duration-200 hover:bg-[var(--card2)]"
              >
                <span className="flex min-w-0 items-start gap-2.5">
                  <span
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black transition-colors duration-300"
                    style={
                      open
                        ? { background: 'var(--primary-color)', color: 'var(--navy)' }
                        : { background: 'var(--card)', color: 'var(--muted)' }
                    }
                  >
                    {toFa(index + 1)}
                  </span>
                  <span
                    className="text-sm leading-6"
                    style={{ fontWeight: open ? 900 : 700, color: 'var(--text)' }}
                  >
                    {item.q}
                  </span>
                </span>

                <ChevronDown
                  size={17}
                  aria-hidden="true"
                  className="mt-1 shrink-0 transition-transform duration-300 ease-out"
                  style={{
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    color: open ? 'var(--accent-text)' : 'var(--muted)',
                  }}
                />
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <p
                    className="px-3.5 pb-3.5 text-xs leading-6"
                    style={{ color: 'var(--muted)', paddingInlineStart: '3.1rem' }}
                  >
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ContactFaqComponent;
