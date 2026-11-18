import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';

/*
 * دکمه‌ی تغییر تم.
 * تم فقط در ShopContext نگه‌داری می‌شود تا همه‌ی دکمه‌ها و آیکون‌ها
 * هم‌زمان و درست با هم عوض شوند (قبلاً هر دکمه state مستقل خودش را داشت
 * و آیکون‌ها با هم هم‌خوان نبودند).
 */
function ThemeToggleComponent({ className = '', showLabel = true, size = 22 }) {
  const { theme, toggleTheme } = useShop();
  const dark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className}
      aria-label={dark ? translateText("تغییر به تم روشن") : translateText("تغییر به تم تاریک")}
      aria-pressed={!dark}
      title={dark ? translateText("تم روشن") : translateText("تم تیره")}
    >
      {dark ? <Sun size={size} /> : <Moon size={size} />}
      {showLabel && <span>{dark ? translateText("تم روشن") : translateText("تم تیره")}</span>}
    </button>
  );
}

export default ThemeToggleComponent;
