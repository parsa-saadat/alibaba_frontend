import React from 'react';
import { Link } from 'react-router-dom';
import { t as translateText } from '../../i18n/runtime.js';
import { MapPin, Package, X } from 'lucide-react';
import StorageImageComponent from '../common/StorageImageComponent';
import { formatPrice } from '../../utils/helpers/format';
import { localizedField } from '../../i18n/content-fields';

const isProductPin = (pin) => pin?.kind === 'product' && Boolean(pin?.product_id);

/*
 * کارت «پین» که نشان می‌دهد پیام دربارهٔ کدام محصول یا فروشگاه است.
 * هم بالای کادر نوشتن می‌آید و هم داخل خود پیام ذخیره‌شده.
 */
function ChatPinComponent({ pin, onRemove, compact = false }) {
  if (!pin) return null;

  /*
   * عنوان وقتی می‌رسد که بک‌اند محصول/فروشگاه را آبریزی کرده باشد.
   * نبودِ عنوان به‌معنی «در دسترس نیست» نیست؛ فقط می‌توان گفت «دربارهٔ این …».
   */
  const title =
    localizedField(pin.title) ||
    (pin.missing
      ? translateText('chat.unavailableProduct')
      : isProductPin(pin)
        ? translateText('chat.pinProduct')
        : translateText('chat.pinStore'));
  const isProduct = isProductPin(pin);
  const hasTitle = Boolean(localizedField(pin.title));
  const to = isProduct && !pin.missing ? `/product/${pin.product_id}` : !isProduct && pin.store_id ? `/store/${pin.store_id}` : null;

  const body = (
    <>
      <span className={`chat-pin-thumb${compact ? ' is-compact' : ''}`}>
        {pin.image_id ? (
          <StorageImageComponent file={pin.image_id} alt={title} compact className="h-full w-full object-contain" />
        ) : (
          <MapPin size={16} className="muted" />
        )}
      </span>
      <span className="chat-pin-text">
        <b className="chat-pin-title">{title}</b>
        {hasTitle ? (
          <span className="chat-pin-meta">
            {isProduct
              ? pin.price != null
                ? formatPrice(pin.price, pin.currency)
                : translateText('chat.pinProduct')
              : translateText('chat.pinStore')}
          </span>
        ) : null}
      </span>
      {onRemove && (
        <button
          type="button"
          className="chat-pin-remove"
          aria-label={translateText('chat.removePin')}
          title={translateText('chat.removePin')}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove();
          }}
        >
          <X size={13} />
        </button>
      )}
    </>
  );

  if (!to)
    return (
      <div className="chat-pin" aria-label={translateText('chat.pinnedAria')}>
        {body}
      </div>
    );

  return (
    <Link to={to} className="chat-pin" aria-label={translateText('chat.pinnedAria')}>
      {body}
    </Link>
  );
}

/* آیکن کوچک پین برای سطر فهرست گفتگوها */
export function ChatPinDot({ pin }) {
  if (!pin) return null;
  return (
    <span className="chat-pin-dot" title={localizedField(pin.title) || ''}>
      {pin.kind === 'product' ? <Package size={11} /> : <MapPin size={11} />}
    </span>
  );
}

export default ChatPinComponent;
