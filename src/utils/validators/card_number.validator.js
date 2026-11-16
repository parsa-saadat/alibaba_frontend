/* فقط ساده: ۱۶ رقم (هماهنگ با بک‌اند؛ بدون چک‌سام) */
export const cardNumberValidator = (value) =>
  /^\d{16}$/.test(String(value ?? '').replace(/[\s-]/g, ''));

export default cardNumberValidator;
