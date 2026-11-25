import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { t as translateText, languages as languageCodes, currencies, language as currentLanguage, currency as currentCurrency, setPreferences } from '../../i18n/runtime.js';
import { API } from '../../config/api';
import { authHeaders } from '../../utils/helpers/storage';
import {
  BadgeCheck,
  BellOff,
  ChevronLeft,
  Coins,
  Copy,
  Check,
  CreditCard,
  Globe2,
  Heart,
  LogOut,
  MapPin,
  Mail,
  Moon,
  Pencil,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Store,
  Sun,
  Ticket,
  UserRound,
} from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import { userFullName } from '../../utils/helpers/user';
import { validateEmailSyntax } from '../../utils/validators/email.validator';
import { playChime, setSoundEnabled, soundEnabled } from '../../utils/helpers/chat-notify.jsx';
import { localizedField } from '../../i18n/content-fields';

/*
 * صفحهٔ پروفایل کاربر، بازطراحی‌شده به سبک اسکرین‌شات‌های «My Alibaba»:
 * سربرگ حساب + سه کارت «اطلاعات حساب / امنیت حساب / تنظیمات».
 *
 * فقط قابلیت‌هایی که واقعاً در بک‌اند هست فعال‌اند:
 *   PUT /user/:id  → نام، نام خانوادگی، نام کاربری، ایمیل
 *   نشانی‌ها، علاقه‌مندی‌ها، زبان/ارز/پوسته → همه واقعی
 * ورود با رمز عبور نیست (کد یک‌بارمصرف با پیامک) و حذف حساب فقط با دسترسی
 * ادمین است، پس این دو ردیف صراحتاً «در دسترس نیست» نشان داده می‌شوند.
 */

const maskEmail = (email) => {
  const value = String(email || '');
  const at = value.indexOf('@');
  if (at < 2) return value || translateText('profile.notSet');
  const head = value.slice(0, 3);
  return `${head}${'*'.repeat(Math.max(at - 3, 3))}${value.slice(at)}`;
};

const maskPhone = (phone) => {
  const value = String(phone || '');
  if (value.length < 6) return value || translateText('profile.notSet');
  return `${value.slice(0, value.length - 7)}*******${value.slice(-3)}`;
};

function Row({ icon: Icon, label, value, to, action, disabled = false, note = '' }) {
  const body = (
    <span className="profile-row-body">
      <b>{label}</b>
      {note ? <em>{note}</em> : null}
    </span>
  );

  const icon = (
    <span className="profile-row-icon" aria-hidden="true">
      <Icon size={15} />
    </span>
  );

  /* ردیف‌های دارای کنترل (سکو/دکمه) نباید خودشان دکمه یا لینک باشند */
  if (value !== undefined && typeof value !== 'string') {
    return (
      <div className="profile-row is-control">
        {icon}
        {body}
        <span className="profile-row-control">{value}</span>
      </div>
    );
  }

  const inner = (
    <>
      {icon}
      <span className="profile-row-body">
        <b>{label}</b>
        {value ? <small dir="ltr">{value}</small> : null}
        {note ? <em>{note}</em> : null}
      </span>
      {disabled ? (
        <span className="profile-row-soon">{translateText('profile.notAvailableShort')}</span>
      ) : (
        <ChevronLeft size={15} className="logical-icon profile-row-chevron" />
      )}
    </>
  );

  if (disabled)
    return (
      <div className="profile-row is-disabled" aria-disabled="true">
        {inner}
      </div>
    );

  const className = `profile-row${to ? ' is-link' : ''}`;
  if (to)
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  return (
    <button type="button" className={className} onClick={action?.onClick}>
      {inner}
    </button>
  );
}

function Card({ icon: Icon, title, children }) {
  return (
    <section className="card rounded-3xl p-5 profile-card">
      <header className="profile-card-head">
        <span className="profile-card-medal" aria-hidden="true">
          <Icon size={16} />
        </span>
        <b>{title}</b>
      </header>
      <div className="profile-card-list">{children}</div>
    </section>
  );
}

