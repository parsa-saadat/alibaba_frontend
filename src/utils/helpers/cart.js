import { getId } from './response.js';

/*
 * کمک‌تابع‌های خالص سبد خرید.
 * ساختار ردیف سبد در بک‌اند: { _id, user_id, product_id, quantity }
 * این فایل هیچ درخواستی به سرور نمی‌فرستد؛ فقط نرمال‌سازی و جست‌وجو.
 */

export const getCartRows = (cart) => {
  if (!cart) return [];
  if (Array.isArray(cart)) return cart.filter(Boolean);
  const rows = cart.data || cart.items || cart.products || cart.cart || [];
  return Array.isArray(rows) ? rows.filter(Boolean) : [];
};

export const productIdOfCartRow = (row) => {
  if (!row) return '';
  const value =
    row.product_id ??
    row.productId ??
    row.product?._id ??
    row.product?.id ??
    row.product ??
    '';
  return getId(value);
};

export const getItemQuantity = (item) => {
  if (!item) return 0;
  const raw = item.quantity ?? item.qty ?? item.count;
  if (raw == null || raw === '') return 1;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
};

export const findInCart = (cart, productId) => {
  const target = getId(productId);
  if (!target) return null;
  return getCartRows(cart).find((row) => productIdOfCartRow(row) === target) || null;
};

export const getCartQuantity = (cart, productId) =>
  getItemQuantity(findInCart(cart, productId));

export const cartCountOf = (cart) =>
  getCartRows(cart).reduce((sum, row) => sum + getItemQuantity(row), 0);

/* جایگزینی/افزودن یک ردیف در لیست سبد (برای آپدیت خوش‌بینانه‌ی Context) */
export const upsertCartRow = (cart, row) => {
  const rows = getCartRows(cart);
  const target = productIdOfCartRow(row);
  if (!target) return rows;
  const exists = rows.some((item) => productIdOfCartRow(item) === target);
  return exists
    ? rows.map((item) => (productIdOfCartRow(item) === target ? { ...item, ...row } : item))
    : [...rows, row];
};

export const removeCartRow = (cart, productId) => {
  const target = getId(productId);
  return getCartRows(cart).filter((row) => productIdOfCartRow(row) !== target);
};

/* پیام خطای فارسی برای خطاهای سبد خرید (پیام بک‌اند اولویت دارد) */
export const cartErrorMessage = (error, fallback = 'خطا در ارتباط با سبد خرید') => {
  const message =
    error?.response?.data?.message || error?.message || fallback;
  const map = {
    'Product already exists in cart': 'این محصول از قبل در سبد خرید شما است',
    'Cart not found': 'این محصول در سبد خرید شما نیست',
    'Product not found': 'محصول یافت نشد',
    'Quantity is not in stock': 'موجودی کافی نیست',
    'Quantity is not available': 'موجودی کافی نیست',
    'Product is not available': 'این محصول قابل خرید نیست',
  };
  return map[message] || message;
};
