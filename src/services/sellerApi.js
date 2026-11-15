import axios from 'axios';

import { API } from '../config/api';
import { authHeaders } from '../utils/helpers/storage';
import { getBody, getId } from '../utils/helpers/response';

/*
 * لایه‌ی API فروشنده
 * ------------------
 * تنها جایی که وضعیت «تأییدشده / تأییدنشده» و «فعال / غیرفعال» فروشنده از
 * بک‌اند واقعی خوانده می‌شود. جریان داده دقیقاً همان چیزی است که بک‌اند می‌دهد:
 *
 *   1) GET /store/:storeId        →  { ..., user: "<شناسه‌ی فروشنده>" }
 *   2) GET /user/:userId          →  { firstname, lastname, username,
 *                                      seller_trust, seller_approved_status,
 *                                      seller_active_status }
 *
 * چرا این فایل لازم بود؟
 *   کارت‌های محصول در لیست‌ها به‌تنهایی هیچ درخواستی نمی‌فرستادند و فقط به
 *   فیلد product.seller_trust تکیه می‌کردند؛ بک‌اند واقعی این فیلد را در
 *   پاسخ لیست محصولات نمی‌فرستد، پس نشان اعتماد هرگز روشن نمی‌شد.
 *   اینجا یک لایه‌ی مشترک با کش، حذف درخواست‌های تکراری و محدودیت هم‌زمانی
 *   ساخته شده تا هر کارت می‌تواند وضعیت واقعی را از بک‌اند بگیرد.
 */

/*
 * کش کوتاه است چون وضعیت اعتماد/فعال‌بودن در پنل ادمین تغییر می‌کند و
 * نباید بعد از لغو اعتماد، نشان سبز روی سایت بماند.
 * ضمناً `clearSellerCache()` بعد از هر تغییر در پنل صدا زده می‌شود.
 */
const TTL = 60 * 1000; // ۱ دقیقه
const MAX_PARALLEL = 6; // حداکثر درخواست هم‌زمان

const storeCache = new Map();
const userCache = new Map();
const storeInflight = new Map();
const userInflight = new Map();

/* ---------------- صف درخواست‌ها ---------------- */

let running = 0;
const queue = [];

const pump = () => {
  while (running < MAX_PARALLEL && queue.length) {
    const job = queue.shift();
    running += 1;
    Promise.resolve()
      .then(job.task)
      .then(job.resolve, job.reject)
      .finally(() => {
        running -= 1;
        pump();
      });
  }
};

const enqueue = (task) =>
  new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    pump();
  });

/* ---------------- کش + حذف تکراری ---------------- */

const fromCache = (cache, inflight, key, request, force = false) => {
  if (!key) return Promise.resolve(null);

  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.at < TTL) return Promise.resolve(hit.value);

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = enqueue(request)
    .then((value) => {
      /* فقط پاسخ‌های معتبر کش می‌شوند؛ خطا نباید تا ابد کش شود */
      if (value) cache.set(key, { at: Date.now(), value });
      return value;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
};

/* ---------------- درخواست‌های خام ---------------- */

const STORE_ID_FIELDS = ['store_id', 'storeId', 'store', 'store_ref'];
const SELLER_ID_FIELDS = ['seller_id', 'sellerId', 'seller', 'user_id', 'userId'];

/* هر محصولی که شکل داده‌اش فرق کند، شناسه‌ی فروشگاه/فروشنده‌اش پیدا می‌شود */
export const storeIdOfProduct = (product) => {
  for (const field of STORE_ID_FIELDS) {
    const value = getId(product?.[field]);
    if (value) return value;
  }
  return '';
};

export const sellerIdOfProduct = (product) => {
  for (const field of SELLER_ID_FIELDS) {
    const value = getId(product?.[field]);
    if (value) return value;
  }
  return getId(product?.store?.user) || '';
};

/*
 * درخواست GET با «تلاش دوم بدون توکن»:
 * اگر توکن کاربر منقضی/نامعتبر باشد، بعضی نسخه‌های بک‌اند جای پاسخ عمومی، ۴۰۱/۴۰۳
 * می‌دهند؛ آن وقت نشان اعتماد برای همه‌ی کارت‌ها خاموش می‌شد. این دو روت عمومی‌اند،
 * پس در صورت خطای احراز هویت یک بار بدون هدر Authorization تکرار می‌شوند.
 */
const publicGet = async (url) => {
  try {
    const res = await axios.get(url, { timeout: 15000, ...authHeaders() });
    return getBody(res);
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      const res = await axios.get(url, { timeout: 15000 });
      return getBody(res);
    }
    throw error;
  }
};

