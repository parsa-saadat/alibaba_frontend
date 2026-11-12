import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Check,
  Copy,
  FileQuestion,
  Film,
  Image as ImageIcon,
  ImageOff,
  Loader2,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  ZoomIn,
} from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import { resolveStorageImage } from '../../utils/helpers/storage-files';
import { getBody, getId } from '../../utils/helpers/response';
import { Link } from 'react-router-dom';
import ImageLightboxComponent from '../../components/common/ImageLightboxComponent';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { toFa } from '../../utils/helpers/format';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

const PAGE_SIZE = 24;

const TYPES = [
  ['', 'همه'],
  ['image', 'تصاویر'],
  ['video', 'ویدیوها'],
];

/* ------------------------------------------------------------------ */
/* کمک‌کننده‌ها                                                         */
/* ------------------------------------------------------------------ */

const isImage = (file) => String(file?.contentType || '').startsWith('image/');

const formatSize = (bytes) => {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '—';
  if (value < 1024) return `${toFa(value)} بایت`;
  if (value < 1024 * 1024) return `${toFa(Math.round(value / 1024))} کیلوبایت`;
  return `${toFa((value / (1024 * 1024)).toFixed(1))} مگابایت`;
};

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '—';
  }
};

/* تصویر را با کش کمکی storage-files به data URL/آدرس تبدیل می‌کند */
function useMediaUrl(file) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    let active = true;
    if (!file) return undefined;

    resolveStorageImage(file)
      .then((result) => active && setUrl(result))
      .catch(() => active && setUrl(''));

    return () => {
      active = false;
    };
  }, [file]);

  return url;
}

function MediaThumb({ file, onZoom }) {
  const url = useMediaUrl(file);
  const image = isImage(file);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [file]);

  if (image && broken) {
    return (
      <div className="grid h-full w-full place-items-center gap-1 bg-black/25 text-[#8fa0c9]">
        <ImageOff size={22} />
        <span className="text-[9px]">تصویر باز نشد</span>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="grid h-full w-full place-items-center bg-black/30 text-[#8fa0c9]">
        {String(file?.contentType || '').startsWith('video/') ? (
          <Film size={26} />
        ) : (
          <FileQuestion size={26} />
        )}
      </div>
    );
  }

  if (!url) {
    return (
      <div className="grid h-full w-full place-items-center bg-black/20">
        <Loader2 size={20} className="animate-spin text-[#8fa0c9]" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onZoom(file)}
      className="group relative block h-full w-full overflow-hidden"
      title="بزرگ‌نمایی"
    >
      <img
        src={url}
        alt={file?.name || 'تصویر'}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
      />
      <span className="absolute inset-0 grid place-items-center bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
        <ZoomIn size={20} />
      </span>
    </button>
  );
}

/* کپی مقاوم: Clipboard API → execCommand → انتخاب متن برای کپی دستی */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* مرورگر/آی‌فریم اجازه نداد → روش بعدی */
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    if (ok) return true;
  } catch {
    /* بی‌خیال؛ می‌رویم سراغ انتخاب متن */
  }

  return false;
}

function selectText(el) {
  if (!el) return;
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  } catch {
    /* ignore */
  }
}

