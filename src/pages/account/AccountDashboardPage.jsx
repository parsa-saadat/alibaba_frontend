import { ORDER_FILTERS } from '../../utils/helpers/orderFilters';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { t as translateText, formatNumber } from '../../i18n/runtime.js';
import { API } from '../../config/api';
import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  CreditCard,
  Heart,
  History,
  MessageSquare,
  Package,
  ShieldCheck,
  Store,
  Ticket,
  UserRound,
} from 'lucide-react';
import { authHeaders, readList } from '../../utils/helpers/storage';
import { getList, getId } from '../../utils/helpers/response';
import axios from 'axios';
import { useShop } from '../../contexts/ShopContext';
import { useChat } from '../../contexts/ChatContext';
import { userFullName } from '../../utils/helpers/user';

/*
 * داشبورد پنل کاربر. فقط دادهٔ واقعی نشان داده می‌شود: گفتگوهای ناخوانده،
 * علاقه‌مندی‌ها و تاریخچهٔ بازدید از همان ذخیره‌گاه‌های موجود در برنامه،
 * سفارش‌ها و نشانی‌ها از API. چیزی که بک‌اند ندارد، «به‌زودی» است.
 */
function Stat({ icon: Icon, value, label, to }) {
  const body = (
    <>
      <b className="account-stat-value">{value}</b>
      <span className="account-stat-label">
        {Icon ? <Icon size={13} /> : null}
        {label}
      </span>
    </>
  );
  return to ? (
    <Link to={to} className="account-stat">
      {body}
    </Link>
  ) : (
    <div className="account-stat">{body}</div>
  );
}

function CompleteCard({ icon: Icon, title, hint, done, to }) {
  return (
    <div className={`account-todo${done ? ' is-done' : ''}`}>
      <span className="account-todo-icon">
        <Icon size={16} />
      </span>
      <span className="account-todo-body">
        <b>{title}</b>
        <small>{done ? translateText('account.completed') : hint}</small>
      </span>
      {done ? (
        <ShieldCheck size={16} className="account-todo-done" />
      ) : (
        <Link to={to} className="account-todo-action">
          {translateText('account.add')}
        </Link>
      )}
    </div>
  );
}

