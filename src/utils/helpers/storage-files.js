import axios from 'axios';
import { getBody, getId, isDirectImage } from './response.js';

const API = import.meta.env?.VITE_APP_API_URL || import.meta.env?.VITE_API_URL || '/api';
const cache = new Map();

const bytesToBase64 = (bytes) => {
  const chunks = [];
  for (let index = 0; index < bytes.length; index += 32768) {
    chunks.push(String.fromCharCode(...bytes.subarray(index, index + 32768)));
  }
  return btoa(chunks.join(''));
};

export const fileDataUrl = (file) => {
  if (isDirectImage(file)) return file;
  if (!file || typeof file !== 'object') return '';
  if (isDirectImage(file.url)) return file.url;
  if (isDirectImage(file.src)) return file.src;

  let data = file.data;
  if (data?.type === 'Buffer' && Array.isArray(data.data)) data = data.data;
  if (data?.$binary?.base64) data = data.$binary.base64;
  const mime = file.contentType || file.mimetype || file.mime || 'image/jpeg';
  if (!String(mime).startsWith('image/')) return '';

  if (typeof data === 'string' && data) {
    return data.startsWith('data:') ? data : `data:${mime};base64,${data}`;
  }

  let bytes;
  if (data instanceof Uint8Array) bytes = data;
  else if (data instanceof ArrayBuffer) bytes = new Uint8Array(data);
  else if (Array.isArray(data)) bytes = Uint8Array.from(data);
  else if (data && typeof data === 'object') {
    const values = Object.values(data);
    if (
      values.length &&
      values.every((value) => Number.isInteger(value) && value >= 0 && value <= 255)
    ) {
      bytes = Uint8Array.from(values);
    }
  }
  if (!bytes?.length) return '';
  return `data:${mime};base64,${bytesToBase64(bytes)}`;
};

/*
 * تشخیص شناسه‌ی فایل داخل یک آدرس تصویر.
 * آدرس‌هایی که از آپلود توضیحات می‌آیند به شکل «<API>/storage/<id>» یا «storage:<id>»
 * ذخیره می‌شوند؛ این تابع آن‌ها را به شناسه برمی‌گرداند تا با resolveStorageImage
 * به data-url تبدیل شوند (روت عمومی /storage/:id خروجی JSON می‌دهد، نه فایل خام).
 */
export const storageIdFromSrc = (src) => {
  if (!src || typeof src !== 'string') return '';
  const value = src.trim();
  if (!value) return '';
  if (value.startsWith('data:') || value.startsWith('blob:')) return '';

  const prefixed = value.match(/^storage:([A-Za-z0-9_-]+)$/);
  if (prefixed) return prefixed[1];

  const byPath = value.match(/\/storage\/([A-Za-z0-9_-]+)\/?$/);
  if (byPath) return byPath[1];

  if (/^[a-f0-9]{24}$/i.test(value)) return value;
  return '';
};

/* true یعنی این آدرس یک فایل داخل استوریج است و باید با API رزولو شود */
export const isStorageSrc = (src) => Boolean(storageIdFromSrc(src));

export const resolveStorageSrc = async (src, force = false) => {
  const id = storageIdFromSrc(src);
  if (!id) return src;
  try {
    const url = await resolveStorageImage(id, force);
    return url || src;
  } catch {
    return src;
  }
};

export const resolveStorageImage = async (file, force = false) => {
  const embedded = fileDataUrl(file);
  if (embedded) return embedded;
  const id = getId(file);
  if (!id) return '';
  if (isDirectImage(id)) return id;
  const key = `${API}/${id}`;
  if (!force && cache.has(key)) return cache.get(key);

  const request = axios
    .get(`${API}/storage/${encodeURIComponent(id)}`, { timeout: 15000 })
    .then((response) => {
      if (response.data?.success === false) throw new Error(response.data.message);
      const url = fileDataUrl(getBody(response));
      if (!url) throw new Error('فایل تصویری معتبری دریافت نشد.');
      return url;
    })
    .catch((error) => {
      cache.delete(key);
      throw error;
    });

  cache.set(key, request);
  if (cache.size > 100) cache.delete(cache.keys().next().value);
  return request;
};
