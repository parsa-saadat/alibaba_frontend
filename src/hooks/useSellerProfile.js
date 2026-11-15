import { useEffect, useRef, useState } from 'react';

import { getId } from '../utils/helpers/response';
import {
  resolveSeller,
  primeSeller,
  sellerIdOfStore,
  storeIdOfProduct,
  sellerIdOfProduct,
  trustState,
  activeState,
} from '../services/sellerApi';

/*
 * useSellerProfile
 * ----------------
 * یک قلاب مشترک برای گرفتن وضعیت واقعی فروشنده از بک‌اند.
 *
 *   const { store, owner, trust, active, loading } = useSellerProfile({
 *     storeId: product?.store_id,
 *     sellerId: product?.seller_id,
 *   });
 *
 * - اگر store و owner از قبل (مثلاً از صفحه‌ی محصول) داشته باشید، همان لحظه
 *   نمایش داده می‌شوند و درخواست اضافه‌ای فرستاده نمی‌شود (initialStore/initialOwner).
 * - هر درخواست از کش مشترک services/sellerApi می‌آید؛ ۲۰ کارت با ۳ فروشگاه =
 *   حداکثر ۶ درخواست، نه ۲۰.
 */
export default function useSellerProfile({
  storeId,
  sellerId,
  initialStore = null,
  initialOwner = null,
  enabled = true,
  /* صفحه‌ی جزئیات همیشه تازه بخواند (بعد از تغییر اعتماد در پنل، داده‌ی کهنه نماند) */
  fresh = false,
} = {}) {
  const storeKey = getId(storeId) || getId(initialStore);
  const sellerKey = getId(sellerId) || sellerIdOfStore(initialStore) || getId(initialOwner);

  const [state, setState] = useState(() => ({
    store: initialStore || null,
    owner: initialOwner || null,
    trust: null,
    active: null,
    loading: false,
    failed: false,
  }));

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /* اگر داده‌ی اولیه عوض شد (مثلاً محصول دیگری لود شد) همگام شو */
  useEffect(() => {
    primeSeller({ store: initialStore, owner: initialOwner });
  }, [initialStore, initialOwner]);

  useEffect(() => {
    if (!enabled) return undefined;

    const knownStore = initialStore || null;
    const knownOwner = initialOwner || null;

    /* هر دو تکه موجود است → بدون درخواست */
    if (knownStore && knownOwner) {
      setState({
        store: knownStore,
        owner: knownOwner,
        trust: trustState(knownStore, knownOwner),
        active: activeState(knownStore, knownOwner),
        loading: false,
        failed: false,
      });
      return undefined;
    }

    if (!storeKey && !sellerKey) {
      setState((prev) => ({ ...prev, loading: false }));
      return undefined;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    resolveSeller({
      storeId: storeKey,
      sellerId: sellerKey,
      store: knownStore,
      owner: knownOwner,
      force: fresh,
    })
      .then((result) => {
        if (cancelled || !mounted.current) return;
        setState({
          store: result.store || knownStore || null,
          owner: result.owner || knownOwner || null,
          trust: result.trust,
          active: result.active,
          loading: false,
          failed: !result.store && !result.owner,
        });
      })
      .catch(() => {
        if (cancelled || !mounted.current) return;
        setState((prev) => ({ ...prev, loading: false, failed: true }));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeKey, sellerKey, enabled, fresh, initialStore, initialOwner]);

  /*
   * تا وقتی نتیجه‌ی API نرسیده، اگر داده‌ی اولیه وجود دارد همان را نشان بده؛
   * محاسبه‌ی trust/active هم برای همین حالت انجام می‌شود تا UI پرش نداشته باشد.
   */
  const store = state.store || initialStore || null;
  const owner = state.owner || initialOwner || null;

  return {
    store,
    owner,
    trust: state.trust,
    active: state.active,
    loading: state.loading,
    failed: state.failed,
  };
}


/* ------------------------------------------------------------------ */
/* نسخه‌ی گروهی: برای جدول مقایسه یا هر لیستی که چند محصول دارد        */
/* ------------------------------------------------------------------ */

export function useSellerProfiles(products = [], { enabled = true } = {}) {
  const [map, setMap] = useState({});
  const [loading, setLoading] = useState(false);

  const keys = products
    .map((product) => getId(product))
    .filter(Boolean)
    .join('|');
  const signature = products
    .map((product) => `${getId(product)}:${storeIdOfProduct(product)}:${sellerIdOfProduct(product)}`)
    .join('|');

  useEffect(() => {
    if (!enabled || !products.length) {
      setMap({});
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(
      products.map((product) =>
        resolveSeller({
          storeId: storeIdOfProduct(product),
          sellerId: sellerIdOfProduct(product),
        })
          .then((result) => [getId(product), result])
          .catch(() => [getId(product), null]),
      ),
    )
      .then((pairs) => {
        if (cancelled) return;
        const next = {};
        pairs.forEach(([id, result]) => {
          if (id && result) next[id] = result;
        });
        setMap(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, enabled, products.length]);

  return { sellers: map, loading, keys };
}
