import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { direction as i18nDirection } from '../../i18n/runtime';
import { t as translateText } from '../../i18n/runtime.js';
import { Headphones, LogOut, MessageSquare, ShoppingBag, Store, ArrowRight, Heart, UserRound, Menu } from 'lucide-react';
import LanguageSelector from '../common/locale/LanguageSelectorComponent';
import UserNavbarComponent from '../panel/UserNavbarComponent';
import ChatDockComponent from '../chat/ChatDockComponent';
import { useShop } from '../../contexts/ShopContext';
import { useChat } from '../../contexts/ChatContext';
import BrandLogoComponent from '../common/BrandLogoComponent';
import { userDisplayName } from '../../utils/helpers/user';
import { formatNumber } from '../../i18n/runtime';

/*
 * شل «پنل من» برای کاربر ثبت‌نام‌شده: نوار باریک بالا، ریل آیکونی با منوی
 * دوم و ستون محتوا. صفحه‌های موجود (سفارش‌ها، پروفایل، علاقه‌مندی‌ها) داخل
 * همین شل رندر می‌شوند تا نسخهٔ دومی از یک صفحه ساخته نشود.
 */
const UserLayout = () => {
  const { user, logout, cartCount, favorites } = useShop();
  const { unread } = useChat();
  const [navOpen, setNavOpen] = useState(false);

  if (!user) {
    return (
      <div dir={i18nDirection} className="account-gateway">
        <header className="account-gateway-header">
          <Link to="/" aria-label={translateText('account.backToSite')}><BrandLogoComponent variant="full" size="sm" /></Link>
          <LanguageSelector variant="admin" compact />
        </header>
        <main className="account-gateway-main">
          <section className="account-gateway-card">
            <span className="account-gateway-icon"><UserRound size={30} /></span>
            <h1>{translateText('account.loginTitle')}</h1>
            <p>{translateText('account.loginText')}</p>
            <ul className="account-gateway-features">
              {[[MessageSquare, 'chat.messages'], [ShoppingBag, 'account.orders'], [Heart, 'account.favorites']].map(([Icon, label]) => <li key={label}><Icon size={18} /><span>{translateText(label)}</span></li>)}
            </ul>
            <Link to="/auth/pre" className="btn-primary account-gateway-login">{translateText('ورود به حساب ')}<ArrowRight className="logical-icon" size={18} /></Link>
            <Link to="/" className="account-gateway-back">{translateText('account.backToSite')}</Link>
          </section>
        </main>
      </div>
    );
  }

  const name = userDisplayName(user, '');
  const workspaceLabel = ['admin','root'].includes(user.role) ? 'profile.adminBadge' : user.is_seller || user.role === 'seller' ? 'پنل فروشنده' : 'account.startSelling';

  return (
    <div dir={i18nDirection} className="user-panel account-shell-v38 min-h-screen flex flex-col">
      <header className="user-panel-bar">
        <div className="user-panel-bar-inner">
        <div className="user-panel-bar-start">
          <button type="button" className="account-nav-toggle icon-control" aria-label={translateText('account.panelNavigation')} aria-expanded={navOpen} aria-controls="account-navigation" onClick={() => setNavOpen(value => !value)}><Menu size={20} /></button>
          <Link to="/" className="user-panel-logo" aria-label={translateText('account.backToSite')}>
            <BrandLogoComponent variant="full" size="sm" />
          </Link>
          <span className="user-panel-divider" aria-hidden />
          <b className="user-panel-title">{translateText('account.panelName')}</b>
        </div>

        <div className="user-panel-locale"><LanguageSelector variant="admin" compact /></div>
        <div className="user-panel-bar-end">
          <Link to={["admin", "root"].includes(user.role) ? "/admin" : user.is_seller || user.role === "seller" ? "/seller" : "/account/seller-application"} className="user-panel-link" title={translateText(workspaceLabel)} aria-label={translateText(workspaceLabel)} data-tooltip={translateText(workspaceLabel)}>
            <Store size={16} />
            <span className="user-panel-action-label">{translateText(workspaceLabel)}</span>
          </Link>
          <Link to="/account/messages" className="user-panel-icon" aria-label={translateText('chat.messages')} title={translateText('chat.messages')} data-tooltip={translateText('chat.messages')}>
            <MessageSquare size={18} />
            {(unread.buyer_total ?? unread.total) > 0 ? <span className="user-panel-dot">{formatNumber(unread.buyer_total ?? unread.total)}</span> : null}
          </Link>
          <Link to="/cart" className="user-panel-icon" aria-label={translateText('account.cart')} title={translateText('account.cart')} data-tooltip={translateText('account.cart')}>
            <ShoppingBag size={18} />
            {cartCount > 0 ? <span className="user-panel-dot">{formatNumber(cartCount)}</span> : null}
          </Link>
          <Link to="/contact" className="user-panel-icon" aria-label={translateText('account.support')} title={translateText('account.support')} data-tooltip={translateText('account.support')}>
            <Headphones size={18} />
          </Link>
          <Link to="/account/settings" className="user-panel-avatar" title={name} aria-label={translateText('account.settings')} data-tooltip={translateText('account.settings')}>
            {(name || '؟').slice(0, 1)}
            {favorites?.length > 0 ? <span className="user-panel-dot is-alt">{formatNumber(favorites.length)}</span> : null}
          </Link>
          <button type="button" className="user-panel-link" onClick={logout} title={translateText('account.signOut')} aria-label={translateText('account.signOut')} data-tooltip={translateText('account.signOut')}>
            <LogOut size={15} />
            <span className="user-panel-action-label">{translateText('account.signOut')}</span>
          </button>
        </div>
        </div>
      </header>

      <div className="user-panel-body">
        <UserNavbarComponent mobileOpen={navOpen} onClose={() => setNavOpen(false)} />
        <main className="user-panel-main min-w-0">
          <Outlet />
        </main>
      </div>

      <ChatDockComponent />
    </div>
  );
};

export default UserLayout;
