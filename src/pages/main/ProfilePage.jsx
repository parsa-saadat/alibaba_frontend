import { t as translateText } from '../../i18n/runtime.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import JalaliDateTimePicker from '../../components/common/JalaliDateTimePicker';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  User,
  Phone,
  LogOut,
  Store,
  MapPin,
  Plus,
  X,
  ShieldCheck,
  Trash2,
  Upload,
  RefreshCw,
  Loader2,
  BadgeCheck,
} from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import { authHeaders, getToken } from '../../utils/helpers/storage';
import AddressFormModalComponent from '../../components/address/AddressFormModalComponent';
import { toFa } from '../../utils/helpers/format';
import { userDisplayName, userInitial, isTrustedSeller } from '../../utils/helpers/user';
import { validateEmailSyntax } from '../../utils/validators/email.validator';
import StorageImageComponent from '../../components/common/StorageImageComponent';
import ImageLightboxComponent from '../../components/common/ImageLightboxComponent';
import { normalizePhoneNumber, validateAuthPhone } from '../../utils/validators/phone.validator';
import { cardNumberValidator } from '../../utils/validators/card_number.validator';
import { shebaNumberValidator } from '../../utils/validators/sheba_number.validator';
import MyStoresSectionComponent from '../../components/profile/MyStoresSectionComponent';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';
const MAX_IMAGE_MB = 5;

const EMPTY_ADDR = {
  full_name: '',
  province: '',
  city: '',
  neighborhood: '',
  full_address: '',
  building_number: '',
  unit: '',
  postal_code: '',
};

const EMPTY_SELLER = { firstname: '', lastname: '', phone: '' };

const ROLE_LABELS = {
  admin: translateText('مدیر سیستم'),
  seller: translateText('فروشنده'),
  user: translateText('کاربر'),
  customer: translateText('کاربر'),
};

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
/** تبدیل ارقام فارسی و عربی به انگلیسی */
function normalizeDigits(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

/** فقط ارقام انگلیسی */
const onlyDigits = (value) => normalizeDigits(value).replace(/\D/g, '');

/** شبا: حروف بزرگ، بدون فاصله و خط تیره، با پیشوند IR */
function normalizeSheba(value) {
  const v = normalizeDigits(value).toUpperCase().replace(/[\s-]/g, '');
  return /^\d{24}$/.test(v) ? `IR${v}` : v;
}

function isAtLeast18(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 18);
  return d <= limit;
}

/* ------------------------------------------------------------------ */
/* Small UI parts (بیرون از کامپوننت اصلی تا هنگام تایپ remount نشوند)  */
/* ------------------------------------------------------------------ */
function Field({ label, error, className = '', children }) {
  return (
    <label className={`block text-xs muted ${className}`}>
      {label}
      <div className="mt-1">{children}</div>
      {error && <span className="block mt-1 text-red-400">{error}</span>}
    </label>
  );
}

