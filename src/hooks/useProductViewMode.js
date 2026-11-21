import { useCallback, useEffect, useState } from 'react';

/*
 * حالت نمایش لیست محصولات (دوتایی / تکی / تکی عمودی).
 * انتخاب کاربر در localStorage ذخیره می‌شود تا بین صفحه‌ها حفظ شود.
 */
const KEY = 'products.view_mode';
const MODES = ['double', 'single', 'single-vertical'];

export default function useProductViewMode(defaultMode = 'double') {
  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return MODES.includes(saved) ? saved : defaultMode;
    } catch {
      return defaultMode;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* حافظه در دسترس نیست — بی‌اهمیت */
    }
  }, [mode]);

  const changeMode = useCallback((next) => {
    if (MODES.includes(next)) setMode(next);
  }, []);

  return [mode, changeMode];
}
