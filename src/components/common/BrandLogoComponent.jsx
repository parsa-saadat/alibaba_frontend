import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';

/*
 * نشان ژئوکالا.
 *
 * دو حالت:
 *  - variant="mark": فقط نشان (پین + دوربین)؛ جای آیکون‌های کوچک، فوتر پنل‌ها و فاوآیکون.
 *  - variant="full": لوگوتایپ کامل «GeoCala» + نشان؛ جای هدر، منوی موبایل و فوتر.
 *
 * فایل‌ها در `public/` هستند و دو نسخه دارند: روشن برای تم تاریک و سرمه‌ای برای تم روشن
 * (کلاس‌های `brand-on-dark` / `brand-on-light` در index.css مهمان‌دار این کارند).
 * برای عوض کردن لوگو کافی است همان چهار فایل PNG را جای‌گذاری کنید.
 */

const MARK_SIZES = {
  xs: 'h-7 w-7',
  sm: 'h-9 w-9 sm:h-10 sm:w-10',
  md: 'h-11 w-11',
  lg: 'h-12 w-12 sm:h-14 sm:w-14',
};

/* لوگوتایپ در هدر بزرگ‌تر دیده می‌شود (شعار زیر آن حذف شده است) */
const FULL_SIZES = {
  xs: 'h-6',
  sm: 'h-9 sm:h-10',
  md: 'h-11 lg:h-12',
  lg: 'h-12 sm:h-14',
};

function DualImage({ dark, light, alt, className, heightClass, width, height }) {
  return (
    <span className={`inline-flex shrink-0 items-center ${heightClass}`}>
      <img
        src={dark}
        alt={alt}
        draggable="false"
        width={width}
        height={height}
        className={`brand-on-dark h-full w-auto max-w-none object-contain ${className}`}
      />
      <img
        src={light}
        alt=""
        aria-hidden="true"
        draggable="false"
        width={width}
        height={height}
        className={`brand-on-light h-full w-auto max-w-none object-contain ${className}`}
      />
    </span>
  );
}

function BrandLogoComponent({
  variant = 'mark',
  size = 'sm',
  tone = 'auto',
  className = '',
  alt = translateText("ژئوکالا"),
}) {
  const darkSrc = variant === 'full' ? '/logo.png' : '/logo-mark.png';
  const lightSrc = variant === 'full' ? '/logo-on-light.png' : '/logo-mark-on-light.png';
  const heightClass =
    variant === 'full'
      ? FULL_SIZES[size] || FULL_SIZES.sm
      : MARK_SIZES[size] || MARK_SIZES.sm;

  /* سطح‌های همیشه تیره (هدر، فوتر، پنل‌ها) → همیشه نسخه‌ی سفید */
  if (tone === 'white') {
    return (
      <img
        src={darkSrc}
        alt={alt}
        draggable="false"
        width={variant === 'full' ? 1549 : 512}
        height={variant === 'full' ? 403 : 512}
        className={`w-auto max-w-none object-contain ${heightClass} ${className}`}
      />
    );
  }

  if (variant === 'full') {
    return (
      <DualImage
        dark={darkSrc}
        light={lightSrc}
        alt={alt}
        heightClass={heightClass}
        width={1549}
        height={403}
        className={className}
      />
    );
  }

  return (
    <DualImage
      dark={darkSrc}
      light={lightSrc}
      alt={alt}
      heightClass={heightClass}
      width={512}
      height={512}
      className={`drop-shadow-sm ${className}`}
    />
  );
}

export default BrandLogoComponent;
