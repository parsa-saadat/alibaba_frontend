import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Trash2, History } from 'lucide-react';
import { t } from '../../i18n/runtime.js';
import FavoritesPage from '../main/FavoritesPage';
import RecentlyViewedComponent from '../../components/product/RecentlyViewedComponent';
import { readList, writeList } from '../../utils/helpers/storage';
import { SEARCH_HISTORY_KEY } from '../../utils/helpers/browsing-history';

export default function AccountSavedPage() {
  const { pathname } = useLocation();
  const historyTab = pathname.endsWith('/history');
  const navigate = useNavigate();
  const [searches, setSearches] = useState(() => readList(SEARCH_HISTORY_KEY));
  const [viewed, setViewed] = useState(() => readList('history'));
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const update = () => { setSearches(readList(SEARCH_HISTORY_KEY)); setViewed(readList('history')); };
    window.addEventListener('geocala:history', update);
    window.addEventListener('storage', update);
    update();
    return () => { window.removeEventListener('geocala:history', update); window.removeEventListener('storage', update); };
  }, [pathname]);
  const clearSearches = () => { writeList(SEARCH_HISTORY_KEY, []); setSearches([]); };
  const clearViewed = () => { writeList('history', []); setViewed([]); setVersion(value => value + 1); };
  return <div className="account-page">
    <header className="account-page-head"><h1>{t(historyTab ? 'account.browsingHistory' : 'account.favorites')}</h1>
      <nav className="account-tabs" aria-label={t('account.saved')}>
        {[['/account/saved','account.favorites'],['/account/saved/history','account.history']].map(([path,label]) => <button type="button" key={path} className={`account-tab${pathname === path ? ' is-active' : ''}`} onClick={() => navigate(path)}>{t(label)}</button>)}
      </nav>
    </header>
    {!historyTab ? <div className="account-embedded"><FavoritesPage /></div> : <>
      <p className="muted text-sm">{t('history.browserNote')}</p>
      <section className="card rounded-2xl p-4 history-searches">
        <div className="account-section-head"><b className="inline-flex items-center gap-2"><Search size={18} />{t('history.searches')}</b>{searches.length > 0 && <button type="button" className="history-clear" onClick={clearSearches}><Trash2 size={15} />{t('پاک کردن ')}</button>}</div>
        {searches.length ? <ul className="history-query-list">{searches.filter(row => typeof row?.query === 'string').map(row => <li key={row.query}><Link to={`/products?name=${encodeURIComponent(row.query)}`}><History size={16} /><span>{row.query}</span></Link><button className="icon-control" type="button" aria-label={`${t('حذف')} ${row.query}`} onClick={() => { const rows = searches.filter(item => item.query !== row.query); writeList(SEARCH_HISTORY_KEY, rows); setSearches(rows); }}><Trash2 size={15} /></button></li>)}</ul> : <p className="muted text-sm py-3">{t('history.noSearches')}</p>}
      </section>
      <section className="history-viewed">
        <div className="account-section-head"><b className="inline-flex items-center gap-2"><History size={18} />{t('اخیراً مشاهده کرده‌اید')}</b>{viewed.length > 0 && <button type="button" className="history-clear" onClick={clearViewed}><Trash2 size={15} />{t('پاک کردن ')}</button>}</div>
        {viewed.length ? <RecentlyViewedComponent showEmpty showClear={false} key={version} limit={12} title={t('account.browsingHistory')} subtitle={t('محصولاتی که در این مرورگر باز کرده‌اید')} moreTo={null} /> : <div className="card rounded-2xl p-5"><b>{t('account.noHistory')}</b><p className="muted text-sm mt-2">{t('account.noHistoryHint')}</p><Link to="/products" className="btn-primary inline-flex mt-4">{t('account.startSourcing')}</Link></div>}
      </section>
    </>}
  </div>;
}
