import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { direction as i18nDirection } from '../../i18n/runtime';
import { t as translateText } from '../../i18n/runtime.js';
import { Headphones, LogOut, MessageSquare, ShoppingBag, Store } from 'lucide-react';
import LanguageSelector from '../common/locale/LanguageSelectorComponent';
import UserNavbarComponent from '../panel/UserNavbarComponent';
import ChatDockComponent from '../chat/ChatDockComponent';
import { useShop } from '../../contexts/ShopContext';
import { useChat } from '../../contexts/ChatContext';
import BrandLogoComponent from '../common/BrandLogoComponent';
import { formatNumber } from '../../i18n/runtime';

/*
 * شل «پنل من» برای کاربر ثبت‌نام‌شده: نوار باریک بالا، ریل آیکونی با منوی
 * دوم و ستون محتوا. صفحه‌های موجود (سفارش‌ها، پروفایل، علاقه‌مندی‌ها) داخل
 * همین شل رندر می‌شوند تا نسخهٔ دومی از یک صفحه ساخته نشود.
 */
const UserLayout = () => {
  const { user, logout, cartCount, favorites } = useShop();
  const { unread } = useChat();

  if (!user) {
    return (
      <div dir={i18nDirection} className="min-h-screen grid place-items-center p-6">
        <LanguageSelector variant="main" />
        <div className="card rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <Store size={38} className="mx-auto text-accent" />
          <h1 className="font-black text-xl">{translateText('account.loginTitle')}</h1>
          <p className="text-sm muted leading-6">{translateText('account.loginText')}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link to="/auth/pre" className="btn-primary">
              {translateText('ورود به حساب ')}
            </Link>
            <Link to="/" className="btn-ghost">
              {translateText('صفحه‌ی اصلی ')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const name = [user.firstname, user.lastname].filter(Boolean).join(' ').trim() || user.username || '';

  return (
    <div dir={i18nDirection} className="user-panel min-h-screen flex flex-col">
      <header className="user-panel-bar">
        <div className="user-panel-bar-start">
          <Link to="/" className="user-panel-logo" aria-label={translateText('account.backToSite')}>
            <BrandLogoComponent variant="full" size="sm" />
          </Link>
          <span className="user-panel-divider" aria-hidden />
          <b className="user-panel-title">{translateText('account.panelName')}</b>
        </div>

        <div className="user-panel-bar-end">
          <LanguageSelector variant="main" compact />
          <Link to="/seller" className="user-panel-link">
            <Store size={16} />
            {translateText('account.startSelling')}
          </Link>
          <Link to="/account/messages" className="user-panel-icon" aria-label={translateText('chat.messages')}>
            <MessageSquare size={18} />
            {unread.total > 0 ? <span className="user-panel-dot">{formatNumber(unread.total)}</span> : null}
          </Link>
          <Link to="/cart" className="user-panel-icon" aria-label={translateText('account.cart')}>
            <ShoppingBag size={18} />
            {cartCount > 0 ? <span className="user-panel-dot">{formatNumber(cartCount)}</span> : null}
          </Link>
          <Link to="/contact" className="user-panel-icon" aria-label={translateText('account.support')}>
            <Headphones size={18} />
          </Link>
          <Link to="/account/settings" className="user-panel-avatar" title={name}>
            {(name || '؟').slice(0, 1)}
            {favorites?.length > 0 ? <span className="user-panel-dot is-alt">{formatNumber(favorites.length)}</span> : null}
          </Link>
          <button type="button" className="user-panel-link" onClick={logout}>
            <LogOut size={15} />
            {translateText('account.signOut')}
          </button>
        </div>
      </header>

      <div className="user-panel-body">
        <UserNavbarComponent />
        <main className="user-panel-main min-w-0">
          <Outlet />
        </main>
      </div>

      <ChatDockComponent />
    </div>
  );
};

export default UserLayout;
