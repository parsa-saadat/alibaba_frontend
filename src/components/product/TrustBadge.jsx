import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { BadgeCheck, ShieldOff } from 'lucide-react';

import useSellerProfile from '../../hooks/useSellerProfile';
import { TRUST, storeIdOfProduct, sellerIdOfProduct } from '../../services/sellerApi';

/*
 * TrustBadge
 * ----------
 * نشان «مورد اعتماد» فروشنده — یک جای واحد برای همه‌ی جاهایی که محصول
 * نمایش داده می‌شود (کارت فروشگاه، کارت پنل، کارت‌های کوچک صفحه‌ی اصلی،
 * پیشنهاد ویژه و …). ظاهر ملایم دور ۱۸:
 *
 *   تأییدشده  →  سبز کم‌رنگ با آیکن BadgeCheck
 *   تأییدنشده →  خاکستری با آیکن ShieldOff
 *   نامشخص    →  هیچ‌چیز (طبق قرارداد، وضعیت ناشناخته برچسب نمی‌گیرد)
 *
 * اگر صفحه‌ی والد وضعیت را از قبل می‌داند (صفحه‌ی فروشگاه)، همان را در
 * `trust` می‌دهد و این کامپوننت درخواستی نمی‌فرستد.
 */
function TrustBadge({
  product = null,
  trust: trustProp = null,
  storeId: storeIdProp = '',
  sellerId: sellerIdProp = '',
  size = 12,
  className = '',
  /* با ?trustdebug=1 وضعیت خام هم کنار نشان نوشته می‌شود */
  debug = false,
}) {
  const storeId = getIdSafe(storeIdProp) || (product ? storeIdOfProduct(product) : '');
  const sellerId = getIdSafe(sellerIdProp) || (product ? sellerIdOfProduct(product) : '');

  const known = trustProp && trustProp !== TRUST.UNKNOWN ? trustProp : null;
  const { trust: fetched } = useSellerProfile({ storeId, sellerId, enabled: !known });
  const trust = known || fetched;

  const trusted = trust === TRUST.TRUSTED;
  const untrusted = trust === TRUST.UNTRUSTED;

  const showDebug =
    debug && typeof window !== 'undefined' && /[?&]trustdebug=1\b/.test(window.location.search);

  if (!trusted && !untrusted && !showDebug) return null;

  return (
    <>
      {trusted && (
        <span
          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold leading-none ${className}`}
          style={{ background: 'color-mix(in srgb, #17994f 16%, transparent)', color: 'var(--success-text, #17994f)' }}
          title={translateText("فروشنده‌ی این کالا از سوی ژئوکالا بررسی و تأیید شده است")}
        >
          <BadgeCheck size={size} />{translateText("مورد اعتماد ")}</span>
      )}
      {!trusted && untrusted && (
        <span
          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold leading-none ${className}`}
          style={{ background: 'var(--card2)', color: 'var(--muted)' }}
          title={translateText("فروشنده‌ی این کالا هنوز از سوی ژئوکالا تأیید نشده است")}
        >
          <ShieldOff size={size} />{translateText("بدون تأیید ")}</span>
      )}
      {showDebug && (
        <span className="text-[9px] muted" style={{ direction: 'ltr' }}>
          {trust || 'null'} · st:{storeId ? storeId.slice(-4) : '-'} · sl:
          {sellerId ? sellerId.slice(-4) : '-'}
        </span>
      )}
    </>
  );
}

/* شناسه‌ی امن برای پراپ‌هایی که ممکن است شیء یا رشته باشند */
function getIdSafe(value) {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') return String(value._id ?? value.id ?? '');
  return '';
}

export default TrustBadge;
