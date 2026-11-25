import axios from 'axios';
import API from '../config/api';
import { authHeaders, getToken } from '../utils/helpers/storage';

/*
 * مسیرهای REST گفتگو. نوشتن‌ها همیشه از HTTP می‌روند تا اعتبارسنجی و
 * تایید نقش فقط یک مسیر داشته باشد؛ WebSocket فقط رویدادها را می‌رساند.
 */
const base = `${API}/chat`;

export const openConversation = (payload) =>
  axios.post(`${base}/conversations`, payload, authHeaders()).then((r) => r.data?.body);

export const listConversations = (params = {}) =>
  axios.get(`${base}/conversations`, { ...authHeaders(), params }).then((r) => r.data?.body);

export const getConversation = (id) =>
  axios.get(`${base}/conversations/${id}`, authHeaders()).then((r) => r.data?.body);

export const listMessages = (id, params = {}) =>
  axios.get(`${base}/conversations/${id}/messages`, { ...authHeaders(), params }).then((r) => r.data?.body);

export const sendMessage = (id, payload) =>
  axios.post(`${base}/conversations/${id}/messages`, payload, authHeaders()).then((r) => r.data?.body);

export const editMessage = (id, body) =>
  axios.put(`${base}/messages/${id}`, { body }, authHeaders()).then((r) => r.data?.body);

export const deleteMessage = (id) =>
  axios.delete(`${base}/messages/${id}`, authHeaders()).then((r) => r.data?.body);

export const markRead = (id) =>
  axios.put(`${base}/conversations/${id}/read`, {}, authHeaders()).then((r) => r.data?.body);

export const unreadSummary = () =>
  axios.get(`${base}/unread`, authHeaders()).then((r) => r.data?.body);

export const setConversationStatus = (id, status) =>
  axios.put(`${base}/conversations/${id}/status`, { status }, authHeaders()).then((r) => r.data?.body);

export const chatStats = () =>
  axios.get(`${base}/stats`, authHeaders()).then((r) => r.data?.body);

/** آپلود تصویر گفتگو؛ برگشت همان شناسه‌های /storage است. */
export const uploadChatImages = async (files) => {
  const form = new FormData();
  for (const file of files) form.append('files', file);
  const res = await axios.post(`${base}/images`, form, {
    headers: { Authorization: getToken(), 'Content-Type': 'multipart/form-data' },
  });
  return res.data?.body;
};

export const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

/**
 * آدرس WebSocket از پایهٔ API ساخته می‌شود:
 *   /api  → (wss|ws)://current-host/ws      (پروکسی Vite/Node)
 *   https://api.example → wss://api.example/ws
 */
export function chatSocketUrl() {
  const token = getToken();
  if (!token) return '';
  try {
    if (/^https?:\/\//i.test(API)) {
      const url = new URL(API);
      const scheme = url.protocol === 'https:' ? 'wss:' : 'ws:';
      const path = url.pathname.replace(/\/+$/, '').replace(/^\/api$/, '') || '';
      return `${scheme}//${url.host}${path}/ws?token=${encodeURIComponent(token)}`;
    }
    const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${scheme}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
  } catch {
    return '';
  }
}
