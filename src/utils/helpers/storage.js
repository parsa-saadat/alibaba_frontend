/*
 * دسترسی امن به حافظه‌ی مرورگر.
 *
 * در بعضی محیط‌ها (آی‌فریم sandbox، حالت ناشناس سافاری، حالت مسدود کردن کوکی)
 * خواندن `localStorage` استثنا می‌دهد و کل اپ سفید می‌شود. این‌جا اگر مرورگر
 * اجازه نداد، به یک حافظه‌ی موقت در رم سقوط می‌کنیم تا سایت همچنان کار کند.
 */

const memory = new Map();

const probe = () => {
  try {
    const key = '__geokala_probe__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

const canUse = typeof window !== 'undefined' && probe();

export const storage = {
  get(key) {
    try {
      return canUse ? window.localStorage.getItem(key) : (memory.get(key) ?? null);
    } catch {
      return memory.get(key) ?? null;
    }
  },
  set(key, value) {
    try {
      if (canUse) window.localStorage.setItem(key, value);
      else memory.set(key, value);
    } catch {
      memory.set(key, value);
    }
  },
  remove(key) {
    try {
      if (canUse) window.localStorage.removeItem(key);
      else memory.delete(key);
    } catch {
      memory.delete(key);
    }
  },
};

export const getToken = () => storage.get('token');

export const getUser = () => {
  try {
    return JSON.parse(storage.get('user'));
  } catch {
    return null;
  }
};

export const setAuth = (token, user) => {
  storage.set('token', token);
  storage.set('user', JSON.stringify(user));
};

export const clearAuth = () => {
  storage.remove('token');
  storage.remove('user');
};

export const authHeaders = () => ({ headers: { Authorization: getToken() } });

export const readList = (key) => {
  try {
    const value = JSON.parse(storage.get(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export const writeList = (key, list) => storage.set(key, JSON.stringify(list));
