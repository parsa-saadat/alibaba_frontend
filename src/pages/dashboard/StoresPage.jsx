import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Pencil,
  Trash2,
  Search,
  ExternalLink,
  Mail,
  Phone,
  User,
  Store,
  CheckCircle2,
  PauseCircle,
  Ban,
} from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import StorageImageComponent from '../../components/main/StorageImageComponent';
import ImageLightboxComponent from '../../components/main/ImageLightboxComponent';
import StoreEditorModalComponent from '../../components/dashboard/StoreEditorModalComponent';
import { Loading } from '../../components/ScroolToTopComponent';
import { toFa, statusFa } from '../../utils/helpers/format';
import { getId } from '../../utils/helpers/response';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

const STATUS_STYLE = {
  ENABLE: { cls: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2 },
  DISABLE: { cls: 'bg-amber-500/15 text-amber-400', icon: PauseCircle },
  ROOT_DISABLE: { cls: 'bg-red-500/15 text-red-400', icon: Ban },
};

function StoresPage() {
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeModal, setStoreModal] = useState(undefined);
  const [zoomFile, setZoomFile] = useState(null);
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, uRes] = await Promise.all([
        axios.get(`${API}/perm/stores?limit=100`, authHeaders()),
        axios.get(`${API}/user?limit=100`, authHeaders()),
      ]);
      setStores(sRes.data.body?.data || sRes.data.body || []);
      setUsers(uRes.data.body?.data || uRes.data.body || []);
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const userMap = useMemo(() => Object.fromEntries(users.map((u) => [getId(u), u])), [users]);

  const counts = useMemo(
    () => ({
      all: stores.length,
      ENABLE: stores.filter((s) => s.status === 'ENABLE').length,
      DISABLE: stores.filter((s) => s.status === 'DISABLE').length,
      ROOT_DISABLE: stores.filter((s) => s.status === 'ROOT_DISABLE').length,
    }),
    [stores],
  );

  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      stores.filter((s) => {
        if (statusFilter !== 'all' && s.status !== statusFilter) return false;
        if (!q) return true;
        const owner = userMap[getId(s.user)];
        return (
          s.name?.toLowerCase().includes(q) ||
          s.contact_info?.email?.toLowerCase().includes(q) ||
          owner?.username?.toLowerCase().includes(q)
        );
      }),
    [stores, userMap, q, statusFilter],
  );

  const setStoreStatus = async (store, status) => {
    setBusyId(getId(store));
    try {
      await axios.put(
        `${API}/store/${getId(store)}`,
        { status, contact_info: store.contact_info },
        authHeaders(),
      );
      toast.success(`وضعیت فروشگاه به «${statusFa(status)}» تغییر کرد`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'خطا در تغییر وضعیت فروشگاه');
    } finally {
      setBusyId('');
    }
  };

  const deleteStore = async (store) => {
    if (!window.confirm(`فروشگاه «${store.name}» حذف شود؟`)) return;
    setBusyId(getId(store));
    try {
      await axios.delete(`${API}/store/${getId(store)}`, authHeaders());
      toast.success('فروشگاه حذف شد');
      load();
    } catch {
      toast.info('حذف ممکن نبود؛ فروشگاه به‌جای آن مسدود شد');
      await setStoreStatus(store, 'ROOT_DISABLE');
    } finally {
      setBusyId('');
    }
  };

  if (loading && stores.length === 0) {
    return (
      <div className="py-16">
        <Loading label="در حال بارگذاری فروشگاه‌ها…" />
      </div>
    );
  }

  const tabs = [
    { id: 'all', label: 'همه' },
    { id: 'ENABLE', label: 'فعال' },
    { id: 'DISABLE', label: 'غیرفعال' },
    { id: 'ROOT_DISABLE', label: 'مسدود' },
  ];

  return (
    <div className="space-y-4">
      {/* ---------- هدر ---------- */}
      <div className="card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-black flex items-center gap-2">
            <Store size={18} className="text-yellow" /> مدیریت فروشگاه‌ها
            <span className="text-xs muted font-normal">({toFa(filtered.length)} مورد)</span>
          </h2>
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی نام فروشگاه، ایمیل یا مالک…"
              className="input !py-2 !pr-9 text-xs"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setStatusFilter(t.id)}
              className={`chip !py-1 !px-3 text-xs ${statusFilter === t.id ? 'on' : ''}`}
            >
              {t.label} ({toFa(counts[t.id])})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-theme p-10 text-center text-sm muted">
          فروشگاهی پیدا نشد.
        </div>
      )}

      {/* ---------- لیست ---------- */}
      <div className="grid xl:grid-cols-2 gap-4">
        {filtered.map((s) => {
          const id = getId(s);
          const owner = userMap[getId(s.user)];
          const busy = busyId === id;
          const st = STATUS_STYLE[s.status] || STATUS_STYLE.DISABLE;
          const StatusIcon = st.icon;
          const zoomable = (file) => (file ? (f, a) => setZoomFile({ file: f, alt: a }) : undefined);

          return (
            <div
              key={id}
              className="card rounded-2xl overflow-hidden flex flex-col"
              style={{ opacity: s.status === 'ROOT_DISABLE' ? 0.8 : 1 }}
            >
              {/* بنر */}
              <div
                className="w-full relative overflow-hidden"
                style={{
                  height: 80,
                  background: s.banner_image_id
                    ? 'var(--card2)'
                    : 'linear-gradient(135deg, var(--card2), var(--primary-color) 220%)',
                }}
              >
                {s.banner_image_id && (
                  <StorageImageComponent
                    file={s.banner_image_id}
                    alt={`بنر ${s.name}`}
                    className="w-full h-full object-cover"
                    onZoom={zoomable(s.banner_image_id)}
                  />
                )}
              </div>

              <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex items-start gap-3">
                  {/* لوگو */}
                  <div
                    className="rounded-2xl overflow-hidden shrink-0 grid place-items-center font-black text-xl border border-theme"
                    style={{
                      width: 52,
                      height: 52,
                      background: 'var(--card2)',
                      color: 'var(--primary-color)',
                    }}
                  >
                    {s.profile_image_id ? (
                      <StorageImageComponent
                        file={s.profile_image_id}
                        alt={s.name}
                        className="w-full h-full object-cover"
                        onZoom={zoomable(s.profile_image_id)}
                      />
                    ) : (
                      (s.name || '?').trim()[0]
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/store/${id}`}
                        className="font-black text-base hover:underline truncate"
                      >
                        {s.name}
                      </Link>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${st.cls}`}
                      >
                        <StatusIcon size={12} /> {statusFa(s.status)}
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-xs muted leading-6 mt-1 line-clamp-2">{s.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 py-3 border-y border-theme">
                  <div className="flex items-center gap-2 text-xs muted min-w-0">
                    <User size={13} className="shrink-0" />
                    <span className="truncate">
                      {owner ? `${owner.username} (${toFa(owner.phone)})` : 'مالک نامشخص'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs muted min-w-0">
                    <Mail size={13} className="shrink-0" />
                    <span dir="ltr" className="truncate">{s.contact_info?.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs muted min-w-0">
                    <Phone size={13} className="shrink-0" />
                    <span dir="ltr" className="truncate">
                      {s.contact_info?.phone || s.contact_info?.fax || '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap mt-auto">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStoreModal(s)}
                    className="btn-yellow !py-1.5 !px-3 text-xs flex items-center gap-1"
                  >
                    <Pencil size={13} /> ویرایش
                  </button>

                  <select
                    disabled={busy}
                    value=""
                    onChange={(e) => e.target.value && setStoreStatus(s, e.target.value)}
                    className="input !py-1.5 !px-2 text-xs !w-auto"
                    aria-label="تغییر وضعیت"
                  >
                    <option value="">تغییر وضعیت…</option>
                    {s.status !== 'ENABLE' && <option value="ENABLE">فعال کردن</option>}
                    {s.status !== 'DISABLE' && <option value="DISABLE">غیرفعال کردن</option>}
                    {s.status !== 'ROOT_DISABLE' && (
                      <option value="ROOT_DISABLE">مسدودسازی ریشه‌ای</option>
                    )}
                  </select>

                  <Link to={`/store/${id}`} className="btn-ghost !p-2" title="مشاهده صفحه فروشگاه">
                    <ExternalLink size={14} />
                  </Link>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => deleteStore(s)}
                    className="btn-ghost !p-2 text-red-400 mr-auto"
                    title="حذف فروشگاه"
                    aria-label="حذف فروشگاه"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {storeModal !== undefined && (
        <StoreEditorModalComponent
          store={storeModal}
          isAdmin
          onClose={() => setStoreModal(undefined)}
          onSaved={load}
        />
      )}

      <ImageLightboxComponent
        file={zoomFile?.file}
        alt={zoomFile?.alt}
        onClose={() => setZoomFile(null)}
      />
    </div>
  );
}

export default StoresPage;