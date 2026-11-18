import { language as currentLocale } from '../i18n/runtime';
import { t as translateText } from '../i18n/runtime.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API } from '../config/api';
import { authHeaders } from '../utils/helpers/storage';
import { useShop } from '../contexts/ShopContext';
import { getId } from '../utils/helpers/response';

/*
 * useStoreCapacity — ظرفیت ساخت فروشگاه بر اساس پلن فروشندگی
 * ----------------------------------------------------------
 * خروجی:
 *   plan        سند پلن فعلی کاربر (یا null)
 *   maxShops    سقف تعداد فروشگاه در پلن (features.max_shops)
 *   used        تعداد فروشگاه‌های فعلی کاربر
 *   remaining   ظرفیت باقی‌مانده
 *   planActive  پلن فعال و منقضی‌نشده است؟
 *   canCreate   اجازه‌ی ساخت فروشگاه جدید هست؟
 *   reason      اگر نبود: 'not-seller' | 'no-plan' | 'expired' | 'no-capacity' | 'full'
 *   blockedText پیام فارسی آماده برای نمایش
 *   refresh()   دریافت دوباره‌ی داده
 *
 * قواعد (هم‌راستا با بک‌اند در createStoreService):
 *   • فقط فروشنده‌ی تأییدشده/فعال می‌تواند فروشگاه بسازد.
 *   • پلن باید وجود داشته باشد، ACTIVE باشد و منقضی نشده باشد.
 *   • تعداد فروشگاه‌های ساخته‌شده باید کمتر از features.max_shops باشد.
 */
export default function useStoreCapacity() {
  const { user } = useShop();
  const [plan, setPlan] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = getId(user) || '';
  const planRaw = user?.seller_plan?.plan_id;
  const planId = typeof planRaw === 'string' ? planRaw : getId(planRaw) || '';
  const startAt = user?.seller_plan?.start_at || null;

  const isSeller =
    user?.is_seller === true ||
    String(user?.role || '').toLowerCase() === 'seller' ||
    user?.seller_approved_status === true;

  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';

  const load = useCallback(
    async (signal) => {
      if (!userId) {
        setPlan(null);
        setStores([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      /* ── پلن ── */
      let planDoc = null;
      if (planId) {
        try {
          const res = await axios.get(`${API}/plan/${planId}`, { ...authHeaders(), signal });
          const body = res?.data?.body;
          planDoc = body?.plan || body?.data || body || null;
        } catch {
          planDoc = null;
        }
      }

      /* ── فروشگاه‌های کاربر ── */
      let list = [];
      if (isSeller || isAdmin) {
        try {
          const res = await axios.get(`${API}/perm/stores?limit=100`, { ...authHeaders(), signal });
          const body = res?.data?.body;
          list = body?.data || body || [];
        } catch {
          list = [];
        }
      } else {
        /* کاربر عادی: فهرست عمومی فروشگاه‌های فعال خودش */
        try {
          const res = await axios.get(`${API}/store`, {
            params: { user_id: userId, limit: 100 },
            signal,
          });
          const body = res?.data?.body;
          list = body?.data || body || [];
        } catch {
          list = [];
        }
      }

      if (signal?.aborted) return;

      setPlan(planDoc);
      setStores(Array.isArray(list) ? list : []);
      setLoading(false);
    },
    [userId, planId, isSeller, isAdmin],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const info = useMemo(() => {
    const maxShops = Number(plan?.features?.max_shops ?? 0);
    const used = stores.length;
    const remaining = Math.max(0, maxShops - used);

    const durationDays = plan?.duration_days;
    let expiresAt = null;
    if (startAt && durationDays !== null && durationDays !== undefined) {
      const started = new Date(startAt).getTime();
      if (Number.isFinite(started)) expiresAt = started + Number(durationDays) * 86400000;
    }
    const expired = expiresAt !== null && Date.now() >= expiresAt;
    /* بک‌اند فقط پلن با وضعیت ACTIVE را می‌پذیرد */
    const statusOk = !plan?.status || String(plan.status).toUpperCase() === 'ACTIVE';
    const planActive = Boolean(planId) && Boolean(plan) && !expired && statusOk;

    let reason = null;
    if (!isSeller) reason = 'not-seller';
    else if (!planId) reason = 'no-plan';
    else if (!plan) reason = 'expired';
    else if (!planActive) reason = 'expired';
    else if (maxShops <= 0) reason = 'no-capacity';
    else if (remaining <= 0) reason = 'full';

    const blockedText =
      reason === 'not-seller'
        ? translateText("برای ساخت فروشگاه باید حساب فروشندگی تأییدشده داشته باشید.")
        : reason === 'no-plan'
          ? translateText("پلن فروشندگی فعالی ندارید؛ ابتدا یک پلن تهیه کنید.")
          : reason === 'expired'
            ? translateText("اعتبار پلن فروشندگی شما تمام شده است؛ برای ساخت فروشگاه پلن را تمدید کنید.")
            : reason === 'no-capacity'
              ? translateText("پلن فعلی شما امکان ساخت فروشگاه ندارد.")
              : reason === 'full'
                ? translateText("ظرفیت فروشگاه پلن شما ({{v0}} فروشگاه) پر شده است.", {v0: (maxShops.toLocaleString(currentLocale))})
                : '';

    return {
      maxShops,
      used,
      remaining,
      expired,
      expiresAt,
      planActive,
      canCreate: reason === null,
      reason,
      blockedText,
      isSeller,
      isAdmin,
      plan,
      stores,
    };
  }, [plan, planId, startAt, stores, isSeller, isAdmin]);

  return { loading, refresh: () => load(), ...info };
}
