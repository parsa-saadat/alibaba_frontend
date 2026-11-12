/*
 * کمک‌تابع‌های مربوط به کاربر
 * بک‌اند فیلدهای firstname / lastname را به کاربر اضافه کرده است؛
 * این توابع نام نمایشی را با اولویت نام و نام خانوادگی می‌سازند و اگر خالی بود
 * به username برمی‌گردند.
 */

export const userFullName = (user) =>
  `${user?.firstname || ''} ${user?.lastname || ''}`.trim();

export const userDisplayName = (user, fallback = 'کاربر علی‌بازار') =>
  userFullName(user) || user?.username || fallback;

export const userInitial = (user, fallback = 'ک') => {
  const name = userFullName(user) || user?.username || '';
  return String(name).trim().charAt(0) || fallback;
};

/* فروشنده‌ی مورد اعتماد — فیلد seller_trust در بک‌اند */
export const isTrustedSeller = (user) => user?.seller_trust === true;

/*
 * دسترسی به ویرایش فیلدهای هویتی فروشنده
 * طبق بک‌اند: بعد از تأیید فروشنده (یا identity_locked) فقط حساب تسویه قابل تغییر است.
 */
export const isSellerIdentityLocked = (seller) =>
  seller?.identity_locked === true || seller?.seller_approved_status === true;
