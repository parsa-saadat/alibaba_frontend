import { t as translateText } from '../../i18n/runtime.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BadgeCheck,
  CalendarDays,
  Check,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { toFa, formatDate } from '../../utils/helpers/format';
import { validateEmailSyntax } from '../../utils/validators/email.validator';
import PanelPageHeader from '../../components/panel/PanelPageHeaderComponent';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

const fullNameOf = (user) =>
  `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username || translateText("کاربر");

const initialOf = (user) => (fullNameOf(user)[0] || translateText("ک")).toUpperCase();

/* رنگ نوار بالای کارت بر اساس نقش */
const roleMeta = (user) => {
  const role = String(user.role || 'user').toLowerCase();
  if (role === 'admin' || role === 'root') return { label: translateText("مدیر"), color: '#ffd60a', bg: 'rgba(255,214,10,0.14)' };
  if (user.is_seller || role === 'seller')
    return { label: translateText("فروشنده"), color: '#2563eb', bg: 'rgba(37,99,235,0.14)' };
  return { label: translateText("کاربر"), color: '#17994f', bg: 'rgba(23,153,79,0.14)' };
};

const FILTERS = [
  { key: 'ALL', label: translateText("همه") },
  { key: 'admin', label: translateText("مدیران") },
  { key: 'seller', label: translateText("فروشندگان") },
  { key: 'user', label: translateText("کاربران") },
];

function StatTile({ label, value, hint, icon: Icon, tint }) {
  return (
    <div className="card rounded-2xl p-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[11px] font-bold muted truncate">{label}</div>
        <div className="mt-2 text-lg font-black" style={{ color: tint || 'var(--text)' }}>
          {value}
        </div>
        {hint && <div className="mt-1 text-[10px] muted truncate">{hint}</div>}
      </div>
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{ background: 'var(--card2)', color: tint || 'var(--primary-color)' }}
      >
        <Icon size={17} />
      </span>
    </div>
  );
}

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', firstname: '', lastname: '', email: '' });

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await axios.get(`${API}/user?limit=100`, authHeaders());
      setUsers(res.data.body?.data || res.data.body || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const admins = users.filter((u) => ['admin', 'root'].includes(String(u.role).toLowerCase())).length;
    const sellers = users.filter((u) => u.is_seller || String(u.role).toLowerCase() === 'seller').length;
    const trusted = users.filter((u) => u.seller_trust === true).length;
    return { admins, sellers, trusted };
  }, [users]);

  const q = search.trim().toLowerCase();
  const filteredUsers = useMemo(
    () =>
      users.filter((u) => {
        const role = String(u.role || 'user').toLowerCase();
        if (roleFilter === 'admin' && !['admin', 'root'].includes(role)) return false;
        if (roleFilter === 'seller' && !(u.is_seller || role === 'seller')) return false;
        if (roleFilter === 'user' && (u.is_seller || role === 'seller' || ['admin', 'root'].includes(role)))
          return false;
        if (!q) return true;
        return [u.username, u.phone, u.email, u.firstname, u.lastname]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q);
      }),
    [users, q, roleFilter],
  );

  const openEditUser = (u) => {
    setEditingUser(u);
    setUserForm({
      username: u.username || '',
      firstname: u.firstname || '',
      lastname: u.lastname || '',
      email: u.email || '',
    });
  };

  const saveUser = (e) => {
    e.preventDefault();
    if (!userForm.username.trim()) return toast.error(translateText("نام کاربری الزامی است"));
    if (userForm.email.trim() && !validateEmailSyntax(userForm.email.trim())) {
      return toast.error(translateText("ایمیل معتبر نیست"));
    }

    const payload = { username: userForm.username.trim() };
    if (userForm.firstname.trim()) payload.firstname = userForm.firstname.trim();
    if (userForm.lastname.trim()) payload.lastname = userForm.lastname.trim();
    if (userForm.email.trim()) payload.email = userForm.email.trim();

    setSaving(true);
    axios
      .put(`${API}/user/${editingUser._id}`, payload, authHeaders())
      .then(() => {
        setEditingUser(null);
        toast.success(translateText("اطلاعات کاربر به‌روزرسانی شد"));
        return load(true);
      })
      .catch((err) => toast.error(err.response?.data?.message || translateText("خطا در ویرایش کاربر")))
      .finally(() => setSaving(false));
  };

  const deleteUser = () => {
    if (!deleteTarget) return;
    setSaving(true);
    axios
      .delete(`${API}/user/${deleteTarget._id}`, authHeaders())
      .then(() => {
        setDeleteTarget(null);
        toast.success(translateText("کاربر حذف شد"));
        return load(true);
      })
      .catch((err) => toast.error(err.response?.data?.message || translateText("خطا در حذف")))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="py-16">
        <Loading label={translateText("در حال بارگذاری کاربران…")} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ───── سرصفحه (کامپوننت مشترک پنل) ───── */}
      <PanelPageHeader
        icon={Users}
        title={translateText("کاربران ژئو کالا")}
        subtitle={translateText("مدیریت اعضا، فروشندگان و مدیران • {{v0}} حساب", {v0: (toFa(users.length))})}
        onRefresh={() => load(true)}
        refreshing={refreshing}
        actions={
          <Link to="/dashboard/sellers" className="btn-ghost !py-2 !px-3 text-xs flex items-center gap-1.5">
            <Store size={14} />{translateText(" پنل فروشندگان ")}</Link>
        }
      />

      {/* ───── آمار ───── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={translateText("کل کاربران")} value={toFa(users.length)} hint={translateText("همه‌ی نقش‌ها")} icon={Users} />
        <StatTile label={translateText("فروشندگان")} value={toFa(stats.sellers)} hint={translateText("دارای پنل فروشنده")} icon={Store} tint="#2563eb" />
        <StatTile label={translateText("مدیران")} value={toFa(stats.admins)} hint={translateText("دسترسی کامل")} icon={ShieldCheck} tint="#c2740a" />
        <StatTile label={translateText("مورد اعتماد")} value={toFa(stats.trusted)} hint={translateText("فروشنده‌ی تأییدشده")} icon={BadgeCheck} tint="#17994f" />
      </div>

      {/* ───── جستجو و فیلتر ───── */}
      <section className="card rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((filter) => {
            const active = roleFilter === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setRoleFilter(filter.key)}
                className="chip"
                style={
                  active
                    ? { background: 'var(--primary-color)', color: '#0a1736', borderColor: 'transparent' }
                    : undefined
                }
              >
                {filter.label}
              </button>
            );
          })}
          <span className="ms-auto text-[11px] muted">
            {toFa(filteredUsers.length)}{translateText(" نتیجه ")}</span>
        </div>

        <div className="relative">
          <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={translateText("جستجو با نام، نام کاربری، ایمیل یا موبایل…")}
            className="input !py-2.5 !pe-9 text-xs w-full"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="btn-ghost !p-1 absolute start-2 top-1/2 -translate-y-1/2"
              aria-label={translateText("پاک کردن جستجو")}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </section>

      {/* ───── کارت کاربران ───── */}
      {filteredUsers.length === 0 ? (
        <section className="card rounded-3xl p-10 text-center space-y-3">
          <span
            className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: 'var(--card2)', color: 'var(--muted)' }}
          >
            <UserRound size={24} />
          </span>
          <b className="block text-sm">{translateText("کاربری پیدا نشد")}</b>
          <p className="text-xs muted">
            {users.length === 0 ? translateText("لیست کاربران خالی است.") : translateText("فیلتر یا عبارت جستجو را تغییر دهید.")}
          </p>
          {(search || roleFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setRoleFilter('ALL');
              }}
              className="btn-ghost !py-2 !px-3 text-xs"
            >{translateText("پاک کردن فیلترها ")}</button>
          )}
        </section>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredUsers.map((u) => {
            const meta = roleMeta(u);
            const trusted = u.seller_trust === true;
            const seller = u.is_seller || String(u.role).toLowerCase() === 'seller';

            return (
              <article key={u._id} className="card rounded-2xl overflow-hidden flex flex-col">
                <div className="h-1.5 w-full" style={{ background: meta.color, opacity: 0.85 }} />

                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-start gap-3">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-base font-black"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {initialOf(u)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <b className="truncate text-sm">{fullNameOf(u)}</b>
                        {trusted && <BadgeCheck size={14} style={{ color: '#17994f' }} />}
                      </div>
                      <div className="mt-0.5 text-[11px] muted truncate" dir="ltr">
                        @{u.username || '—'}
                      </div>
                    </div>

                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] muted">
                    <div className="flex items-center gap-1.5">
                      <Phone size={11} className="shrink-0" style={{ color: 'var(--primary-color)' }} />
                      <span dir="ltr">{toFa(u.phone || '—')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail size={11} className="shrink-0" style={{ color: 'var(--primary-color)' }} />
                      <span dir="ltr" className="truncate">
                        {u.email || translateText("ایمیل ثبت نشده")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarDays size={11} className="shrink-0" style={{ color: 'var(--primary-color)' }} />
                      <span>{translateText("عضویت: ")}{formatDate(u.created_at || u.create_at)}</span>
                    </div>
                  </div>

                  {seller && (
                    <div className="flex flex-wrap items-center gap-1">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          background: u.seller_approved_status ? 'rgba(23,153,79,0.14)' : 'rgba(194,116,10,0.14)',
                          color: u.seller_approved_status ? '#17994f' : '#c2740a',
                        }}
                      >
                        {u.seller_approved_status ? translateText("تأییدشده") : translateText("در انتظار تأیید")}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          background: u.seller_active_status === 'ACTIVE' ? 'rgba(37,99,235,0.14)' : 'rgba(130,140,170,0.16)',
                          color: u.seller_active_status === 'ACTIVE' ? '#2563eb' : 'var(--muted)',
                        }}
                      >
                        {u.seller_active_status === 'ACTIVE' ? translateText("فعال") : translateText("غیرفعال")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-auto flex items-center gap-1.5 border-t border-theme p-3">
                  <button
                    type="button"
                    onClick={() => openEditUser(u)}
                    className="btn-ghost !py-1.5 text-xs flex-1 flex items-center justify-center gap-1"
                  >
                    <Pencil size={13} />{translateText(" ویرایش ")}</button>
                  {seller && (
                    <Link
                      to="/dashboard/sellers"
                      className="btn-ghost !py-1.5 !px-2.5 text-xs flex items-center gap-1"
                      title={translateText("مدیریت در بخش فروشندگان")}
                    >
                      <Store size={13} />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(u)}
                    className="btn-ghost !p-2"
                    style={{ color: '#e53935' }}
                    title={translateText("حذف کاربر")}
                    aria-label={translateText("حذف کاربر")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ───── مودال ویرایش ───── */}
      {editingUser && (
        <div
          className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditingUser(null)}
        >
          <form
            onSubmit={saveUser}
            onClick={(e) => e.stopPropagation()}
            className="card rounded-3xl w-full max-w-lg overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-theme p-4">
              <span
                className="grid h-11 w-11 place-items-center rounded-2xl text-base font-black"
                style={{ background: roleMeta(editingUser).bg, color: roleMeta(editingUser).color }}
              >
                {initialOf(editingUser)}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black truncate">{translateText("ویرایش ")}{fullNameOf(editingUser)}</h3>
                <span className="text-[11px] muted" dir="ltr">
                  @{editingUser.username}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="btn-ghost !p-1.5"
                aria-label={translateText("بستن")}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <label className="block text-[11px] font-bold muted">{translateText("نام کاربری ")}<input
                  className="input mt-1.5 !text-xs"
                  dir="ltr"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] font-bold muted">{translateText("نام ")}<input
                    className="input mt-1.5 !text-xs"
                    value={userForm.firstname}
                    onChange={(e) => setUserForm({ ...userForm, firstname: e.target.value })}
                  />
                </label>
                <label className="text-[11px] font-bold muted">{translateText("نام خانوادگی ")}<input
                    className="input mt-1.5 !text-xs"
                    value={userForm.lastname}
                    onChange={(e) => setUserForm({ ...userForm, lastname: e.target.value })}
                  />
                </label>
              </div>
              <label className="block text-[11px] font-bold muted">{translateText("ایمیل ")}<input
                  className="input mt-1.5 !text-xs"
                  dir="ltr"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                />
              </label>

              <div className="card2 rounded-xl p-2.5 text-[11px] muted flex items-center gap-1.5">
                <Phone size={12} />{translateText("شماره موبایل و نقش کاربر فقط از سمت سرور قابل تغییر است. ")}</div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-theme p-3">
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setDeleteTarget(editingUser);
                }}
                className="btn-ghost !py-2 !px-3 text-xs"
                style={{ color: '#e53935' }}
              >{translateText("حذف کاربر ")}</button>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setEditingUser(null)} className="btn-ghost !py-2 !px-4 text-xs">{translateText("انصراف ")}</button>
                <button type="submit" disabled={saving} className="btn-yellow !py-2 !px-4 text-xs flex items-center gap-1.5 disabled:opacity-60">
                  <Check size={14} /> {saving ? translateText("در حال ذخیره…") : translateText("ذخیره تغییرات")}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ───── مودال حذف ───── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[160] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="card rounded-3xl p-5 w-full max-w-sm space-y-4 text-center">
            <span
              className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
              style={{ background: 'rgba(229,57,53,0.14)', color: '#e53935' }}
            >
              <Trash2 size={24} />
            </span>
            <div className="space-y-1">
              <b className="block text-sm">{translateText("حذف کاربر")}</b>
              <p className="text-xs muted leading-6">
                «{fullNameOf(deleteTarget)}{translateText("» برای همیشه حذف می‌شود. این عملیات قابل بازگشت نیست. ")}</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="btn-ghost !py-2 !px-4 text-xs">{translateText("انصراف ")}</button>
              <button
                type="button"
                disabled={saving}
                onClick={deleteUser}
                className="btn-yellow !py-2 !px-4 text-xs disabled:opacity-60"
                style={{ background: '#e53935', color: '#fff' }}
              >
                {saving ? translateText("در حال حذف…") : translateText("بله، حذف کن")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
