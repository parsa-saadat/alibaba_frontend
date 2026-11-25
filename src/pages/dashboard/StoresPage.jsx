import { storeDisplay, displayText } from '../../utils/helpers/display-text';
import usePanelStats from '../../hooks/usePanelStats';
import StatsNotice from '../../components/panel/StatsNoticeComponent';
import { t as translateText } from '../../i18n/runtime.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BadgeCheck,
  Ban,
  CheckCircle2,
  ExternalLink,
  Mail,
  MapPin,
  Package,
  PauseCircle,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Store,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import StorageImageComponent from '../../components/common/StorageImageComponent';
import ImageLightboxComponent from '../../components/common/ImageLightboxComponent';
import StoreEditorModalComponent from '../../components/panel/StoreEditorModalComponent';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { toFa, statusFa } from '../../utils/helpers/format';
import { getId } from '../../utils/helpers/response';
import { userFullName } from '../../utils/helpers/user';
import PanelPageHeader from '../../components/panel/PanelPageHeaderComponent';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

const STATUS_META = {
  ENABLE: { color: '#17994f', bg: 'rgba(23,153,79,0.14)', icon: CheckCircle2 },
  DISABLE: { color: '#ff6a00', bg: 'rgba(255,106,0,0.14)', icon: PauseCircle },
  ROOT_DISABLE: { color: '#e53935', bg: 'rgba(229,57,53,0.14)', icon: Ban },
};
const metaOf = (status) => STATUS_META[status] || STATUS_META.DISABLE;

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

