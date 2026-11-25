import React from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { t } from '../../i18n/runtime.js';
import MessengerComponent from '../../components/chat/MessengerComponent';

export default function AccountMessagesPage() {
  const { tab } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Historical inquiry/contact URLs resolve to the one real inbox, preserving deep links.
  if (tab) return <Navigate to={`/account/messages${location.search}`} replace />;
  return <div className="account-page account-messages-page">
    <header className="account-page-head"><h1>{t('chat.messages')}</h1></header>
    <div className="account-page-body">
      <MessengerComponent as="buyer" initialConversationId={searchParams.get('conversation') || ''} onBrowse={() => navigate('/products')} onCreate={() => navigate('/products')} />
    </div>
  </div>;
}
