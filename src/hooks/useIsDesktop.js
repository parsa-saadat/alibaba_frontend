import { useEffect, useState } from 'react';

/*
 * تشخیص دسکتاپ (breakpoint lg = 1024px مثل تیلویند).
 * با innerWidth + رویداد resize — در محیط‌های embed برخی مرورگرها matchMedia
 * به‌درستی آپدیت نمی‌شود؛ innerWidth همیشه مقدار واقعی پنجره را می‌دهد.
 */
const DESKTOP_MIN_WIDTH = 1024;

export default function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= DESKTOP_MIN_WIDTH,
  );

  useEffect(() => {
    const onChange = () => setIsDesktop(window.innerWidth >= DESKTOP_MIN_WIDTH);
    onChange();
    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', onChange);
    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('orientationchange', onChange);
    };
  }, []);

  return isDesktop;
}
