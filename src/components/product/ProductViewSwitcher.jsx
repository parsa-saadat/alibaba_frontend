import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { LayoutGrid, Rows2, GalleryVertical } from 'lucide-react';

/*
 * انتخابگر حالت نمایش محصولات:
 *  - double          → شبکه‌ی ریسپانسیو (دسکتاپ ۴ ستون، گوشی ۲)
 *  - single          → تکی افقی (یک محصول در هر ردیف)
 *  - single-vertical → تکی عمودی — فقط در موبایل (با lg:hidden در دسکتاپ مخفی می‌شود)
 * در دسکتاپ فقط آیکن‌ها (متن با lg:hidden مخفی)، در موبایل آیکن + متن.
 * همه‌چیز با CSS media query کنترل می‌شود تا وابسته به JS نباشد.
 */
const MODES = [
  {
    value: 'double',
    label: translateText('دوتایی'),
    icon: LayoutGrid,
    title: translateText('نمایش شبکه‌ای'),
  },
  {
    value: 'single',
    label: translateText('تکی'),
    icon: Rows2,
    title: translateText('نمایش تکی افقی'),
  },
  {
    value: 'single-vertical',
    label: translateText('تکی عمودی'),
    icon: GalleryVertical,
    title: translateText('نمایش تکی عمودی'),
    mobileOnly: true,
  },
];

function ProductViewSwitcher({ value, onChange, className = '' }) {
  return (
    <div
      role="radiogroup"
      aria-label={translateText('حالت نمایش محصولات')}
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-xl border border-theme p-0.5 ${className}`}
      style={{ background: 'var(--card2)' }}
    >
      {MODES.map((mode) => {
        const active = value === mode.value;
        const Icon = mode.icon;
        return (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={mode.title}
            title={mode.title}
            onClick={() => !active && onChange(mode.value)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all duration-200 ${
              mode.mobileOnly ? 'lg:hidden' : ''
            } ${active ? 'shadow-md' : 'muted hover:opacity-80'}`}
            style={active ? { background: 'var(--primary-color)', color: 'var(--on-primary' } : undefined}
          >
            <Icon size={14} />
            {/* در دسکتاپ فقط آیکن — متن فقط در موبایل */}
            <span className="lg:hidden">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ProductViewSwitcher;
