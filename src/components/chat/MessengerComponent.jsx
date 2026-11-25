import React, { useCallback, useEffect, useState } from 'react';
import { t as translateText } from '../../i18n/runtime.js';
import { MessagesSquare, Store } from 'lucide-react';
import ChatInboxComponent from './ChatInboxComponent';
import ChatThreadComponent from './ChatThreadComponent';
import ChatEmptyStateComponent, { ChatInboxEmpty } from './ChatEmptyStateComponent';
import { useChat } from '../../contexts/ChatContext';
import { getConversation } from '../../services/chatApi';

/*
 * دوپنلهٔ پیام‌رسان (فهرست + رشته). در موبایل یک‌پنله می‌شود و با دکمهٔ
 * بازگشت به فهرست برمی‌گردد. `readOnly` برای گفتگویی است که ادمین بسته است.
 */
function MessengerComponent({ as = 'buyer', scope, initialConversationId, onSelect, onCreate, onBrowse }) {
  const { connected, on } = useChat();
  const [active, setActive] = useState(null);
  const [inboxState, setInboxState] = useState({ loading: true, count: 0 });
  const handleInboxState = useCallback((next) => setInboxState(next), []);
  const soloEmpty = !inboxState.loading && inboxState.count === 0 && !active;

  const select = useCallback(
    (row) => {
      setActive(row);
      onSelect?.(row);
    },
    [onSelect],
  );

  /* لینک مستقیم به یک گفتگو (؟conversation=…) از سربرگ‌های دیگر پنل */
  useEffect(() => {
    if (!initialConversationId) return;
    let cancelled = false;
    getConversation(initialConversationId)
      .then((row) => {
        if (!cancelled && row) setActive(row);
      })
      .catch(() => {
        /* گفتگوی متعلق به کاربر نیست یا حذف شده — نمای پیشین می‌ماند */
      });
    return () => {
      cancelled = true;
    };
  }, [initialConversationId]);

  /* اگر گفتگوی فعال بسته/مسدود شد، همان رشته تازه می‌شود */
  useEffect(
    () =>
      on('conversation:updated', (event) => {
        const patch = event?.conversation || {};
        setActive((prev) => (prev && String(prev._id) === String(patch._id) ? { ...prev, ...patch } : prev));
      }),
    [on],
  );

  return (
    <div className={`chat-messenger${active ? ' has-active' : ''}${soloEmpty ? ' is-solo' : ''}`}>
      <div className="chat-messenger-status" role="status" aria-live="polite">
        <span className={`chat-dot${connected ? ' is-on' : ''}`} aria-hidden />
        {translateText(connected ? 'chat.connected' : 'chat.reconnecting')}
      </div>

      {soloEmpty ? (
        /* هیچ گفتگویی نیست: یک پنل کامل، بدون ستون باریک و بدون «یک گفتگو را انتخاب کنید» */
        <ChatInboxEmpty as={as} onBrowse={onBrowse} />
      ) : (
        <>
          <ChatInboxComponent
            as={as}
            scope={scope}
            activeId={active?._id}
            onSelect={select}
            onCreate={onCreate}
            onBrowse={onBrowse}
            onState={handleInboxState}
          />

          <div className="chat-messenger-main">
            {active ? (
              <ChatThreadComponent
                conversation={active}
                onBack={() => setActive(null)}
                readOnly={active.status === 'BLOCKED' || active.status === 'CLOSED'}
                readOnlyReason={translateText(active.status === 'BLOCKED' ? 'chat.blockedNotice' : 'chat.closedNotice')}
              />
            ) : (
              <ChatEmptyStateComponent
                icon={MessagesSquare}
                title={translateText('chat.pickConversation')}
                text={translateText('chat.pickConversationHint')}
                tone={onCreate ? 'brand' : 'quiet'}
                action={
                  onCreate ? (
                    <button type="button" className="btn-primary" onClick={onCreate}>
                      <Store size={15} />
                      {translateText('chat.startFromProduct')}
                    </button>
                  ) : null
                }
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MessengerComponent;