export default function AccountProfilePage() {
  const { user, refreshUser, logout, theme, toggleTheme } = useShop();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [soundOn, setSoundOn] = useState(() => soundEnabled());
  const [form, setForm] = useState({
    firstname: localizedField(user?.firstname) || '',
    lastname: localizedField(user?.lastname) || '',
    username: user?.username || '',
    email: localizedField(user?.email) || '',
  });

  const name = useMemo(() => userFullName(user) || user?.username || '', [user]);
  const email = localizedField(user?.email) || '';
  const memberCode = user?.username || '';
  const isSeller = user?.is_seller === true || String(user?.role || '').toLowerCase() === 'seller';
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';

  const startEdit = () => {
    setForm({
      firstname: localizedField(user?.firstname) || '',
      lastname: localizedField(user?.lastname) || '',
      username: user?.username || '',
      email,
    });
    setEditing(true);
    document.getElementById('profile-edit-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const save = (event) => {
    event.preventDefault();
    const username = form.username.trim();
    const emailValue = form.email.trim();

    if (!username) return toast.error(translateText('نام کاربری نمی‌تواند خالی باشد'));
    if (emailValue && !validateEmailSyntax(emailValue))
      return toast.error(translateText('ایمیل وارد‌شده معتبر نیست'));

    const unchanged =
      username === (user.username || '') &&
      form.firstname.trim() === (localizedField(user?.firstname) || '') &&
      form.lastname.trim() === (localizedField(user?.lastname) || '') &&
      emailValue === email;
    if (unchanged) return toast.info(translateText('تغییری برای ذخیره وجود ندارد'));

    setSaving(true);
    axios
      .put(
        `${API}/user/${user._id}`,
        {
          username,
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
          email: emailValue,
        },
        authHeaders(),
      )
      .then(() => {
        toast.success(translateText('profile.saved'));
        setEditing(false);
        refreshUser();
      })
      .catch((error) =>
        toast.error(error?.response?.data?.message || translateText('خطا در ذخیره مشخصات')),
      )
      .finally(() => setSaving(false));
  };

  const copyMemberCode = async () => {
    try {
      await navigator.clipboard.writeText(memberCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.warn(translateText('profile.copyFailed'));
    }
  };

  return (
    <div className="account-page profile-page">
      <section className="card rounded-3xl p-5 profile-hero">
        <div className="profile-hero-top">
          <span className="profile-avatar" aria-hidden="true">
            {(name || '؟').slice(0, 1)}
          </span>

          <div className="profile-hero-id">
            <h1>{name || translateText('account.guest')}</h1>
            <div className="profile-hero-chips">
              {isSeller ? (
                <span className="chip !cursor-default !py-0.5 !px-2 text-[10px]">
                  <Store size={11} />
                  {translateText('profile.sellerBadge')}
                </span>
              ) : null}
              {user?.seller_trust === true ? (
                <span className="chip !cursor-default !py-0.5 !px-2 text-[10px]">
                  <BadgeCheck size={11} />
                  {translateText('chat.trustedSeller')}
                </span>
              ) : null}
              {isAdmin ? (
                <span className="chip !cursor-default !py-0.5 !px-2 text-[10px]">
                  <ShieldCheck size={11} />
                  {translateText('profile.adminBadge')}
                </span>
              ) : null}
            </div>

            <div className="profile-hero-lines">
              <span className="profile-hero-line">
                <Mail size={13} className="muted" />
                <b>{email ? maskEmail(email) : translateText('profile.notSet')}</b>
                <button type="button" className="profile-mini" onClick={startEdit} title={translateText('profile.changeEmail')}>
                  <Pencil size={12} />
                </button>
              </span>

              <span className="profile-hero-line">
                <UserRound size={13} className="muted" />
                {translateText('profile.memberId')}
                <b dir="ltr">{memberCode || '—'}</b>
                <button
                  type="button"
                  className="profile-mini"
                  onClick={copyMemberCode}
                  title={translateText('profile.copy')}
                  aria-label={translateText('profile.copy')}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </span>
            </div>
          </div>

          <div className="profile-hero-actions">
            <button type="button" className="btn-primary" onClick={startEdit}>
              <Pencil size={15} />
              {translateText('profile.editProfile')}
            </button>
            <button type="button" className="btn-ghost" onClick={logout}>
              <LogOut size={15} />
              {translateText('account.signOut')}
            </button>
          </div>
        </div>

        {editing ? (
          <form id="profile-edit-form" onSubmit={save} className="profile-edit">
            <div className="profile-edit-grid">
              <label className="text-xs muted">
                {translateText('نام ')}
                <input
                  className="input mt-1"
                  value={form.firstname}
                  maxLength={80}
                  onChange={(event) => setForm({ ...form, firstname: event.target.value })}
                />
              </label>
              <label className="text-xs muted">
                {translateText('نام خانوادگی ')}
                <input
                  className="input mt-1"
                  value={form.lastname}
                  maxLength={80}
                  onChange={(event) => setForm({ ...form, lastname: event.target.value })}
                />
              </label>
              <label className="text-xs muted">
                {translateText('profile.usernameLabel')}
                <input
                  className="input mt-1"
                  dir="ltr"
                  value={form.username}
                  maxLength={40}
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                />
              </label>
              <label className="text-xs muted">
                {translateText('ایمیل ')}
                <input
                  className="input mt-1"
                  dir="ltr"
                  type="email"
                  value={form.email}
                  maxLength={120}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </label>
            </div>
            <p className="profile-edit-note">{translateText('profile.editNote')}</p>
            <div className="profile-edit-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? translateText('chat.loading') : translateText('profile.saveProfile')}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
                {translateText('chat.cancelEdit')}
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <div className="profile-cards">
        <Card icon={UserRound} title={translateText('profile.accountInformation')}>
          <Row
            icon={Pencil}
            label={translateText('profile.myProfile')}
            value={name}
            action={{ onClick: startEdit }}
          />
          <Row icon={MapPin} label={translateText('profile.addresses')} to="/address" />
          <Row icon={Heart} label={translateText('account.favorites')} to="/account/saved" />
          <Row
            icon={Store}
            label={translateText('account.becomeSeller')}
            note={isSeller ? translateText('profile.sellerActive') : translateText('profile.sellerApplyHint')}
            to={isSeller ? '/seller' : '/profile'}
          />
          <Row icon={Ticket} label={translateText('account.tax')} disabled note={translateText('profile.supportOnly')} />
        </Card>

        <Card icon={ShieldCheck} title={translateText('profile.accountSecurity')}>
          <Row
            icon={Phone}
            label={translateText('profile.loginPhone')}
            value={maskPhone(user?.phone)}
            note={translateText('profile.loginPhoneNote')}
            disabled
          />
          <Row
            icon={Mail}
            label={translateText('profile.changeEmail')}
            value={email ? maskEmail(email) : translateText('profile.notSet')}
            action={{ onClick: startEdit }}
          />
          <Row
            icon={ShieldAlert}
            label={translateText('profile.changePassword')}
            note={translateText('profile.otpOnlyNote')}
            disabled
          />
          <Row
            icon={LogOut}
            label={translateText('profile.deleteAccount')}
            note={translateText('profile.supportOnly')}
            disabled
          />
        </Card>

        <Card icon={Globe2} title={translateText('profile.preferences')}>
          <Row
            icon={Globe2}
            label={translateText('profile.language')}
            value={
              <select
                className="profile-select"
                value={currentLanguage}
                aria-label={translateText('profile.language')}
                onChange={(event) => setPreferences(event.target.value, currentCurrency)}
              >
                {languageCodes.map((code) => (
                  <option key={code} value={code}>
                    {code.toUpperCase()}
                  </option>
                ))}
              </select>
            }
          />
          <Row
            icon={Coins}
            label={translateText('profile.currency')}
            value={
              <select
                className="profile-select"
                value={currentCurrency}
                aria-label={translateText('profile.currency')}
                onChange={(event) => setPreferences(currentLanguage, event.target.value)}
              >
                {currencies.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            }
          />
          <Row
            icon={theme === 'dark' ? Moon : Sun}
            label={translateText('profile.appearance')}
            value={
              <button type="button" className="profile-switch" onClick={toggleTheme} aria-pressed={theme === 'dark'}>
                <span className={`profile-switch-knob${theme === 'dark' ? ' is-dark' : ''}`} aria-hidden="true" />
                <span>{theme === 'dark' ? translateText('profile.darkMode') : translateText('profile.lightMode')}</span>
              </button>
            }
          />
          <Row
            icon={BellOff}
            label={translateText('profile.messageSound')}
            value={
              <button
                type="button"
                className="profile-switch"
                role="switch"
                aria-checked={soundOn}
                onClick={() => {
                  const next = !soundOn;
                  setSoundEnabled(next);
                  setSoundOn(next);
                  if (next) playChime();
                }}
              >
                <span className={`profile-switch-knob${soundOn ? ' is-dark' : ''}`} aria-hidden="true" />
                <span>{soundOn ? translateText('profile.soundOn') : translateText('profile.soundOff')}</span>
              </button>
            }
          />
          <Row icon={CreditCard} label={translateText('account.payment')} to="/account/payment" />
        </Card>
      </div>
    </div>
  );
}
