import { t as translateText } from '../../i18n/runtime.js';
import React, { useEffect, useState } from 'react';
import { ImageOff, LoaderCircle, ZoomIn } from 'lucide-react';
import { resolveStorageImage } from '../../utils/helpers/storage-files';
import { getId } from '../../utils/helpers/response';

function StorageImageComponent({
  file,
  alt = '',
  className = '',
  eager = false,
  fallback = null,
  compact = false,
  onZoom = null,
}) {
  const key =
    typeof file === 'string' ? file : getId(file) || file?.url || (file ? 'embedded' : '');
  const [state, setState] = useState({ key: '', url: '', error: false, loaded: false });
  const ready = state.key === key;
  const url = ready ? state.url : '';
  const loaded = ready && state.loaded;
  useEffect(() => {
    let active = true;
    setState({ key, url: '', error: false, loaded: false });
    if (file)
      resolveStorageImage(file)
        .then((url) => {
          if (active) setState({ key, url: url || '', error: !url, loaded: false });
        })
        .catch(() => {
          if (active) setState({ key, url: '', error: true, loaded: false });
        });
    return () => {
      active = false;
    };
  }, [file, key]);
  const fail = () =>
    setState((previous) =>
      previous.key === key ? { ...previous, error: true, loaded: false } : previous,
    );
  const finish = async (event) => {
    const image = event.currentTarget;
    try {
      await image.decode?.();
    } catch {
      /* onLoad succeeded; decoding may already be complete */
    }
    setState((previous) =>
      previous.key === key && previous.url === image.getAttribute('src')
        ? { ...previous, loaded: true }
        : previous,
    );
  };
  if (!file || (ready && state.error)) {
    return fallback !== null ? (
      fallback
    ) : (
      <span
        className={`storage-image-placeholder ${className}`}
        role="img"
        aria-label={alt || translateText('تصویر در دسترس نیست')}
      >
        <ImageOff size={compact ? 16 : 22} />
        {!compact && (
          <span className="storage-image-caption">{translateText('تصویر در دسترس نیست')}</span>
        )}
      </span>
    );
  }
  const content = (
    <>
      {url && (
        <img
          src={url}
          alt={alt}
          className={`storage-image-content ${loaded ? 'is-loaded' : ''}`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={finish}
          onError={fail}
        />
      )}
      {!loaded && (
        <span
          className="storage-image-loading"
          role="status"
          aria-label={translateText('در حال بارگذاری {{v0}}', { v0: alt })}
        >
          <span className="storage-image-shimmer" />
          <LoaderCircle
            className="animate-spin relative"
            size={compact ? 17 : 24}
            aria-hidden="true"
          />
        </span>
      )}
      {onZoom && loaded && (
        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center text-white">
          <ZoomIn size={18} />
        </span>
      )}
    </>
  );
  const classes = `storage-image-frame relative overflow-hidden group ${className}`;
  return onZoom ? (
    <button
      type="button"
      className={classes}
      onClick={() => loaded && onZoom(file, alt)}
      aria-label={translateText('بزرگ‌نمایی {{v0}}', { v0: alt })}
      aria-busy={!loaded}
    >
      {content}
    </button>
  ) : (
    <span className={classes} aria-busy={!loaded}>
      {content}
    </span>
  );
}
export default StorageImageComponent;
