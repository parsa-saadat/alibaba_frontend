import { t as translateText } from '../../i18n/runtime.js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import { X } from 'lucide-react';
import { resolveStorageSrc, storageIdFromSrc } from '../../utils/helpers/storage-files';

const marked = new Marked({ gfm: true, breaks: true, async: false });

/*
 * هاست‌های مجاز برای ویدیوی جاسازی‌شده.
 * هر iframe دیگری (آگهی، اسکریپت، ردیاب) حذف می‌شود.
 */
const EMBED_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'aparat.com',
  'www.aparat.com',
];

const isAllowedEmbed = (src) => {
  try {
    const url = new URL(src, window.location.origin);
    return url.protocol === 'https:' && EMBED_HOSTS.includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
};

const MEDIA_STYLE = {
  display: 'block',
  maxWidth: '100%',
  height: 'auto',
  borderRadius: '16px',
  margin: '18px auto',
  border: '1px solid var(--border)',
  background: 'var(--bg2)',
};

const FRAME_STYLE = {
  display: 'block',
  width: '100%',
  aspectRatio: '16 / 9',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  margin: '18px 0',
  background: '#000',
};

/**
 * تزئین HTML توضیحات و آماده‌سازی رسانه‌ها.
 * روی یک DOM جداگانه انجام می‌شود و خروجی، رشته‌ی HTML نهایی است؛
 * بنابراین React همیشه همان چیزی را رندر می‌کند که ما ساختیم.
 */
const decorate = (html, resolved) => {
  if (!html) return '';
  const box = document.createElement('div');
  box.innerHTML = html;

  /* فرم‌های جاسازی: فقط هاست‌های مجاز */
  [...box.querySelectorAll('iframe')].forEach((frame) => {
    const src = frame.getAttribute('src') || '';
    if (!isAllowedEmbed(src)) {
      frame.remove();
      return;
    }
    Object.assign(frame.style, FRAME_STYLE);
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('loading', 'lazy');
  });

  /* ویدیوی آپلودی */
  [...box.querySelectorAll('video')].forEach((video) => {
    Object.assign(video.style, MEDIA_STYLE, { aspectRatio: '16 / 9', background: '#000' });
    video.setAttribute('controls', '');
  });

  /* تصویرها: بزرگ‌نمایی، lazy و تبدیل آدرس استوریج به data-url */
  [...box.querySelectorAll('img')].forEach((img) => {
    const src = img.getAttribute('src') || '';
    const id = storageIdFromSrc(src);
    const finalSrc = (id && resolved[src]) || src;

    Object.assign(img.style, MEDIA_STYLE);
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
    img.style.cursor = id || /^https?:/i.test(src) ? 'zoom-in' : 'default';
    if (!id || resolved[src]) {
      img.setAttribute('src', finalSrc);
    } else {
      img.setAttribute('width', '240');
      img.setAttribute('height', '160');
      img.setAttribute('alt', img.getAttribute('alt') || translateText('در حال بارگذاری تصویر…'));
    }
  });

  /* جدول‌ها: قاب اسکرول افقی + استایل خانه‌ها */
  [...box.querySelectorAll('table')].forEach((table) => {
    /* صفحه‌ی محصول کلاس [&_table]:block دارد؛ اینجا به حالت جدول برمی‌گردانیم تا ستون‌ها پر شوند */
    table.style.display = 'table';
    table.style.width = '100%';
    table.style.tableLayout = 'auto';
    table.style.borderCollapse = 'collapse';
    table.style.minWidth = '320px';

    [...table.querySelectorAll('th, td')].forEach((cell) => {
      cell.style.border = '1px solid var(--border)';
      cell.style.padding = '10px 12px';
      cell.style.textAlign = 'right';
      cell.style.verticalAlign = 'middle';
    });
    [...table.querySelectorAll('thead th, tr > th')].forEach((cell) => {
      cell.style.background = 'var(--card2)';
      cell.style.fontWeight = '800';
    });
    [...table.querySelectorAll('tbody tr:nth-child(even)')].forEach((row) => {
      row.style.background = 'rgba(160,160,160, 0.06)';
    });

    const wrap = document.createElement('div');
    wrap.setAttribute('data-md-scroll', '1');
    wrap.style.overflowX = 'auto';
    wrap.style.margin = '18px 0';
    wrap.style.borderRadius = '16px';
    wrap.style.border = '1px solid var(--border)';
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });

  return box.innerHTML;
};

/**
 * رندر توضیحات محصول (Markdown + HTML مجاز).
 *
 * نکته‌ی مهم: آدرس تصویرهایی که از ویرایشگر آپلود می‌شوند به شکل
 * `<API>/storage/<id>` ذخیره می‌شوند و خودِ این آدرس فایل تصویری برنمی‌گرداند
 * (روت عمومی JSON می‌دهد)؛ پس قبل از رندر با API واقعی به data-url تبدیل می‌شوند.
 */
function MarkdownContentComponent({ content, className = '' }) {
  const hostRef = useRef(null);
  const [zoom, setZoom] = useState(null);
  const [resolved, setResolved] = useState({});

  const html = useMemo(() => {
    if (typeof content !== 'string' || !content.trim()) return '';
    const rendered = marked.parse(content);
    return DOMPurify.sanitize(rendered, {
      USE_PROFILES: { html: true },
      ADD_TAGS: ['iframe', 'video', 'source', 'figure', 'figcaption'],
      ADD_ATTR: [
        'allowfullscreen',
        'frameborder',
        'controls',
        'loading',
        'target',
        'rel',
        'colspan',
        'rowspan',
        'alt',
        'title',
      ],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['style', 'script', 'form', 'input', 'button', 'textarea', 'select', 'object'],
      FORBID_ATTR: ['style', 'id', 'name'],
    });
  }, [content]);

  /* آدرس تصویرهای استوریج که باید به data-url تبدیل شوند */
  const storageSrcs = useMemo(() => {
    if (!html) return [];
    const found = new Set();
    const probe = document.createElement('div');
    probe.innerHTML = html;
    probe.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (storageIdFromSrc(src)) found.add(src);
    });
    return [...found];
  }, [html]);
  const srcKey = storageSrcs.join('|');

  useEffect(() => {
    if (!storageSrcs.length) return undefined;
    let active = true;
    Promise.all(storageSrcs.map((src) => resolveStorageSrc(src).then((url) => [src, url]))).then(
      (pairs) => {
        if (!active) return;
        const next = {};
        pairs.forEach(([src, url]) => {
          if (url && url !== src) next[src] = url;
        });
        if (Object.keys(next).length) setResolved((prev) => ({ ...prev, ...next }));
      },
    );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcKey]);

  const finalHtml = useMemo(() => decorate(html, resolved), [html, resolved]);

  const onClick = useCallback((event) => {
    const img = event.target.closest?.('img');
    if (!img || img.style.cursor !== 'zoom-in') return;
    setZoom({ src: img.getAttribute('src') || '', alt: img.getAttribute('alt') || '' });
  }, []);

  const closeZoom = useCallback(() => setZoom(null), []);

  if (!html) {
    return (
      <p className="muted" style={{ margin: 0 }}>
        {translateText('توضیحاتی برای این محصول ثبت نشده است. ')}
      </p>
    );
  }

  return (
    <>
      <div
        ref={hostRef}
        dir="auto"
        className={`markdown-body ${className}`.trim()}
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: finalHtml }}
      />

      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeZoom}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 220,
            background: 'rgba(20,20,20, 0.86)',
            backdropFilter: 'blur(6px)',
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
        >
          <button
            type="button"
            onClick={closeZoom}
            aria-label={translateText('بستن')}
            style={{
              position: 'absolute',
              top: 18,
              left: 18,
              width: 40,
              height: 40,
              borderRadius: 12,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(255,255,255,0.14)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
          <img
            src={zoom.src}
            alt={zoom.alt}
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: '92vw', maxHeight: '86vh', borderRadius: 18, objectFit: 'contain' }}
          />
        </div>
      )}
    </>
  );
}

export default MarkdownContentComponent;
