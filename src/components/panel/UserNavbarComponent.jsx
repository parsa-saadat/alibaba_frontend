import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { t as translateText } from '../../i18n/runtime.js';
import {
  Bell,
  Bookmark,
  Boxes,
  ClipboardList,
  CreditCard,
  Flag,
  Heart,
  LayoutDashboard,
  MessageSquare,
  QrCode,
  UserRound,
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';

/*
 * ریل آیکونی پنل کاربر + منوی دومِ بازشونده، همان ساختار اسکرین‌شات‌ها.
 * بخش‌هایی که پشتشان قابلیت واقعی نیست به یک صفحهٔ «به‌زودی» می‌روند تا
 * فهرست کامل بماند ولی قابلیت جعلی ساخته نشود.
 */
const SECTIONS = [
  { key: 'dashboard', path: '/account', end: true, icon: LayoutDashboard, label: 'account.dashboard' },
  {
    key: 'messages',
    path: '/account/messages',
    icon: MessageSquare,
    label: 'chat.messages',
    children: [
      { path: '/account/messages', label: 'chat.messenger' },
      { path: '/account/messages/inquiries', label: 'chat.inquiries' },
      { path: '/account/messages/contacts', label: 'chat.contacts' },
    ],
  },
  {
    key: 'orders',
    path: '/account/orders',
    icon: ClipboardList,
    label: 'account.orders',
    children: [
      { path: '/account/orders', label: 'account.ordersAll' },
      { path: '/account/service/refunds', label: 'account.refunds' },
      { path: '/account/service/reviews', label: 'account.myReviews' },
      { path: '/account/service/coupons', label: 'account.coupons' },
      { path: '/account/service/tax', label: 'account.tax' },
    ],
  },
  {
    key: 'payment',
    path: '/account/payment',
    icon: CreditCard,
    label: 'account.payment',
    children: [
      { path: '/account/payment', label: 'account.paymentManagement' },
      { path: '/account/service/transactions', label: 'account.transactions' },
      { path: '/account/service/wire', label: 'account.wireTransfer' },
    ],
  },
  {
    key: 'saved',
    path: '/account/saved',
    icon: Heart,
    label: 'account.saved',
    children: [
      { path: '/account/saved', label: 'account.favorites' },
      { path: '/account/saved/history', label: 'account.history' },
    ],
  },
  { key: 'subscription', path: '/account/service/subscription', icon: Bookmark, label: 'account.subscription', isNew: true },
  { key: 'logistics', path: '/account/service/logistics', icon: Bell, label: 'account.logistics' },
  { key: 'dropshipping', path: '/account/service/dropshipping', icon: Boxes, label: 'account.dropshipping' },
  { key: 'more', path: '/account/service/more', icon: Flag, label: 'account.more' },
  { key: 'settings', path: '/account/settings', icon: UserRound, label: 'account.settings' },
];

const isActive = (section, pathname) =>
  section.end
    ? pathname === '/account'
    : pathname === section.path ||
      pathname.startsWith(`${section.path}/`) ||
      (section.children || []).some((child) => pathname === child.path);

export default function UserNavbarComponent() {
  const { pathname } = useLocation();
  const { unread } = useChat();
  const [openKey, setOpenKey] = useState(null);
  const railRef = useRef(null);

  useEffect(() => {
    const owner = SECTIONS.find((section) => (section.children || []).some((child) => pathname === child.path));
    setOpenKey(owner ? owner.key : null);
  }, [pathname]);

  useEffect(() => {
    const onDown = (event) => {
      if (railRef.current && !railRef.current.contains(event.target)) setOpenKey(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <nav ref={railRef} className="user-rail" aria-label={translateText('account.panelNavigation')}>
      <ul className="user-rail-list">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const active = isActive(section, pathname);
          const expanded = openKey === section.key && Boolean(section.children?.length);

          return (
            <li key={section.key} className="user-rail-item">
              <NavLink
                to={section.path}
                end={section.end}
                className={`user-rail-link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onMouseEnter={() => section.children && setOpenKey(section.key)}
                onClick={() => section.children && setOpenKey((value) => (value === section.key ? null : section.key))}
                title={translateText(section.label)}
              >
                <Icon size={18} />
                <span className="user-rail-text">{translateText(section.label)}</span>
                {section.key === 'messages' && unread.total > 0 ? (
                  <span className="user-rail-badge">{unread.total > 99 ? '99+' : unread.total}</span>
                ) : null}
                {section.isNew ? <span className="user-rail-new">{translateText('account.newTag')}</span> : null}
              </NavLink>

              {expanded ? (
                <div className="user-rail-flyout" role="menu">
                  <b className="user-rail-flyout-title">{translateText(section.label)}</b>
                  <ul>
                    {section.children.map((child) => (
                      <li key={child.path}>
                        <NavLink
                          to={child.path}
                          end
                          className={({ isActive: on }) => `user-rail-sub${on ? ' is-active' : ''}`}
                          role="menuitem"
                          onClick={() => setOpenKey(null)}
                        >
                          {translateText(child.label)}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <button type="button" className="user-rail-qr" title={translateText('account.scanQr')} aria-label={translateText('account.scanQr')}>
        <QrCode size={18} />
      </button>
    </nav>
  );
}

export { SECTIONS, isActive };