export default function AccountDashboardPage() {
  const { user, favorites } = useShop();
  const { unread } = useChat();
  const [open, setOpen] = useState(true);
  const [orders, setOrders] = useState(null);
  const [totalOrders,setTotalOrders] = useState(null);
  const [addresses, setAddresses] = useState(null);

  const load = useCallback(async () => {
    const id = getId(user);
    if (!id) return;
    try {
      const res = await axios.get(`${API}/orders`, { ...authHeaders(), params: { limit: 5, desc:true, scope:'buyer' } });
      const body = res.data?.body;
      setTotalOrders(body?.total ?? (Array.isArray(body) ? body.length : body?.data?.length ?? 0));
      setOrders(Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []);
    } catch {
      setOrders([]);
      setTotalOrders(0);
    }
    try {
      const res = await axios.get(`${API}/users/${id}/address`, { ...authHeaders(), params: { limit: 50 } });
      setAddresses(getList(res));
    } catch {
      setAddresses([]);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const history = useMemo(() => readList('history').filter(Boolean), []);
  const name = userFullName(user) || user?.username || '';
  const orderCount = totalOrders;

  return (
    <div className="account-dashboard">
      <div className="account-dashboard-main">
        <section className="card rounded-3xl p-5 account-profile-card">
          <div className="account-profile-top">
            <span className="account-avatar" aria-hidden>{(name || '؟').slice(0, 1)}</span>
            <div className="account-profile-name">
              <h1>{name || translateText('account.guest')}</h1>
              <p>
                <Link to="/account/settings">{translateText('account.myProfile')}</Link>
                <span aria-hidden>·</span>
              </p>
            </div>
            <Link to="/contact" className="account-support">
              <UserRound size={15} />
              {translateText('account.support')}
            </Link>
          </div>

          <div className="account-stats">
            <Stat icon={MessageSquare} value={formatNumber(unread.buyer_total ?? unread.total)} label={translateText('account.unreadMessages')} to="/account/messages" />
            <Stat icon={Package} value={orderCount === null ? '—' : formatNumber(orderCount)} label={translateText('account.newQuotes')} to="/account/orders" />
          </div>
        </section>

        <section className="card rounded-3xl p-5">
          <button type="button" className="account-section-head" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
            <b>{translateText('account.completeProfile')}</b>
            <span>
              {translateText('account.todoHint')}
              <ChevronDown size={15} className={open ? 'is-open' : ''} />
            </span>
          </button>

          {open ? (
            <div className="account-todo-grid">
              <CompleteCard
                icon={Store}
                title={translateText('account.addAddress')}
                hint={translateText('account.addAddressHint')}
                done={Boolean(addresses?.length)}
                to="/address"
              />
              <CompleteCard
                icon={CreditCard}
                title={translateText('account.addCard')}
                hint={translateText('account.addCardHint')}
                done={false}
                to="/account/payment"
              />

            </div>
          ) : null}
        </section>

        <section className="card rounded-3xl p-5">
          <div className="account-section-head">
            <b>{translateText('account.orders')}</b>
            <Link to="/account/orders" className="account-section-link">
              {translateText('account.viewAll')}
              <ChevronLeft size={14} className="logical-icon" />
            </Link>
          </div>

          <div className="account-order-chips">
            {ORDER_FILTERS.map(
              (item) => (
                <Link key={item.key} to={`/account/orders?status=${item.key}`} className="chip">
                  {translateText(item.label)}
                </Link>
              ),
            )}
          </div>

          {orders === null ? (
            <div className="skeleton h-24 rounded-2xl" />
          ) : orders.length === 0 ? (
            <div className="account-empty-block">
              <ClipboardList size={30} className="muted" />
              <b>{translateText('account.noOrders')}</b>
              <p>{translateText('account.noOrdersHint')}</p>
              <Link to="/products" className="btn-primary">
                {translateText('account.startSourcing')}
              </Link>
              <span className="account-protect">
                <ShieldCheck size={13} />
                {translateText('account.orderProtection')}
              </span>
            </div>
          ) : (
            <ul className="account-order-list">
              {orders.slice(0, 3).map((order) => (
                <li key={getId(order)}>
                  <Link to={`/orders/${getId(order)}`} className="account-order-row">
                    <span>
                      <b>{order.order_code || `#${getId(order).slice(0, 8)}`}</b>
                      <small>{order.status ? String(order.status) : ''}</small>
                    </span>
                    <ChevronLeft size={15} className="logical-icon muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card rounded-3xl p-5">
          <div className="account-section-head">
            <b>{translateText('account.paymentFinancing')}</b>
          </div>
          <div className="account-pay-grid">
            <Link to="/account/payment" className="account-pay-card">
              <CreditCard size={16} />
              <b>{translateText('account.cardsAccounts')}</b>
              <small>{translateText('account.cardsAccountsHint')}</small>
            </Link>
            <Link to="/account/service/transactions" className="account-pay-card">
              <ClipboardList size={16} />
              <b>{translateText('account.transactions')}</b>
              <small>{translateText('account.transactionsHint')}</small>
            </Link>
            <Link to="/account/orders" className="account-pay-card">
              <BadgeCheck size={16} />
              <b>{translateText('account.invoices')}</b>
              <small>{translateText('account.invoicesHint')}</small>
            </Link>
          </div>
        </section>
      </div>

      <aside className="account-dashboard-side">
        <section className="card rounded-3xl p-5">
          <div className="account-section-head">
            <b>{translateText('account.favorites')}</b>
          </div>
          {favorites?.length ? (
            <Link to="/account/saved" className="account-side-empty">
              <Heart size={28} className="text-accent" />
              <b>{translateText('account.savedCount', { count: formatNumber(favorites.length) })}</b>
              <span>{translateText('account.open')}</span>
            </Link>
          ) : (
            <div className="account-side-empty">
              <Heart size={28} className="muted" />
              <b>{translateText('account.noFavorites')}</b>
              <Link to="/products">{translateText('account.explore')}</Link>
            </div>
          )}
        </section>

        <section className="card rounded-3xl p-5">
          <div className="account-section-head">
            <b>{translateText('account.browsingHistory')}</b>
          </div>
          {history.length ? (
            <Link to="/account/saved/history" className="account-side-empty">
              <History size={28} className="text-accent" />
              <b>{translateText('account.historyCount', { count: formatNumber(history.length) })}</b>
              <span>{translateText('account.open')}</span>
            </Link>
          ) : (
            <div className="account-side-empty">
              <History size={28} className="muted" />
              <b>{translateText('account.noHistory')}</b>
              <Link to="/products">{translateText('account.explore')}</Link>
            </div>
          )}
        </section>

        <section className="card rounded-3xl p-5 account-promo">
          <div className="account-section-head">
            <b>{translateText('account.promotion')}</b>
          </div>
          <Link to="/products?discount=true" className="account-promo-card">
            <Ticket size={18} />
            <b>{translateText('account.promoDeals')}</b>
            <small>{translateText('account.promoDealsHint')}</small>
          </Link>
          <Link to="/seller" className="account-promo-card is-alt">
            <Store size={18} />
            <b>{translateText('account.becomeSeller')}</b>
            <small>{translateText('account.becomeSellerHint')}</small>
          </Link>
        </section>
      </aside>
    </div>
  );
}
