import React from 'react';
import { Link } from 'react-router-dom';
import { Store, LayoutGrid, ArrowUp } from 'lucide-react';
import ThemeToggleComponent from '../common/ThemeToggleComponent';

const item =
  'w-[72px] py-3 flex flex-col items-center gap-1 text-[11px] muted hover:text-yellow transition-colors';
const divider = { borderBottom: '1px solid var(--border)' };

function FloatingToolbarComponent() {
  return (
    /* فقط وقتی حاشیه‌ی کنار محتوای ۱۴۴۰ پیکسلی خالی است نمایش داده می‌شود
       تا روی کارت‌های دسته‌بندی/محصول نیفتد */
    <div className="card hidden min-[1600px]:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 flex-col rounded-l-xl rounded-r-none shadow-xl">
      <Link to="/profile" className={item} style={divider}>
        <Store size={22} />
        فروشنده شوید
      </Link>
      <Link to="/products" className={item} style={divider}>
        <LayoutGrid size={22} />
        همه محصولات
      </Link>
      <ThemeToggleComponent className={item} />
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={item}
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <ArrowUp size={22} />
        بالای صفحه
      </button>
    </div>
  );
}

export default FloatingToolbarComponent;