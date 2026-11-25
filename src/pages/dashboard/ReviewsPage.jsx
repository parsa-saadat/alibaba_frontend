import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  MessageSquare,
  SlidersHorizontal,
  RefreshCw,
  Package,
  Store,
  ArrowUpRight,
  Image as ImageIcon,
  MessagesSquare,
  X,
  Search,
  FilterX,
} from 'lucide-react';
import { t } from '../../i18n/runtime';
import { authHeaders } from '../../utils/helpers/storage';
import { useShop } from '../../contexts/ShopContext';
import { displayText } from '../../utils/helpers/display-text';
import PanelPageHeader from '../../components/panel/PanelPageHeaderComponent';
import EntitySelect from '../../components/panel/EntitySelectComponent';
import StorageImage from '../../components/common/StorageImageComponent';
import ReviewThread, { reviewNumber as n } from '../../components/product/ReviewThreadComponent';
const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';
const empty = { product_id: '', store_id: '', user_id: '', type: '', rating: '' };
export default function ReviewsPage() {
  const { user } = useShop();
  const { pathname } = useLocation();
  const canFilterAuthors = user?.role === 'admin' && !pathname.startsWith('/seller');
  const [filters, setFilters] = useState(empty),
    [labels, setLabels] = useState({}),
    [applied, setApplied] = useState({}),
    [page, setPage] = useState(1),
    [sort, setSort] = useState('newest'),
    [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [revision, refresh] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError('');
    axios
      .get(`${API}/manage/reviews`, {
        ...authHeaders(),
        signal: c.signal,
        params: { ...Object.fromEntries(Object.entries(applied).filter(([key]) => key !== 'user_id' || canFilterAuthors)), page, limit: 10, sort },
      })
      .then((r) => setData(r.data.body))
      .catch(() => {
        if (!c.signal.aborted) setError(t('reviews.loadError'));
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [applied, page, sort, revision, canFilterAuthors]);
  const change = (key, value, label) => {
    if (key === 'user_id' && !canFilterAuthors) return;
    setFilters((v) => ({ ...v, [key]: value }));
    if (label !== undefined) setLabels((v) => ({ ...v, [key]: label }));
  };
  const reset = () => {
    setFilters(empty);
    setApplied({});
    setLabels({});
    setPage(1);
  };
  const quickFilter = (key, value, label) => {
    if (key === 'user_id' && !canFilterAuthors) return;
    setFilters((v) => ({ ...v, [key]: value }));
    setLabels((v) => ({ ...v, [key]: label }));
    setApplied((v) => ({ ...v, [key]: value }));
    setPage(1);
  };
  const localUsers = Array.from(
    new Map(
      (data?.data || [])
        .flatMap((row) => [row, ...(row.replies || [])])
        .filter((row) => row.user_id)
        .map((row) => [String(row.user_id), { _id: String(row.user_id), label: row.author }]),
    ).values(),
  );
  const active = Object.entries(applied).filter(([key, value]) => value && (key !== 'user_id' || canFilterAuthors));
  return (
    <div className="panel-reviews reviews-workspace">
      <PanelPageHeader
        icon={MessageSquare}
        title={t('reviews.manage')}
        subtitle={t(
          user?.role === 'admin' ? 'reviews.adminDescription' : 'reviews.sellerDescription',
        )}
        onRefresh={() => refresh((v) => v + 1)}
        refreshing={loading}
        refreshLabel={t('reviews.refresh')}
      />
      <form
        className="card review-filter-panel"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setApplied(Object.fromEntries(Object.entries(filters).filter(([key, v]) => v && (key !== 'user_id' || canFilterAuthors))));
        }}
      >
        <div className="review-filter-title">
          <span>
            <SlidersHorizontal size={18} />
            <b>{t('reviews.filters')}</b>
          </span>
          <small>{t('reviews.filterHint')}</small>
        </div>
        <div className="review-filter-entities">
          {(canFilterAuthors
            ? ['product_id', 'store_id', 'user_id']
            : ['product_id', 'store_id']
          ).map((key) => (
            <EntitySelect
              key={key}
              kind={key.split('_')[0]}
              label={t(`reviews.filter.${key}`)}
              value={filters[key]}
              selectedLabel={labels[key]}
              onChange={(value, label) => change(key, value, label)}
              endpoint={
                key === 'product_id'
                  ? '/perm/products'
                  : key === 'store_id'
                    ? '/perm/stores'
                    : canFilterAuthors
                      ? '/user'
                      : null
              }
              localOptions={localUsers}
            />
          ))}
        </div>
        <div className="review-filter-bottom">
          <label>
            {t('reviews.type')}
            <select
              className="input"
              value={filters.type}
              onChange={(e) => change('type', e.target.value)}
            >
              <option value="">{t('reviews.all')}</option>
              <option value="product">{t('reviews.product')}</option>
              <option value="store">{t('reviews.store')}</option>
            </select>
          </label>
          <label>
            {t('reviews.rating')}
            <select
              className="input"
              value={filters.rating}
              onChange={(e) => change('rating', e.target.value)}
            >
              <option value="">{t('reviews.all')}</option>
              {[5, 4, 3, 2, 1].map((star) => (
                <option key={star} value={star}>
                  {n(star)} ★
                </option>
              ))}
            </select>
          </label>
          <div className="review-filter-actions">
            <button className="review-button primary" type="submit">
              <Search size={16} />
              {t('reviews.apply')}
            </button>
            <button className="review-button secondary" type="button" onClick={reset}>
              <FilterX size={16} />
              {t('reviews.reset')}
            </button>
          </div>
        </div>
      </form>
      {active.length > 0 && (
        <div className="review-applied">
          {active.map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                change(key, '', '');
                setApplied((v) => {
                  const next = { ...v };
                  delete next[key];
                  return next;
                });
                setPage(1);
              }}
            >
              <span>
                {t(
                  key === 'rating'
                    ? 'reviews.rating'
                    : key === 'type'
                      ? 'reviews.type'
                      : `reviews.filter.${key}`,
                )}
                :{' '}
                {key === 'rating'
                  ? `${n(Number(value))} ★`
                  : key === 'type'
                    ? t(`reviews.${value}`)
                    : labels[key] || `#${String(value).slice(-6)}`}
              </span>
              <X size={13} />
            </button>
          ))}
        </div>
      )}
      <div className="reviews-results-heading">
        <div>
          <h2>{t('reviews.inbox')}</h2>
          <span>{t('reviews.threadCount', { count: n(data?.total || 0) })}</span>
        </div>
        <label>
          {t('reviews.sort')}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            {['newest', 'highest', 'lowest'].map((s) => (
              <option key={s} value={s}>
                {t(`reviews.${s}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? (
        <div className="card reviews-panel-state" role="alert">
          <MessageSquare size={30} />
          <h3>{t('reviews.loadError')}</h3>
          <button
            className="review-button primary"
            type="button"
            onClick={() => refresh((v) => v + 1)}
          >
            <RefreshCw size={16} />
            {t('reviews.retry')}
          </button>
        </div>
      ) : loading ? (
        <div className="reviews-loading-cards" role="status" aria-label={t('reviews.loading')}>
          {[0, 1, 2].map((i) => (
            <div className="card" key={i}>
              <i />
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : !data?.data?.length ? (
        <div className="card reviews-panel-state">
          <MessageSquare size={32} />
          <h3>{t('reviews.noResults')}</h3>
          <p>{t('reviews.adjustFilters')}</p>
          {active.length > 0 && (
            <button type="button" className="review-button secondary" onClick={reset}>
              {t('reviews.reset')}
            </button>
          )}
        </div>
      ) : (
        <div className="review-inbox-list">
          {data.data.map((row) => {
            const TargetIcon = row.target_type === 'product' ? Package : Store;
            const targetName = displayText(row.target_name) || t(`reviews.${row.target_type}`);
            return (
              <article
                className={`card review-inbox-card ${row.deleted ? 'is-deleted' : ''}`}
                key={row._id}
              >
                <div className="review-inbox-card-heading">
                  <a
                    className="review-target-link"
                    href={`/${row.target_type}/${row.target_id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="review-target-icon">
                      {row.target_image ? <StorageImage file={row.target_image} alt={targetName} className="w-full h-full object-contain" /> : <TargetIcon size={19} />}
                    </span>
                    <span>
                      <small>{t(`reviews.${row.target_type}`)}</small>
                      <b>{targetName}</b>
                    </span>
                    <ArrowUpRight size={16} />
                  </a>
                  <div className="review-content-badges">
                    {!!row.images?.length && (
                      <span>
                        <ImageIcon size={13} />
                        {n(row.images.length)}
                      </span>
                    )}
                    {!!row.replies?.length && (
                      <span>
                        <MessagesSquare size={13} />
                        {t('reviews.replyCount', { count: n(row.replies.length) })}
                      </span>
                    )}
                  </div>
                </div>
                <ReviewThread
                  row={row}
                  type={row.target_type}
                  id={row.target_id}
                  managed
                  admin={user?.role === 'admin'}
                  onRefresh={() => refresh((v) => v + 1)}
                />
                <div className="review-inbox-card-footer">
                  <span dir="ltr">#{String(row._id).slice(-8)}</span>
                  <div>
                    {canFilterAuthors && (
                      <button
                        type="button"
                        className="review-button text"
                        onClick={() => quickFilter('user_id', String(row.user_id), row.author)}
                      >
                        {t('reviews.onlyUser')}
                      </button>
                    )}
                    <button
                      type="button"
                      className="review-button text"
                      onClick={() =>
                        quickFilter(
                          row.target_type === 'product' ? 'product_id' : 'store_id',
                          String(row.target_id),
                          targetName,
                        )
                      }
                    >
                      {t('reviews.onlyTarget')}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <div className="review-pagination">
        <button
          type="button"
          className="review-button secondary"
          disabled={page === 1 || loading}
          onClick={() => setPage((v) => v - 1)}
        >
          {t('reviews.previous')}
        </button>
        <span>
          {n(page)} / {n(Math.max(1, Math.ceil((data?.total || 0) / 10)))}
        </span>
        <button
          type="button"
          className="review-button secondary"
          disabled={page * 10 >= (data?.total || 0) || loading}
          onClick={() => setPage((v) => v + 1)}
        >
          {t('reviews.next')}
        </button>
      </div>
    </div>
  );
}