function ImageUploadSlot({ label, fileId, uploading, error, onPick, onRemove, onZoom }) {
  const ref = useRef(null);
  return (
    <div>
      <div className="text-xs muted mb-1">{label}</div>
      {fileId ? (
        <div className="relative h-44 rounded-2xl overflow-hidden border border-theme">
          <StorageImageComponent
            file={fileId}
            alt={label}
            className="w-full h-full object-cover"
            onZoom={(f, a) => onZoom({ file: f, alt: a })}
          />
          <div className="absolute top-2 start-2 flex gap-1">
            <button
              type="button"
              onClick={() => ref.current?.click()}
              disabled={uploading}
              className="bg-black/75 text-white rounded-full p-1.5 hover:bg-black"
              aria-label={translateText('تعویض تصویر')}
              title={translateText('تعویض تصویر')}
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={uploading}
              className="bg-black/75 text-white rounded-full p-1.5 hover:bg-red-600"
              aria-label={translateText('حذف تصویر')}
              title={translateText('حذف تصویر')}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className={`w-full h-44 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-2 text-xs muted ${
            error ? 'border-red-400' : 'border-theme'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              {translateText(' در حال آپلود… ')}
            </>
          ) : (
            <>
              <Upload size={20} />
              {translateText(' انتخاب تصویر ')}
            </>
          )}
        </button>
      )}
      {error && <span className="block mt-1 text-xs text-red-400">{error}</span>}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onPick} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
function ProfilePage() {
  const { user, refreshUser, logout } = useShop();
  const [profile, setProfile] = useState({
    username: '',
    firstname: '',
    lastname: '',
    email: '',
  });
  const [savingName, setSavingName] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [showAddr, setShowAddr] = useState(false);
  const [addr, setAddr] = useState(EMPTY_ADDR);
  const [addrErrors, setAddrErrors] = useState({});
  const [savingAddr, setSavingAddr] = useState(false);

  const [seller, setSeller] = useState(EMPTY_SELLER);
  const [sellerErrors, setSellerErrors] = useState({});
  const [uploadingField, setUploadingField] = useState('');
  const [submittingSeller, setSubmittingSeller] = useState(false);
  const [zoomFile, setZoomFile] = useState(null);

  const loadAddresses = useCallback(() => {
    if (!user) return;
    setAddrLoading(true);
    axios
      .get(`${API}/users/${user._id}/address`, authHeaders())
      .then((res) =>
        setAddresses(Array.isArray(res.data.body) ? res.data.body : res.data.body?.data || []),
      )
      .catch(() => toast.error(translateText('خطا در دریافت نشانی‌ها')))
      .finally(() => setAddrLoading(false));
  }, [user]);

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || '',
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || '',
      });
      setSeller(previous => ({ ...previous, firstname: user.firstname || '', lastname: user.lastname || '', phone: user.seller_contact_phone || user.phone || '' }));
      loadAddresses();
    }
  }, [user, loadAddresses]);

  if (!user) {
    return (
      <section className="profile-welcome max-w-5xl mx-auto">
        <div className="profile-welcome-visual" aria-hidden="true">
          <div className="welcome-orbit">
            <User size={56} />
          </div>
          <span className="welcome-mini">
            <Store size={24} />
            <ShieldCheck size={24} />
            <MapPin size={24} />
          </span>
        </div>
        <div className="profile-welcome-copy">
          <span className="text-accent font-bold">GeoCala</span>
          <h1>{translateText('welcome.title')}</h1>
          <p className="muted">{translateText('welcome.description')}</p>
          <ul>
            {['orders', 'favorites', 'stores'].map((key) => (
              <li key={key}>
                <ShieldCheck size={17} />
                {translateText(`welcome.${key}`)}
              </li>
            ))}
          </ul>
          <div className="profile-welcome-actions">
            <Link to="/auth/pre" className="btn-primary">
              {translateText('welcome.login')}
            </Link>
            <Link to="/products" className="btn-ghost">
              {translateText('welcome.browse')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- مشخصات کاربر ---------------- */
  const saveProfile = () => {
    const username = profile.username.trim();
    const firstname = profile.firstname.trim();
    const lastname = profile.lastname.trim();
    const email = profile.email.trim();

    if (!username) return toast.error(translateText('نام کاربری نمی‌تواند خالی باشد'));
    if (email && !validateEmailSyntax(email))
      return toast.error(translateText('ایمیل وارد‌شده معتبر نیست'));

    const unchanged =
      username === (user.username || '') &&
      firstname === (user.firstname || '') &&
      lastname === (user.lastname || '') &&
      email === (user.email || '');
    if (unchanged) return toast.info(translateText('تغییری برای ذخیره وجود ندارد'));

    setSavingName(true);
    axios
      .put(`${API}/user/${user._id}`, { username, firstname, lastname, email }, authHeaders())
      .then(() => {
        toast.success(translateText('مشخصات حساب به‌روزرسانی شد'));
        refreshUser();
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || translateText('خطا در ذخیره مشخصات')),
      )
      .finally(() => setSavingName(false));
  };

  /* ---------------- نشانی‌ها ---------------- */
  const toggleAddrForm = () => {
    if (showAddr) {
      setAddr(EMPTY_ADDR);
      setAddrErrors({});
    }
    setShowAddr((v) => !v);
  };

  const setAddrField = (key, val) => {
    setAddr((a) => ({ ...a, [key]: val }));
    if (addrErrors[key]) setAddrErrors((e) => ({ ...e, [key]: '' }));
  };

  const addAddress = () => {
    const errors = {};
    const required = {
      full_name: translateText('نام گیرنده را وارد کنید'),
      province: translateText('استان را وارد کنید'),
      city: translateText('شهر را وارد کنید'),
      neighborhood: translateText('محله را وارد کنید'),
      full_address: translateText('نشانی کامل را وارد کنید'),
    };
    Object.entries(required).forEach(([k, msg]) => {
      if (!String(addr[k]).trim()) errors[k] = msg;
    });

    const postal = onlyDigits(addr.postal_code);
    if (postal.length !== 10) errors.postal_code = translateText('کد پستی باید ۱۰ رقم باشد');

    const building = Number(onlyDigits(addr.building_number));
    if (!building || building < 1) errors.building_number = translateText('پلاک معتبر نیست');

    const unit = Number(onlyDigits(addr.unit));
    if (!unit || unit < 1) errors.unit = translateText('واحد معتبر نیست');

    if (Object.keys(errors).length) {
      setAddrErrors(errors);
      return toast.error(translateText('لطفاً موارد مشخص‌شده را اصلاح کنید'));
    }

    setSavingAddr(true);
    axios
      .post(
        `${API}/users/${user._id}/address`,
        {
          address: {
            full_name: addr.full_name.trim(),
            province: addr.province.trim(),
            city: addr.city.trim(),
            neighborhood: addr.neighborhood.trim(),
            full_address: addr.full_address.trim(),
            building_number: building,
            unit,
            postal_code: postal,
            is_default: addresses.length === 0,
          },
        },
        authHeaders(),
      )
      .then(() => {
        toast.success(translateText('نشانی اضافه شد'));
        setShowAddr(false);
        setAddr(EMPTY_ADDR);
        setAddrErrors({});
        loadAddresses();
      })
      .catch((err) => toast.error(err.response?.data?.message || translateText('خطا در ثبت نشانی')))
      .finally(() => setSavingAddr(false));
  };

  const removeAddress = (id) => {
    if (!window.confirm(translateText('آیا از حذف این نشانی مطمئن هستید؟'))) return;
    axios
      .delete(`${API}/users/${user._id}/address/${id}`, authHeaders())
      .then(() => {
        toast.success(translateText('نشانی حذف شد'));
        loadAddresses();
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || translateText('خطا در حذف نشانی')),
      );
  };

  /* ---------------- درخواست فروشندگی ---------------- */
  const setSellerField = (key, val) => {
    setSeller((s) => ({ ...s, [key]: val }));
    if (sellerErrors[key]) setSellerErrors((e) => ({ ...e, [key]: '' }));
  };

  const uploadFile = async (e, field) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/'))
      return toast.error(translateText('فقط فایل تصویری مجاز است'));
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      return toast.error(
        translateText('حجم تصویر نباید بیشتر از {{v0}} مگابایت باشد', { v0: toFa(MAX_IMAGE_MB) }),
      );
    }

    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const res = await axios.post(`${API}/storage`, formData, {
        headers: {
          Authorization: getToken(),
          'Content-Type': 'multipart/form-data',
        },
      });
      const fileId = res.data?.body?.[0]?._id;
      if (!fileId) throw new Error('empty');
      setSellerField(field, fileId);
      toast.success(translateText('تصویر آپلود شد'));
    } catch (err) {
      toast.error(err.response?.data?.message || translateText('خطا در آپلود تصویر'));
    } finally {
      setUploadingField('');
    }
  };

  const requestSeller = () => {
    if (submittingSeller) return;
    const errors = {};
    if (!seller.firstname.trim() || seller.firstname.trim().length > 80) errors.firstname = translateText('seller.applicationNameError');
    if (!seller.lastname.trim() || seller.lastname.trim().length > 80) errors.lastname = translateText('seller.applicationNameError');
    if (!validateAuthPhone(seller.phone)) errors.phone = translateText('seller.applicationPhoneError');
    setSellerErrors(errors);
    if (Object.keys(errors).length) return toast.error(translateText('لطفاً موارد مشخص‌شده را اصلاح کنید'));
    setSubmittingSeller(true);
    axios.post(`${API}/seller`, { firstname: seller.firstname.trim(), lastname: seller.lastname.trim(), phone: normalizePhoneNumber(seller.phone) }, authHeaders())
      .then(() => { toast.success(translateText('درخواست فروشندگی ثبت شد و در انتظار تأیید مدیر است')); refreshUser(); })
      .catch(error => toast.error(error.response?.data?.message || translateText('خطا در ثبت درخواست')))
      .finally(() => setSubmittingSeller(false));
  };

  const isSeller = user.is_seller || user.role === 'seller' || user.role === 'admin';
  const err = (k) => sellerErrors[k];
  const inputCls = (k) => `input ${sellerErrors[k] ? '!border-red-400' : ''}`;
  const addrCls = (k) => `input ${addrErrors[k] ? '!border-red-400' : ''}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* ---------- هدر ---------- */}
      <section data-testid="profile-header" className="card rounded-3xl overflow-hidden min-w-0">
        <div
          className="p-4 sm:p-6 space-y-5"
          style={{ background: 'linear-gradient(120deg, rgba(255,106,0,0.08), transparent 65%)' }}
        >
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-2xl grid place-items-center font-black text-xl sm:text-2xl"
              style={{ background: 'var(--primary-color)', color: 'var(--on-primary' }}
              aria-hidden="true"
            >
              {userInitial(user)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-black text-lg sm:text-2xl leading-8 break-words">
                {userDisplayName(user)}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-bold"
                  style={{ background: 'var(--card2)' }}
                >
                  <User size={12} />
                  {ROLE_LABELS[user.role] || user.role}
                </span>
                {isSeller && isTrustedSeller(user) && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-theme px-2.5 py-1 text-[10px] sm:text-xs">
                    <BadgeCheck size={13} className="text-accent shrink-0" />
                    {translateText('فروشنده مورد اعتماد ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 min-w-0">
            <div className="rounded-2xl border border-theme px-3 py-2.5 min-w-0">
              <span className="flex items-center gap-1.5 text-[10px] muted mb-1">
                <Phone size={12} />
                {translateText('شماره موبایل')}
              </span>
              <bdi dir="ltr" className="block text-sm font-bold break-all">
                {toFa(user.phone)}
              </bdi>
            </div>
            {user.username && (
              <div className="rounded-2xl border border-theme px-3 py-2.5 min-w-0">
                <span className="flex items-center gap-1.5 text-[10px] muted mb-1">
                  <User size={12} />
                  {translateText('نام کاربری')}
                </span>
                <bdi dir="ltr" className="block text-sm font-bold break-all">
                  @{user.username}
                </bdi>
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-theme p-3 sm:px-6 flex flex-wrap items-center gap-2">
          {isSeller && (
            <Link
              to="/seller"
              className="btn-primary !py-2 !px-3 !text-xs inline-flex items-center gap-1.5"
            >
              <Store size={14} />
              {translateText(' پنل فروشنده ')}
            </Link>
          )}
          {user.role === 'admin' && (
            <Link
              to="/dashboard"
              className="btn-ghost !p-2 inline-flex items-center justify-center shrink-0"
              aria-label={translateText(' پنل مدیر ')}
              title={translateText(' پنل مدیر ')}
            >
              <ShieldCheck size={17} />
            </Link>
          )}
          <Link
            to="/address"
            className="btn-ghost !py-2 !px-3 !text-xs inline-flex items-center gap-1.5"
          >
            <MapPin size={14} />
            {translateText(' مدیریت نشانی‌ها ')}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="btn-ghost !py-2 !px-3 !text-xs inline-flex items-center gap-1.5 text-red-400 ms-auto"
          >
            <LogOut size={14} />
            {translateText('خروج ')}
          </button>
        </div>
      </section>

      {/* ---------- ویرایش مشخصات ---------- */}
      <div className="card rounded-3xl p-6">
        <h2 className="font-black mb-1">{translateText('ویرایش مشخصات')}</h2>
        <p className="text-xs muted mb-4">
          {translateText(
            'نام و نام خانوادگی در پروفایل، نظرات و صفحه‌ی فروشگاه شما نمایش داده می‌شود. ',
          )}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveProfile();
          }}
          className="grid sm:grid-cols-2 gap-3 max-w-2xl"
        >
          <label className="text-xs muted">
            {translateText('نام ')}
            <input
              className="input mt-1"
              value={profile.firstname}
              onChange={(e) => setProfile({ ...profile, firstname: e.target.value })}
              placeholder={translateText('مثلاً سارا')}
            />
          </label>
          <label className="text-xs muted">
            {translateText('نام خانوادگی ')}
            <input
              className="input mt-1"
              value={profile.lastname}
              onChange={(e) => setProfile({ ...profile, lastname: e.target.value })}
              placeholder={translateText('مثلاً محمدی')}
            />
          </label>
          <label className="text-xs muted">
            {translateText('نام کاربری ')}
            <input
              className="input mt-1"
              dir="ltr"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              placeholder="username"
              required
            />
          </label>
          <label className="text-xs muted">
            {translateText('ایمیل ')}
            <input
              className="input mt-1"
              dir="ltr"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="name@example.com"
            />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={savingName} className="btn-primary">
              {savingName ? translateText('در حال ذخیره…') : translateText('ذخیره مشخصات')}
            </button>
          </div>
        </form>
      </div>

      {/* ---------- فروشگاه‌های من و ظرفیت پلن ---------- */}
      <MyStoresSectionComponent />

      {/* ---------- نشانی‌ها ---------- */}
      <div className="card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black flex items-center gap-2">
            <MapPin size={18} className="text-accent" />
            {translateText(' نشانی‌های من ( ')}
            {toFa(addresses.length)})
          </h2>
          <button
            type="button"
            onClick={() => setShowAddr(true)}
            className="btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1"
          >
            <Plus size={14} />
            {translateText(' نشانی جدید ')}
          </button>
        </div>

        <div className="space-y-2">
          {addrLoading && addresses.length === 0 && (
            <div className="text-xs muted text-center py-4">
              {translateText('در حال دریافت نشانی‌ها… ')}
            </div>
          )}
          {!addrLoading && addresses.length === 0 && (
            <div className="rounded-2xl border border-dashed border-theme p-6 text-center text-xs muted">
              {translateText(
                'هنوز نشانی‌ای ثبت نکرده‌اید. با دکمه «نشانی جدید» اولین نشانی را اضافه کنید. ',
              )}
            </div>
          )}
          {addresses.map((a) => {
            const ad = a.address || a;
            return (
              <div
                key={a._id}
                className="card2 rounded-2xl p-3 flex items-center justify-between gap-2 text-sm"
              >
                <div className="min-w-0">
                  <b>{ad.full_name || translateText('نشانی')}</b> — {ad.province}
                  {translateText('، ')}
                  {ad.city}
                  {translateText('،')} {ad.neighborhood}
                  {ad.is_default && (
                    <span className="chip !py-0 !px-2 text-[10px] me-2">
                      {translateText('پیش‌فرض ')}
                    </span>
                  )}
                  <div className="text-xs muted">
                    {ad.full_address}
                    {translateText(' (پلاک ')}
                    {toFa(ad.building_number ?? '')}
                    {translateText('، واحد ')}
                    {toFa(ad.unit ?? '')})
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link to={`/address/${a._id}`} className="btn-ghost !py-1 !px-2.5 text-xs">
                    {translateText('ویرایش ')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeAddress(a._id)}
                    className="text-red-400 p-2"
                    aria-label={translateText('حذف نشانی')}
                    title={translateText('حذف نشانی')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- درخواست فروشندگی ---------- */}
      {!isSeller && (
        <div className="card rounded-3xl p-6">
          <h2 className="font-black text-lg flex items-center gap-2 mb-4">
            <Store size={20} className="text-accent" />
            {translateText(' درخواست فروشندگی در ژئوکالا ')}
          </h2>

          <p className="muted text-sm mb-4">{translateText('seller.applicationHint')}</p>
          <div className="seller-application-fields grid sm:grid-cols-3 gap-3">
            {[['firstname', 'نام '], ['lastname', 'نام خانوادگی '], ['phone', 'تلفن تماس']].map(([field, label]) => (
              <Field key={field} label={translateText(label)} error={err(field)}>
                <input className={inputCls(field)} value={seller[field]} maxLength={field === 'phone' ? 20 : 80}
                  dir={field === 'phone' ? 'ltr' : undefined} type={field === 'phone' ? 'tel' : 'text'}
                  autoComplete={field === 'firstname' ? 'given-name' : field === 'lastname' ? 'family-name' : 'tel'}
                  onChange={event => setSellerField(field, event.target.value)} />
              </Field>
            ))}
          </div>

          <button
            type="button"
            onClick={requestSeller}
            disabled={submittingSeller || !!uploadingField}
            className="btn-primary mt-4"
          >
            {submittingSeller
              ? translateText('در حال ارسال…')
              : translateText('ارسال درخواست فروشندگی')}
          </button>
        </div>
      )}

      <ImageLightboxComponent
        file={zoomFile?.file}
        alt={zoomFile?.alt}
        onClose={() => setZoomFile(null)}
      />

      {/* پاپ‌آپ ثبت نشانی (جای فرم درون‌صفحه‌ای) */}
      <AddressFormModalComponent
        open={showAddr}
        onClose={() => setShowAddr(false)}
        userId={user?._id}
        makeDefault={addresses.length === 0}
        onSaved={() => loadAddresses()}
      />
    </div>
  );
}

export default ProfilePage;
