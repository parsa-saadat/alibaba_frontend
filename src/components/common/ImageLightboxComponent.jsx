import { t, numberLocale, numberingSystem } from '../../i18n/runtime';
import { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import StorageImage from './StorageImageComponent';
export default function ImageLightboxComponent({
  file,
  files = [],
  initialIndex = 0,
  alt = t('تصویر'),
  onClose,
}) {
  const dialog = useRef(null),
    stage = useRef(null),
    drag = useRef(null),
    moved = useRef(false),
    close = useRef(onClose);
  close.current = onClose;
  const [index, setIndex] = useState(initialIndex),
    [scale, setScale] = useState(1);
  const count = (n) => new Intl.NumberFormat(numberLocale, { numberingSystem }).format(n);
  const gallery = files.length ? files : file ? [file] : [];
  useEffect(() => {
    if (!file) return;
    setIndex(Math.min(initialIndex, gallery.length - 1));
    setScale(1);
    dialog.current?.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [file, initialIndex]);
  useEffect(() => {
    setScale(1);
    dialog.current
      ?.querySelector('.image-viewer-thumbnails [aria-current="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (stage.current) {
      stage.current.scrollTop = 0;
      stage.current.scrollLeft = 0;
    }
  }, [index]);
  const move = (step) => setIndex((v) => (v + step + gallery.length) % gallery.length);
  if (!file) return null;
  return (
    <dialog
      ref={dialog}
      className="image-viewer"
      aria-label={alt}
      onClick={(e) => {
        if (moved.current) {
          moved.current = false;
          return;
        }
        if (
          e.target.closest(
            'button, .image-viewer-toolbar, .image-viewer-thumbnails, .image-viewer-arrows',
          )
        )
          return;
        const image = stage.current?.querySelector('img');
        if (!image || !image.naturalWidth) {
          if (e.target === e.currentTarget) dialog.current.close();
          return;
        }
        const rect = image.getBoundingClientRect();
        const ratio = Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
        const width = image.naturalWidth * ratio,
          height = image.naturalHeight * ratio;
        const left = rect.left + (rect.width - width) / 2,
          top = rect.top + (rect.height - height) / 2;
        if (
          e.clientX < left ||
          e.clientX > left + width ||
          e.clientY < top ||
          e.clientY > top + height
        )
          dialog.current.close();
      }}
      onClose={() => close.current?.()}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          move(1);
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          move(-1);
        }
      }}
    >
      <div className="image-viewer-toolbar">
        <span>{alt}</span>
        <b dir="ltr">
          {count(index + 1)} / {count(gallery.length)}
        </b>
        <div>
          <button
            type="button"
            aria-label={t('کوچک‌نمایی')}
            onClick={() => setScale((v) => Math.max(1, v - 0.5))}
          >
            <ZoomOut size={20} />
          </button>
          <button type="button" aria-label={t('اندازه اصلی')} onClick={() => setScale(1)}>
            <RotateCcw size={19} />
          </button>
          <button
            type="button"
            aria-label={t('بزرگ‌نمایی')}
            onClick={() => setScale((v) => Math.min(4, v + 0.5))}
          >
            <ZoomIn size={20} />
          </button>
          <button className="icon-control" type="button" aria-label={t('بستن')} onClick={() => dialog.current.close()}>
            <X size={25} />
          </button>
        </div>
      </div>
      <div className="image-viewer-layout">
        <div className="image-viewer-thumbnails">
          {gallery.map((image, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${t('تصویر')} ${count(i + 1)}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => setIndex(i)}
            >
              <StorageImage file={image} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        <div className="image-viewer-main">
          <div
            ref={stage}
            className={`image-viewer-stage ${scale > 1 ? 'is-zoomed' : ''}`}
            onDoubleClick={() => setScale((v) => (v === 1 ? 2 : 1))}
            onPointerDown={(e) => {
              moved.current = false;
              if (scale <= 1 || e.pointerType === 'touch') return;
              drag.current = {
                x: e.clientX,
                y: e.clientY,
                left: stage.current.scrollLeft,
                top: stage.current.scrollTop,
              };
              stage.current.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              if (Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y) > 5)
                moved.current = true;
              stage.current.scrollLeft = drag.current.left + drag.current.x - e.clientX;
              stage.current.scrollTop = drag.current.top + drag.current.y - e.clientY;
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          >
            <div
              className="image-viewer-canvas"
              style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }}
            >
              <StorageImage
                key={index}
                file={gallery[index]}
                alt={alt}
                eager
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          {gallery.length > 1 && (
            <div className="image-viewer-arrows">
              <button className="icon-control" type="button" aria-label={t('reviews.previous')} onClick={() => move(-1)}>
                <ChevronUp size={23} />
              </button>
              <button className="icon-control" type="button" aria-label={t('reviews.next')} onClick={() => move(1)}>
                <ChevronDown size={23} />
              </button>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