function StoresPage() {
  const { stats: panelStats, error: statsError, refresh: refreshStats } = usePanelStats(['store']);
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeModal, setStoreModal] = useState(undefined);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [zoomFile, setZoomFile] = useState(null);
  const [busyId, setBusyId] = useState('');

  const load = useCallback(
    async (silent = false) => {
      refreshStats();
      if (silent) setRefreshing(true);
      else setRefreshing(true);
      try {
        const [storesRes, usersRes] = await Promise.all([
          axios.get(`${API}/perm/stores?lang=all&limit=100`, {
            ...authHeaders(),
            params: { search, status: statusFilter === 'all' ? undefined : statusFilter },
          }),
          axios.get(`${API}/user?limit=100`, authHeaders()).catch(() => null),
        ]);
        setStores((storesRes.data.body?.data || storesRes.data.body || []).map(storeDisplay));
        setUsers(usersRes?.data?.body?.data || usersRes?.data?.body || []);
      } catch {
        setStores([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, statusFilter],
  );

  useEffect(() => {
    const timer = setTimeout(() => load(true), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const userMap = useMemo(() => Object.fromEntries(users.map((u) => [getId(u), u])), [users]);

  const statsByStore = panelStats.store?.byStore || {};

  const counts = panelStats.store?.counts || {
    all: '—',
    ENABLE: '—',
    DISABLE: '—',
    ROOT_DISABLE: '—',
  };

  const q = search.trim().toLowerCase();
  const filtered = stores;

  const setStoreStatus = async (store, status) => {
    setBusyId(getId(store));
    try {
      await axios.put(
        `${API}/store/${getId(store)}`,
        { status, contact_info: store.contact_info },
        authHeaders(),
      );
      toast.success(translateText('وضعیت فروشگاه به «{{v0}}» تغییر کرد', { v0: statusFa(status) }));
      load(true);
    } catch (error) {
      toast.error(error.response?.data?.message || translateText('خطا در تغییر وضعیت فروشگاه'));
    } finally {
      setBusyId('');
    }
  };

  const deleteStore = async (store) => {
    setBusyId(getId(store));
    try {
      await axios.delete(`${API}/store/${getId(store)}`, authHeaders());
      toast.success(translateText('فروشگاه حذف شد'));
      setDeleteTarget(null);
      load(true);
    } catch {
      toast.info(translateText('حذف ممکن نبود؛ فروشگاه به‌جای آن مسدود شد'));
      await setStoreStatus(store, 'ROOT_DISABLE');
      setDeleteTarget(null);
    } finally {
      setBusyId('');
    }
  };

  if (loading && stores.length === 0) {
    return (
      <div className="py-16">
        <Loading label={translateText('در حال بارگذاری فروشگاه‌ها…')} />
      </div>
    );
  }

  const tabs = [
    { id: 'all', label: translateText('همه') },
    { id: 'ENABLE', label: translateText('فعال') },
    { id: 'DISABLE', label: translateText('غیرفعال') },
    { id: 'ROOT_DISABLE', label: translateText('مسدود') },
  ];

  return (
    <div className="space-y-5">
      <PanelPageHeader
        icon={Store}
        title={translateText('مدیریت فروشگاه‌ها')}
        subtitle={translateText('{{v0}} فروشگاه • {{v1}} کالا • {{v2}} فعال', {
          v0: toFa(counts.all),
          v1: toFa(panelStats.store?.products ?? '—'),
          v2: toFa(counts.ENABLE),
        })}
        onRefresh={() => load(true)}
        refreshing={refreshing}
        actions={
          <>
            <Link
              to="/dashboard/sellers"
              className="btn-ghost !py-2 !px-3 text-xs flex items-center gap-1.5"
            >
              <UserRound size={14} />
              {translateText(' فروشندگان ')}
            </Link>
            <button
              type="button"
              onClick={() => setStoreModal(null)}
              className="btn-ghost !py-2 !px-3 text-xs flex items-center gap-1.5"
            >
              <Plus size={14} />
              {translateText(' فروشگاه جدید ')}
            </button>
          </>
        }
      />
      <StatsNotice error={statsError} stats={panelStats} />

      {/* ───── آمار ───── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={translateText('کل فروشگاه‌ها')}
          value={toFa(counts.all)}
          hint={translateText('{{v0}} کالا', { v0: toFa(panelStats.store?.products ?? '—') })}
          icon={Store}
        />
        <StatTile
          label={translateText('فعال')}
          value={toFa(counts.ENABLE)}
          hint={translateText('در دسترس مشتری')}
          icon={CheckCircle2}
          tint="#17994f"
        />
        <StatTile
          label={translateText('غیرفعال')}
          value={toFa(counts.DISABLE)}
          hint={translateText('موقتاً بسته')}
          icon={PauseCircle}
          tint="#ff6a00"
        />
        <StatTile
          label={translateText('مسدود')}
          value={toFa(counts.ROOT_DISABLE)}
          hint={translateText('توسط مدیریت')}
          icon={Ban}
          tint="#e53935"
        />
      </div>

      {/* ───── فیلتر و جستجو ───── */}
      <section className="card rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {tabs.map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className="chip flex items-center gap-1.5"
                style={
                  active
                    ? {
                        background: 'var(--primary-color)',
                        color: '#242424',
                        borderColor: 'transparent',
                      }
                    : undefined
                }
              >
                {tab.label}
                <span
                  className="rounded-full px-1.5 text-[10px] font-black"
                  style={{ background: active ? 'rgba(36,36,36,0.16)' : 'var(--card2)' }}
                >
                  {toFa(counts[tab.id] || 0)}
                </span>
              </button>
            );
          })}
          <span className="ms-auto text-[11px] muted">
            {toFa(filtered.length)}
            {translateText(' نتیجه')}
          </span>
        </div>

        <div className="relative">
          <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={translateText('جستجوی نام فروشگاه، ایمیل یا مالک…')}
            className="input !py-2.5 !pe-9 text-xs w-full"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="btn-ghost !p-1 absolute start-2 top-1/2 -translate-y-1/2"
              aria-label={translateText('پاک کردن جستجو')}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </section>

      {/* ───── لیست ───── */}
      {filtered.length === 0 ? (
        <section className="card rounded-3xl p-10 text-center space-y-3">
          <span
            className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: 'var(--card2)', color: 'var(--muted)' }}
          >
            <Store size={24} />
          </span>
          <b className="block text-sm">{translateText('فروشگاهی پیدا نشد')}</b>
          <p className="text-xs muted">
            {stores.length === 0
              ? translateText('فروشگاهی ثبت نشده است.')
              : translateText('فیلتر یا عبارت جستجو را تغییر دهید.')}
          </p>
        </section>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {filtered.map((rawStore) => {
            const store = storeDisplay(rawStore);
            const id = getId(store);
            const owner = userMap[getId(store.user)];
            const busy = busyId === id;
            const meta = metaOf(store.status);
            const StatusIcon = meta.icon;
            const rooted = store.status === 'ROOT_DISABLE';
            const stats = statsByStore[id] || { count: '—', stock: '—' };
            const zoomable = (file) =>
              file ? (f, a) => setZoomFile({ file: f, alt: a }) : undefined;

            return (
              <article key={id} className="card rounded-2xl overflow-hidden flex flex-col">
                <div
                  className="relative w-full overflow-hidden"
                  style={{
                    height: 84,
                    background: store.banner_image_id
                      ? 'var(--card2)'
                      : 'linear-gradient(135deg, var(--card2), rgba(255,106,0,0.35))',
                  }}
                >
                  {store.banner_image_id && (
                    <StorageImageComponent
                      file={store.banner_image_id}
                      alt={translateText('بنر {{v0}}', { v0: store.name })}
                      className="w-full h-full object-cover"
                      onZoom={zoomable(store.banner_image_id)}
                    />
                  )}
                  <span
                    className="absolute top-2 start-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black backdrop-blur"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <StatusIcon size={11} /> {statusFa(store.status)}
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-start gap-3">
                    <div
                      className="grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-theme text-lg font-black"
                      style={{
                        width: 52,
                        height: 52,
                        background: 'var(--card2)',
                        color: 'var(--primary-color)',
                      }}
                    >
                      {store.profile_image_id ? (
                        <StorageImageComponent
                          file={store.profile_image_id}
                          alt={store.name}
                          className="w-full h-full object-cover"
                          onZoom={zoomable(store.profile_image_id)}
                        />
                      ) : (
                        (store.name || '?').trim()[0]
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/store/${id}`}
                        className="block truncate text-sm font-black hover:underline"
                      >
                        {store.name || translateText('بدون نام')}
                      </Link>
                      <div className="mt-1 flex items-center gap-1 text-[11px] muted min-w-0">
                        <UserRound size={11} className="shrink-0" />
                        <span className="truncate">
                          {userFullName(owner) ||
                            displayText(owner?.username) ||
                            translateText('مالک نامشخص')}
                        </span>
                        {owner?.seller_trust === true && (
                          <BadgeCheck size={12} style={{ color: '#17994f' }} />
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: 'var(--card2)', color: 'var(--text)' }}
                        >
                          <Package size={10} /> {toFa(stats.count)}
                          {translateText(' کالا ')}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: 'var(--card2)', color: 'var(--muted)' }}
                        >
                          {translateText('موجودی: ')}
                          {toFa(stats.stock)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-1.5 border-y border-theme py-2.5 text-[11px] muted sm:grid-cols-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Mail size={12} className="shrink-0" />
                      <span dir="ltr" className="truncate">
                        {store.contact_info?.email || '—'}
                      </span>
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Phone size={12} className="shrink-0" />
                      <span dir="ltr" className="truncate">
                        {store.contact_info?.phone || store.contact_info?.fax || '—'}
                      </span>
                    </span>
                    {(store.address || store.contact_info?.address) && (
                      <span className="flex min-w-0 items-center gap-1.5 sm:col-span-2">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">
                          {store.address || store.contact_info?.address}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setStoreModal(store)}
                      className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-50"
                    >
                      <Pencil size={13} />
                      {translateText(' ویرایش ')}
                    </button>

                    {!rooted && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          setStoreStatus(store, store.status === 'ENABLE' ? 'DISABLE' : 'ENABLE')
                        }
                        className="btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-50"
                      >
                        {store.status === 'ENABLE' ? (
                          <PauseCircle size={13} />
                        ) : (
                          <CheckCircle2 size={13} />
                        )}
                        {store.status === 'ENABLE'
                          ? translateText('غیرفعال')
                          : translateText('فعال')}
                      </button>
                    )}

                    {rooted ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setStoreStatus(store, 'ENABLE')}
                        className="btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-50"
                        style={{ color: '#17994f' }}
                        title={translateText('برداشتن مسدودی و فعال‌سازی دوباره‌ی فروشگاه')}
                      >
                        <CheckCircle2 size={13} />
                        {translateText(' رفع مسدودی ')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              translateText(
                                'فروشگاه «{{v0}}» مسدود شود؟ فروشنده دیگر نمی‌تواند آن را ویرایش یا فعال کند.',
                                { v0: store.name },
                              ),
                            )
                          ) {
                            setStoreStatus(store, 'ROOT_DISABLE');
                          }
                        }}
                        className="btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-50"
                        style={{ color: '#e53935' }}
                        title={translateText('مسدودسازی توسط مدیریت')}
                      >
                        <Ban size={13} />
                        {translateText(' مسدودسازی ')}
                      </button>
                    )}

                    <Link
                      to={`/store/${id}`}
                      className="btn-ghost !py-1.5 !px-2.5 text-xs flex items-center gap-1"
                    >
                      <ExternalLink size={13} />
                      {translateText(' صفحه ')}
                    </Link>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDeleteTarget(store)}
                      className="btn-ghost !p-2 ms-auto disabled:opacity-50"
                      style={{ color: '#e53935' }}
                      title={translateText('حذف یا مسدودسازی فروشگاه')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {storeModal !== undefined && (
        <StoreEditorModalComponent
          store={storeModal}
          isAdmin
          users={users}
          onClose={() => setStoreModal(undefined)}
          onSaved={() => load(true)}
        />
      )}

      {/* ───── تأیید حذف ───── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card rounded-3xl p-5 w-full max-w-sm space-y-4 text-center"
          >
            <span
              className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
              style={{ background: 'rgba(229,57,53,0.14)', color: '#e53935' }}
            >
              <Trash2 size={24} />
            </span>
            <div className="space-y-1">
              <b className="block text-sm">{translateText('حذف فروشگاه')}</b>
              <p className="text-xs muted leading-6">
                «{displayText(deleteTarget.name)}
                {translateText(
                  '» حذف شود؟ اگر حذف ممکن نباشد، فروشگاه مسدود می‌شود و کالاهایش از دسترس خارج می‌شوند. ',
                )}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="btn-ghost !py-2 !px-4 text-xs"
              >
                {translateText('انصراف ')}
              </button>
              <button
                type="button"
                disabled={busyId === getId(deleteTarget)}
                onClick={() => deleteStore(deleteTarget)}
                className="btn-primary !py-2 !px-4 text-xs disabled:opacity-60"
                style={{ background: '#e53935', color: '#fff' }}
              >
                {translateText('بله، حذف کن ')}
              </button>
            </div>
          </div>
        </div>
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
