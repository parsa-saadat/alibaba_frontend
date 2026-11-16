/* فقط ساده: ۱۰ رقم (هماهنگ با بک‌اند؛ بدون الگوریتم کد ملی) */
export const nationalIDValidator = (value) => /^\d{10}$/.test(String(value ?? ''));

export default nationalIDValidator;