export const fetchStore = (storeId, { force = false } = {}) =>
  fromCache(
    storeCache,
    storeInflight,
    getId(storeId),
    () => publicGet(`${API}/store/${getId(storeId)}`),
    force,
  );

export const fetchPublicUser = (userId, { force = false } = {}) =>
  fromCache(
    userCache,
    userInflight,
    getId(userId),
    () => publicGet(`${API}/user/${getId(userId)}`),
    force,
  );

/*
 * منبع دوم اعتماد: روت ادمین `GET /seller/:id`.
 * روت عمومی `/user/:id` در بعضی نسخه‌های بک‌اند فیلدهای فروشندگی را برنمی‌گرداند؛
 * اگر کاربر لاگین‌کرده ادمین باشد و پاسخ عمومی سیگنال `seller_trust` نداشته باشد،
 * این روت به‌عنوان پشتیبان صدا زده می‌شود. برای کاربر عادی ۴۰۳ می‌دهد و بی‌اثر است.
 */
export const fetchAdminSeller = (sellerId, { force = false } = {}) =>
  fromCache(
    userCache,
    userInflight,
    'seller-admin:' + getId(sellerId),
    () =>
      axios
        .get(`${API}/seller/${getId(sellerId)}`, { timeout: 15000, ...authHeaders() })
        .then(getBody),
    force,
  );

/*
 * پشتیبان گروهی: فهرست عمومی فروشگاه‌ها یک بار خوانده می‌شود و نقشه‌ی
 * store_id → seller_id ساخته می‌شود.
 * چرا لازم است؟ اگر روی نصب واقعی، درخواست `GET /store/:id` به هر دلیلی
 * (۴۰۱/۴۰۳/۴۰۴ یا کندی) جواب ندهد، کارت‌های محصول هیچ‌وقت فروشنده را پیدا
 * نمی‌کردند و نشان اعتماد فقط در صفحه‌ی فروشگاه دیده می‌شد؛ چون آن‌جا خودِ
 * شیء فروشگاه از قبل در دست است.
 */
const storesIndexCache = { at: 0, value: null, promise: null };

export const fetchStoresIndex = ({ force = false } = {}) => {
  if (!force && storesIndexCache.value && Date.now() - storesIndexCache.at < TTL)
    return Promise.resolve(storesIndexCache.value);
  if (storesIndexCache.promise) return storesIndexCache.promise;

  storesIndexCache.promise = publicGet(`${API}/store?limit=100`)
    .then((body) => {
      const list = Array.isArray(body) ? body : body?.data || [];
      const map = new Map();
      list.forEach((store) => {
        const key = getId(store);
        if (key) map.set(key, store);
      });
      storesIndexCache.at = Date.now();
      storesIndexCache.value = map;
      return map;
    })
    .catch(() => new Map())
    .finally(() => {
      storesIndexCache.promise = null;
    });

  return storesIndexCache.promise;
};

/* ---------------- پر کردن کش از داده‌ای که همین حالا داریم ---------------- */

export const primeSeller = ({ store, owner } = {}) => {
  const storeId = getId(store);
  if (storeId && store) storeCache.set(storeId, { at: Date.now(), value: store });

  const ownerId = getId(owner);
  if (ownerId && owner) userCache.set(ownerId, { at: Date.now(), value: owner });
};

/* شناسه‌ی فروشنده از دل فروشگاه — با تحمل همه‌ی شکل‌های ممکن */
export const sellerIdOfStore = (store, fallback = '') =>
  getId(store?.user) ||
  getId(store?.user_id) ||
  getId(store?.owner) ||
  getId(store?.seller_id) ||
  getId(fallback);

/* ---------------- وضعیت اعتماد و فعالیت ---------------- */

export const TRUST = {
  TRUSTED: 'trusted',
  UNTRUSTED: 'untrusted',
  UNKNOWN: 'unknown',
};

/*
 * قاعده‌ی سخت‌گیرانه (قابل تغییر نیست):
 *   - «تأییدشده» فقط وقتی seller_trust واقعاً true باشد.
 *   - اگر seller_approved_status صریحاً false باشد، حتی با seller_trust=true هم
 *     فروشنده تأییدشده حساب نمی‌شود (هم‌راستا با پنل ادمین).
 *   - اگر هیچ سیگنالی نرسیده باشد (نه فروشگاه و نه کاربر)، وضعیت «نامشخص» است
 *     تا UI به‌جای نمایش «تأییدنشده‌ی دروغین»، چیزی نشان ندهد.
 */
