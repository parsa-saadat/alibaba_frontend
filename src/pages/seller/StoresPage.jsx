import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
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
  X,
} from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import StorageImageComponent from '../../components/common/StorageImageComponent';
import ImageLightboxComponent from '../../components/common/ImageLightboxComponent';
import StoreEditorModalComponent from '../../components/panel/StoreEditorModalComponent';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { toFa, statusFa } from '../../utils/helpers/format';
import { getId } from '../../utils/helpers/response';
import PanelPageHeader from '../../components/panel/PanelPageHeaderComponent';
import StoreCapacityComponent from '../../components/panel/StoreCapacityComponent';
import useStoreCapacity from '../../hooks/useStoreCapacity';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

const STATUS_META = {
  ENABLE: { color: '#17994f', bg: 'rgba(23,153,79,0.14)', icon: CheckCircle2 },
  DISABLE: { color: '#c2740a', bg: 'rgba(194,116,10,0.14)', icon: PauseCircle },
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
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeModal, setStoreModal] = useState(undefined);
  const [zoomFile, setZoomFile] = useState(null);
  const [busyId, setBusyId] = useState('');
  /* ظرفیت ساخت فروشگاه بر اساس پلن فروشندگی */
  const capacity = useStoreCapacity();

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [storesRes, productsRes] = await Promise.all([
        axios.get(`${API}/perm/stores?limit=100`, authHeaders()),
        axios.get(`${API}/perm/products?limit=200`, authHeaders()).catch(() => null),
      ]);
      setStores(storesRes.data.body?.data || storesRes.data.body || []);
      const list = productsRes?.data?.body?.data || productsRes?.data?.body || [];
      setProducts(Array.isArray(list) ? list : []);
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* آمار هر فروشگاه: تعداد کالا و ارزش موجودی */
  const statsByStore = useMemo(() => {
    const map = {};
    products.forEach((product) => {
      const key = getId(product.store_id);
      if (!key) return;
      if (!map[key]) map[key] = { count: 0, stock: 0, value: 0 };
      map[key].count += 1;
      map[key].stock += Number(product.stock ?? 0) || 0;
      map[key].value += Number(product.price?.amount ?? product.price ?? 0) || 0;
    });
    return map;
  }, [products]);

  const counts = useMemo(
    () => ({
      all: stores.length,
      ENABLE: stores.filter((store) => store.status === 'ENABLE').length,
      DISABLE: stores.filter((store) => store.status === 'DISABLE').length,
      ROOT_DISABLE: stores.filter((store) => store.status === 'ROOT_DISABLE').length,
    }),
    [stores],
  );

  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      stores.filter((store) => {
        if (statusFilter !== 'all' && store.status !== statusFilter) return false;
        if (!q) return true;
        return [store.name, store.contact_info?.email, store.contact_info?.phone, store.contact_info?.address]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q);
      }),
    [stores, q, statusFilter],
  );

  const setStoreStatus = async (store, status) => {
    setBusyId(getId(store));
    try {
      await axios.put(`${API}/store/${getId(store)}`, { status, contact_info: store.contact_info }, authHeaders());
      toast.success(`وضعیت فروشگاه به «${statusFa(status)}» تغییر کرد`);
      load(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در تغییر وضعیت فروشگاه');
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
    <div className="space-y-5">
      {/* ───── سرصفحه ───── */}
            <PanelPageHeader
        icon={Store}
        title="فروشگاه‌های من"
        subtitle={`${toFa(stores.length)} فروشگاه • ${toFa(products.length)} کالا در مجموع`}
        onRefresh={() => {
          capacity.refresh();
          load(true);
        }}
        refreshing={refreshing}
      />

      {/* ───── ظرفیت پلن و دکمه‌ی ساخت فروشگاه ───── */}
      <StoreCapacityComponent capacity={capacity} onCreate={() => setStoreModal(null)} />

      {/* ───── آمار ───── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="کل فروشگاه‌ها" value={toFa(counts.all)} hint={`${toFa(products.length)} کالا`} icon={Store} />
        <StatTile label="فعال" value={toFa(counts.ENABLE)} hint="در دسترس مشتری" icon={CheckCircle2} tint="#17994f" />
        <StatTile label="غیرفعال" value={toFa(counts.DISABLE)} hint="موقتاً بسته" icon={PauseCircle} tint="#c2740a" />
        <StatTile label="مسدود" value={toFa(counts.ROOT_DISABLE)} hint="توسط مدیریت" icon={Ban} tint="#e53935" />
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
                style={active ? { background: 'var(--primary-color)', color: '#0a1736', borderColor: 'transparent' } : undefined}
              >
                {tab.label}
                <span
                  className="rounded-full px-1.5 text-[10px] font-black"
                  style={{ background: active ? 'rgba(10,23,54,0.16)' : 'var(--card2)' }}
                >
                  {toFa(counts[tab.id] || 0)}
                </span>
              </button>
            );
          })}
          <span className="ms-auto text-[11px] muted">{toFa(filtered.length)} نتیجه</span>
        </div>

        <div className="relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی نام فروشگاه، ایمیل، تلفن یا نشانی…"
            className="input !py-2.5 !pr-9 text-xs w-full"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="btn-ghost !p-1 absolute left-2 top-1/2 -translate-y-1/2"
              aria-label="پاک کردن جستجو"
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
          <b className="block text-sm">
            {capacity.reason === 'not-seller' ? 'هنوز فروشنده نیستید' : 'فروشگاهی پیدا نشد'}
          </b>
          <p className="text-xs muted">
            {capacity.reason === 'not-seller'
              ? 'برای ساخت فروشگاه باید حساب فروشندگی تأییدشده داشته باشید؛ از پنل کاربری درخواست فروشندگی بدهید.'
              : stores.length === 0
                ? 'هنوز فروشگاهی نساخته‌اید.'
                : 'فیلتر یا عبارت جستجو را تغییر دهید.'}
          </p>
          {capacity.reason === 'not-seller' ? (
            <Link to="/profile" className="btn-ghost !py-2 !px-3 text-xs inline-flex items-center gap-1.5">
              درخواست فروشندگی
            </Link>
          ) : capacity.canCreate ? (
            <button type="button" onClick={() => setStoreModal(null)} className="btn-yellow !py-2 !px-3 text-xs">
              ساخت فروشگاه جدید
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={capacity.blockedText}
              className="btn-ghost !py-2 !px-3 text-xs opacity-60 cursor-not-allowed"
            >
              {capacity.blockedText || 'ساخت فروشگاه جدید'}
            </button>
          )}
        </section>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {filtered.map((store) => {
            const id = getId(store);
            const busy = busyId === id;
            const meta = metaOf(store.status);
            const StatusIcon = meta.icon;
            const rooted = store.status === 'ROOT_DISABLE';
            const stats = statsByStore[id] || { count: 0, stock: 0, value: 0 };
            const zoomable = (file) => (file ? (f, a) => setZoomFile({ file: f, alt: a }) : undefined);

            return (
              <article key={id} className="card rounded-2xl overflow-hidden flex flex-col">
                {/* بنر */}
                <div
                  className="relative w-full overflow-hidden"
                  style={{
                    height: 84,
                    background: store.banner_image_id
                      ? 'var(--card2)'
                      : 'linear-gradient(135deg, var(--card2), rgba(255,214,10,0.35))',
                  }}
                >
                  {store.banner_image_id && (
                    <StorageImageComponent
                      file={store.banner_image_id}
                      alt={`بنر ${store.name}`}
                      className="w-full h-full object-cover"
                      onZoom={zoomable(store.banner_image_id)}
                    />
                  )}
                  <span
                    className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black backdrop-blur"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <StatusIcon size={11} /> {statusFa(store.status)}
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-start gap-3">
                    <div
                      className="grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-theme text-lg font-black"
                      style={{ width: 52, height: 52, background: 'var(--card2)', color: 'var(--primary-color)' }}
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
                      <Link to={`/store/${id}`} className="block truncate text-sm font-black hover:underline">
                        {store.name || 'بدون نام'}
                      </Link>
                      {store.description && (
                        <p className="mt-1 line-clamp-2 text-[11px] muted leading-5">{store.description}</p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: 'var(--card2)', color: 'var(--text)' }}
                        >
                          <Package size={10} /> {toFa(stats.count)} کالا
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: 'var(--card2)', color: 'var(--muted)' }}
                        >
                          موجودی: {toFa(stats.stock)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-1.5 border-y border-theme py-2.5 text-[11px] muted sm:grid-cols-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Mail size={12} className="shrink-0" /> <span dir="ltr" className="truncate">{store.contact_info?.email || '—'}</span>
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Phone size={12} className="shrink-0" /> <span dir="ltr" className="truncate">{store.contact_info?.phone || store.contact_info?.fax || '—'}</span>
                    </span>
                    {store.contact_info?.address && (
                      <span className="flex min-w-0 items-center gap-1.5 sm:col-span-2">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{store.contact_info.address}</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busy || rooted}
                      onClick={() => setStoreModal(store)}
                      className="btn-yellow !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-50"
                      title={rooted ? 'این فروشگاه مسدود است' : 'ویرایش فروشگاه'}
                    >
                      <Pencil size={13} /> ویرایش
                    </button>

                    {!rooted && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setStoreStatus(store, store.status === 'ENABLE' ? 'DISABLE' : 'ENABLE')}
                        className="btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-50"
                      >
                        {store.status === 'ENABLE' ? <PauseCircle size={13} /> : <CheckCircle2 size={13} />}
                        {store.status === 'ENABLE' ? 'غیرفعال کن' : 'فعال کن'}
                      </button>
                    )}

                    <Link to={`/store/${id}`} className="btn-ghost !py-1.5 !px-2.5 text-xs flex items-center gap-1">
                      <ExternalLink size={13} /> صفحه‌ی فروشگاه
                    </Link>

                    {rooted && (
                      <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: '#e53935' }}>
                        <Ban size={12} /> مسدود توسط مدیریت
                      </span>
                    )}
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
          onClose={() => setStoreModal(undefined)}
          onSaved={() => {
            capacity.refresh();
            load(true);
          }}
        />
      )}

      <ImageLightboxComponent file={zoomFile?.file} alt={zoomFile?.alt} onClose={() => setZoomFile(null)} />
    </div>
  );
}

export default StoresPage;
