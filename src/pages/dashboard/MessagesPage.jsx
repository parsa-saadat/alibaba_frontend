import { createPortal } from 'react-dom';
import { direction } from '../../i18n/runtime';
import useMobileConversation from '../../hooks/useMobileConversation';
import React, { useCallback, useEffect, useState } from 'react';
import { t as translateText } from '../../i18n/runtime.js';
import { Ban, CheckCircle2, MessagesSquare, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import ChatInboxComponent from '../../components/chat/ChatInboxComponent';
import ChatThreadComponent from '../../components/chat/ChatThreadComponent';
import ChatEmptyStateComponent from '../../components/chat/ChatEmptyStateComponent';
import PanelPageHeader from '../../components/panel/PanelPageHeaderComponent';
import StatTile from '../../components/panel/StatTileComponent';
import { chatStats, setConversationStatus } from '../../services/chatApi';
import { toFa } from '../../utils/helpers/format';
import { getId } from '../../utils/helpers/response';
import { personName } from '../../utils/helpers/chat-format';
import { Link } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';

/*
 * نظارت ادمین روی گفتگوها: فقط خواندن و تغییر وضعیت. نوشتن در گفتگوی
 * خریدار/فروشنده در بک‌اند هم رد می‌شود، پس رشته readOnly گرفته می‌شود.
 * چیدمان مثل پنل کاربر است: فهرست + رشته، و اگر گفتگوئی نباشد تک‌پنل.
 */
export default function AdminMessagesPage() {
  const [stats, setStats] = useState(null);
  const [active, setActive] = useState(null);
  const close = useCallback(()=>setActive(null),[]);
  const mobile = useMobileConversation(active?._id,close);
  const [inboxState, setInboxState] = useState({ loading: true, count: 0 });
  const { on } = useChat();

  const loadStats = useCallback(async () => {
    try {
      const body = await chatStats();
      setStats(body?.counts || null);
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  /* با هر رویداد زنده، شمارش‌های بالای صفحه تازه می‌شود */
  useEffect(
    () =>
      on('message:new', () => loadStats()),
    [on, loadStats],
  );

  const changeStatus = async (status) => {
    if (!active) return;
    try {
      await setConversationStatus(getId(active._id), status);
      setActive((prev) => ({ ...prev, status }));
      toast.success(translateText(status === 'OPEN' ? 'chat.reopened' : 'chat.statusUpdated'));
      loadStats();
    } catch (error) {
      toast.error(error?.response?.data?.message || translateText('chat.statusError'));
    }
  };

  const soloEmpty = !inboxState.loading && inboxState.count === 0 && !active;

  const messenger = (
      <div dir={direction} role={mobile&&active?'dialog':undefined} aria-modal={mobile&&active?true:undefined} aria-label={translateText('chat.messages')} className={`chat-messenger is-admin${active ? ' has-active' : ''}${mobile&&active ? ' chat-mobile-fullscreen' : ''}${soloEmpty ? ' is-solo' : ''}`}>
        {soloEmpty ? (
          <ChatEmptyStateComponent
            icon={MessagesSquare}
            title={translateText('chat.noConversations')}
            text={translateText('chat.adminNoConversations')}
          />
        ) : (
          <>
            <ChatInboxComponent
              as="buyer"
              scope="all"
              activeId={active?._id}
              onSelect={setActive}
              onState={setInboxState}
            />

            <div className="chat-messenger-main">
              {active ? (
                <>
                  {/* نوار نظارت: طرفین، وضعیت فعلی و فقط کارهای معنادار */}
                  <div className="chat-admin-bar">
                    <span className="chat-admin-label">
                      {translateText('chat.buyerToSeller', {
                        buyer: personName(active.buyer, '—'),
                        seller: personName(active.seller, '—'),
                      })}
                    </span>

                    <span className={`chat-admin-status is-${String(active.status || 'OPEN').toLowerCase()}`}>
                      {translateText(
                        active.status === 'BLOCKED'
                          ? 'chat.blockedShort'
                          : active.status === 'CLOSED'
                            ? 'chat.closedShort'
                            : 'chat.statOpen',
                      )}
                    </span>

                    <span className="chat-admin-actions">
                      {active.status !== 'OPEN' ? (
                        <button type="button" className="review-button secondary" onClick={() => changeStatus('OPEN')}>
                          <CheckCircle2 size={14} />
                          {translateText('chat.reopen')}
                        </button>
                      ) : null}
                      {active.status !== 'CLOSED' ? (
                        <button type="button" className="review-button secondary" onClick={() => changeStatus('CLOSED')}>
                          <ShieldCheck size={14} />
                          {translateText('chat.closeThread')}
                        </button>
                      ) : null}
                      {active.status !== 'BLOCKED' ? (
                        <button type="button" className="review-button danger" onClick={() => changeStatus('BLOCKED')}>
                          <Ban size={14} />
                          {translateText('chat.blockThread')}
                        </button>
                      ) : null}
                    </span>
                  </div>

                  <ChatThreadComponent
                    conversation={active}
                    onBack={mobile?close:undefined}
                    onClose={mobile?close:undefined}
                    readOnly={active.role === 'admin' || active.status !== 'OPEN'}
                    readOnlyReason={translateText('chat.adminReadOnly')}
                  />
                </>
              ) : (
                <ChatEmptyStateComponent
                  icon={MessagesSquare}
                  title={translateText('chat.pickConversation')}
                  text={translateText('chat.adminPickHint')}
                />
              )}
            </div>
          </>
        )}
      </div>
  );

  return (
    <div className="space-y-4">
      <Link to="/products" className="btn-primary inline-flex">{translateText("chat.new")}</Link>
      <PanelPageHeader
        icon={MessagesSquare}
        title={translateText('chat.adminTitle')}
        subtitle={translateText('chat.adminHint')}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label={translateText('chat.statConversations')} value={toFa(stats?.conversations ?? '—')} />
        <StatTile label={translateText('chat.statMessages')} value={toFa(stats?.messages ?? '—')} />
        <StatTile label={translateText('chat.statOpen')} value={toFa(stats?.open ?? '—')} />
        <StatTile label={translateText('chat.statBlocked')} value={toFa(stats?.blocked ?? '—')} />
      </div>

      {mobile&&active ? createPortal(messenger,document.body) : messenger}
    </div>
  );
}
