import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useShop } from './ShopContext';
import { chatSocketUrl, openConversation, unreadSummary } from '../services/chatApi';
import { t as translateText } from '../i18n/runtime.js';
import { nameText, previewOf } from '../utils/helpers/chat-format';
import { notifyIncoming, setChatNavigator } from '../utils/helpers/chat-notify.jsx';

/*
 * یک نشست WebSocket مشترک برای همهٔ سطوح (پنل کاربر، پنل فروشنده، دکمهٔ
 * Chat now و دراور پیام‌ها). نوشتن داده اینجا انجام نمی‌شود؛ این فایل فقط
 * اتصال را نگه می‌دارد و رویدادها را پخش می‌کند.
 *
 * `dock` همان پنل شناور «Messages» است که از صفحهٔ محصول/فروشگاه باز می‌شود.
 */
const ChatContext = createContext(null);

const RECONNECT_STEPS = [1500, 3000, 6000, 12000, 24000];

export function ChatProvider({ children }) {
  const { user } = useShop();
  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState({ total: 0, conversations: 0, blocked: false });

  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());
  const retryRef = useRef(0);
  const timerRef = useRef(null);
  const closedByUsRef = useRef(false);
  const activeConversationRef = useRef('');

  /* اشتراک در یک رویداد؛ return کردن این تابع لغو اشتراک است */
  const on = useCallback((type, handler) => {
    const set = listenersRef.current.get(type) || new Set();
    set.add(handler);
    listenersRef.current.set(type, set);
    return () => set.delete(handler);
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      const body = await unreadSummary();
      if (body) setUnread({ total: body.total || 0, buyer_total: body.buyer_total ?? body.total ?? 0, seller_total: body.seller_total || 0, conversations: body.conversations || 0, blocked: body.blocked === true });
    } catch {
      /* شمارندهٔ ناخوانده نباید رابط را بشکند */
    }
  }, []);

  const emit = useCallback(
    (payload) => {
      if (!payload?.type) return;
      for (const handler of listenersRef.current.get(payload.type) || []) {
        try {
          handler(payload);
        } catch {
          /* یک گوش‌سوی خراب نباید بقیه را متوقف کند */
        }
      }

      if (payload.type === 'message:new' || payload.type === 'conversation:updated') refreshUnread();

      /* اعلان پیام تازه: فقط پیامی که از طرف مقابل آمده و همان لحظه باز نیست */
      if (payload.type !== 'message:new') return;
      const message = payload.message;
      if (!message || String(message.sender_id) === String(user?._id)) return;
      if (activeConversationRef.current === String(payload.conversation_id)) return;

      const other = message.sender_role === 'seller' ? 'chat.seller' : 'chat.buyer';
      notifyIncoming({
        id: `chat-${message._id}`,
        title: nameText(message.sender_name) || translateText(other),
        preview: previewOf(message),
        to: `${(message.recipient_is_seller === false ? message.sender_role === 'seller' : message.sender_role === 'buyer') && (user?.is_seller === true || user?.role === 'seller') ? '/seller/messages' : '/account/messages'}?conversation=${encodeURIComponent(String(payload.conversation_id))}`,
      });
    },
    [refreshUnread, user?._id],
  );

  /* ثبت گفتگوی باز، تا برای پیام‌های همان گفتگو اعلان تکراری زده نشود */
  const setActiveConversation = useCallback((id) => {
    activeConversationRef.current = id ? String(id) : '';
  }, []);

  const disconnect = useCallback(() => {
    closedByUsRef.current = true;
    clearTimeout(timerRef.current);
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket) {
      try {
        socket.close();
      } catch {
        /* بی‌اهمیت */
      }
    }
    setConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!user?._id) return;
    const url = chatSocketUrl();
    if (!url || socketRef.current) return;

    closedByUsRef.current = false;
    let socket;
    try {
      socket = new WebSocket(url);
    } catch {
      return;
    }
    socketRef.current = socket;

    socket.onopen = () => {
      retryRef.current = 0;
      setConnected(true);
      refreshUnread();
    };
    socket.onmessage = (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }
      if (payload?.type === 'pong' || payload?.type === 'ping') return;
      emit(payload);
    };
    socket.onclose = () => {
      if (socketRef.current === socket) socketRef.current = null;
      setConnected(false);
      if (closedByUsRef.current) return;
      const step = RECONNECT_STEPS[Math.min(retryRef.current, RECONNECT_STEPS.length - 1)];
      retryRef.current += 1;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(connect, step);
    };
    socket.onerror = () => socket.close();
  }, [emit, refreshUnread, user?._id]);

  /* مسیر توست اعلان از داخل Router */
  const navigate = useNavigate();
  useEffect(() => {
    setChatNavigator(navigate);
    return () => setChatNavigator(null);
  }, [navigate]);

  /* اتصال/قطع با تغییر نشست؛ بازیابی وقتی تب دوباره دیده می‌شود */
  useEffect(() => {
    if (!user?._id) {
      disconnect();
      setUnread({ total: 0, conversations: 0, blocked: false });
      return undefined;
    }
    connect();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshUnread();
        if (!socketRef.current) connect();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      disconnect();
    };
  }, [connect, disconnect, refreshUnread, user?._id]);

  /** رویداد آتشین به سرور (تایپ). ارسال/ویرایش/حذف از REST می‌رود. */
  const publish = useCallback((frame) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    try {
      socket.send(JSON.stringify(frame));
      return true;
    } catch {
      return false;
    }
  }, []);

  /* ---------- پنل شناور «Messages» که با Chat now باز می‌شود ---------- */
  const [dock, setDock] = useState({ open: false, conversation: null, busy: false });

  const openChat = useCallback(
    async (params) => {
      if (!user?._id) {
        toast.warn(translateText('chat.loginRequired'));
        return null;
      }
      setDock((prev) => ({ ...prev, busy: true }));
      try {
        const body = await openConversation(params);
        const conversation = body?.conversation;
        if (!conversation) throw new Error('empty');
        setDock({ open: true, busy: false, conversation: { ...conversation, _id: String(conversation._id), _composePin: Boolean(params.product_id || params.store_id), _composeNonce: `${Date.now()}-${Math.random()}` } });
        return conversation;
      } catch (error) {
        setDock((prev) => ({ ...prev, busy: false }));
        toast.error(error?.response?.data?.message || translateText('chat.openError'));
        return null;
      }
    },
    [user?._id],
  );

  const consumePin = useCallback((id, nonce) => setDock(prev => String(prev.conversation?._id) === String(id) && prev.conversation?._composeNonce === nonce ? { ...prev, conversation: { ...prev.conversation, _composePin: false } } : prev), []);
  const closeChat = useCallback(() => setDock((prev) => ({ ...prev, open: false })), []);
  const showChat = useCallback(() => setDock((prev) => ({ ...prev, open: true })), []);

  const value = useMemo(
    () => ({ connected, unread, refreshUnread, on, publish, setUnread, dock, openChat, closeChat, showChat, consumePin, setActiveConversation }),
    [connected, unread, refreshUnread, on, publish, dock, openChat, closeChat, showChat, consumePin, setActiveConversation],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
}
