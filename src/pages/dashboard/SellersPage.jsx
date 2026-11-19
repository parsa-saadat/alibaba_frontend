import StatTile from '../../components/panel/StatTileComponent';
import usePanelStats from '../../hooks/usePanelStats';
import StatsNotice from '../../components/panel/StatsNoticeComponent';
import { t as translateText } from '../../i18n/runtime.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  BadgeCheck,
  CalendarDays,
  Check,
  CreditCard,
  IdCard,
  MapPin,
  Pencil,
  Phone,
  Search,
  ShieldOff,
  UserRound,
  Wallet,
  Ban,
} from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import StorageImageComponent from '../../components/common/StorageImageComponent';
import ImageLightboxComponent from '../../components/common/ImageLightboxComponent';
import { Loading } from '../../components/common/ScroolToTopComponent';
import SellerEditorModalComponent from '../../components/panel/SellerEditorModalComponent';
import { toFa } from '../../utils/helpers/format';
import { isTrustedSeller, userFullName, userInitial } from '../../utils/helpers/user';
import PanelPageHeader from '../../components/panel/PanelPageHeaderComponent';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

const FILTERS = [
  ['ALL', translateText('همه')],
  ['PENDING', translateText('در انتظار تأیید')],
  ['APPROVED', translateText('تأییدشده')],
  ['TRUSTED', translateText('مورد اعتماد')],
  ['INACTIVE', translateText('غیرفعال')],
];

const TYPE_LABELS = {
  Individual_seller: translateText('حقیقی'),
  institutional_seller: translateText('حقوقی'),
};

/* ------------------------------------------------------------------ */
/* اجزای کوچک                                                          */
/* ------------------------------------------------------------------ */

function Chip({ children, tone = 'neutral', icon: Icon }) {
  const tones = {
    neutral: 'border border-theme muted',
    success: 'bg-emerald-500/15 text-emerald-400',
    warning: 'bg-amber-500/15 text-amber-400',
    danger: 'bg-red-500/15 text-red-400',
    brand: 'text-[#0a1736]',
    info: 'bg-blue-500/15 text-blue-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${tones[tone]}`}
      style={tone === 'brand' ? { background: 'var(--primary-color)' } : undefined}
    >
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon size={12} className="shrink-0 text-yellow" />
      <span className="shrink-0 text-[10px] muted">{label}:</span>
      <b className="truncate text-[11px]" dir={mono ? 'ltr' : undefined} title={String(value)}>
        {value}
      </b>
    </div>
  );
}

