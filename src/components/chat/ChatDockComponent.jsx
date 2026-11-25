import React, { useEffect, useState } from 'react';
import { t as translateText } from '../../i18n/runtime.js';
import { ExternalLink, Maximize2, MessageCircle, Minimize2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import ChatThreadComponent from './ChatThreadComponent';
import { personName } from '../../utils/helpers/chat-format';

/*
 * پنل شناور «Messages» پایین صفحه (مثل صفحهٔ محصول Alibaba): گفتگوی همان
 * محصول را بدون ترک صفحه باز می‌کند و لینک «باز کردن در پیام‌ها» دارد.
 * سه حالت: بسته (فقط سرصفحه)، جمع‌شده و باز.
 */
function ChatDockComponent() {
  const { dock, closeChat, unread, user } = useChat();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!dock.open) return;
    const onKey = (event) => event.key === 'Escape' && closeChat();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dock.open, closeChat]);

  if (!dock.open || !dock.conversation) return null;

  const counterpart = dock.conversation.role === 'seller' ? dock.conversation.buyer : dock.conversation.seller;

  return (
    <div className={`chat-dock${collapsed ? ' is-collapsed' : ''}`} role="dialog" aria-label={translateText('chat.messages')}>
      <header className="chat-dock-head">
        <span className="chat-dock-title">
          <MessageCircle size={15} />
          {translateText('chat.messages')}
          {unread.total > 0 ? <span className="chat-dock-badge">{unread.total}</span> : null}
        </span>
        <span className="chat-dock-actions">
          <Link
            to="/account/messages"
            className="chat-dock-link"
            title={translateText('chat.openInPanel')}
            aria-label={translateText('chat.openInPanel')}
          >
            <ExternalLink size={15} />
          </Link>
          <button
            type="button"
            className="chat-action"
            aria-label={collapsed ? translateText('chat.expand') : translateText('chat.collapse')}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
          </button>
          <button type="button" className="chat-action icon-control" aria-label={translateText('chat.close')} onClick={closeChat}>
            <X size={16} />
          </button>
        </span>
      </header>

      {!collapsed ? (
        dock.conversation._id ? (
          <ChatThreadComponent conversation={dock.conversation} onClose={closeChat} autoFocusComposer />
        ) : (
          <div className="chat-placeholder is-small">
            <b>{translateText('chat.opening')}</b>
          </div>
        )
      ) : (
        <button type="button" className="chat-dock-preview" onClick={() => setCollapsed(false)}>
          {personName(counterpart, translateText('chat.conversation'))}
        </button>
      )}
    </div>
  );
}

export default ChatDockComponent;
