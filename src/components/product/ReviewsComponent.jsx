import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { X, MessageSquare, Pencil, ArrowUpDown } from 'lucide-react';
import { t } from '../../i18n/runtime';
import { useShop } from '../../contexts/ShopContext';
import { authHeaders } from '../../utils/helpers/storage';
import ReviewThread, {
  ReviewComposer,
  ReviewStars,
  reviewNumber as n,
} from './ReviewThreadComponent';
export { ReviewStars } from './ReviewThreadComponent';
const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';
function ReviewList({ type, id, expanded = false, incremental = false, onSummary }) {
  const { user } = useShop();
  const [data, setData] = useState(null),
    [rating, setRating] = useState(''),
    [sort, setSort] = useState('newest'),
    [page, setPage] = useState(1),
    [revision, refresh] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [writing, setWriting] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    if (incremental && page === 1) setData(null);
    axios
      .get(`${API}/reviews/${type}/${id}`, {
        ...authHeaders(),
        signal: controller.signal,
        params: { page, limit: expanded ? 10 : 3, rating: rating || undefined, sort },
      })
      .then((r) => {
        if (controller.signal.aborted) return;
        const body = r.data.body;
        setData((previous) =>
          incremental && page > 1 && previous
            ? {
                ...body,
                data: [
                  ...new Map(
                    [...previous.data, ...body.data].map((row) => [String(row._id), row]),
                  ).values(),
                ],
              }
            : body,
        );
        onSummary?.(r.data.body.summary);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(t('reviews.loadError'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [type, id, page, rating, sort, revision, user?._id]);
  const summary = data?.summary;
  return (
    <div className="reviews-body" aria-busy={loading}>
      {summary && (
        <div className="reviews-overview">
          <div className="reviews-score">
            <strong>{summary.count ? n(summary.average) : '—'}</strong>
            <div>
              <ReviewStars value={summary.average} />
              <p className="muted">{t('reviews.based', { count: n(summary.count) })}</p>
            </div>
          </div>
          <div className="reviews-distribution">
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => {
                  setRating(String(star));
                  setPage(1);
                }}
                aria-label={`${n(star)} ${t('reviews.stars')}`}
              >
                <span>{n(star)} ★</span>
                <i>
                  <b
                    style={{
                      width: `${summary.count ? (summary.distribution[star] / summary.count) * 100 : 0}%`,
                    }}
                  />
                </i>
                <span>{n(summary.distribution[star])}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="reviews-tools">
        <div className="reviews-filters">
          <button
            className={`review-pill ${!rating ? 'active' : ''}`}
            type="button"
            onClick={() => {
              setRating('');
              setPage(1);
            }}
          >
            {t('reviews.all')}
          </button>
          <label className="review-pill">
            {t('reviews.rating')}
            <select
              aria-label={t('reviews.rating')}
              value={rating}
              onChange={(e) => {
                setRating(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('reviews.all')}</option>
              {[5, 4, 3, 2, 1].map((s) => (
                <option key={s} value={s}>
                  {n(s)} ★
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="reviews-sort">
          <ArrowUpDown size={15} />
          <select
            aria-label={t('reviews.sort')}
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
      <div className="reviews-write">
        {user ? (
          <button
            type="button"
            className="review-button primary"
            onClick={() => setWriting((v) => !v)}
          >
            <Pencil size={15} />
            {t('reviews.write')}
          </button>
        ) : (
          <Link className="review-button secondary" to="/auth/pre">
            {t('reviews.login')}
          </Link>
        )}
        <span className="muted">{t('reviews.multiple')}</span>
      </div>
      {writing && (
        <ReviewComposer
          type={type}
          id={id}
          onDone={() => {
            setWriting(false);
            setPage(1);
            refresh((v) => v + 1);
          }}
          onCancel={() => setWriting(false)}
        />
      )}
      {error && (
        <p className="reviews-error" role="alert">
          {error}
          <button
            type="button"
            className="review-button primary"
            onClick={() => refresh((v) => v + 1)}
          >
            {t('reviews.retry')}
          </button>
        </p>
      )}
      {loading && !(incremental && data?.data?.length) ? (
        <div className="reviews-loading" role="status">
          {t('reviews.loading')}
        </div>
      ) : (
        (!error || incremental) && (
          <>
            {!data?.data?.length && (
              <div className="reviews-empty">
                <MessageSquare size={30} />
                <p>{t('reviews.empty')}</p>
              </div>
            )}
            {data?.data?.map((row) => (
              <ReviewThread
                key={row._id}
                row={row}
                type={type}
                id={id}
                onRefresh={() => {
                  if (incremental) setPage(1);
                  refresh((v) => v + 1);
                }}
              />
            ))}
            {incremental && data?.data?.length < data?.total && (
              <div className="store-more-row">
                <button
                  type="button"
                  className="review-button secondary"
                  disabled={loading || !!error}
                  onClick={() => setPage((v) => v + 1)}
                >
                  {loading ? t('reviews.loading') : t('reviews.loadMore')}
                  <span>
                    {n(data.data.length)} / {n(data.total)}
                  </span>
                </button>
              </div>
            )}
            {!incremental && data?.total > data?.limit && (
              <div className="review-pagination">
                <button
                  type="button"
                  className="review-button secondary"
                  disabled={page === 1}
                  onClick={() => setPage((v) => v - 1)}
                >
                  {t('reviews.previous')}
                </button>
                <span>
                  {n(page)} / {n(Math.ceil(data.total / data.limit))}
                </span>
                <button
                  type="button"
                  className="review-button secondary"
                  disabled={page * data.limit >= data.total}
                  onClick={() => setPage((v) => v + 1)}
                >
                  {t('reviews.next')}
                </button>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
export default function ReviewsComponent({ productId, storeId, incremental = false }) {
  const [tab, setTab] = useState(productId ? 'product' : 'store'),
    [summaries, setSummaries] = useState({}),
    [open, setOpen] = useState(false),
    [version, setVersion] = useState(0);
  const dialog = useRef(null);
  const type = tab === 'store' && storeId ? 'store' : productId ? 'product' : 'store',
    id = type === 'product' ? productId : storeId;
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);
  useEffect(() => {
    if (!productId || !storeId) return;
    const c = new AbortController();
    axios
      .get(`${API}/reviews/store/${storeId}`, {
        ...authHeaders(),
        signal: c.signal,
        params: { limit: 1 },
      })
      .then((r) => {
        if (r.data?.body?.summary) setSummaries((v) => ({ ...v, store: r.data.body.summary }));
      })
      .catch(() => {});
    return () => c.abort();
  }, [productId, storeId]);
  if (!id) return null;
  return (
    <section className="reviews-section card" id="ratings-reviews">
      <h2>{t('reviews.title')}</h2>
      <div className="reviews-tabs" role="tablist" aria-label={t('reviews.title')}>
        {[
          ['product', productId],
          ['store', storeId],
        ]
          .filter(([, v]) => v)
          .map(([key]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={type === key}
              onClick={() => setTab(key)}
            >
              {t(`reviews.${key}`)}
              {summaries[key] ? ` (${n(summaries[key].count)})` : ''}
            </button>
          ))}
      </div>
      <ReviewList
        incremental={incremental}
        key={`${type}-${id}-${version}`}
        type={type}
        id={id}
        onSummary={(s) => setSummaries((v) => ({ ...v, [type]: s }))}
      />
      {!incremental && (
        <button type="button" className="reviews-show-all" onClick={() => setOpen(true)}>
          {t('reviews.showAll')}
        </button>
      )}
      <dialog
        ref={dialog}
        className="reviews-dialog"
        onClose={() => {
          setOpen(false);
          setVersion((v) => v + 1);
        }}
      >
        <div className="reviews-dialog-heading">
          <h3>
            {t(`reviews.${type}`)}
            {summaries[type] ? ` (${n(summaries[type].count)})` : ''}
          </h3>
          <button
            type="button"
            className="review-button secondary icon"
            aria-label={t('reviews.close')}
            onClick={() => dialog.current.close()}
          >
            <X size={22} />
          </button>
        </div>
        {open && (
          <ReviewList
            type={type}
            id={id}
            expanded
            onSummary={(s) => setSummaries((v) => ({ ...v, [type]: s }))}
          />
        )}
      </dialog>
    </section>
  );
}
