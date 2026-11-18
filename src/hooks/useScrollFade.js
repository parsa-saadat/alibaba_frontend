import { useEffect, useRef, useState } from 'react';

/*
 * useScrollFade
 * -------------
 * برای ردیف‌های اسکرول افقی. سایه‌ی محو لبه‌ها فقط در سمتی نشان داده می‌شود که
 * محتوای پنهان دارد:
 *   - ابتدای ردیف (اسکرول نشده): فقط لبه‌ی انتهایی محو است، روی اولین کارت سایه نمی‌افتد.
 *   - وسط ردیف: هر دو لبه.
 *   - انتهای ردیف: فقط لبه‌ی ابتدایی.
 * جهت RTL/LTR و حالت‌های مختلف scrollLeft مرورگرها در نظر گرفته شده است.
 *
 * خروجی: [ref, hasOverflow, fadeStyle]
 *   fadeStyle = { '--fade-l': '0px|28px', '--fade-r': '0px|28px' } → روی همان المان
 *   همراه با کلاس `scroll-fade-x` گذاشته می‌شود.
 */
const FADE = '28px';
const EDGE = 4;

export default function useScrollFade() {
  const ref = useRef(null);
  const attached = useRef(null);
  const cleanup = useRef(null);
  const [state, setState] = useState({ overflow: false, left: false, right: false });

  /* بدون آرایه‌ی وابستگی: اگر المان بعداً (مثلاً بعد از بارگذاری) ساخته شد هم وصل می‌شود */
  useEffect(() => {
    const el = ref.current;
    if (el === attached.current) return undefined;

    cleanup.current?.();
    cleanup.current = null;
    attached.current = el;
    if (!el) return undefined;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const max = el.scrollWidth - el.clientWidth;
      const overflow = max > EDGE;
      let left = false;
      let right = false;

      if (overflow) {
        const rtl = getComputedStyle(el).direction === 'rtl';
        const scrolled = Math.abs(el.scrollLeft); // فاصله از «ابتدای» ردیف
        const startHidden = scrolled > EDGE;
        const endHidden = scrolled < max - EDGE;
        /* RTL: ابتدا = راست؛ LTR: ابتدا = چپ */
        left = rtl ? endHidden : startHidden;
        right = rtl ? startHidden : endHidden;
      }

      setState((prev) =>
        prev.overflow === overflow && prev.left === left && prev.right === right
          ? prev
          : { overflow, left, right },
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    el.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(schedule);
      observer.observe(el);
      Array.from(el.children).forEach((child) => observer.observe(child));
    }

    cleanup.current = () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
    };
    return undefined;
  });

  useEffect(
    () => () => {
      cleanup.current?.();
      cleanup.current = null;
      attached.current = null;
    },
    [],
  );

  const fadeStyle = {
    '--fade-l': state.left ? FADE : '0px',
    '--fade-r': state.right ? FADE : '0px',
  };

  return [ref, state.overflow, fadeStyle];
}
