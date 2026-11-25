import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { t as translateText } from '../../i18n/runtime.js';
import FavoritesPage from '../main/FavoritesPage';
import RecentlyViewedComponent from '../../components/product/RecentlyViewedComponent';
import { readList } from '../../utils/helpers/storage';

const TABS = [
  ['favorites', 'account.favorites'],
  ['history', 'account.history'],
];

/*
 * «ذخیره‌شده‌ها و تاریخچه» — همان داده‌های موجود در localStorage برنامه؛
 * صفحهٔ علاقه‌مندی‌ها دوباره نوشته نشده، همان کامپوننت داخل پنل رندر می‌شود.
 */
export default function AccountSavedPage() {
  const { tab = 'favorites' } = useParams();
  const navigate = useNavigate();
  const historyCount = readList('history').filter(Boolean).length;

  return (
    <div className="account-page">
      <header className="account-page-head">
        <h1>{translateText('account.saved')}</h1>
        <nav className="account-tabs">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`account-tab${key === tab ? ' is-active' : ''}`}
              onClick={() => navigate(key === 'favorites' ? '/account/saved' : '/account/saved/history')}
            >
              {translateText(label)}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'favorites' ? (
        <div className="account-embedded">
          <FavoritesPage />
        </div>
      ) : historyCount ? (
        <RecentlyViewedComponent
          limit={12}
          title={translateText('account.browsingHistory')}
          subtitle={translateText('account.historyThreeMonths')}
          moreTo="/products"
        />
      ) : (
        <div className="card rounded-3xl p-5">
          <div className="account-empty-block">
            <b>{translateText('account.noHistory')}</b>
            <p>{translateText('account.noHistoryHint')}</p>
            <Link to="/products" className="btn-primary">
              {translateText('account.startSourcing')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
