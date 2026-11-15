import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Check,
  Copy,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Store as StoreIcon,
  UserRound,
  X,
} from 'lucide-react';

import StorageImageComponent from '../common/StorageImageComponent';
import ProductTrustBadge from '../product/TrustBadge';
import { toFa } from '../../utils/helpers/format';
import { storeContactInfo } from '../../utils/helpers/user';
import { getId } from '../../utils/helpers/response';
import { TRUST } from '../../services/sellerApi';
import useSellerProfile from '../../hooks/useSellerProfile';

/* ------------------------------------------------------------------ */
/* رنگ‌ها                                                              */
/*   تأیید شده   → سبز (کل بخش سبز می‌شود)                               */
/*   تأییدنشده  → خنثی + تأکید زرد برند                                 */
/*   نامشخص     → خنثی، بدون هیچ ادعایی                                 */
/* ------------------------------------------------------------------ */

const GREEN = '#17994f';
const GREEN_RGB = '23,153,79';

const tone = (trust) => {
  if (trust === TRUST.TRUSTED) {
    return {
      trusted: true,
      accent: GREEN,
      onAccent: '#ffffff',
      soft: `rgba(${GREEN_RGB},0.14)`,
      softer: `rgba(${GREEN_RGB},0.08)`,
      line: `rgba(${GREEN_RGB},0.34)`,
      wash: `linear-gradient(180deg, rgba(${GREEN_RGB},0.10) 0%, rgba(${GREEN_RGB},0) 46%)`,
      chipText: GREEN,
    };
  }
  return {
    trusted: false,
    accent: 'var(--primary-color)',
    onAccent: 'var(--navy)',
    soft: 'color-mix(in srgb, var(--primary-color) 14%, transparent)',
    softer: 'var(--card2)',
    line: 'var(--border)',
    wash: 'none',
    chipText: 'var(--muted)',
  };
};

/* ------------------------------------------------------------------ */
/* نشان‌ها                                                             */
/* ------------------------------------------------------------------ */

/*
 * نشان اعتماد در صفحه‌ی فروشگاه — همان کامپوننت و همان واژه‌ی کارت‌های محصول
 * («مورد اعتماد» / «بدون تأیید») تا در کل سایت یک شکل باشد.
 * امضای قبلی (trust / trusted / showUntrusted) حفظ شده تا فراخوانی‌های قدیمی نشکنند.
 */
export function TrustBadge({ trust, trusted, showUntrusted = false, className = '' }) {
  const state =
    trust || (trusted === true ? TRUST.TRUSTED : trusted === false ? TRUST.UNTRUSTED : TRUST.UNKNOWN);

  if (state === TRUST.UNKNOWN) return null;
  if (state === TRUST.UNTRUSTED && !showUntrusted) return null;

  return <ProductTrustBadge trust={state} className={className} />;
}

