import { t as translateText } from '../../i18n/runtime.js';
/*
 * کمک‌تابع‌های مربوط به کاربر
 * بک‌اند فیلدهای firstname / lastname را به کاربر اضافه کرده است؛
 * این توابع نام نمایشی را با اولویت نام و نام خانوادگی می‌سازند و اگر خالی بود
 * به username برمی‌گردند.
 */

export const userFullName = (user) =>
  `${user?.firstname || ''} ${user?.lastname || ''}`.trim();

export const userDisplayName = (user, fallback = translateText("کاربر ژئو کالا")) =>
  userFullName(user) || user?.username || fallback;

export const userInitial = (user, fallback = translateText("ک")) => {
  const name = userFullName(user) || user?.username || '';
  return String(name).trim().charAt(0) || fallback;
};

/* فروشنده‌ی مورد اعتماد — فیلد seller_trust در بک‌اند */
export const isTrustedSeller = (user) => user?.seller_trust === true;

/*
 * آیا فروشنده‌ی این محصول «تأییدشده / مورد اعتماد» است؟
 * بک‌اند می‌تواند این وضعیت را در یکی از این جاها بفرستد:
 *   محصول:            product.seller_trust
 *   محصولِ پرشده:     product.seller.seller_trust  یا  product.store.user.seller_trust
 *   فروشگاه:          store.seller_trust
 *   کاربر فروشنده:    owner.seller_trust  (نتیجه‌ی GET /user/:id)
 * اگر هیچ‌کدام true نبود، نتیجه false است (یعنی «تأییدشده» نباید نمایش داده شود).
 */
export const isTrustedProduct = (product) =>
  isTrustedSeller(product) ||
  isTrustedSeller(product?.seller) ||
  isTrustedSeller(product?.store) ||
  isTrustedSeller(product?.store?.user) ||
  isTrustedSeller(product?.user);

/* «مورد اعتماد» بودن یک فروشگاه با توجه به فروشگاه و صاحب آن */
export const isTrustedStore = (store, owner) =>
  isTrustedSeller(owner) || isTrustedSeller(store) || isTrustedSeller(store?.user);

/*
 * اطلاعات تماس یک فروشگاه به‌صورت یکدست
 * اولویت: contact_info فروشگاه → اطلاعات صاحب فروشگاه (فروشنده)
 */
export const storeContactInfo = (store, owner) => {
  const info = store?.contact_info || {};
  const address = owner?.address || {};
  const ownerAddress = [address.province, address.city, address.full_address]
    .filter(Boolean)
    .join(translateText("، "));

  return {
    storeName: String(store?.name || '').trim(),
    sellerName: (userFullName(owner) || owner?.username || '').trim(),
    phone: String(info.phone || owner?.phone || '').trim(),
    email: String(info.email || owner?.email || '').trim(),
    address: String(info.address || ownerAddress || '').trim(),
  };
};

/*
 * دسترسی به ویرایش فیلدهای هویتی فروشنده
 * طبق بک‌اند: بعد از تأیید فروشنده (یا identity_locked) فقط حساب تسویه قابل تغییر است.
 */
export const isSellerIdentityLocked = (seller) =>
  seller?.identity_locked === true || seller?.seller_approved_status === true;

/*
 * نام نمایشی فروشنده از روت عمومی کاربر
 * (بک‌اند فیلدهای firstname/lastname را برمی‌گرداند؛ در نبود آن‌ها username)
 */
export const sellerDisplayName = (owner) =>
  (userFullName(owner) || owner?.username || '').trim();

/*
 * فعال یا غیرفعال بودن فروشنده
 * منبع اصلی: seller_active_status از روت عمومی /user/:id
 * (بک‌اند مقدار 'ACTIVE' | 'INACTIVE' می‌دهد؛ اگر نبود، وضعیت فروشگاه ملاک است)
 */
export const sellerIsActive = (owner, store) => {
  /* فروشگاه مسدودشده توسط مدیریت هرگز فعال حساب نمی‌شود */
  if (store?.status === 'ROOT_DISABLE') return false;
  const status = owner?.seller_active_status;
  if (status === 'ACTIVE') return true;
  if (status === 'INACTIVE') return false;
  return store?.status === 'ENABLE';
};

/*
 * اطلاعات کامل فروشنده برای کارت/پاپ‌آپ «ارتباط با فروشنده»
 * همه‌ی فیلدها از فروشگاه + روت عمومی کاربر ساخته می‌شوند و هیچ‌کدام اجباری نیست.
 */
export const sellerProfile = (store, owner) => {
  const contact = storeContactInfo(store, owner);
  return {
    ...contact,
    sellerName: contact.sellerName || sellerDisplayName(owner),
    trusted: isTrustedStore(store, owner),
    active: sellerIsActive(owner, store),
    storeActive: store?.status === 'ENABLE',
    rating: Number(store?.rating) || 0,
    storeId: store?._id || store?.id || '',
  };
};
