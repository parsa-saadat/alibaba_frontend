import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { t as translateText } from '../../i18n/runtime.js';
import { BadgeCheck, Filter, Loader2, Search, Store } from 'lucide-react';
import { listConversations } from '../../services/chatApi';
import { useChat } from '../../contexts/ChatContext';
import { formatRelative, personName } from '../../utils/helpers/chat-format';
import { getId } from '../../utils/helpers/response';
import ChatInboxEmpty from './ChatEmptyStateComponent';

/**
 * فهرست گفتگوها. `as` مشخص می‌کند فروشنده گفتگوهای فروشندگی‌اش را ببیند
 * یا خریدار گفتگوهای خودش را؛ ادمین با scope=all همه را می‌بیند.
 */
function ChatInboxComponent({
  as = 'buyer',
  scope,
  activeId,
  onSelect,
  search: externalSearch,
  onCreate,
  onBrowse,
  onState,
}) {
  const { on } = useChat();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(externalSearch || '');
  const [filter, setFilter] = useState('ALL');

  const params = useMemo(
    () => ({ as, ...(scope ? { scope } : {}), ...(search ? { search } : {}), ...(filter === 'UNREAD' ? { unread_only: 'true' } : {}), limit: 50 }),
    [as, scope, search, filter],
  );

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const body = await listConversations(params);
        setRows(body?.data || []);
        setError('');
      } catch (err) {
        setError(err?.response?.data?.message || translateText('chat.inboxError'));
      } finally {
        setLoading(false);
      }
    },
    [params],
  );

  useEffect(() => {
    const timer = setTimeout(() => load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  /* هر رویداد زنده فهرست را بی‌صدا تازه می‌کند */
  useEffect(
    () =>
      on('conversation:updated', () => load(true)),
    [on, load],
  );
  useEffect(() => on('message:new', () => load(true)), [on, load]);

  /* به والد خبر داده می‌شود که فهرست خالی است تا چیدمان تک‌پنل انتخاب شود */
  useEffect(() => {
    onState?.({ loading, count: rows.length });
  }, [loading, rows.length, onState]);

  const title = translateText(scope === 'all' ? 'chat.allConversations' : as === 'seller' ? 'chat.sellerInbox' : 'chat.inbox');

  return (
    <aside className="chat-inbox" aria-label={title}>
      <div className="chat-inbox-head">
        <h2 className="chat-inbox-title">{title}</h2>
        {onCreate ? (
          <button type="button" className="chat-action" onClick={onCreate} title={translateText('chat.new')}>
            <Store size={15} />
          </button>
        ) : null}
      </div>

      <div className="chat-inbox-search">
        <Search size={14} className="muted" />
        <input
          className="chat-search-input"
          value={search}
          placeholder={translateText('chat.searchPlaceholder')}
          aria-label={translateText('chat.searchPlaceholder')}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button
          type="button"
          className={`chat-action${filter === 'UNREAD' ? ' is-on' : ''}`}
          aria-pressed={filter === 'UNREAD'}
          title={translateText('chat.filterUnread')}
          onClick={() => setFilter((value) => (value === 'UNREAD' ? 'ALL' : 'UNREAD'))}
        >
          <Filter size={14} />
        </button>
      </div>

      <div className="chat-inbox-list" role="list">
        {loading ? (
          <div className="chat-loading">
            <Loader2 size={16} className="animate-spin" />
            {translateText('chat.loading')}
          </div>
        ) : rows.length === 0 ? (
          <ChatInboxEmpty as={as} error={error} onBrowse={onBrowse} />
        ) : (
          rows.map((row) => {
            const shown = row.role === 'seller' ? row.buyer : row.seller;
            const active = String(activeId) === String(row._id);
            return (
              <button
                key={getId(row._id)}
                type="button"
                role="listitem"
                data-active={active || undefined}
                className={`chat-inbox-row${active ? ' is-active' : ''}`}
                onClick={() => onSelect?.(row)}
              >
                <span className="chat-avatar" aria-hidden>{(personName(shown, '?') || '?').slice(0, 1)}</span>
                <span className="chat-inbox-body">
                  <span className="chat-inbox-top">
                    <b className="chat-inbox-name">{personName(shown, translateText('chat.unknownUser'))}</b>
                    <span className="chat-inbox-time" dir="ltr">
                      {formatRelative(row.updated_at)}
                    </span>
                  </span>
                  <span className="chat-inbox-preview">
                    {row.last_message?.kind === 'deleted'
                      ? translateText('chat.deletedMessage')
                      : row.last_message?.kind === 'image'
                        ? translateText('chat.imagePreview')
                        : row.last_message?.body || row.first_seen_from || translateText('chat.noMessagesYet')}
                  </span>
                  <span className="chat-inbox-chips">
                    {row.role === 'admin' ? (
                      <span className="chip !cursor-default !py-0.5 !px-2 text-[10px]">{translateText('chat.buyerToSeller', { buyer: personName(row.buyer), seller: personName(row.seller) })}</span>
                    ) : null}
                    {row.seller?.seller_trust ? (
                      <span className="chat-trust-chip">
                        <BadgeCheck size={11} />
                        {translateText('chat.trustedSeller')}
                      </span>
                    ) : null}
                    {row.status !== 'OPEN' ? (
                      <span className="chat-status-chip">
                        {translateText(row.status === 'BLOCKED' ? 'chat.blockedShort' : 'chat.closedShort')}
                      </span>
                    ) : null}
                  </span>
                </span>
                {row.unread > 0 ? <span className="chat-unread">{row.unread}</span> : null}
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}

export default ChatInboxComponent;
