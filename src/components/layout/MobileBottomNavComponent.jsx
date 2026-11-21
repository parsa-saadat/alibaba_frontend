import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingCart, User } from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';

/*
 * نوار پایین موبایل — مثل اپلیکیشن علی‌بابا:
 * خانه / فروشگاه / سبد خرید / حساب من
 * فقط در صفحه‌های اصلی سایت (بدون پنل‌ها، ورود و پرداخت) نمایش داده می‌شود.
 */
function MobileBottomNavComponent() {
  const { pathname } = useLocation();
  const { cartCount } = useShop();

  /* در پنل‌ها، فرم‌های ورود و مرحله‌ی پرداخت نوار پایین ندارد */
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/seller')
  )
    return null;

  const items = [
    {
      to: '/',
      label: translateText('خانه '),
      icon: Home,
      active: pathname === '/',
    },
    {
      to: '/products',
      label: translateText('فروشگاه '),
      icon: LayoutGrid,
      active: pathname.startsWith('/products') || pathname.startsWith('/shop') || pathname.startsWith('/product/'),
    },
    {
      to: '/cart',
      label: translateText('سبد خرید '),
      icon: ShoppingCart,
      active: pathname.startsWith('/cart'),
      badge: cartCount,
    },
    {
      to: '/profile',
      label: translateText('حساب من '),
      icon: User,
      active: pathname.startsWith('/profile') || pathname.startsWith('/order'),
    },
  ];

  return (
    <nav
      aria-label={translateText('منوی موبایل ')}
      className="fixed inset-x-0 bottom-0 z-40 border-t lg:hidden"
      style={{
        background: 'var(--card)',
        borderColor: 'var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.active;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold transition-colors"
              style={{ color: active ? 'var(--accent-text)' : 'var(--muted)' }}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                {item.badge > 0 && (
                  <span
                    className="absolute -top-1.5 -end-2 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-black"
                    style={{ background: 'var(--primary-color)', color: 'var(--on-primary' }}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              {item.label}
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-6 top-0 h-0.5 rounded-full"
                  style={{ background: 'var(--primary-color)' }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNavComponent;