export function ActiveBadge({ active, className = '' }) {
  if (active === null || active === undefined) return null;

  return (
    <span
      title={active ? 'فروشنده در حال فعالیت است' : 'فروشنده غیرفعال است'}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${className}`}
      style={{
        background: active ? `rgba(${GREEN_RGB},0.14)` : 'rgba(255,159,67,0.16)',
        color: 'var(--text)',
      }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: active ? GREEN : '#ff9f43' }}
      />
      {active ? 'فعال' : 'غیرفعال'}
    </span>
  );
}

function RatingChip({ rating }) {
  if (!rating) return null;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-theme px-2.5 py-1 text-[11px] font-black"
      style={{ background: 'var(--card)' }}
      title="امتیاز فروشگاه"
    >
      <Star size={12} style={{ color: 'var(--primary-color)' }} fill="currentColor" />
      {toFa(rating.toFixed(1))}
    </span>
  );
}

function LoadingChip() {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold muted"
      style={{ background: 'var(--card2)' }}
    >
      <LoaderCircle size={12} className="animate-spin" />
      بررسی اعتماد…
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* کارت «ارتباط با فروشنده»                                            */
/* ------------------------------------------------------------------ */

export function SellerStoreCard({ store, owner, product, storeId, sellerId, onOpenContact, className = '' }) {
  /* اگر داده از والد نرسیده باشد، خودِ کارت از بک‌اند می‌گیرد */
  const resolvedStoreId = getId(store) || getId(storeId) || getId(product?.store_id);
  const resolvedSellerId = getId(owner) || getId(sellerId) || getId(product?.seller_id);

  const profile = useSellerProfile({
    storeId: resolvedStoreId,
    sellerId: resolvedSellerId,
    initialStore: store || null,
    initialOwner: owner || null,
    /* این بخش ویترین نشان اعتماد است؛ همیشه تازه از سرور بخوان
       تا بعد از لغو اعتماد در پنل، سبزِ کهنه نماند */
    fresh: true,
  });

  const finalStore = profile.store || store || null;
  const finalOwner = profile.owner || owner || null;

  /* اگر هنوز چیزی از API نرسیده و خودِ والد هم داده‌ای نداشته، از فیلدهای محصول استفاده کن */
  const fallbackTrust =
    product?.seller_trust === true ? TRUST.TRUSTED : product?.seller_trust === false ? TRUST.UNTRUSTED : null;
  const trust = profile.trust || fallbackTrust || TRUST.UNKNOWN;

  const c = tone(trust);
  const info = storeContactInfo(finalStore, finalOwner);

  const sellerName = info.sellerName || String(finalOwner?.firstname || '').trim();
  const username = String(finalOwner?.username || '').trim();
  const storeTitle = info.storeName || (typeof product?.store_name === 'string' ? product.store_name : '');
  const rating = Number(finalStore?.rating) || 0;
  const storeKey = getId(finalStore) || resolvedStoreId;
  const hasData = Boolean(finalStore || finalOwner || storeTitle || info.phone || sellerName);

  return (
    <section
      aria-label="ارتباط با فروشنده"
      className={`relative overflow-hidden rounded-2xl border ${className}`}
      style={{ borderColor: c.line, background: `var(--card)` }}
    >
      {/* نوار رنگی بالای کارت */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: c.accent }}
      />
      {/* تینت سبز برای فروشنده‌ی تأیید شده */}
      {c.wash !== 'none' && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: c.wash }} />
      )}

      {/*
        چیدمان «نوار فروشنده»: یک ردیف افقی که عرض کارت را کامل پر می‌کند.
        [هویت] │ [شماره تماس] │ [نشانی] │ [دو دکمه‌ی هم‌اندازه]
        در موبایل همان بخش‌ها زیر هم می‌آیند و جداکننده‌ها افقی می‌شوند.
      */}
      <div className="relative flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-0">
        {/* ───── ۱) هویت فروشنده ───── */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-1 rounded-full" style={{ background: c.accent }} />
            <span className="text-[11px] font-black muted">ارتباط با فروشنده</span>
          </div>

          <div className="mt-2 flex items-start gap-3">
            <span
              className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border"
              style={{
                background: 'var(--card2)',
                borderColor: c.line,
                boxShadow: c.trusted ? `0 0 0 3px ${c.softer}` : 'none',
              }}
            >
              {finalStore?.profile_image_id ? (
                <StorageImageComponent
                  file={finalStore.profile_image_id}
                  alt={storeTitle || 'فروشگاه'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <StoreIcon size={22} className="muted" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="max-w-full truncate text-base font-black">
                  {storeKey ? (
                    <Link to={`/store/${storeKey}`} className="hover:underline" title="رفتن به صفحه‌ی فروشگاه">
                      {storeTitle || 'فروشنده'}
                    </Link>
                  ) : (
                    storeTitle || 'فروشنده'
                  )}
                </h2>
                {profile.loading && trust === TRUST.UNKNOWN ? (
                  <LoadingChip />
                ) : (
                  <TrustBadge trust={trust} showUntrusted />
                )}
                <ActiveBadge active={profile.active} />
                <RatingChip rating={rating} />
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1 muted">
                  <UserRound size={13} className="shrink-0" />
                  فروشنده
                </span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>
                  {sellerName || 'نامشخص'}
                </span>
              </div>

              {c.trusted && (
                <span
                  className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold"
                  style={{ color: GREEN }}
                >
                  <ShieldCheck size={12} />
                  هویت تأیید شده توسط ژئو کالا
                </span>
              )}
            </div>
          </div>
        </div>

        {!hasData && !profile.loading ? (
          <p className="text-xs muted lg:border-s lg:border-theme lg:ps-4">
            اطلاعات فروشنده‌ی این کالا در دسترس نیست.
          </p>
        ) : (
          <>
            {/* ───── ۲) شماره تماس ───── */}
            <div className="min-w-0 border-t border-theme pt-3 lg:min-w-[210px] lg:max-w-[280px] lg:flex-1 lg:border-s lg:border-t-0 lg:ps-4 lg:pt-0">
              <div className="flex items-center gap-2">
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                  style={{ background: c.soft, color: c.trusted ? GREEN : 'var(--accent-text)' }}
                >
                  <Phone size={15} />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold muted">شماره تماس</div>
                  {info.phone ? (
                    <a
                      href={`tel:${info.phone}`}
                      dir="ltr"
                      className="block truncate text-[15px] font-black tracking-wide hover:opacity-75"
                      title="تماس تلفنی با فروشنده"
                    >
                      {toFa(info.phone)}
                    </a>
                  ) : (
                    <div className="truncate text-xs font-bold muted">ثبت نشده</div>
                  )}
                </div>
              </div>
            </div>

            {/* ───── ۴) دو دکمه‌ی هم‌اندازه ───── */}
            <div className="flex flex-col gap-2 border-t border-theme pt-3 lg:w-[216px] lg:shrink-0 lg:border-s lg:border-t-0 lg:ps-4 lg:pt-0">
              <button
                type="button"
                onClick={onOpenContact}
                aria-haspopup="dialog"
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-xs font-black transition hover:opacity-90"
                style={{ background: c.accent, color: c.onAccent }}
              >
                <Phone size={15} />
                اطلاعات تماس
              </button>

              {storeKey ? (
                <Link
                  to={`/store/${storeKey}`}
                  className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition hover:opacity-80"
                  style={{ background: 'var(--card2)', borderColor: c.line, color: 'var(--text)' }}
                >
                  <StoreIcon size={15} />
                  صفحه فروشگاه
                </Link>
              ) : (
                <span className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-theme text-xs font-bold muted">
                  فروشگاهی ثبت نشده
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* ردیف اطلاعات در پاپ‌آپ                                              */
/* ------------------------------------------------------------------ */

function ContactRow({ icon: Icon, label, value, href, copyValue, ltr = false, multiline = false, onCopy, copied, accent, soft }) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 border-b border-theme px-4 py-3 last:border-0 sm:px-5">
      <span
        className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl"
        style={{ background: soft, color: accent }}
      >
        <Icon size={16} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="text-[11px] muted">{label}</div>
        {href ? (
          <a
            href={href}
            dir={ltr ? 'ltr' : undefined}
            className={`mt-0.5 block text-sm font-bold transition hover:opacity-80 ${
              multiline ? 'break-words leading-6' : 'truncate'
            } ${ltr ? 'text-end' : ''}`}
          >
            {value}
          </a>
        ) : (
          <div
            dir={ltr ? 'ltr' : undefined}
            className={`mt-0.5 text-sm font-bold ${multiline ? 'break-words leading-6' : 'truncate'} ${
              ltr ? 'text-end' : ''
            }`}
          >
            {value}
          </div>
        )}
      </div>

      {copyValue && (
        <button
          type="button"
          onClick={() => onCopy(copyValue, label)}
          className="btn-ghost shrink-0 !p-2"
          aria-label={`کپی ${label}`}
          title={copied ? 'کپی شد' : `کپی ${label}`}
        >
          {copied ? <Check size={15} style={{ color: GREEN }} /> : <Copy size={15} />}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* پاپ‌آپ اطلاعات تماس                                                 */
/* ------------------------------------------------------------------ */

export function StoreContactModal({ open, onClose, store, owner, product }) {
  const [copiedLabel, setCopiedLabel] = useState('');
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const resolvedStoreId = getId(store) || getId(product?.store_id);
  const resolvedSellerId = getId(owner) || getId(product?.seller_id);

  const profile = useSellerProfile({
    storeId: resolvedStoreId,
    sellerId: resolvedSellerId,
    initialStore: store || null,
    initialOwner: owner || null,
    enabled: open,
  });

  const finalStore = profile.store || store || null;
  const finalOwner = profile.owner || owner || null;
  const trust = profile.trust || (product?.seller_trust === true ? TRUST.TRUSTED : TRUST.UNKNOWN);
  const c = tone(trust);

  const info = useMemo(() => storeContactInfo(finalStore, finalOwner), [finalStore, finalOwner]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current?.();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => setCopiedLabel(''), 1800);
    return () => clearTimeout(timer);
  }, [copiedLabel, open]);

  if (!open) return null;

  const username = String(finalOwner?.username || '').trim();
  const storeKey = getId(finalStore) || resolvedStoreId;
  const storeTitle =
    info.storeName || (typeof product?.store_name === 'string' ? product.store_name : '') || 'فروشنده';

  const copy = async (value, label) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch {
        /* نادیده */
      }
      document.body.removeChild(textarea);
    }
    setCopiedLabel(label);
  };

  const rowProps = { onCopy: copy, accent: c.trusted ? GREEN : 'var(--accent-text)', soft: c.soft };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-contact-title"
    >
      <style>{`
        @keyframes store-contact-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes store-contact-in { from { opacity: 0; transform: translateY(18px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <button
        type="button"
        aria-label="بستن اطلاعات تماس"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ animation: 'store-contact-fade 0.2s ease-out' }}
      />

      <div
        className="card relative z-10 max-h-[92vh] w-full max-w-md overflow-hidden rounded-t-3xl border shadow-2xl sm:rounded-3xl"
        style={{ animation: 'store-contact-in 0.26s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
      >
        <div className="h-1 w-full" style={{ background: c.accent }} />

        {/* هدر */}
        <div
          className="relative border-b border-theme px-4 pb-4 pt-3.5 sm:px-5"
          style={{
            background: c.trusted
              ? `rgba(${GREEN_RGB},0.10)`
              : 'color-mix(in srgb, var(--primary-color) 10%, transparent)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-theme"
                style={{ background: 'var(--card)' }}
              >
                {finalStore?.profile_image_id ? (
                  <StorageImageComponent
                    file={finalStore.profile_image_id}
                    alt={storeTitle}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <StoreIcon size={20} className="muted" />
                )}
              </span>

              <div className="min-w-0">
                <h2 id="store-contact-title" className="truncate text-base font-black">
                  {storeKey ? (
                    <Link
                      to={`/store/${storeKey}`}
                      onClick={onClose}
                      className="hover:underline"
                      title="رفتن به صفحه‌ی فروشگاه"
                    >
                      {storeTitle}
                    </Link>
                  ) : (
                    storeTitle
                  )}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <TrustBadge trust={trust} showUntrusted />
                  <ActiveBadge active={profile.active} />
                </div>
              </div>
            </div>

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-theme transition hover:opacity-80"
              style={{ background: 'var(--card)' }}
            >
              <X size={17} />
            </button>
          </div>

          {info.phone && (
            <a
              href={`tel:${info.phone}`}
              className="mt-3 flex items-center justify-center gap-2 rounded-2xl py-3 transition hover:opacity-90"
              style={{ background: c.accent, color: c.onAccent }}
            >
              <Phone size={18} />
              <span className="text-lg font-black tracking-wide" dir="ltr">
                {toFa(info.phone)}
              </span>
            </a>
          )}
        </div>

        {/* ردیف‌ها */}
        <div className="relative">
          <div className="max-h-[42vh] overflow-y-auto">
            <ContactRow icon={Building2} label="نام فروشگاه" value={storeTitle} copyValue={storeTitle} copied={copiedLabel === 'نام فروشگاه'} {...rowProps} />
            <ContactRow icon={UserRound} label="فروشنده" value={info.sellerName} copyValue={info.sellerName} copied={copiedLabel === 'فروشنده'} {...rowProps} />
            {username && (
              <ContactRow
                icon={UserRound}
                label="نام کاربری فروشنده"
                value={`@${username}`}
                copyValue={username}
                ltr
                copied={copiedLabel === 'نام کاربری فروشنده'}
                {...rowProps}
              />
            )}
            <ContactRow
              icon={Phone}
              label="شماره تماس"
              value={info.phone ? toFa(info.phone) : ''}
              href={info.phone ? `tel:${info.phone}` : undefined}
              copyValue={info.phone}
              ltr
              copied={copiedLabel === 'شماره تماس'}
              {...rowProps}
            />
            <ContactRow
              icon={Mail}
              label="ایمیل"
              value={info.email}
              href={info.email ? `mailto:${info.email}` : undefined}
              copyValue={info.email}
              ltr
              copied={copiedLabel === 'ایمیل'}
              {...rowProps}
            />
            <ContactRow icon={MapPin} label="نشانی فروشگاه" value={info.address} multiline {...rowProps} />

            {!info.phone && !info.email && !info.address && (
              <p className="px-5 py-6 text-center text-xs muted">
                فروشنده اطلاعات تماسی ثبت نکرده است؛ از صفحه‌ی فروشگاه پیام بگذارید.
              </p>
            )}
          </div>

          {/* محو شدن لبه‌ی پایین لیست (آلفای صفر از همان رنگ کارت) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-6"
            style={{
              background:
                'linear-gradient(to top, var(--card) 0%, color-mix(in srgb, var(--card) 0%, transparent) 100%)',
            }}
          />
        </div>

        {/* اکشن‌ها — دو دکمه‌ی کاملاً هم‌اندازه */}
        <div className="border-t border-theme p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
          <div className={`grid gap-2 ${info.phone && storeKey ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {info.phone ? (
              <a
                href={`tel:${info.phone}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition hover:opacity-90"
                style={{ background: c.accent, color: c.onAccent }}
              >
                <Phone size={16} />
                تماس با فروشنده
              </a>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition hover:opacity-90"
                style={{ background: c.accent, color: c.onAccent }}
              >
                متوجه شدم
              </button>
            )}

            {storeKey && (
              <Link
                to={`/store/${storeKey}`}
                onClick={onClose}
                className="btn-ghost inline-flex h-11 items-center justify-center gap-2 !py-0 text-sm"
              >
                <StoreIcon size={16} />
                صفحه فروشگاه
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerStoreCard;