function CopyIdButton({ id }) {
  const [done, setDone] = useState(false);

  const copy = async () => {
    const ok = await copyToClipboard(id);

    if (ok) {
      setDone(true);
      setTimeout(() => setDone(false), 1500);
      return;
    }

    /* اگر کپی خودکار ممکن نشد، متن شناسه را انتخاب می‌کنیم تا با Ctrl+C کپی شود */
    selectText(document.querySelector(`[data-id-text="${CSS.escape(id)}"]`));
    toast.info('کپی خودکار ممکن نشد؛ شناسه انتخاب شد — Ctrl+C بزن');
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1 rounded-lg border border-theme px-2 py-1 text-[10px] font-bold transition hover:border-[var(--primary-color)]"
      title="کپی شناسه"
    >
      {done ? <Check size={11} /> : <Copy size={11} />}
      {done ? 'کپی شد' : 'کپی آیدی'}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* صفحه‌ی رسانه (پنل ادمین)                                             */
/* ------------------------------------------------------------------ */

function MediaPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [zoomFile, setZoomFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [denied, setDenied] = useState('');
  const inputRef = useRef(null);

  /* جستجو با تأخیر */
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/storage`, {
        ...authHeaders(),
        params: { page, limit: PAGE_SIZE, contentType: type || undefined, search: query || undefined },
        timeout: 20000,
      });
      const body = getBody(res);
      const rows = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
      setFiles(rows);
      setTotal(Number(body?.total ?? rows.length) || 0);
      setTotalPages(Number(body?.totalPages ?? 1) || 1);
    } catch (e) {
      const status = e.response?.status;
      const message = e.response?.data?.message || 'دریافت فهرست رسانه‌ها ناموفق بود';

      setFiles([]);
      setTotal(0);
      setTotalPages(1);

      if (status === 401 || status === 403) setDenied(message);
      else toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, type, query]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (fileList) => {
    const list = [...fileList].filter(Boolean);
    if (!list.length) return;

    const form = new FormData();
    list.forEach((file) => form.append('files', file));

    setUploading(true);
    try {
      const res = await axios.post(`${API}/storage`, form, {
        ...authHeaders(),
        headers: { ...authHeaders().headers, 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      const created = getBody(res);
      const count = Array.isArray(created) ? created.length : 1;
      toast.success(`${toFa(count)} فایل آپلود شد`);
      setPage(1);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'آپلود ناموفق بود');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (file) => {
    if (!window.confirm(`«${file.name}» حذف شود؟ این کار برگشت‌پذیر نیست.`)) return;

    axios
      .delete(`${API}/storage/${encodeURIComponent(getId(file))}`, authHeaders())
      .then(() => {
        toast.success('فایل حذف شد');
        setFiles((prev) => prev.filter((f) => getId(f) !== getId(file)));
        setTotal((t) => Math.max(0, t - 1));
      })
      .catch((e) => toast.error(e.response?.data?.message || 'حذف ناموفق بود'));
  };

  const stats = useMemo(() => {
    const images = files.filter(isImage).length;
    return { images, others: files.length - images };
  }, [files]);

  /* دسترسی غیرمجاز: پیام روشن + راه‌حل، به‌جای شبکه‌ی خالی */
  if (denied) {
    return (
      <div className="card rounded-3xl p-8 text-center">
        <ShieldAlert size={40} className="mx-auto mb-3 text-yellow" />
        <h1 className="text-lg font-black">دسترسی به کتابخانه‌ی رسانه ممکن نشد</h1>
        <p className="mx-auto mt-2 max-w-lg text-xs leading-6 muted">
          پاسخ سرور: <b dir="ltr">{denied}</b>
        </p>
        <ul className="mx-auto mt-4 max-w-lg space-y-2 text-right text-xs leading-6 muted">
          <li>
            ۱. با <b>حساب ادمین</b> وارد شوید (در حالت دمو: شماره <b dir="ltr">09120000001</b> و کد{' '}
            <b dir="ltr">123456</b>).
          </li>
          <li>
            ۲. اگر بک‌اند واقعی را اجرا می‌کنید، فایل{' '}
            <b dir="ltr">src/routes/storage/storage.route.js</b> را از بسته‌ی دور ۷ جایگزین کنید؛
            در نسخه‌ی قدیمی، مسیر <b dir="ltr">GET /storage</b> توکن را بررسی نمی‌کرد و همیشه همین
            خطا را می‌داد.
          </li>
          <li>۳. توکن شما منقضی شده باشد هم همین خطا را می‌گیرید؛ یک‌بار خارج و دوباره وارد شوید.</li>
        </ul>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button type="button" onClick={() => { setDenied(''); load(); }} className="btn-yellow !py-2 text-sm">
            تلاش دوباره
          </button>
          <Link to="/auth/pre" className="btn-ghost !py-2 text-sm">
            ورود با حساب ادمین
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* سرصفحه */}
      <div className="card rounded-3xl p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-base font-black sm:text-lg">
              <ImageIcon size={18} className="text-yellow" />
              کتابخانه‌ی رسانه
            </h1>
            <p className="mt-1 text-xs muted">
              همه‌ی عکس‌های پروژه یک‌جا؛ شناسه‌ی هر فایل را کپی کن یا حذفش کن.
              <span className="mx-1">•</span>
              مجموع: <b>{toFa(total)}</b> فایل
              {files.length > 0 && (
                <>
                  <span className="mx-1">—</span>
                  در این صفحه: {toFa(stats.images)} تصویر
                  {stats.others > 0 ? ` و ${toFa(stats.others)} فایل دیگر` : ''}
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => upload(e.target.files)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-yellow inline-flex items-center gap-1.5 !py-2 text-sm disabled:opacity-60"
            >
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {uploading ? 'در حال آپلود…' : 'آپلود فایل'}
            </button>
          </div>
        </div>

        {/* فیلتر و جستجو */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map(([value, label]) => (
              <button
                key={value || 'all'}
                type="button"
                onClick={() => {
                  setType(value);
                  setPage(1);
                }}
                className={`chip ${type === value ? 'on' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو با نام فایل یا شناسه…"
              className="input !py-2 !pr-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* ناحیه‌ی کشیدن و رها کردن */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          upload(e.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed p-3 text-center text-xs transition ${
          dragOver ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/5' : 'border-theme muted'
        }`}
      >
        فایل‌ها را اینجا رها کن (تصویر یا ویدیو، حداکثر ۱۰ مگابایت برای هر فایل)
      </div>

      {/* شبکه‌ی فایل‌ها */}
      {loading ? (
        <div className="py-16">
          <Loading label="در حال بارگذاری رسانه‌ها…" />
        </div>
      ) : files.length === 0 ? (
        <div className="card rounded-3xl p-12 text-center">
          <ImageIcon size={34} className="mx-auto mb-3 muted" />
          <div className="font-black">فایلی پیدا نشد</div>
          <p className="mt-1 text-xs muted">
            {query || type ? 'فیلتر را عوض کن یا عبارت دیگری جستجو کن.' : 'اولین فایل را آپلود کن.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {files.map((file) => {
            const id = getId(file);
            return (
              <article key={id} className="card overflow-hidden rounded-2xl">
                <div className="aspect-square w-full bg-black/20">
                  <MediaThumb file={file} onZoom={setZoomFile} />
                </div>

                <div className="space-y-1.5 p-2.5">
                  <div className="truncate text-[11px] font-bold" title={file.name}>
                    {file.name || 'بدون نام'}
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[10px] muted">
                    <span>{formatSize(file.size)}</span>
                    <span>{formatDate(file.create_at)}</span>
                  </div>
                  <div
                    className="line-clamp-2 break-all rounded-lg bg-black/20 px-1.5 py-1 text-[9px] leading-4 select-all"
                    dir="ltr"
                    title={id}
                    data-id-text={id}
                  >
                    {id}
                  </div>
                  {file.used_by?.length > 0 && (
                    <div className="truncate text-[10px] text-yellow" title={file.used_by.join('، ')}>
                      {file.used_by[0]}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 pt-0.5">
                    <CopyIdButton id={id} />
                    <button
                      type="button"
                      onClick={() => remove(file)}
                      className="inline-flex items-center gap-1 rounded-lg border border-theme px-2 py-1 text-[10px] font-bold text-red-400 transition hover:border-red-400"
                      title="حذف فایل"
                    >
                      <Trash2 size={11} />
                      حذف
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* صفحه‌بندی */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-ghost !py-2 text-xs disabled:opacity-40"
          >
            قبلی
          </button>
          <span className="text-xs muted">
            صفحه‌ی {toFa(page)} از {toFa(totalPages)}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn-ghost !py-2 text-xs disabled:opacity-40"
          >
            بعدی
          </button>
        </div>
      )}

      <ImageLightboxComponent
        file={zoomFile}
        alt={zoomFile?.name}
        onClose={() => setZoomFile(null)}
      />
    </div>
  );
}

export default MediaPage;