/*
 * بعضی نسخه‌های بک‌اند مقدار را رشته/عدد می‌فرستند («true»، 1). این تابع فقط
 * همین شکل‌های صریح را به بولین تبدیل می‌کند؛ هر چیز دیگری «بدون سیگنال» است تا
 * هیچ‌وقت نشان سبز الکی روشن نشود.
 */
const asBool = (value) => {
  if (value === true || value === false) return value;
  if (value === 1 || value === '1' || value === 'true' || value === 'TRUE') return true;
  if (value === 0 || value === '0' || value === 'false' || value === 'FALSE') return false;
  return undefined;
};

export const trustState = (store, owner) => {
  /*
   * سیگنال اصلی همان `seller_trust` است. اگر ادمین فقط همین کلید را روشن کرده
   * باشد و `seller_approved_status` هنوز false مانده باشد، بازهم فروشنده
   * «مورد اعتماد» است؛ قبلاً همان false باعث می‌شد نشان سبز روی کل سایت
   * خاموش بماند و فقط صفحه‌ی فروشگاه آن را نشان دهد.
   */
  const signals = [asBool(owner?.seller_trust), asBool(store?.seller_trust)].filter(
    (value) => typeof value === 'boolean',
  );

  if (!signals.length) return TRUST.UNKNOWN;
  return signals.some(Boolean) ? TRUST.TRUSTED : TRUST.UNTRUSTED;
};

/* فعال/غیرفعال: منبع اصلی seller_active_status است، بعد وضعیت فروشگاه */
export const activeState = (store, owner) => {
  if (store?.status === 'ROOT_DISABLE') return false;
  const status = owner?.seller_active_status;
  if (status === true || status === 'true') return true;
  if (status === 'ACTIVE') return true;
  if (status === 'INACTIVE') return false;
  if (store?.status === 'ENABLE') return true;
  if (store?.status === 'DISABLE' || store?.status === 'DISABLED') return false;
  return null;
};

/* ---------------- ترکیب: فروشگاه + صاحب فروشگاه ---------------- */

const objectOf = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : null;

const uniq = (list) => [...new Set(list.map((v) => String(v || '')).filter(Boolean))];

const statusOfError = (error) => error?.response?.status || error?.message || 'error';

