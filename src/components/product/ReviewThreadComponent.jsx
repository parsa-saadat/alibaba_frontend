import { direction as siteDirection } from '../../i18n/runtime';
import { useState } from 'react';
import axios from 'axios';
import { Star, ImagePlus, X, Reply, Pencil, Trash2, Package, Store, ChevronDown, ArrowUpRight } from 'lucide-react';
import { t, numberLocale, numberingSystem } from '../../i18n/runtime';
import { useShop } from '../../contexts/ShopContext';
import { authHeaders } from '../../utils/helpers/storage';
import { displayText } from '../../utils/helpers/display-text';
import { formatPrice } from '../../utils/helpers/format';
import StorageImage from '../common/StorageImageComponent';
import ImageLightbox from '../common/ImageLightboxComponent';
const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';
export const reviewNumber = (n) =>
  new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 1, numberingSystem }).format(n);
export function ReviewStars({ value = 0 }) {
  return (
    <span
      className="review-stars"
      role="img"
      aria-label={`${reviewNumber(value)} / ${reviewNumber(5)}`}
    >
      <span aria-hidden="true">★★★★★</span>
      <span aria-hidden="true" style={{ width: `${Math.max(0, Math.min(5, value)) * 20}%` }}>
        ★★★★★
      </span>
    </span>
  );
}
export function ReviewComposer({ type, id, existing = null, parentId = null, onDone, onCancel }) {
  const [rating, setRating] = useState(existing?.rating || 0),
    [text, setText] = useState(existing?.text || ''),
    [images, setImages] = useState(existing?.images || []),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState('');
  async function upload(e) {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    if (
      files.length + images.length > 5 ||
      files.some(
        (f) =>
          f.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(f.type),
      )
    ) {
      setError(t('reviews.imageLimit'));
      return;
    }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      const r = await axios.post(`${API}/review-images`, fd, authHeaders());
      setImages((v) => [...v, ...r.data.body.map((f) => f._id)]);
    } catch {
      setError(t('reviews.uploadError'));
    } finally {
      setUploading(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const url = `${API}/reviews/${type}/${id}`;
      const payload = { text: text.trim(), images, ...(!parentId ? { rating } : {}) };
      if (existing) await axios.put(`${url}/${existing._id}`, payload, authHeaders());
      else await axios.post(parentId ? `${url}/${parentId}/replies` : url, payload, authHeaders());
      onDone?.();
    } catch (e) {
      setError(e.response?.status === 403 ? t('reviews.denied') : t('reviews.saveError'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="review-form card2" onSubmit={save}>
      {!parentId && (
        <>
          <h4>{t('reviews.yourRating')}</h4>
          <div
            className="review-rating-input"
            role="radiogroup"
            aria-label={t('reviews.yourRating')}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${reviewNumber(n)} / ${reviewNumber(5)}`}
                onClick={() => setRating(n)}
              >
                <Star size={24} fill={n <= rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </>
      )}
      <label>
        {t(parentId ? 'reviews.replyText' : 'reviews.yourReview')}
        <textarea
          className="input"
          rows={3}
          required
          minLength={3}
          maxLength={3000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <div className="review-attached">
        {images.map((image, index) => (
          <div key={image}>
            <StorageImage file={image} className="w-full h-full object-cover" />
            <button
              type="button"
              aria-label={t('reviews.removeImage')}
              onClick={() => setImages((v) => v.filter((_, i) => i !== index))}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="review-form-actions">
        <label className={`review-button secondary ${uploading ? 'is-disabled' : ''}`}>
          <ImagePlus size={16} />
          {t(uploading ? 'reviews.uploading' : 'reviews.addPhotos')}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy || uploading || images.length >= 5}
            onChange={upload}
            className="sr-only"
          />
        </label>
        <span className="muted review-image-hint">{t('reviews.imageHint')}</span>
      </div>
      {error && (
        <p role="alert" className="reviews-error">
          {error}
        </p>
      )}
      <div className="review-form-actions">
        <button
          className="review-button primary"
          disabled={busy || uploading || (!parentId && !rating) || text.trim().length < 3}
        >
          {t(busy ? 'reviews.saving' : parentId ? 'reviews.sendReply' : 'reviews.submit')}
        </button>
        <button
          type="button"
          className="review-button secondary"
          disabled={busy}
          onClick={onCancel}
        >
          {t('reviews.cancel')}
        </button>
      </div>
    </form>
  );
}
export default function ReviewThread({ row, type, id, onRefresh, managed = false, admin = false, target = null }) {
  const { user } = useShop();
  const reviewTarget = target || { name: row.target_name, image: row.target_image, price: row.target_price };
  const targetName = displayText(reviewTarget.name) || t(`reviews.${type}`);
  const TargetIcon = type === 'product' ? Package : Store;
  const [mode, setMode] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [zoom, setZoom] = useState(null);
  async function remove() {
    setBusy(true);
    try {
      await axios.delete(`${API}/reviews/${type}/${id}/${row._id}`, authHeaders());
      setMode(null);
      onRefresh?.();
    } catch {
      setError(t('reviews.saveError'));
    } finally {
      setBusy(false);
    }
  }
  const done = () => {
    setMode(null);
    onRefresh?.();
  };
  return (
    <article className={`review-row ${row.parent_id ? 'review-reply' : ''}`}>
      <div className="review-author">
        <span>{row.author?.[0] || 'M'}</span>
        <b>{row.author}</b>
        {['admin', 'seller'].includes(row.author_role) && (
          <small>{t(`reviews.role.${row.author_role}`)}</small>
        )}
        {row.is_mine && <small>{t('reviews.yours')}</small>}
      </div>
      <div className="review-content">
        <div className="review-row-heading">
          {row.rating != null && <ReviewStars value={row.rating} />}
          <time dateTime={row.created_at}>
            {new Intl.DateTimeFormat(numberLocale, {
              numberingSystem,
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }).format(new Date(row.created_at))}
          </time>
        </div>
        <p className="review-body-text" dir={siteDirection}>
          {row.deleted ? t('reviews.deleted') : row.text}
        </p>
        {row.images?.length > 0 && (
          <div className="review-photos">
            {row.images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setZoom(index)}
                aria-label={t('reviews.viewPhoto')}
              >
                <StorageImage file={image} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        {managed && (
          <details className="review-management-meta review-details-card">
            <summary><span><TargetIcon size={16} />{t('reviews.details')}</span><ChevronDown size={15} /></summary>
            <div className="review-details-body">
              <a className="review-details-target" href={`/${type}/${id}`} target="_blank" rel="noreferrer">
                <span className="review-details-thumbnail">{reviewTarget.image ? <StorageImage file={reviewTarget.image} alt={targetName} className="w-full h-full object-contain" /> : <TargetIcon size={28} />}</span>
                <span className="review-details-title"><small>{t(`reviews.${type}`)}</small><b>{targetName}</b>
                  {type === 'product' && reviewTarget.price && <strong>{formatPrice(reviewTarget.price.amount, reviewTarget.price.currency)}</strong>}
                  <span>{t('reviews.openTarget')} <ArrowUpRight size={13} /></span>
                </span>
              </a>
              {admin && row.user_id && <div className="review-details-reference"><span>{t('reviews.userId')}</span><code dir="ltr">{row.user_id}</code></div>}
            </div>
          </details>
        )}
        <div className="review-row-actions">
          {user && !row.parent_id && !row.deleted && (
            <button
              type="button"
              className="review-button text"
              onClick={() => setMode(mode === 'reply' ? null : 'reply')}
            >
              <Reply size={15} />
              {t('reviews.reply')}
            </button>
          )}
          {row.is_mine && !row.deleted && (
            <button type="button" className="review-button text" onClick={() => setMode('edit')}>
              <Pencil size={14} />
              {t('reviews.edit')}
            </button>
          )}
          {(row.is_mine || admin) && !row.deleted && (
            <button
              type="button"
              className="review-button text danger"
              onClick={() => setMode('delete')}
            >
              <Trash2 size={14} />
              {t('reviews.delete')}
            </button>
          )}
        </div>
        {error && (
          <p className="reviews-error" role="alert">
            {error}
          </p>
        )}
        {mode === 'delete' && (
          <div className="review-delete card2">
            <p>{t('reviews.deleteConfirm')}</p>
            <div className="review-form-actions">
              <button
                type="button"
                className="review-button primary"
                disabled={busy}
                onClick={remove}
              >
                {t('reviews.delete')}
              </button>
              <button
                type="button"
                className="review-button secondary"
                onClick={() => setMode(null)}
              >
                {t('reviews.cancel')}
              </button>
            </div>
          </div>
        )}
        {(mode === 'edit' || mode === 'reply') && (
          <ReviewComposer
            key={mode}
            type={type}
            id={id}
            existing={mode === 'edit' ? row : null}
            parentId={mode === 'reply' ? row._id : row.parent_id}
            onDone={done}
            onCancel={() => setMode(null)}
          />
        )}
        {row.replies?.map((child) => (
          <ReviewThread
            key={child._id}
            row={child}
            type={type}
            id={id}
            onRefresh={onRefresh}
            managed={managed}
            target={reviewTarget}
            admin={admin}
          />
        ))}
      </div>
      <ImageLightbox
        file={zoom != null ? row.images[zoom] : null}
        files={row.images || []}
        initialIndex={zoom || 0}
        alt={t('reviews.viewPhoto')}
        onClose={() => setZoom(null)}
      />
    </article>
  );
}
