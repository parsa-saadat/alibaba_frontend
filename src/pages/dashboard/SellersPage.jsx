import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Check, X, Search } from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import StorageImageComponent from '../../components/main/StorageImageComponent';
import ImageLightboxComponent from '../../components/main/ImageLightboxComponent';
import { Loading } from '../../components/ScroolToTopComponent';
import { toFa, statusFa } from '../../utils/helpers/format';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

function SellersPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sellerFilter, setSellerFilter] = useState('ALL');
  const [zoomFile, setZoomFile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/sellers?limit=100`, authHeaders());
      setSellers(res.data.body?.data || res.data.body || []);
    } catch {
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingSellers = useMemo(
    () => sellers.filter((s) => !s.seller_approved_status),
    [sellers],
  );

  const q = search.trim().toLowerCase();
  const filteredSellers = useMemo(() => {
    let list = sellers;
    if (sellerFilter === 'PENDING') list = list.filter((s) => !s.seller_approved_status);
    if (sellerFilter === 'APPROVED') list = list.filter((s) => s.seller_approved_status);
    if (sellerFilter === 'INACTIVE') {
      list = list.filter((s) => String(s.seller_active_status).toUpperCase() !== 'ACTIVE');
    }
    if (q) {
      list = list.filter(
        (s) =>
          s.username?.toLowerCase().includes(q) ||
          s.national_ID?.includes(q) ||
          s.phone?.includes(q),
      );
    }
    return list;
  }, [sellers, sellerFilter, q]);

  const approveSeller = (id) =>
    axios
      .put(
        `${API}/seller/${id}`,
        { seller_approved_status: true, seller_active_status: 'ACTIVE' },
        authHeaders(),
      )
      .then(() => {
        toast.success('درخواست فروشندگی تأیید و فعال شد');
        load();
      })
      .catch((e) => toast.error(e.response?.data?.message || 'خطا در تأیید فروشنده'));

  const setSellerActive = (id, activeStatus) =>
    axios
      .put(`${API}/seller/${id}`, { seller_active_status: activeStatus }, authHeaders())
      .then(() => {
        toast.success(activeStatus === 'ACTIVE' ? 'فروشنده فعال شد' : 'فروشنده غیرفعال شد');
        load();
      })
      .catch((e) => toast.error(e.response?.data?.message || 'خطا در تغییر وضعیت فعالیت'));

  if (loading) {
    return (
      <div className="py-16">
        <Loading label="در حال بارگذاری فروشندگان…" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {[
            ['ALL', `همه (${toFa(sellers.length)})`],
            ['PENDING', `در انتظار تأیید (${toFa(pendingSellers.length)})`],
            ['APPROVED', 'تأییدشده'],
            ['INACTIVE', 'غیرفعال'],
          ].map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSellerFilter(k)}
              className={`chip ${sellerFilter === k ? 'on' : ''}`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی فروشنده، موبایل یا کد ملی…"
            className="input !py-2 !pr-9 text-xs"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredSellers.map((s) => {
          const isActive = String(s.seller_active_status).toUpperCase() === 'ACTIVE';
          return (
            <div
              key={s._id}
              className="card rounded-2xl p-5 flex flex-col lg:flex-row justify-between gap-4"
            >
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <b className="text-base">{s.username}</b>
                  <span className="chip !cursor-default !py-0.5 !px-2 text-[11px]">
                    {statusFa(s.seller_type)}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      s.seller_approved_status
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    {s.seller_approved_status ? 'تأییدشده' : 'در انتظار تأیید'}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      isActive ? 'bg-blue-500/15 text-blue-400' : 'bg-red-500/15 text-red-400'
                    }`}
                  >
                    {isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 text-xs muted">
                  <div>
                    موبایل: <b dir="ltr">{toFa(s.phone || '—')}</b>
                  </div>
                  <div>
                    کد ملی: <b dir="ltr">{toFa(s.national_ID || '—')}</b>
                  </div>
                  <div>
                    کارت: <b dir="ltr">{toFa(s.settlement_account?.card_number || '—')}</b>
                  </div>
                  <div>
                    شبا: <b dir="ltr">{s.settlement_account?.sheba_number || '—'}</b>
                  </div>
                </div>
                <div className="text-xs muted">
                  نشانی:{' '}
                  {s.address
                    ? `${s.address.province}، ${s.address.city} — ${s.address.full_address}`
                    : '—'}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  {s.identity_image_id && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-theme">
                      <StorageImageComponent
                        file={s.identity_image_id}
                        alt={`کارت ملی ${s.username}`}
                        className="w-full h-full object-cover"
                        onZoom={(f, a) => setZoomFile({ file: f, alt: a })}
                      />
                    </div>
                  )}
                  {s.identity_verification_image_id && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-theme">
                      <StorageImageComponent
                        file={s.identity_verification_image_id}
                        alt={`سلفی احراز ${s.username}`}
                        className="w-full h-full object-cover"
                        onZoom={(f, a) => setZoomFile({ file: f, alt: a })}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {!s.seller_approved_status && (
                    <button
                      type="button"
                      onClick={() => approveSeller(s._id)}
                      className="btn-yellow !py-2 !px-3.5 text-xs flex items-center gap-1"
                    >
                      <Check size={14} /> تأیید درخواست
                    </button>
                  )}
                  {isActive ? (
                    <button
                      type="button"
                      onClick={() => setSellerActive(s._id, 'INACTIVE')}
                      className="btn-ghost !py-2 !px-3.5 text-xs text-red-400 flex items-center gap-1"
                    >
                      <X size={14} /> غیرفعال کردن
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSellerActive(s._id, 'ACTIVE')}
                      className="btn-navy !py-2 !px-3.5 text-xs flex items-center gap-1"
                    >
                      <Check size={14} /> فعال کردن
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredSellers.length === 0 && (
          <div className="card rounded-2xl p-10 text-center muted">فروشنده‌ای یافت نشد.</div>
        )}
      </div>

      <ImageLightboxComponent
        file={zoomFile?.file}
        alt={zoomFile?.alt}
        onClose={() => setZoomFile(null)}
      />
    </div>
  );
}

export default SellersPage;