function DocThumb({ file, alt, onZoom }) {
  if (!file) return null;

  return (
    <button
      type="button"
      onClick={() => onZoom?.(file, alt)}
      className="h-14 w-14 overflow-hidden rounded-xl border border-theme transition hover:border-[var(--primary-color)]"
      title={alt}
    >
      <StorageImageComponent file={file} alt={alt} compact className="h-full w-full object-cover" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* صفحه                                                               */
/* ------------------------------------------------------------------ */

function SellersPage() {
  const { stats: panelStats, error: statsError, refresh: refreshStats } = usePanelStats(['seller']);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [zoom, setZoom] = useState(null);
  const [editingSeller, setEditingSeller] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      refreshStats();
      if (isRefresh && typeof isRefresh === 'object') isRefresh = true;
      if (isRefresh) setRefreshing(true);
      else setRefreshing(true);
      try {
        const res = await axios.get(`${API}/sellers?limit=100`, {
          ...authHeaders(),
          params: { search, panel_filter: filter },
        });
        const body = res.data.body;
        setSellers(Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []);
      } catch (e) {
        setSellers([]);
        toast.error(
          e.response?.data?.message || translateText('دریافت فهرست فروشندگان ناموفق بود'),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, filter],
  );

  useEffect(() => {
    const timer = setTimeout(() => load(true), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const q = search.trim().toLowerCase();
  const filteredSellers = sellers;

  /* عملیات‌ها ------------------------------------------------------- */

  const runAction = (id, request, successText) => {
    setBusyId(id);
    request()
      .then(() => {
        toast.success(successText);
        load();
      })
      .catch((e) => toast.error(e.response?.data?.message || translateText('عملیات ناموفق بود')))
      .finally(() => setBusyId(''));
  };

  const approveSeller = (id) =>
    runAction(
      id,
      () =>
        axios.put(
          `${API}/seller/${id}`,
          { seller_approved_status: true, seller_active_status: 'ACTIVE' },
          authHeaders(),
        ),
      translateText('درخواست فروشندگی تأیید و فعال شد'),
    );

  const setTrust = (id, trust) =>
    runAction(
      id,
      () => axios.put(`${API}/seller/${id}/trust`, { trust }, authHeaders()),
      trust ? translateText('فروشنده مورد اعتماد شد') : translateText('اعتماد فروشنده لغو شد'),
    );

  const setActive = (id, activeStatus) =>
    runAction(
      id,
      () => axios.put(`${API}/seller/${id}`, { seller_active_status: activeStatus }, authHeaders()),
      activeStatus === 'ACTIVE'
        ? translateText('فروشنده فعال شد')
        : translateText('فروشنده غیرفعال شد'),
    );

  if (loading) {
    return (
      <div className="py-16">
        <Loading label={translateText('در حال بارگذاری فروشندگان…')} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PanelPageHeader
        icon={UserRound}
        title={translateText('فروشندگان')}
        subtitle={translateText(
          'تأیید، فعال/غیرفعال کردن، نشان اعتماد و ویرایش کامل اطلاعات هر فروشنده.',
        )}
        onRefresh={() => load(true)}
        refreshing={refreshing}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={translateText('جستجو با نام، نام کاربری، موبایل یا کد ملی…')}
              className="input !py-2 !pe-9 text-xs"
            />
          </div>

          {/* فیلترها */}
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`chip ${filter === value ? 'on' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </PanelPageHeader>
      <StatsNotice error={statsError} stats={panelStats} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label={translateText('فروشندگان')}
          value={toFa(panelStats.seller?.counts.all ?? '—')}
        />
        <StatTile
          label={translateText('در انتظار تأیید')}
          value={toFa(panelStats.seller?.counts.pending ?? '—')}
        />
        <StatTile
          label={translateText('تأییدشده')}
          value={toFa(panelStats.seller?.counts.approved ?? '—')}
        />
        <StatTile
          label={translateText('مورد اعتماد')}
          value={toFa(panelStats.seller?.counts.trusted ?? '—')}
        />
      </div>

      {/* فهرست */}
      {filteredSellers.length === 0 ? (
        <div className="card rounded-3xl p-12 text-center">
          <UserRound size={34} className="mx-auto mb-3 muted" />
          <div className="font-black">{translateText('فروشنده‌ای با این مشخصات پیدا نشد')}</div>
          <p className="mt-1 text-xs muted">
            {translateText('فیلتر را عوض کن یا عبارت دیگری جستجو کن.')}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {filteredSellers.map((seller) => {
            const isActive = String(seller.seller_active_status).toUpperCase() === 'ACTIVE';
            const approved = seller.seller_approved_status === true;
            const trusted = isTrustedSeller(seller);
            const busy = busyId === seller._id;
            const fullName = userFullName(seller);

            return (
              <article key={seller._id} className="card flex flex-col gap-3 rounded-3xl p-4">
                {/* سر کارت */}
                <header className="flex items-start gap-3">
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-black"
                    style={{
                      background: approved ? 'var(--primary-color)' : 'rgba(130,140,170,0.25)',
                      color: approved ? '#0a1736' : 'var(--text)',
                    }}
                    aria-hidden
                  >
                    {userInitial(seller) || translateText('؟')}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <b className="truncate text-sm sm:text-base">{fullName || seller.username}</b>
                      {trusted && (
                        <Chip tone="brand" icon={BadgeCheck}>
                          {translateText('مورد اعتماد ')}
                        </Chip>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] muted">
                      {fullName && (
                        <span dir="ltr" className="truncate">
                          @{seller.username}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1" dir="ltr">
                        <Phone size={11} className="text-yellow" />
                        {toFa(seller.phone || '—')}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Chip>
                        {TYPE_LABELS[seller.seller_type] ||
                          seller.seller_type ||
                          translateText('نوع نامشخص')}
                      </Chip>
                      <Chip
                        tone={approved ? 'success' : 'warning'}
                        icon={approved ? Check : undefined}
                      >
                        {approved ? translateText('تأییدشده') : translateText('در انتظار تأیید')}
                      </Chip>
                      <Chip tone={isActive ? 'info' : 'danger'} icon={isActive ? undefined : Ban}>
                        {isActive ? translateText('فعال') : translateText('غیرفعال')}
                      </Chip>
                    </div>
                  </div>

                  {/* مدارک */}
                  <div className="flex shrink-0 gap-1.5">
                    <DocThumb
                      file={seller.identity_image_id}
                      alt={translateText('کارت ملی {{v0}}', { v0: seller.username })}
                      onZoom={(file, alt) => setZoom({ file, alt })}
                    />
                    <DocThumb
                      file={seller.identity_verification_image_id}
                      alt={translateText('سلفی احراز {{v0}}', { v0: seller.username })}
                      onZoom={(file, alt) => setZoom({ file, alt })}
                    />
                  </div>
                </header>

                {/* مشخصات */}
                <div className="grid grid-cols-2 gap-2 rounded-2xl p-3 card2">
                  <InfoRow
                    icon={IdCard}
                    label={translateText('کد ملی')}
                    value={toFa(seller.national_ID || '—')}
                    mono
                  />
                  <InfoRow
                    icon={CalendarDays}
                    label={translateText('تولد')}
                    value={toFa(seller.birth_date || '—')}
                    mono
                  />
                  <InfoRow
                    icon={CreditCard}
                    label={translateText('کارت')}
                    value={toFa(seller.settlement_account?.card_number || '—')}
                    mono
                  />
                  <InfoRow
                    icon={Wallet}
                    label={translateText('شبا')}
                    value={seller.settlement_account?.sheba_number || '—'}
                    mono
                  />
                </div>

                <div className="flex items-start gap-1.5 text-[11px] muted">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-yellow" />
                  <span className="line-clamp-2">
                    {seller.address
                      ? `${seller.address.province || ''}${seller.address.city ? translateText('، {{v0}}', { v0: seller.address.city }) : ''} — ${seller.address.full_address || ''}`
                      : translateText('نشانی ثبت نشده')}
                  </span>
                </div>

                {/* عملیات */}
                <footer className="mt-auto flex flex-wrap items-center gap-2 border-t border-theme pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingSeller(seller)}
                    className="btn-yellow inline-flex items-center gap-1 !py-1.5 !px-3 text-xs"
                  >
                    <Pencil size={13} />
                    {translateText(' ویرایش ')}
                  </button>

                  {approved ? (
                    trusted ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setTrust(seller._id, false)}
                        className="btn-ghost inline-flex items-center gap-1 !py-1.5 !px-3 text-xs disabled:opacity-50"
                      >
                        <ShieldOff size={13} />
                        {translateText(' لغو اعتماد ')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setTrust(seller._id, true)}
                        className="btn-ghost inline-flex items-center gap-1 !py-1.5 !px-3 text-xs disabled:opacity-50"
                      >
                        <BadgeCheck size={13} />
                        {translateText(' مورد اعتماد کن ')}
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => approveSeller(seller._id)}
                      className="btn-ghost inline-flex items-center gap-1 !py-1.5 !px-3 text-xs disabled:opacity-50"
                    >
                      <Check size={13} />
                      {translateText(' تأیید درخواست ')}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setActive(seller._id, isActive ? 'INACTIVE' : 'ACTIVE')}
                    className={`btn-ghost inline-flex items-center gap-1 !py-1.5 !px-3 text-xs disabled:opacity-50 ${
                      isActive ? 'text-red-400' : ''
                    }`}
                  >
                    {isActive ? <Ban size={13} /> : <Check size={13} />}
                    {isActive ? translateText('غیرفعال کن') : translateText('فعال کن')}
                  </button>

                  <span
                    className="ms-auto hidden text-[10px] muted sm:block"
                    dir="ltr"
                    title={seller._id}
                  >
                    {String(seller._id).slice(0, 10)}…
                  </span>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      <ImageLightboxComponent file={zoom?.file} alt={zoom?.alt} onClose={() => setZoom(null)} />

      {editingSeller && (
        <SellerEditorModalComponent
          seller={editingSeller}
          onClose={() => setEditingSeller(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

export default SellersPage;
