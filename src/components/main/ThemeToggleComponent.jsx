import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const KEY = 'theme';

const readTheme = () => {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  const root = document.documentElement;
  if (root.dataset.theme === 'light' || root.classList.contains('light')) return 'light';
  return 'dark';
};

const applyTheme = (t) => {
  const root = document.documentElement;
  root.dataset.theme = t;
  root.classList.toggle('dark', t === 'dark');
  root.classList.toggle('light', t === 'light');
  root.style.colorScheme = t;
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* ignore */
  }
};

function ThemeToggleComponent({ className = '', showLabel = true }) {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {
      /* ignore */
    }
    if (saved) applyTheme(saved);

    const sync = () => setTheme(readTheme());
    window.addEventListener('theme-change', sync);
    return () => window.removeEventListener('theme-change', sync);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    window.dispatchEvent(new Event('theme-change'));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={className}
      aria-label="تغییر تم"
      title={theme === 'dark' ? 'تم روشن' : 'تم تیره'}
    >
      {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
      {showLabel && <span>{theme === 'dark' ? 'تم روشن' : 'تم تیره'}</span>}
    </button>
  );
}

export default ThemeToggleComponent;