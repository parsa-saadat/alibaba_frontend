import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Pencil, Trash2, Search, Phone, Mail, X } from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import { Loading } from '../../components/ScroolToTopComponent';
import { toFa } from '../../utils/helpers/format';
import { validateEmailSyntax } from '../../utils/validators/email.validator';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    firstname: '',
    lastname: '',
    email: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/user?limit=100`, authHeaders());
      setUsers(res.data.body?.data || res.data.body || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const filteredUsers = useMemo(
    () =>
      q
        ? users.filter(
            (u) =>
              u.username?.toLowerCase().includes(q) ||
              u.phone?.includes(q) ||
              u.email?.toLowerCase().includes(q) ||
              `${u.firstname || ''} ${u.lastname || ''}`.toLowerCase().includes(q),
          )
        : users,
    [users, q],
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
    if (!userForm.username.trim()) return toast.error('نام کاربری الزامی است');
    if (userForm.email.trim() && !validateEmailSyntax(userForm.email.trim())) {
      return toast.error('ایمیل معتبر نیست');
    }
    const payload = { username: userForm.username.trim() };
    if (userForm.firstname.trim()) payload.firstname = userForm.firstname.trim();
    if (userForm.lastname.trim()) payload.lastname = userForm.lastname.trim();
    if (userForm.email.trim()) payload.email = userForm.email.trim();

    axios
      .put(`${API}/user/${editingUser._id}`, payload, authHeaders())
      .then(() => {
        setEditingUser(null);
        toast.success('اطلاعات کاربر به‌روزرسانی شد');
        load();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'خطا در ویرایش کاربر'));
  };

  const deleteUser = (id) => {
    if (!confirm('این کاربر حذف شود؟')) return;
    axios
      .delete(`${API}/user/${id}`, authHeaders())
      .then(() => {
        toast.success('کاربر حذف شد');
        load();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'خطا در حذف'));
  };

  if (loading) {
    return (
      <div className="py-16">
        <Loading label="در حال بارگذاری کاربران…" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-black">کاربران ({toFa(filteredUsers.length)})</h2>
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو با نام، نام کاربری، ایمیل یا موبایل…"
            className="input !py-2 !pr-9 text-xs"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((u) => (
          <div key={u._id} className="card rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-10 h-10 rounded-xl bg-navy text-brand-yellow grid place-items-center font-black shrink-0">
                  {(u.firstname || u.username || 'ک')[0]}
                </span>
                <div className="min-w-0">
                  <div className="font-black text-sm truncate">
                    {u.firstname || u.lastname
                      ? `${u.firstname || ''} ${u.lastname || ''}`.trim()
                      : u.username}
                  </div>
                  <div className="text-xs muted truncate" dir="ltr">
                    @{u.username}
                  </div>
                </div>
              </div>
              <span className="chip !cursor-default !py-0.5 !px-2 text-[11px] shrink-0">
                {u.role}
                {u.is_seller ? ' • فروشنده' : ''}
              </span>
            </div>

            <div className="space-y-1 text-xs muted">
              <div className="flex items-center gap-1.5">
                <Phone size={12} className="text-yellow" />
                <span dir="ltr">{toFa(u.phone || '—')}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Mail size={12} className="text-yellow shrink-0" />
                <span dir="ltr" className="truncate">
                  {u.email || 'ایمیل ثبت نشده'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 mt-auto border-t border-theme">
              <button
                type="button"
                onClick={() => openEditUser(u)}
                className="btn-ghost !py-1.5 text-xs flex-1 flex items-center justify-center gap-1"
              >
                <Pencil size={13} /> ویرایش کاربر
              </button>
              <button
                type="button"
                onClick={() => deleteUser(u._id)}
                className="btn-ghost !p-2 text-red-400"
                title="حذف کاربر"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingUser && (
        <div
          className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditingUser(null)}
        >
          <form
            onSubmit={saveUser}
            onClick={(e) => e.stopPropagation()}
            className="card rounded-3xl p-6 w-full max-w-md space-y-3"
          >
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="font-black">ویرایش کاربر: {editingUser.username}</h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="btn-ghost !p-1.5"
              >
                <X size={16} />
              </button>
            </div>
            <label className="block text-xs muted">
              نام کاربری
              <input
                className="input mt-1"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs muted">
                نام
                <input
                  className="input mt-1"
                  value={userForm.firstname}
                  onChange={(e) => setUserForm({ ...userForm, firstname: e.target.value })}
                />
              </label>
              <label className="text-xs muted">
                نام خانوادگی
                <input
                  className="input mt-1"
                  value={userForm.lastname}
                  onChange={(e) => setUserForm({ ...userForm, lastname: e.target.value })}
                />
              </label>
            </div>
            <label className="block text-xs muted">
              ایمیل
              <input
                className="input mt-1"
                dir="ltr"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="btn-ghost !py-2 text-xs"
              >
                انصراف
              </button>
              <button type="submit" className="btn-yellow !py-2 text-xs">
                ذخیره تغییرات
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
