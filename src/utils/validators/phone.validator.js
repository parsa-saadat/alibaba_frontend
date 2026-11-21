export const validateIRPhoneSyntax = (phone) => {
  if (!phone) return false;
  return /^09\d{9}$/.test(String(phone));
};

export const validateOtpSyntax = (code) => {
  if (!code) return false;
  return /^\d{6}$/.test(String(code));
};

export default validateIRPhoneSyntax;

/*
 * ورود/ثبت‌نام: هم با پیش‌شماره‌ی ۰۹ و هم با +98 می‌شود شماره را وارد کرد.
 * خروجی normalizePhoneNumber همیشه شکل استاندارد +989xxxxxxxxx است تا بک‌اند
 * کاربر را با همان شماره‌ی ذخیره‌شده پیدا کند.
 */
export const normalizePhoneNumber = (phone) => {
  const digits = String(phone || '')
    .replace(/[\s()‌.-]/g, '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  if (digits.startsWith('+98')) return digits;
  if (digits.startsWith('98') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0')) return `+98${digits.slice(1)}`;
  return digits;
};

export const validateAuthPhone = (phone) => /^\+989\d{9}$/.test(String(normalizePhoneNumber(phone) || ''));
