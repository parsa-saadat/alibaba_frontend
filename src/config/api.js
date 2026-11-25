/* آدرس پایه‌ی بک‌اند — یک‌جا تعریف می‌شود تا در همه‌ی فایل‌ها تکرار نشود */
export const API =
  import.meta.env.VITE_APP_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://185.204.197.23:3000';

export default API;
