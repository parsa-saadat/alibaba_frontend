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
      aria-label={dark ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
      aria-pressed={!dark}
      title={dark ? 'تم روشن' : 'تم تیره'}
    >
      {dark ? <Sun size={size} /> : <Moon size={size} />}
      {showLabel && <span>{dark ? 'تم روشن' : 'تم تیره'}</span>}
    </button>
  );
}

export default ThemeToggleComponent;
