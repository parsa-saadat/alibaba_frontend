import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { direction } from '../../i18n/runtime';
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
  ChevronRight, X, Store, ShoppingBag, Headphones, LogOut, ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import { useChat } from '../../contexts/ChatContext';

// Shared account headings; child destinations appear only in a flyout or mobile accordion.
const SECTIONS = [
  { key: 'dashboard', path: '/account', end: true, icon: LayoutDashboard, label: 'account.dashboard' },
  {
    key: 'messages',
    path: '/account/messages',
    icon: MessageSquare,
    label: 'chat.messages',

  },
  {
    key: 'orders',
    path: '/account/orders',
    icon: ClipboardList,
    label: 'account.orders',
    children: [
      { path: '/account/orders', label: 'account.ordersAll' },
    ],
  },
  {
    key: 'payment',
    path: '/account/payment',
    icon: CreditCard,
    label: 'account.payment',
    children: [
      { path: '/account/payment', label: 'account.paymentManagement' },
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
  { key: 'settings', path: '/account/settings', icon: UserRound, label: 'account.settings' },
];

const isActive = (section, pathname) =>
  section.end
    ? pathname === '/account'
    : pathname === section.path ||
      pathname.startsWith(`${section.path}/`) ||
      (section.children || []).some((child) => pathname === child.path);

export default function UserNavbarComponent({ mobileOpen = false, onClose = () => {} }) {
  const { pathname } = useLocation();
  const { unread } = useChat();
  const { user, logout } = useShop();
  const admin = ['admin','root'].includes(String(user?.role || '').toLowerCase());
  const seller = user?.is_seller === true || String(user?.role || '').toLowerCase() === 'seller';
  const sections = [...SECTIONS,
    {key:'workspace', path:admin ? '/admin' : seller ? '/seller' : '/account/seller-application', icon:admin ? ShieldCheck : Store, label:admin ? ' پنل ادمین ' : seller ? 'پنل فروشنده' : 'account.becomeSeller'},
    {key:'cart',path:'/cart',icon:ShoppingBag,label:'account.cart'},
    {key:'support',path:'/contact',icon:Headphones,label:'account.support'}];
  const [expanded, setExpanded] = useState(false);
  const [openKey, setOpenKey] = useState(null);
  const [position, setPosition] = useState({top:0,left:0,width:216});
  const closeTimer = useRef(null);
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  const cancelClose = () => clearTimeout(closeTimer.current);
  const scheduleClose = () => { cancelClose(); closeTimer.current = setTimeout(() => {setOpenKey(null);setExpanded(false);}, 150); };
  const railRef = useRef(null), flyoutRef = useRef(null), anchors = useRef({}), toggles = useRef({});
  const closeRef = useRef(onClose); closeRef.current = onClose;
  const desktop = () => window.matchMedia('(min-width:1024px)').matches;
  useEffect(() => { setExpanded(false); setOpenKey(null); closeRef.current(); }, [pathname]);
  useEffect(() => {
    if (!openKey || !desktop()) return;
    const place = () => {
      const rect = anchors.current[openKey]?.getBoundingClientRect(); if (!rect) return;
      const rail = railRef.current?.getBoundingClientRect() || rect;
      const width = Math.min(216, innerWidth - 24);
      const prefer = direction === 'rtl' ? rail.left-width-8 : rail.right+8;
      const alternate = direction === 'rtl' ? rail.right+8 : rail.left-width-8;
      const left = prefer >= 12 && prefer + width <= innerWidth-12 ? prefer : alternate;
      const height = flyoutRef.current?.getBoundingClientRect().height || 150;
      setPosition({top:Math.max(12,Math.min(rect.top,innerHeight-height-12)),left:Math.max(12,Math.min(left,innerWidth-width-12)),width});
    };
    place(); const observer = new ResizeObserver(place); if (railRef.current) observer.observe(railRef.current);
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    return () => { observer.disconnect(); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [openKey]);
  useEffect(() => {
    const outside = event => { if (!railRef.current?.contains(event.target) && !flyoutRef.current?.contains(event.target)) { setOpenKey(null); setExpanded(false); } };
    const escape = event => { if (event.key === 'Escape' && openKey && !mobileOpen) { setOpenKey(null); toggles.current[openKey]?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [openKey, mobileOpen]);
  useEffect(() => {
    if (!mobileOpen) { setOpenKey(null); return; }
    const media = window.matchMedia('(min-width:1024px)');
    const resize = event => { if (event.matches) closeRef.current(); };
    media.addEventListener('change', resize);
    const previous = document.activeElement, oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; railRef.current?.querySelector('button')?.focus();
    const keydown = event => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const items = Array.from(railRef.current?.querySelectorAll('a,button') || []).filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
      const first=items[0], last=items[items.length-1];
      if (event.shiftKey && document.activeElement===first) {event.preventDefault();last?.focus();}
      if (!event.shiftKey && document.activeElement===last) {event.preventDefault();first?.focus();}
    };
    document.addEventListener('keydown',keydown);
    return () => {media.removeEventListener('change',resize);document.removeEventListener('keydown',keydown);document.body.style.overflow=oldOverflow;if(previous?.isConnected)previous.focus();};
  }, [mobileOpen]);
  const leave = event => { if (flyoutRef.current?.contains(event.relatedTarget)) return; if(desktop())scheduleClose(); };
  const navigate = () => {setOpenKey(null);setExpanded(false);onClose();};
  const submenu = section => <ul>{section.children.map(child => <li key={child.path}><NavLink to={child.path} end className={({isActive})=>`user-rail-sub${isActive?' is-active':''}`} onClick={navigate}>{translateText(child.label)}</NavLink></li>)}</ul>;
  const current = sections.find(section => section.key === openKey && section.children?.length);
  return <>
    {mobileOpen && <button type="button" className="account-nav-backdrop" aria-label={translateText('بستن منو')} onClick={onClose} />}
    <nav id="account-navigation" ref={railRef} className={`user-rail account-nav-v38 account-nav-v40${expanded?' is-expanded':''}${mobileOpen?' is-mobile-open':''}`}
      onMouseEnter={()=>{cancelClose();setExpanded(true);}} onMouseLeave={leave} onFocusCapture={()=>setExpanded(true)}
      onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget)&&!flyoutRef.current?.contains(event.relatedTarget))setExpanded(false);}}
      aria-label={translateText('account.panelNavigation')}>
      <div className="account-nav-mobile-heading"><b>{translateText('account.panelName')}</b><button className="icon-control" type="button" onClick={onClose} aria-label={translateText('بستن منو')}><X size={20}/></button></div>
      <ul className="user-rail-list">
        {sections.map(section=>{
          const Icon=section.icon, active=isActive(section,pathname), hasChildren=Boolean(section.children?.length), open=openKey===section.key;
          return <li key={section.key} className={`user-rail-item${section.key==='workspace'?' workspace-nav-item':''}`} ref={el=>{anchors.current[section.key]=el;}}
            onMouseEnter={()=>{if(desktop())setOpenKey(hasChildren?section.key:null);}}>
            <div className="account-nav-row">
              <NavLink to={section.path} end={section.end} className={`user-rail-link${active?' is-active':''}`} title={translateText(section.label)} aria-label={translateText(section.label)} onClick={navigate}>
                <Icon size={19}/><span className="user-rail-text">{translateText(section.label)}</span>
                {section.key==='messages'&&(unread.buyer_total??unread.total)>0&&<span className="user-rail-badge">{(unread.buyer_total??unread.total)>99?'99+':(unread.buyer_total??unread.total)}</span>}
              </NavLink>
              {hasChildren&&<button ref={el=>{toggles.current[section.key]=el;}} type="button" className="account-submenu-toggle icon-control" aria-label={translateText(section.label)} aria-expanded={open} aria-controls={`account-submenu-${section.key}`}
                onClick={()=>setOpenKey(open?null:section.key)} onKeyDown={event=>{if(event.key===(direction==='rtl'?'ArrowLeft':'ArrowRight')){event.preventDefault();setOpenKey(section.key);requestAnimationFrame(()=>flyoutRef.current?.querySelector('a')?.focus());}}}><ChevronRight size={15}/></button>}
            </div>
            {hasChildren&&mobileOpen&&<div id={`account-submenu-${section.key}`} className={`account-submenu-inline${open?' is-open':''}`} inert={!open} aria-hidden={!open}><div>{submenu(section)}</div></div>}
          </li>;
        })}
        <li className="account-nav-mobile-only"><button type="button" className="user-rail-link" onClick={logout}><LogOut size={19}/><span className="user-rail-text">{translateText('account.signOut')}</span></button></li>
      </ul>
    </nav>
    {current&&!mobileOpen&&createPortal(<div id={`account-submenu-${current.key}`} dir={direction} ref={flyoutRef} className="account-submenu-flyout" style={position}
      onMouseEnter={cancelClose}
      onMouseLeave={event=>{if(!railRef.current?.contains(event.relatedTarget))scheduleClose();}}
      onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget)&&!railRef.current?.contains(event.relatedTarget)){setOpenKey(null);setExpanded(false);}}}>
      <b>{translateText(current.label)}</b>{submenu(current)}
    </div>,document.body)}
  </>;
}

export { SECTIONS, isActive };
