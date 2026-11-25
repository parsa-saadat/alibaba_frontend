import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { t as translateText } from '../../i18n/runtime.js';
import { MessagesSquare, ShieldAlert } from 'lucide-react';
import MessengerComponent from '../../components/chat/MessengerComponent';
import PanelPageHeader from '../../components/panel/PanelPageHeaderComponent';
import { useShop } from '../../contexts/ShopContext';

/*
 * صندوق پیام‌های فروشنده. دروازهٔ نقش در بک‌اند است (فقط فروشندهٔ تأیید و
 * فعال‌شده می‌تواند بخواند/بفرستد)؛ اینجا همان قاعده در رابط نشانه‌گذاری می‌شود.
 */
export default function SellerMessagesPage() {
  const { user } = useShop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const reachable =
    isAdmin ||
    (user?.is_seller === true &&
      user?.seller_approved_status === true &&
      String(user?.seller_active_status || '').toUpperCase() === 'ACTIVE');

  return (
    <div className="space-y-4">
      <button type="button" className="btn-primary" onClick={() => navigate('/products')}>{translateText('chat.new')}</button>
      <PanelPageHeader
        icon={MessagesSquare}
        title={translateText('chat.sellerInbox')}
        subtitle={translateText('chat.sellerInboxHint')}
      />

      {reachable ? (
        <div className="chat-panel-shell">
          <MessengerComponent as="seller" initialConversationId={searchParams.get('conversation') || ''} onCreate={() => navigate('/products')} onBrowse={() => navigate('/products')} />
        </div>
      ) : (
        <div className="card rounded-3xl p-8 text-center space-y-3">
          <ShieldAlert size={32} className="mx-auto text-accent" />
          <h2 className="font-black text-lg">{translateText('chat.lockedTitle')}</h2>
          <p className="text-sm muted leading-6">{translateText('chat.lockedText')}</p>
        </div>
      )}
    </div>
  );
}
