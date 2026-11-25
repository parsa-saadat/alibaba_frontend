import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { t as translateText } from '../../i18n/runtime.js';
import { ArrowRight, Ban, Loader2, X } from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import { useChat } from '../../contexts/ChatContext';
import { deleteMessage, editMessage, listMessages, markRead, sendMessage } from '../../services/chatApi';
import ChatMessageComponent from './ChatMessageComponent';
import ChatComposerComponent from './ChatComposerComponent';
import { dayKey, formatDayDivider, nameText, personName } from '../../utils/helpers/chat-format';

const PAGE = 30;

/**
 * رشتهٔ گفتگو: پیام‌ها، تایپ طرف مقابل، رسید خوانده‌شدن و کادر نوشتن.
 * همین کامپوننت در پنل کاربر، پنل فروشنده و دراور «Chat now» استفاده می‌شود.
 */
function ChatThreadComponent({ conversation, onBack, onClose, readOnly = false, readOnlyReason = '', autoFocusComposer = false }) {
  const { user } = useShop();
  const { on, publish, setActiveConversation, consumePin } = useChat();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [typingName, setTypingName] = useState('');
  const [counterpartOnline, setCounterpartOnline] = useState(false);

  const scrollerRef = useRef(null);
  const typingSentAt = useRef(0);
  const typingTimer = useRef(null);

  const id = String(conversation?._id || '');
  /* نمای ادمین فقط‌خواندنی است: هیچ پیامی «مال من» حساب نمی‌شود */
  const isModerator = conversation?.role === 'admin';
  const myRole = isModerator ? 'admin' : conversation?.role === 'seller' ? 'seller' : 'buyer';
  const counterpart = useMemo(
    () => (myRole === 'seller' ? conversation?.buyer : conversation?.seller),
    [conversation, myRole],
  );
  const counterpartName = isModerator
    ? `${personName(conversation?.buyer, '—')} ←→ ${personName(conversation?.seller, '—')}`
    : personName(
        counterpart,
        translateText(myRole === 'seller' ? 'chat.buyer' : 'chat.seller'),
      );

  /*
   * پین گفتگو: بک‌اند آن را با عنوان/تصویر/قیمت محصول آبریزی کرده است.
   * `raw` همان چیزی است که همراه پیام ذخیره می‌شود.
   */
  const contextPin = useMemo(() => {
    const hydrated = conversation?.pin;
    if (hydrated && (hydrated.title || hydrated.product_id || hydrated.store_id)) {
      return {
        ...hydrated,
        raw: {
          kind: hydrated.kind,
          product_id: hydrated.product_id || conversation?.product_id || null,
          store_id: hydrated.store_id || conversation?.store_id || null,
        },
      };
    }
    if (!conversation?.product_id && !conversation?.store_id) return null;
    return {
      kind: conversation.product_id ? 'product' : 'store',
      product_id: conversation.product_id || null,
      store_id: conversation.store_id || null,
      raw: {
        kind: conversation.product_id ? 'product' : 'store',
        product_id: conversation.product_id || null,
        store_id: conversation.store_id || null,
      },
    };
  }, [conversation]);

  const [pinPending, setPinPending] = useState(Boolean(conversation?._composePin));
  useEffect(() => { setPinPending(Boolean(conversation?._composePin)); }, [conversation?._id, conversation?._composeNonce]);
  const pin = pinPending ? contextPin : null;

  const scrollToEnd = useCallback((behavior = 'auto') => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const body = await listMessages(id, { limit: PAGE });
      setMessages(body?.data || []);
      setHasMore(Boolean(body?.has_more));
      requestAnimationFrame(() => scrollToEnd());
    } catch {
      setError(translateText('chat.loadError'));
    } finally {
      setLoading(false);
    }
  }, [id, scrollToEnd]);

  useEffect(() => {
    load();
  }, [load]);

  /* ثبت گفتگوی باز تا اعلان برای پیام‌های همین گفتگو تکراری زده نشود */
  useEffect(() => {
    if (!id) return undefined;
    setActiveConversation(id);
    return () => setActiveConversation('');
  }, [id, setActiveConversation]);

  /* خوانده‌شدن وقتی گفتگو باز است و تب فعال است */
  useEffect(() => {
    if (!id || readOnly) return;
    markRead(id).catch(() => {});
    const onVisibility = () => document.visibilityState === 'visible' && markRead(id).catch(() => {});
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [id, messages.length, readOnly]);

  /* رویدادهای زندهٔ همین گفتگو */
  useEffect(() => {
    if (!id) return undefined;
    const off = [
      on('message:new', (event) => {
        if (String(event.conversation_id) !== id) return;
        setMessages((prev) => (prev.some((m) => String(m._id) === String(event.message._id)) ? prev : [...prev, event.message]));
        if (event.message?.sender_role !== myRole) {
          setTypingName('');
          markRead(id).catch(() => {});
        }
        requestAnimationFrame(() => scrollToEnd('smooth'));
      }),
      on('message:updated', (event) => {
        if (String(event.conversation_id) !== id) return;
        setMessages((prev) => prev.map((m) => (String(m._id) === String(event.message._id) ? event.message : m)));
      }),
      on('message:deleted', (event) => {
        if (String(event.conversation_id) !== id) return;
        setMessages((prev) =>
          prev.map((m) =>
            String(m._id) === String(event.message_id)
              ? { ...m, kind: 'deleted', body: '', images: [], pin: null, deleted_at: event.deleted_at }
              : m,
          ),
        );
      }),
      on('read', (event) => {
        if (String(event.conversation_id) !== id) return;
        setMessages((prev) => prev.map((m) => (m.sender_role === myRole ? { ...m, read_by: [...new Set([...(m.read_by || []), event.reader_id])] } : m)));
      }),
      on('typing', (event) => {
        if (String(event.conversation_id) !== id || String(event.user_id) === String(user?._id)) return;
        setTypingName(nameText(event.name) || counterpartName);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTypingName(''), 3200);
      }),
      on('presence', (event) => {
        if (String(event.conversation_id) !== id) return;
        setCounterpartOnline(Boolean(event.online));
      }),
    ];
    return () => {
      off.forEach((stop) => stop());
      clearTimeout(typingTimer.current);
    };
  }, [id, on, scrollToEnd, counterpartName, myRole, user?._id]);

  useEffect(() => {
    setCounterpartOnline(Boolean(counterpart?.online));
  }, [counterpart]);

  const send = async ({ body, images = [], editing }) => {
    if (!id || readOnly) return;
    try {
      if (editing) {
        const res = await editMessage(editing, body);
        if (res?.message) setMessages((prev) => prev.map((m) => (String(m._id) === String(editing) ? res.message : m)));
        return true;
      }
      const res = await sendMessage(id, { body, images, pin: pin?.raw || null });
      if (res?.message) setMessages(prev => prev.some(row => String(row._id) === String(res.message._id)) ? prev : [...prev, res.message]);
      setPinPending(false);
      consumePin(id, conversation?._composeNonce);
      if (Date.now() - typingSentAt.current > 2000) {
        typingSentAt.current = 0;
      }
      return true;
    } catch (err) {
      setError(err?.response?.data?.message || translateText('chat.sendError'));
      return false;
    }
  };

  const remove = async (messageId) => {
    try {
      await deleteMessage(messageId);
      setMessages((prev) => prev.map((m) => (String(m._id) === String(messageId) ? { ...m, kind: 'deleted', body: '', images: [], pin: null } : m)));
    } catch (err) {
      setError(err?.response?.data?.message || translateText('chat.deleteError'));
    }
  };

  const loadOlder = async () => {
    if (!hasMore || loadingOlder || !messages.length) return;
    setLoadingOlder(true);
    try {
      const node = scrollerRef.current;
      const previousHeight = node ? node.scrollHeight : 0;
      const body = await listMessages(id, { limit: PAGE, before: messages[0].created_at });
      const older = body?.data || [];
      setMessages((prev) => [...older, ...prev]);
      setHasMore(Boolean(body?.has_more));
      requestAnimationFrame(() => {
        if (node) node.scrollTop = node.scrollHeight - previousHeight;
      });
    } finally {
      setLoadingOlder(false);
    }
  };

  const onDraftChange = (event) => {
    if (!event.target.value) return;
    const now = Date.now();
    if (now - typingSentAt.current > 1500) {
      typingSentAt.current = now;
      publish({ type: 'typing', conversation_id: id });
    }
  };

  const nameFor = (message) => {
    if (!isModerator) return counterpartName;
    return personName(
      message?.sender_role === 'seller' ? conversation?.seller : conversation?.buyer,
      translateText(message?.sender_role === 'seller' ? 'chat.seller' : 'chat.buyer'),
    );
  };

  let lastDay = '';

  return (
    <section className="chat-thread" aria-label={translateText('chat.threadAria')}>
      <header className="chat-thread-head">
        <div className="chat-thread-id">
          {onBack ? (
            <button type="button" className="chat-action chat-back icon-control" aria-label={translateText('chat.back')} onClick={onBack}>
              <ArrowRight className="logical-icon" size={16} />
            </button>
          ) : null}
          <span className={`chat-avatar${counterpartOnline ? ' is-online' : ''}`} aria-hidden>
            {(counterpartName || '?').slice(0, 1)}
          </span>
          <span className="chat-thread-name">
            <b>{counterpartName}</b>
            <small>
              {counterpartOnline ? translateText('chat.online') : translateText('chat.offline')}
              {conversation?.seller?.seller_trust ? ` · ${translateText('chat.trustedSeller')}` : ''}
            </small>
          </span>
        </div>
        {onClose ? (
          <button type="button" className="chat-action chat-thread-close icon-control" aria-label={translateText('chat.close')} onClick={onClose}>
            <X size={16} />
          </button>
        ) : null}
      </header>

      {conversation?.status && conversation.status !== 'OPEN' ? (
        <div className="chat-status-banner">
          <Ban size={13} />
          {translateText(conversation.status === 'BLOCKED' ? 'chat.blockedNotice' : 'chat.closedNotice')}
        </div>
      ) : null}

      {error ? (
        <div className="chat-error-bar" role="alert">
          <span>{error}</span>
          <button type="button" className="chat-action icon-control" aria-label={translateText('chat.dismiss')} onClick={() => setError('')}>
            <X size={13} />
          </button>
        </div>
      ) : null}

      <div className="chat-messages" ref={scrollerRef}>
        {loading ? (
          <div className="chat-loading">
            <Loader2 size={18} className="animate-spin" />
            {translateText('chat.loadingMessages')}
          </div>
        ) : (
          <>
            {hasMore ? (
              <button type="button" className="chat-load-older" onClick={loadOlder} disabled={loadingOlder}>
                {loadingOlder ? translateText('chat.loading') : translateText('chat.loadOlder')}
              </button>
            ) : null}

            {messages.length === 0 ? (
              <p className="chat-empty-thread">{translateText('chat.emptyThread')}</p>
            ) : null}

            {messages.map((message) => {
              const day = dayKey(message.created_at);
              const divider = day !== lastDay;
              lastDay = day;
              return (
                <React.Fragment key={String(message._id)}>
                  {divider ? <div className="chat-day-divider">{formatDayDivider(message.created_at)}</div> : null}
                  <ChatMessageComponent
                    message={message}
                    mine={!isModerator && message.sender_role === myRole}
                    counterpartName={nameFor(message)}
                    onEdit={(id2, body) => send({ body, editing: id2 })}
                    onDelete={remove}
                  />
                </React.Fragment>
              );
            })}

            {typingName ? (
              <div className="chat-typing" aria-live="polite">
                <span className="chat-typing-dots" aria-hidden><i /><i /><i /></span>
                {translateText('chat.typing', { name: typingName })}
              </div>
            ) : null}
          </>
        )}
      </div>

      <ChatComposerComponent
        pin={pin}
        onRemovePin={() => { setPinPending(false); consumePin(id, conversation?._composeNonce); }}
        onSend={send}
        disabled={readOnly}
        disabledReason={readOnlyReason || translateText('chat.readOnlyBlocked')}
        onDraftChange={onDraftChange}
        autoFocus={autoFocusComposer}
      />
    </section>
  );
}

export default ChatThreadComponent;
