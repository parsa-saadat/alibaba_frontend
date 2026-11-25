import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { Store, LayoutGrid, ArrowUp } from 'lucide-react';
import ThemeToggleComponent from '../common/ThemeToggleComponent';

const item = 'toolbar-action';
const divider = { borderBottom: '1px solid var(--border)' };

function FloatingToolbarComponent() {
  return (
    /* فقط وقتی حاشیه‌ی کنار محتوای ۱۴۴۰ پیکسلی خالی است نمایش داده می‌شود
       تا روی کارت‌های دسته‌بندی/محصول نیفتد */
    <div
      data-testid="floating-toolbar"
      className="floating-toolbar card hidden min-[1720px]:flex fixed top-1/2 -translate-y-1/2 z-40 flex-col shadow-xl"
    >
      <Link
        to="/profile"
        aria-label={translateText('فروشنده شوید ')}
        title={translateText('فروشنده شوید ')}
        className={item}
        style={divider}
      >
        <Store size={19} />
        <span className="sr-only">{translateText('فروشنده شوید ')}</span>
      </Link>
      <Link
        to="/products"
        aria-label={translateText('همه محصولات ')}
        title={translateText('همه محصولات ')}
        className={item}
        style={divider}
      >
        <LayoutGrid size={19} />
        <span className="sr-only">{translateText('همه محصولات ')}</span>
      </Link>
      <ThemeToggleComponent className={item} showLabel={false} size={19} />
      <button
        aria-label={translateText('بالای صفحه ')}
        title={translateText('بالای صفحه ')}
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={item}
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <ArrowUp size={19} />
        <span className="sr-only">{translateText('بالای صفحه ')}</span>
      </button>
    </div>
  );
}

export default FloatingToolbarComponent;
