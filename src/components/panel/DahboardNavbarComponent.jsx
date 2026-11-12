import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  FolderTree,
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  Images,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import { userDisplayName } from '../../utils/helpers/user';

const ADMIN_ITEMS = [
  { path: '/dashboard', label: 'پیشخوان', icon: LayoutDashboard, end: true },
  { path: '/dashboard/sellers', label: 'فروشندگان', icon: ShieldCheck },
  { path: '/dashboard/users', label: 'کاربران', icon: Users },
  { path: '/dashboard/stores', label: 'فروشگاه‌ها', icon: Store },
  { path: '/dashboard/products', label: 'محصولات', icon: Package },
  { path: '/dashboard/categories', label: 'دسته‌بندی‌ها', icon: FolderTree },
  { path: '/dashboard/orders', label: 'سفارش‌ها', icon: ShoppingBag },
  { path: '/dashboard/plans', label: 'پلن‌ها', icon: CreditCard },
  { path: '/dashboard/media', label: 'رسانه‌ها', icon: Images },
];

function DashboardNavbarComponent() {
  const navigate = useNavigate();
  const { user, logout, theme, toggleTheme } = useShop();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarInner = ({ isMobile = false }) => {
    const isCompact = !isMobile && collapsed;
    return (
      <div className="flex flex-col h-full bg-[#0a1736] text-white select-none">
        <div
          className={`p-4 border-b border-white/10 flex items-center ${
            isCompact ? 'justify-center' : 'justify-between gap-2'
          }`}
        >
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-9 h-9 rounded-xl grid place-items-center font-black text-lg shrink-0 shadow"
              style={{ background: 'var(--primary-color)', color: '#0a1736' }}
            >
              ع
            </span>
            {!isCompact && (
              <div className="min-w-0">
                <div className="font-black text-sm truncate">پنل مدیریت</div>
                <div className="text-[11px] text-[#9aa8cc] truncate">مدیر کل سیستم</div>
              </div>
            )}
          </Link>
          {!isMobile && (
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[#9aa8cc]"
              title={collapsed ? 'بزرگ‌نمایی منو' : 'کوچک‌نمایی منو'}
            >
              {collapsed ? <PanelRightOpen size={17} /> : <PanelRightClose size={17} />}
            </button>
          )}
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10"
              aria-label="بستن منو"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="ناوبری پنل ادمین">
          {ADMIN_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                title={isCompact ? item.label : undefined}
                onClick={() => isMobile && setMobileOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center ${
                    isCompact ? 'justify-center px-2' : 'justify-between px-3'
                  } py-2.5 rounded-xl text-sm transition-all ${
                    isActive
                      ? 'bg-[#ffd60a] text-[#0a1736] font-black shadow-md'
                      : 'text-[#d8e1fa] hover:bg-white/10'
                  }`
                }
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon size={18} className="shrink-0" />
                  {!isCompact && <span className="truncate">{item.label}</span>}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-full flex items-center ${
              isCompact ? 'justify-center px-2' : 'gap-2.5 px-3'
            } py-2.5 rounded-xl text-sm text-[#d8e1fa] hover:bg-white/10`}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            {!isCompact && <span>{theme === 'dark' ? 'تم روشن' : 'تم تاریک'}</span>}
          </button>
          <Link
            to="/seller"
            onClick={() => isMobile && setMobileOpen(false)}
            className={`w-full flex items-center ${
              isCompact ? 'justify-center px-2' : 'gap-2.5 px-3'
            } py-2.5 rounded-xl text-sm text-brand-yellow hover:bg-white/10`}
          >
            <Store size={17} className="shrink-0" />
            {!isCompact && <span>پنل فروشنده</span>}
          </Link>
          <Link
            to="/"
            onClick={() => isMobile && setMobileOpen(false)}
            className={`w-full flex items-center ${
              isCompact ? 'justify-center px-2' : 'gap-2.5 px-3'
            } py-2.5 rounded-xl text-sm text-[#d8e1fa] hover:bg-white/10`}
          >
            <ExternalLink size={17} className="shrink-0" />
            {!isCompact && <span>مشاهده فروشگاه</span>}
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
            className={`w-full flex items-center ${
              isCompact ? 'justify-center px-2' : 'gap-2.5 px-3'
            } py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-500/15`}
          >
            <LogOut size={17} className="shrink-0" />
            {!isCompact && <span>خروج از حساب</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="lg:hidden sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b border-theme bg-[#0a1736] text-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10"
            aria-label="باز کردن منوی داشبورد"
          >
            <Menu size={19} />
          </button>
          <span className="font-black text-sm">پنل مدیریت علی‌بازار</span>
        </div>
        <span className="text-xs text-brand-yellow font-bold">{userDisplayName(user, user?.username)}</span>
      </div>

      <aside
        className={`hidden lg:block shrink-0 border-l border-white/10 transition-all duration-200 sticky top-0 h-screen ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarInner />
      </aside>

      {mobileOpen && (
        <>
          <div className="mobile-drawer-backdrop lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="mobile-drawer lg:hidden !p-0">
            <SidebarInner isMobile />
          </aside>
        </>
      )}
    </>
  );
}

export default DashboardNavbarComponent;
