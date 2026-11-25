import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { t as translateText } from '../../i18n/runtime.js';
import { CreditCard, FileText, Landmark, ShieldCheck, Ticket, Wallet } from 'lucide-react';
import { API } from '../../config/api';
import { authHeaders } from '../../utils/helpers/storage';
import { getList, getId } from '../../utils/helpers/response';
import { formatMoney } from '../../i18n/runtime';
import { useShop } from '../../contexts/ShopContext';

/*
 * «کارت‌ها و حساب‌ها» در پنل کاربر. پرداخت روی این سکوی B2B از درگاه سفارش
 * انجام می‌شود، پس این صفحه خلاصهٔ واقعیِ پرداخت‌های سفارش‌ها را نشان می‌دهد
 * و کارت بانکی ذخیره‌شده را جعل نمی‌کند.
 */
const STATUS_KEYS = {
  PAID: 'payment.paid',
  PENDING: 'payment.pending',
  WAIT_PAYMENT: 'payment.pending',
  UNPAID: 'payment.pending',
  REFUNDED: 'payment.refunded',
  PART_REFUND: 'payment.partialRefund',
  CANCELED: 'payment.canceled',
  FAILED: 'payment.failed',
};

export default function AccountPaymentPage() {
  const { user } = useShop();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const id = getId(user);
    if (!id) return;
    try {
      const res = await axios.get(`${API}/user/${id}/orders`, { ...authHeaders(), params: { limit: 50 } });
      setOrders(getList(res));
    } catch (err) {
      setError(err?.response?.data?.message || translateText('account.loadError'));
      setOrders([]);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = (orders || []).reduce(
    (acc, order) => {
      const status = String(order.status || '').toUpperCase();
      const amount = Number(order.total_amount?.amount ?? order.total ?? 0);
      const currency = order.total_amount?.currency || 'IRT';
      if (status === 'PAID' || status === 'DELIVERED') acc.paid += amount, (acc.paidCurrency ||= currency);
      else if (status.includes('REFUND')) acc.refunded += amount, (acc.refundCurrency ||= currency);
      else acc.pending += amount, (acc.pendingCurrency ||= currency);
      return acc;
    },
    { paid: 0, pending: 0, refunded: 0 },
  );

  return (
    <div className="account-page">
      <header className="account-page-head">
        <h1>{translateText('account.cardsAccounts')}</h1>
        <Link to="/account/orders" className="account-section-link">
          <FileText size={14} />
          {translateText('account.viewAll')}
        </Link>
      </header>

      <section className="account-banner is-success">
        <span className="account-banner-icon">
          <ShieldCheck size={18} />
        </span>
        <div className="account-banner-body">
          <b>{translateText('payment.secureTitle')}</b>
          <p>{translateText('payment.secureText')}</p>
        </div>
        <span className="account-banner-badges" aria-hidden>
          <CreditCard size={16} />
          <Landmark size={16} />
          <Wallet size={16} />
        </span>
      </section>

      <div className="account-pay-summary">
        <div className="account-pay-tile">
          <small>{translateText('payment.paidTotal')}</small>
          <b>{orders ? formatMoney(totals.paid, totals.paidCurrency) : '—'}</b>
        </div>
        <div className="account-pay-tile">
          <small>{translateText('payment.pendingTotal')}</small>
          <b>{orders ? formatMoney(totals.pending, totals.pendingCurrency) : '—'}</b>
        </div>
        <div className="account-pay-tile">
          <small>{translateText('payment.refundedTotal')}</small>
          <b>{orders ? formatMoney(totals.refunded, totals.refundCurrency) : '—'}</b>
        </div>
      </div>

      {error ? <p className="chat-composer-error">{error}</p> : null}

      <section className="card rounded-3xl p-5">
        <div className="account-section-head">
          <b>{translateText('payment.methodsTitle')}</b>
        </div>
        <p className="text-xs muted leading-6">{translateText('payment.methodsText')}</p>
        <ul className="account-payment-list">
          {(orders || []).slice(0, 8).map((order) => {
            const status = String(order.status || '').toUpperCase();
            return (
              <li key={getId(order)} className="account-payment-row">
                <span>
                  <b>{order.order_code || `#${getId(order).slice(0, 8)}`}</b>
                  <small>{translateText(STATUS_KEYS[status] || 'payment.other')}</small>
                </span>
                <span dir="ltr">
                  {formatMoney(order.total_amount?.amount ?? order.total ?? 0, order.total_amount?.currency)}
                </span>
              </li>
            );
          })}
          {orders && orders.length === 0 ? (
            <li className="account-empty-inline">{translateText('account.noOrders')}</li>
          ) : null}
        </ul>
      </section>

      <section className="card rounded-3xl p-5">
        <div className="account-section-head">
          <b>{translateText('account.coupons')}</b>
        </div>
        <div className="account-empty-block is-compact">
          <Ticket size={26} className="muted" />
          <b>{translateText('account.notAvailable')}</b>
          <p>{translateText('account.notAvailableHint')}</p>
          <Link to="/products" className="btn-ghost">
            {translateText('account.startSourcing')}
          </Link>
        </div>
      </section>
    </div>
  );
}
