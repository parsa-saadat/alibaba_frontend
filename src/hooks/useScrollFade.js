import { useEffect, useRef, useState } from 'react';

/*
 * useScrollFade
 * -------------
 * برای ردیف‌های اسکرول افقی: تنها وقتی واقعاً چیزی برای اسکرول هست، کلاس محو‌شدگی
 * دو سر (`scroll-fade-x`) اضافه می‌شود. بدون این بررسی، ردیفی که سرریز ندارد هم
 * لبه‌ی اول و آخرش سایه‌دار/محو دیده می‌شود (مثل لینک‌های منوی هدر).
 *
 * خروجی: [ref, hasOverflow]
 */
export default function useScrollFade() {
  const ref = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const check = () => {
      const next = el.scrollWidth - el.clientWidth > 4;
      setHasOverflow((prev) => (prev === next ? prev : next));
    };

    check();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(check);
      observer.observe(el);
      Array.from(el.children).forEach((child) => observer.observe(child));
      window.addEventListener('resize', check);
      return () => {
        observer.disconnect();
        window.removeEventListener('resize', check);
      };
    }

    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return [ref, hasOverflow];
}