export const resolveSeller = async ({
  storeId,
  sellerId,
  store: knownStore,
  owner: knownOwner,
  force = false,
} = {}) => {
  if (knownStore) primeSeller({ store: knownStore });
  if (knownOwner) primeSeller({ owner: knownOwner });

  const steps = [];

  /*
   * ---------- ۱) کاربرِ فروشنده، مستقیم ----------
   * روی محصولِ لیست‌ها `seller_id` همیشه هست (بک‌اند آن را هنگام ساخت از
   * store.user می‌گذارد)، پس سریع‌ترین مسیر یکی است: GET /user/:seller_id.
   * قبلاً اول فروشگاه خوانده می‌شد؛ روی بک‌اند کند، ۲۴ کارت صفحه‌ی اصلی
   * پشت صفِ درخواست‌ها می‌ماندند و نشان دیر یا هیچ‌وقت ظاهر نمی‌شد.
   */
  let store = knownStore || null;
  const storeKey = getId(storeId) || getId(knownStore) || '';
  const directSellerId = getId(sellerId);

  let owner = knownOwner || null;
  let ownerKey = '';
  let source = knownOwner ? 'page' : '';

  if (!owner && directSellerId) {
    const found = await fetchPublicUser(directSellerId, { force }).catch((error) => {
      steps.push({ step: 'user', id: directSellerId, error: statusOfError(error) });
      return null;
    });
    if (found) {
      owner = found;
      ownerKey = directSellerId;
      source = 'public-user';
      steps.push({ step: 'user', id: directSellerId, ok: true, seller_trust: asBool(found.seller_trust) });
    }
  }

  /* ---------- ۲) فروشگاه (و فروشنده‌ی داخل آن) ---------- */
  if (!store && storeKey && (!owner || typeof asBool(owner?.seller_trust) !== 'boolean')) {
    store = await fetchStore(storeKey, { force }).catch((error) => {
      steps.push({ step: 'store', id: storeKey, error: statusOfError(error) });
      return null;
    });
    if (store) steps.push({ step: 'store', id: storeKey, ok: true });
  }

  /* پشتیبان: از فهرست عمومی فروشگاه‌ها (اگر روت تکی جواب نداد) */
  if (!store && storeKey && (!owner || typeof asBool(owner?.seller_trust) !== 'boolean')) {
    const index = await fetchStoresIndex({ force }).catch(() => null);
    const found = index?.get(storeKey) || null;
    if (found) {
      store = found;
      steps.push({ step: 'stores-index', id: storeKey, ok: true });
    }
  }

  const embeddedOwner =
    objectOf(store?.user) || objectOf(store?.seller) || objectOf(store?.owner) || null;
  if (!owner && embeddedOwner) {
    owner = embeddedOwner;
    source = 'store-embedded-user';
  }

  const candidates = uniq([ownerKey, directSellerId, sellerIdOfStore(store, '')]);

  if (!owner || typeof asBool(owner?.seller_trust) !== 'boolean') {
    for (const key of candidates) {
      if (owner && getId(owner) === key && typeof asBool(owner?.seller_trust) === 'boolean') break;
      const found = await fetchPublicUser(key, { force }).catch((error) => {
        steps.push({ step: 'user', id: key, error: statusOfError(error) });
        return null;
      });
      if (!found) continue;
      owner = found;
      ownerKey = key || ownerKey;
      source = 'public-user';
      steps.push({ step: 'user', id: key, ok: true, seller_trust: asBool(found.seller_trust) });
      if (typeof asBool(found.seller_trust) === 'boolean') break;
    }
  }

  /* ---------- ۳) پشتیبان: روت ادمین /seller/:id ---------- */
  const publicHasSignal = typeof asBool(owner?.seller_trust) === 'boolean';
  if (!publicHasSignal) {
    for (const key of uniq([ownerKey, ...candidates]).slice(0, 2)) {
      const adminRecord = await fetchAdminSeller(key, { force }).catch((error) => {
        steps.push({ step: 'admin-seller', id: key, error: statusOfError(error) });
        return null;
      });
      if (adminRecord && typeof asBool(adminRecord.seller_trust) === 'boolean') {
        owner = { ...(owner || {}), ...adminRecord };
        source = 'admin-seller';
        steps.push({ step: 'admin-seller', id: key, ok: true });
        break;
      }
    }
  }

  const result = {
    store,
    owner,
    sellerId: getId(owner) || ownerKey || '',
    trust: trustState(store, owner),
    active: activeState(store, owner),
    source: source || 'none',
    steps,
  };

  /* برای عیب‌یابی: window.__sellerDebug در کنسول مرورگر */
  try {
    if (typeof window !== 'undefined') {
      const log = (window.__sellerDebug = window.__sellerDebug || []);
      log.push({
        storeId: storeKey || '-',
        sellerId: result.sellerId || '-',
        trust: result.trust,
        active: result.active,
        source,
        hasStore: Boolean(store),
        hasOwner: Boolean(owner),
        steps,
      });
      if (log.length > 60) log.shift();
    }
  } catch {
    /* بی‌اهمیت */
  }

  return result;
};

/*
 * ابزار عیب‌یابی: در کنسول مرورگر بنویس
 *   await __trustExplain()
 * و ببین هر کارت محصول چرا نشان اعتماد گرفت یا نگرفت. (گزارش آخرین ۱۰ کارت)
 */
export const registerTrustProbe = (probe = {}) => {
  if (typeof window === 'undefined' || !probe.id) return;
  const list = (window.__trustProbes = window.__trustProbes || []);
  const at = list.findIndex((item) => item.id === probe.id);
  if (at >= 0) list[at] = { ...list[at], ...probe };
  else {
    list.push(probe);
    if (list.length > 200) list.shift();
  }
};

export const explainTrust = async () => {
  if (typeof window === 'undefined') return [];
  const probes = window.__trustProbes || [];
  const rows = [];
  for (const probe of probes.slice(-10)) {
    const resolved = await resolveSeller({
      storeId: probe.storeId,
      sellerId: probe.sellerId,
      force: true,
    });
    rows.push({
      product: probe.id,
      storeId: probe.storeId || '-',
      sellerId: probe.sellerId || '-',
      trust: resolved.trust,
      source: resolved.source,
      steps: resolved.steps,
    });
  }
  // eslint-disable-next-line no-console
  console.table(rows);
  return rows;
};

/* پاک کردن کش (مثلاً بعد از تغییر وضعیت در پنل ادمین) */
export const clearSellerCache = () => {
  storeCache.clear();
  userCache.clear();
  storesIndexCache.at = 0;
  storesIndexCache.value = null;
};

/* دسترسی سریع از کنسول مرورگر:  await __trustExplain()  */
if (typeof window !== 'undefined') {
  window.__trustExplain = explainTrust;
}
