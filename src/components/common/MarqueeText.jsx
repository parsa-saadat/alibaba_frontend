import React, { useEffect, useRef, useState } from 'react';

/*
 * متنی که اگر از عرض ظرف بزرگ‌تر باشد، آرام به چپ و راست حرکت می‌کند.
 * روی هاور متوقف می‌شود تا خواندنش راحت باشد.
 * (برای عنوان محصول‌هایی که با truncate بریده می‌شدند)
 */
function MarqueeText({ text, className = '', title }) {
  const wrapRef = useRef(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;

    const measure = () => {
      const inner = el.firstElementChild;
      if (!inner) return setShift(0);
      const distance = inner.getBoundingClientRect().width - el.clientWidth;
      setShift(distance > 2 ? Math.ceil(distance) : 0);
    };

    measure();

    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div
      ref={wrapRef}
      dir="rtl"
      className={`marquee ${shift > 0 ? 'is-overflow' : ''} ${className}`}
      style={
        shift > 0
          ? {
              '--marquee-shift': `${shift}px`,
              '--marquee-duration': `${Math.min(18, Math.max(7, shift / 22))}s`,
            }
          : undefined
      }
      title={title || (shift > 0 ? text : undefined)}
    >
      <span>{text}</span>
    </div>
  );
}

export default MarqueeText;
