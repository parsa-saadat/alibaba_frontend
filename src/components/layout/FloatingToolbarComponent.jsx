import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { Store, LayoutGrid, ArrowUp } from 'lucide-react';
import ThemeToggleComponent from '../common/ThemeToggleComponent';

const item =
  'w-[72px] py-3 flex flex-col items-center gap-1 text-[11px] muted hover:text-accent transition-colors';
const divider = { borderBottom: '1px solid var(--border)' };

function FloatingToolbarComponent() {
  return (
    /* فقط وقتی حاشیه‌ی کنار محتوای ۱۴۴۰ پیکسلی خالی است نمایش داده می‌شود
       تا روی کارت‌های دسته‌بندی/محصول نیفتد */
    <div
      data-testid="floating-toolbar"
      className="floating-toolbar card hidden min-[1600px]:flex fixed top-1/2 -translate-y-1/2 z-40 flex-col shadow-xl"
    >
      <Link to="/profile" className={item} style={divider}>
        <Store size={22} />
        {translateText('فروشنده شوید ')}
      </Link>
      <Link to="/products" className={item} style={divider}>
        <LayoutGrid size={22} />
        {translateText('همه محصولات ')}
      </Link>
      <ThemeToggleComponent className={item} />
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={item}
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <ArrowUp size={22} />
        {translateText('بالای صفحه ')}
      </button>
    </div>
  );
}

export default FloatingToolbarComponent;
