import { toast } from 'react-toastify';
import { t as translateText } from '../../i18n/runtime.js';
import { storage } from '../helpers/storage';

/*
 * اعلان پیام تازه: سه کانال، همه واقعی و بدون وابستگی به سرویس خارجی.
 *  ۱) badge  → شمارندهٔ ناخوانده در ChatContext (نوبار و ریل پنل)
 *  ۲) toast  → کارت کلیک‌پذیر با لینک به گفتگو
 *  ۳) sound  → تک‌خوان کوتاه WebAudio؛ چون مرورگرها پخش صدا را قبل از
 *              اولین تعامل کاربر بلاک می‌کنند، تا آن Moment ساکت می‌مانیم.
 */

const SOUND_KEY = 'chat.sound.v1';
const MAX_TOASTS_PER_WINDOW = 3;
const TOAST_WINDOW_MS = 15_000;

let audioCtx = null;
let gestureSeen = false;
let recentToasts = [];

const armFirstGesture = () => {
  if (gestureSeen || typeof window === 'undefined') return;
  const onGesture = () => {
    gestureSeen = true;
    window.removeEventListener('pointerdown', onGesture);
    window.removeEventListener('keydown', onGesture);
  };
  window.addEventListener('pointerdown', onGesture, { passive: true });
  window.addEventListener('keydown', onGesture);
};
armFirstGesture();

export const soundEnabled = () => storage.get(SOUND_KEY) !== 'off';

export const setSoundEnabled = (on) => storage.set(SOUND_KEY, on ? 'on' : 'off');

/** تک‌خوان کوتاه و ملایم؛ اگر پخش نشود خطا نمی‌دهد. */
export const playChime = () => {
  if (!soundEnabled() || !gestureSeen || typeof window === 'undefined') return false;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    audioCtx ||= new Ctx();
    if (audioCtx.state === 'suspended') return false;

    const now = audioCtx.currentTime;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    gain.connect(audioCtx.destination);

    [880, 1_174.66].forEach((frequency, index) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      osc.connect(gain);
      osc.start(now + index * 0.07);
      osc.stop(now + 0.34);
    });
    return true;
  } catch {
    return false;
  }
};

/* سقف تعداد توست در بازهٔ کوتاه، تا سیل پیام صفحه را پر نکند */
const toastAllowed = () => {
  const now = Date.now();
  recentToasts = recentToasts.filter((at) => now - at < TOAST_WINDOW_MS);
  if (recentToasts.length >= MAX_TOASTS_PER_WINDOW) return false;
  recentToasts.push(now);
  return true;
};

/**
 * اعلان یک پیام ورودی.
 * @param {{id: string, title: string, preview: string, to: string}} payload
 */
let navigate = null;

/* ChatContext داخل Router است و این را با useNavigate ثبت می‌کند؛
   بدون آن، توست فقط اطلاع می‌دهد و کلیک بی‌اثر می‌ماند. */
export const setChatNavigator = (fn) => {
  navigate = typeof fn === 'function' ? fn : null;
};

export const notifyIncoming = (payload) => {
  playChime();
  if (!toastAllowed()) return false;

  const go = () => {
    if (!navigate) return;
    navigate(payload.to);
    toast.dismiss(payload.id);
  };

  toast(
    <button type="button" onClick={go} className="chat-toast" disabled={!navigate}>
      <b className="chat-toast-title">{payload.title}</b>
      <span className="chat-toast-text">{payload.preview || translateText('chat.newMessageAria')}</span>
    </button>,
    {
      toastId: payload.id,
      position: 'bottom-left',
      autoClose: 6000,
      pauseOnHover: true,
      onClick: go,
    },
  );
  return true;
};
