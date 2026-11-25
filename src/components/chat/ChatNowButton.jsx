import React from 'react';
import { t as translateText } from '../../i18n/runtime.js';
import { Loader2, MessageCircle } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { getId } from '../../utils/helpers/response';

/*
 * دکمهٔ «Chat now» که روی همهٔ صفحه‌های محصول، صفحهٔ فروشگاه و کارت تأمین‌کننده
 * دیده می‌شود. گفتگو را با همان محصول به‌عنوان پین باز می‌کند.
 */
function ChatNowButton({ seller_id, product_id, store_id, variant = 'outline', className = '', label }) {
  const { openChat, dock } = useChat();
  const sellerId = getId(seller_id);
  if (!sellerId) return null;

  const busy = dock.busy;

  const open = () =>
    openChat({
      seller_id: sellerId,
      ...(product_id ? { product_id: getId(product_id) } : {}),
      ...(store_id ? { store_id: getId(store_id) } : {}),
    });

  const base =
    variant === 'solid'
      ? 'chat-now is-solid'
      : variant === 'ghost'
        ? 'chat-now is-ghost'
        : 'chat-now';

  return (
    <button
      type="button"
      className={`${base} ${className}`.trim()}
      onClick={open}
      disabled={busy}
      aria-label={label || translateText('chat.chatNow')}
      title={label || translateText('chat.chatNow')}
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
      <span>{label || translateText('chat.chatNow')}</span>
    </button>
  );
}

export default ChatNowButton;
