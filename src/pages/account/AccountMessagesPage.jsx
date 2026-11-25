import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { t as translateText } from '../../i18n/runtime.js';
import { BadgeCheck, MessageSquare, Store } from 'lucide-react';
import MessengerComponent from '../../components/chat/MessengerComponent';
import { listConversations } from '../../services/chatApi';
import { getId } from '../../utils/helpers/response';
import { formatRelative, personName } from '../../utils/helpers/chat-format';

const TABS = [
  ['messenger', 'chat.messenger'],
  ['inquiries', 'chat.inquiries'],
  ['contacts', 'chat.contacts'],
];

/*
 * صفحهٔ پیام‌های کاربر. سه سربرگ از همان دادهٔ گفتگوها ساخته می‌شود:
 *  - پیام‌رسان: فهرست + رشته
 *  - استعلام‌ها: گفتگوهایی که از یک محصول شروع شده‌اند (پین محصول دارند)
 *  - مخاطبان: فروشندگانی که با آن‌ها گفتگو داشته‌ایم
 */
export default function AccountMessagesPage() {
  const { tab = 'messenger' } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationParam = searchParams.get('conversation') || '';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const body = await listConversations({ as: 'buyer', limit: 50 });
      setRows(body?.data || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const inquiries = useMemo(() => rows.filter((row) => row.product_id), [rows]);
  const contacts = useMemo(() => {
    const bySeller = new Map();
    for (const row of rows) {
      const key = getId(row.seller?._id || row.seller_id);
      if (!key) continue;
      const prev = bySeller.get(key);
      if (!prev || new Date(row.updated_at) > new Date(prev.updated_at))
        bySeller.set(key, { ...row, conversations: (prev?.conversations || 0) + 1 });
    }
    return [...bySeller.values()];
  }, [rows]);

  return (
    <div className="account-page">
      <header className="account-page-head">
        <h1>{translateText('chat.messages')}</h1>
        <nav className="account-tabs" aria-label={translateText('chat.messages')}>
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`account-tab${key === tab ? ' is-active' : ''}`}
              onClick={() => navigate(key === 'messenger' ? '/account/messages' : `/account/messages/${key}`)}
            >
              {translateText(label)}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'messenger' ? (
        <div className="account-page-body">
          <MessengerComponent
            as="buyer"
            initialConversationId={conversationParam}
            onBrowse={() => navigate('/products')}
          />
        </div>
      ) : (
        <div className="card rounded-3xl p-4 account-list-card">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-16 rounded-2xl" />
              ))}
            </div>
          ) : tab === 'inquiries' ? (
            <SimpleRows
              empty={translateText('chat.noInquiries')}
              emptyHint={translateText('chat.noInquiriesHint')}
              rows={inquiries.map((row) => ({
                key: getId(row._id),
                title: personName(row.seller, translateText('chat.seller')),
                meta: row.product_id ? translateText('chat.inquiryAboutProduct') : '',
                time: formatRelative(row.updated_at),
                to: `/account/messages?conversation=${encodeURIComponent(getId(row._id))}`,
                trust: row.seller?.seller_trust,
              }))}
            />
          ) : (
            <SimpleRows
              empty={translateText('chat.noContacts')}
              emptyHint={translateText('chat.noContactsHint')}
              rows={contacts.map((row) => ({
                key: getId(row.seller?._id),
                title: personName(row.seller, translateText('chat.seller')),
                meta: translateText('chat.conversationsCount', { count: String(row.conversations) }),
                time: formatRelative(row.updated_at),
                to: `/account/messages?conversation=${encodeURIComponent(getId(row._id))}`,
                storeId: row.store_id,
                trust: row.seller?.seller_trust,
              }))}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SimpleRows({ rows, empty, emptyHint }) {
  if (!rows.length)
    return (
      <div className="account-empty-block">
        <MessageSquare size={30} className="muted" />
        <b>{empty}</b>
        <p>{emptyHint}</p>
        <Link to="/products" className="btn-primary">
          {translateText('account.startSourcing')}
        </Link>
      </div>
    );

  return (
    <ul className="account-simple-list">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="account-simple-row">
            <span className="chat-avatar" aria-hidden>{(row.title || '؟').slice(0, 1)}</span>
            <span className="account-simple-body">
              <b>
                {row.to ? <Link to={row.to}>{row.title}</Link> : row.title}
                {row.trust ? (
                  <span className="chat-trust-chip">
                    <BadgeCheck size={11} />
                    {translateText('chat.trustedSeller')}
                  </span>
                ) : null}
              </b>
              <small>
                {row.meta} · <span dir="ltr">{row.time}</span>
              </small>
            </span>
            {row.storeId ? (
              <Link to={`/store/${row.storeId}`} className="chat-inline-link">
                <Store size={14} />
                {translateText('chat.visitStore')}
              </Link>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

