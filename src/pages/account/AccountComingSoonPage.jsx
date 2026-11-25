import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { t as translateText } from '../../i18n/runtime.js';
import { Construction, Home } from 'lucide-react';

/*
 * بخش‌هایی از پنل که در این نسخه پشت‌بک‌اند ندارند. به‌جای ساخت دادهٔ جعلی،
 * صریح «در دسترس نیست» می‌گویند و به نزدیک‌ترین صفحهٔ واقعی راهنمایی می‌کنند.
 */
const SECTIONS = {
  refunds: { label: 'account.refunds', to: '/account/orders', link: 'account.goOrders' },
  transactions: { label: 'account.transactions', to: '/account/payment', link: 'account.goPayment' },
  wire: { label: 'account.wireTransfer', to: '/account/payment', link: 'account.goPayment' },
};

export default function AccountComingSoonPage() {
  const { key = 'refunds' } = useParams();
  const section = SECTIONS[key] || SECTIONS.refunds;

  return (
    <div className="account-page">
      <div className="card rounded-3xl p-8 account-empty-block">
        <Construction size={34} className="text-accent" />
        <h1 className="font-black text-lg">{translateText(section.label)}</h1>
        <p>{translateText('account.notAvailableHint')}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link to={section.to} className="btn-primary">
            {translateText(section.link)}
          </Link>
          <Link to="/account" className="btn-ghost">
            <Home size={15} />
            {translateText('account.dashboardHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export { SECTIONS as COMING_SOON_SECTIONS };
