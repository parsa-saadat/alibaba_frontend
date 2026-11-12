import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  User,
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
} from "lucide-react";
import { useShop } from "../../contexts/ShopContext";
import { authHeaders, getToken } from "../../utils/helpers/storage";
import { toFa } from "../../utils/helpers/format";
import {
  userDisplayName,
  userInitial,
  isTrustedSeller,
} from "../../utils/helpers/user";
import { validateEmailSyntax } from "../../utils/validators/email.validator";
import StorageImageComponent from "../../components/common/StorageImageComponent";
import ImageLightboxComponent from "../../components/common/ImageLightboxComponent";
import { nationalIDValidator } from "../../utils/validators/national_id.validator";
import { cardNumberValidator } from "../../utils/validators/card_number.validator";
import { shebaNumberValidator } from "../../utils/validators/sheba_number.validator";

const API =
  import.meta.env.VITE_APP_API_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";
const MAX_IMAGE_MB = 5;

const EMPTY_ADDR = {
  full_name: "",
  province: "",
  city: "",
  neighborhood: "",
  full_address: "",
  building_number: "",
  unit: "",
  postal_code: "",
};

const EMPTY_SELLER = {
  seller_type: "Individual_seller",
  national_ID: "",
  birth_date: "",
  identity_image_id: "",
  identity_verification_image_id: "",
  province: "",
  city: "",
  full_address: "",
  card_number: "",
  sheba_number: "",
  firstname_lastname: "",
};

const ROLE_LABELS = {
  admin: "مدیر سیستم",
  seller: "فروشنده",
  user: "کاربر",
  customer: "کاربر",
};

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
/** تبدیل ارقام فارسی و عربی به انگلیسی */
function normalizeDigits(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}

/** فقط ارقام انگلیسی */
const onlyDigits = (value) => normalizeDigits(value).replace(/\D/g, "");

/** شبا: حروف بزرگ، بدون فاصله و خط تیره، با پیشوند IR */
function normalizeSheba(value) {
  const v = normalizeDigits(value).toUpperCase().replace(/[\s-]/g, "");
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
function Field({ label, error, className = "", children }) {
  return (
    <label className={`block text-xs muted ${className}`}>
      {label}
      <div className="mt-1">{children}</div>
      {error && <span className="block mt-1 text-red-400">{error}</span>}
    </label>
  );
}

function ImageUploadSlot({
  label,
  fileId,
  uploading,
  error,
  onPick,
  onRemove,
  onZoom,
}) {
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
          <div className="absolute top-2 left-2 flex gap-1">
            <button
              type="button"
              onClick={() => ref.current?.click()}
              disabled={uploading}
              className="bg-black/75 text-white rounded-full p-1.5 hover:bg-black"
              aria-label="تعویض تصویر"
              title="تعویض تصویر"
            >
              {uploading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <RefreshCw size={13} />
              )}
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={uploading}
              className="bg-black/75 text-white rounded-full p-1.5 hover:bg-red-600"
              aria-label="حذف تصویر"
              title="حذف تصویر"
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
            error ? "border-red-400" : "border-theme"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="animate-spin" /> در حال آپلود…
            </>
          ) : (
            <>
              <Upload size={20} /> انتخاب تصویر
            </>
          )}
        </button>
      )}
      {error && (
        <span className="block mt-1 text-xs text-red-400">{error}</span>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
function ProfilePage() {
  const { user, refreshUser, logout } = useShop();
  const [profile, setProfile] = useState({
    username: "",
    firstname: "",
    lastname: "",
    email: "",
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
  const [uploadingField, setUploadingField] = useState("");
  const [submittingSeller, setSubmittingSeller] = useState(false);
  const [zoomFile, setZoomFile] = useState(null);

  const loadAddresses = useCallback(() => {
    if (!user) return;
    setAddrLoading(true);
    axios
      .get(`${API}/users/${user._id}/address`, authHeaders())
      .then((res) =>
        setAddresses(
          Array.isArray(res.data.body)
            ? res.data.body
            : res.data.body?.data || [],
        ),
      )
      .catch(() => toast.error("خطا در دریافت نشانی‌ها"))
      .finally(() => setAddrLoading(false));
  }, [user]);

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || "",
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        email: user.email || "",
      });
      loadAddresses();
    }
  }, [user, loadAddresses]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <User size={36} className="mx-auto muted mb-3" />
        <p className="muted mb-4">برای مشاهده پنل کاربری وارد شوید.</p>
        <Link to="/auth/pre" className="btn-yellow">
          ورود
        </Link>
      </div>
    );
  }

  /* ---------------- مشخصات کاربر ---------------- */
  const saveProfile = () => {
    const username = profile.username.trim();
    const firstname = profile.firstname.trim();
    const lastname = profile.lastname.trim();
    const email = profile.email.trim();

    if (!username) return toast.error("نام کاربری نمی‌تواند خالی باشد");
    if (email && !validateEmailSyntax(email))
      return toast.error("ایمیل وارد‌شده معتبر نیست");

    const unchanged =
      username === (user.username || "") &&
      firstname === (user.firstname || "") &&
      lastname === (user.lastname || "") &&
      email === (user.email || "");
    if (unchanged) return toast.info("تغییری برای ذخیره وجود ندارد");

    setSavingName(true);
    axios
      .put(
        `${API}/user/${user._id}`,
        { username, firstname, lastname, email },
        authHeaders(),
      )
      .then(() => {
        toast.success("مشخصات حساب به‌روزرسانی شد");
        refreshUser();
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || "خطا در ذخیره مشخصات"),
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
    if (addrErrors[key]) setAddrErrors((e) => ({ ...e, [key]: "" }));
  };

  const addAddress = () => {
    const errors = {};
    const required = {
      full_name: "نام گیرنده را وارد کنید",
      province: "استان را وارد کنید",
      city: "شهر را وارد کنید",
      neighborhood: "محله را وارد کنید",
      full_address: "نشانی کامل را وارد کنید",
    };
    Object.entries(required).forEach(([k, msg]) => {
      if (!String(addr[k]).trim()) errors[k] = msg;
    });

    const postal = onlyDigits(addr.postal_code);
    if (postal.length !== 10) errors.postal_code = "کد پستی باید ۱۰ رقم باشد";

    const building = Number(onlyDigits(addr.building_number));
    if (!building || building < 1) errors.building_number = "پلاک معتبر نیست";

    const unit = Number(onlyDigits(addr.unit));
    if (!unit || unit < 1) errors.unit = "واحد معتبر نیست";

    if (Object.keys(errors).length) {
      setAddrErrors(errors);
      return toast.error("لطفاً موارد مشخص‌شده را اصلاح کنید");
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
        toast.success("نشانی اضافه شد");
        setShowAddr(false);
        setAddr(EMPTY_ADDR);
        setAddrErrors({});
        loadAddresses();
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || "خطا در ثبت نشانی"),
      )
      .finally(() => setSavingAddr(false));
  };

  const removeAddress = (id) => {
    if (!window.confirm("آیا از حذف این نشانی مطمئن هستید؟")) return;
    axios
      .delete(`${API}/users/${user._id}/address/${id}`, authHeaders())
      .then(() => {
        toast.success("نشانی حذف شد");
        loadAddresses();
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || "خطا در حذف نشانی"),
      );
  };

  /* ---------------- درخواست فروشندگی ---------------- */
  const setSellerField = (key, val) => {
    setSeller((s) => ({ ...s, [key]: val }));
    if (sellerErrors[key]) setSellerErrors((e) => ({ ...e, [key]: "" }));
  };

  const uploadFile = async (e, field) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error("فقط فایل تصویری مجاز است");
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      return toast.error(
        `حجم تصویر نباید بیشتر از ${toFa(MAX_IMAGE_MB)} مگابایت باشد`,
      );
    }

    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const res = await axios.post(`${API}/storage`, formData, {
        headers: {
          Authorization: getToken(),
          "Content-Type": "multipart/form-data",
        },
      });
      const fileId = res.data?.body?.[0]?._id;
      if (!fileId) throw new Error("empty");
      setSellerField(field, fileId);
      toast.success("تصویر آپلود شد");
    } catch (err) {
      toast.error(err.response?.data?.message || "خطا در آپلود تصویر");
    } finally {
      setUploadingField("");
    }
  };

  const requestSeller = () => {
    setSubmittingSeller(true);
    axios
      .post(
        `${API}/seller`,
        {
          seller_type: seller.seller_type,
          national_ID: nationalId,
          birth_date: seller.birth_date,
          identity_image_id: seller.identity_image_id,
          identity_verification_image_id: seller.identity_verification_image_id,
          address: {
            province: seller.province.trim(),
            city: seller.city.trim(),
            full_address: seller.full_address.trim(),
          },
          settlement_account: {
            type: "card",
            card_number: card,
            sheba_number: sheba,
            firstname_lastname: seller.firstname_lastname.trim(),
          },
        },
        authHeaders(),
      )
      .then(() => {
        toast.success("درخواست فروشندگی ثبت شد و در انتظار تأیید مدیر است");
        setSellerErrors({});
        refreshUser();
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || "خطا در ثبت درخواست"),
      )
      .finally(() => setSubmittingSeller(false));
  };

  const isSeller =
    user.is_seller || user.role === "seller" || user.role === "admin";
  const err = (k) => sellerErrors[k];
  const inputCls = (k) => `input ${sellerErrors[k] ? "!border-red-400" : ""}`;
  const addrCls = (k) => `input ${addrErrors[k] ? "!border-red-400" : ""}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* ---------- هدر ---------- */}
      <div className="card rounded-3xl p-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl grid place-items-center font-black text-2xl"
            style={{ background: "var(--primary-color)", color: "var(--navy)" }}
          >
            {userInitial(user)}
          </div>
          <div>
            <h1 className="font-black text-xl flex items-center gap-2 flex-wrap">
              {userDisplayName(user)}
              {isSeller && isTrustedSeller(user) && (
                <span className="chip !cursor-default !py-0.5 !px-2 text-[11px] flex items-center gap-1">
                  <BadgeCheck size={12} className="text-yellow" />
                  فروشنده مورد اعتماد
                </span>
              )}
            </h1>
            <div className="text-xs muted mt-1">
              {user.username ? (
                <span dir="ltr">@{user.username}</span>
              ) : null}
              {user.username ? " • " : ""}
              موبایل: <span dir="ltr">{toFa(user.phone)}</span> • نقش:{" "}
              {ROLE_LABELS[user.role] || user.role}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            to="/address"
            className="btn-ghost text-sm flex items-center gap-1"
          >
            <MapPin size={16} /> مدیریت نشانی‌ها
          </Link>
          {isSeller && (
            <Link
              to="/seller"
              className="btn-yellow text-sm flex items-center gap-1"
            >
              <Store size={16} /> پنل فروشنده
            </Link>
          )}
          {user.role === "admin" && (
            <Link
              to="/dashboard"
              className="btn-yellow text-sm flex items-center gap-1"
            >
              <ShieldCheck size={16} /> پنل مدیر
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="btn-ghost text-sm text-red-400"
          >
            خروج
          </button>
        </div>
      </div>

      {/* ---------- ویرایش مشخصات ---------- */}
      <div className="card rounded-3xl p-6">
        <h2 className="font-black mb-1">ویرایش مشخصات</h2>
        <p className="text-xs muted mb-4">
          نام و نام خانوادگی در پروفایل، نظرات و صفحه‌ی فروشگاه شما نمایش داده می‌شود.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveProfile();
          }}
          className="grid sm:grid-cols-2 gap-3 max-w-2xl"
        >
          <label className="text-xs muted">
            نام
            <input
              className="input mt-1"
              value={profile.firstname}
              onChange={(e) =>
                setProfile({ ...profile, firstname: e.target.value })
              }
              placeholder="مثلاً سارا"
            />
          </label>
          <label className="text-xs muted">
            نام خانوادگی
            <input
              className="input mt-1"
              value={profile.lastname}
              onChange={(e) =>
                setProfile({ ...profile, lastname: e.target.value })
              }
              placeholder="مثلاً محمدی"
            />
          </label>
          <label className="text-xs muted">
            نام کاربری
            <input
              className="input mt-1"
              dir="ltr"
              value={profile.username}
              onChange={(e) =>
                setProfile({ ...profile, username: e.target.value })
              }
              placeholder="username"
              required
            />
          </label>
          <label className="text-xs muted">
            ایمیل
            <input
              className="input mt-1"
              dir="ltr"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="name@example.com"
            />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={savingName} className="btn-yellow">
              {savingName ? "در حال ذخیره…" : "ذخیره مشخصات"}
            </button>
          </div>
        </form>
      </div>

      {/* ---------- نشانی‌ها ---------- */}
      <div className="card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black flex items-center gap-2">
            <MapPin size={18} className="text-yellow" /> نشانی‌های من (
            {toFa(addresses.length)})
          </h2>
          <button
            type="button"
            onClick={toggleAddrForm}
            className="btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1"
          >
            {showAddr ? (
              <>
                <X size={14} /> لغو
              </>
            ) : (
              <>
                <Plus size={14} /> نشانی جدید
              </>
            )}
          </button>
        </div>

        {showAddr && (
          <div
            className="grid sm:grid-cols-2 gap-3 mb-4 p-4 rounded-2xl"
            style={{ background: "var(--card2)" }}
          >
            <Field
              label="نام و نام خانوادگی گیرنده"
              error={addrErrors.full_name}
              className="sm:col-span-2"
            >
              <input
                className={addrCls("full_name")}
                value={addr.full_name}
                onChange={(e) => setAddrField("full_name", e.target.value)}
              />
            </Field>
            <Field label="استان" error={addrErrors.province}>
              <input
                className={addrCls("province")}
                value={addr.province}
                onChange={(e) => setAddrField("province", e.target.value)}
              />
            </Field>
            <Field label="شهر" error={addrErrors.city}>
              <input
                className={addrCls("city")}
                value={addr.city}
                onChange={(e) => setAddrField("city", e.target.value)}
              />
            </Field>
            <Field label="محله" error={addrErrors.neighborhood}>
              <input
                className={addrCls("neighborhood")}
                value={addr.neighborhood}
                onChange={(e) => setAddrField("neighborhood", e.target.value)}
              />
            </Field>
            <Field label="کد پستی (۱۰ رقم)" error={addrErrors.postal_code}>
              <input
                className={addrCls("postal_code")}
                dir="ltr"
                inputMode="numeric"
                maxLength={10}
                value={addr.postal_code}
                onChange={(e) =>
                  setAddrField("postal_code", onlyDigits(e.target.value))
                }
              />
            </Field>
            <Field
              label="نشانی کامل"
              error={addrErrors.full_address}
              className="sm:col-span-2"
            >
              <input
                className={addrCls("full_address")}
                value={addr.full_address}
                onChange={(e) => setAddrField("full_address", e.target.value)}
              />
            </Field>
            <Field label="پلاک" error={addrErrors.building_number}>
              <input
                className={addrCls("building_number")}
                inputMode="numeric"
                value={addr.building_number}
                onChange={(e) =>
                  setAddrField("building_number", onlyDigits(e.target.value))
                }
              />
            </Field>
            <Field label="واحد" error={addrErrors.unit}>
              <input
                className={addrCls("unit")}
                inputMode="numeric"
                value={addr.unit}
                onChange={(e) =>
                  setAddrField("unit", onlyDigits(e.target.value))
                }
              />
            </Field>
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="button"
                onClick={addAddress}
                disabled={savingAddr}
                className="btn-yellow flex-1"
              >
                {savingAddr ? "در حال ثبت…" : "ثبت نشانی"}
              </button>
              <button
                type="button"
                onClick={toggleAddrForm}
                className="btn-ghost"
              >
                لغو
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {addrLoading && addresses.length === 0 && (
            <div className="text-xs muted text-center py-4">
              در حال دریافت نشانی‌ها…
            </div>
          )}
          {!addrLoading && addresses.length === 0 && !showAddr && (
            <div className="rounded-2xl border border-dashed border-theme p-6 text-center text-xs muted">
              هنوز نشانی‌ای ثبت نکرده‌اید. با دکمه «نشانی جدید» اولین نشانی را
              اضافه کنید.
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
                  <b>{ad.full_name || "نشانی"}</b> — {ad.province}، {ad.city}،{" "}
                  {ad.neighborhood}
                  {ad.is_default && (
                    <span className="chip !py-0 !px-2 text-[10px] mr-2">
                      پیش‌فرض
                    </span>
                  )}
                  <div className="text-xs muted">
                    {ad.full_address} (پلاک {toFa(ad.building_number ?? "")}،
                    واحد {toFa(ad.unit ?? "")})
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    to={`/address/${a._id}`}
                    className="btn-ghost !py-1 !px-2.5 text-xs"
                  >
                    ویرایش
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeAddress(a._id)}
                    className="text-red-400 p-2"
                    aria-label="حذف نشانی"
                    title="حذف نشانی"
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
            <Store size={20} className="text-yellow" /> درخواست فروشندگی در
            علی‌بازار
          </h2>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="نوع فروشنده">
              <select
                className="input"
                value={seller.seller_type}
                onChange={(e) => setSellerField("seller_type", e.target.value)}
              >
                <option value="Individual_seller">فروشنده حقیقی</option>
                <option value="institutional_seller">فروشنده حقوقی</option>
              </select>
            </Field>
            <Field label="کد ملی (۱۰ رقم)" error={err("national_ID")}>
              <input
                className={inputCls("national_ID")}
                dir="ltr"
                inputMode="numeric"
                maxLength={10}
                value={seller.national_ID}
                onChange={(e) =>
                  setSellerField("national_ID", onlyDigits(e.target.value))
                }
              />
            </Field>
            <Field label="تاریخ تولد" error={err("birth_date")}>
              <input
                className={inputCls("birth_date")}
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={seller.birth_date}
                onChange={(e) => setSellerField("birth_date", e.target.value)}
              />
            </Field>
            <Field
              label="نام و نام خانوادگی صاحب حساب"
              error={err("firstname_lastname")}
            >
              <input
                className={inputCls("firstname_lastname")}
                value={seller.firstname_lastname}
                onChange={(e) =>
                  setSellerField("firstname_lastname", e.target.value)
                }
              />
            </Field>
            <Field label="شماره کارت (۱۶ رقم)" error={err("card_number")}>
              <input
                className={inputCls("card_number")}
                dir="ltr"
                inputMode="numeric"
                maxLength={16}
                value={seller.card_number}
                onChange={(e) =>
                  setSellerField("card_number", onlyDigits(e.target.value))
                }
              />
            </Field>
            <Field
              label="شماره شبا (با IR یا بدون آن)"
              error={err("sheba_number")}
            >
              <input
                className={inputCls("sheba_number")}
                dir="ltr"
                maxLength={26}
                value={seller.sheba_number}
                onChange={(e) =>
                  setSellerField(
                    "sheba_number",
                    normalizeDigits(e.target.value)
                      .toUpperCase()
                      .replace(/[^0-9A-Z]/g, ""),
                  )
                }
              />
            </Field>
            <Field label="استان" error={err("province")}>
              <input
                className={inputCls("province")}
                value={seller.province}
                onChange={(e) => setSellerField("province", e.target.value)}
              />
            </Field>
            <Field label="شهر" error={err("city")}>
              <input
                className={inputCls("city")}
                value={seller.city}
                onChange={(e) => setSellerField("city", e.target.value)}
              />
            </Field>
            <Field
              label="نشانی کامل"
              error={err("full_address")}
              className="sm:col-span-2"
            >
              <input
                className={inputCls("full_address")}
                value={seller.full_address}
                onChange={(e) => setSellerField("full_address", e.target.value)}
              />
            </Field>

            <ImageUploadSlot
              label="تصویر کارت ملی"
              fileId={seller.identity_image_id}
              uploading={uploadingField === "identity_image_id"}
              error={err("identity_image_id")}
              onPick={(e) => uploadFile(e, "identity_image_id")}
              onRemove={() => setSellerField("identity_image_id", "")}
              onZoom={setZoomFile}
            />
            <ImageUploadSlot
              label="سلفی احراز هویت (همراه با کارت ملی)"
              fileId={seller.identity_verification_image_id}
              uploading={uploadingField === "identity_verification_image_id"}
              error={err("identity_verification_image_id")}
              onPick={(e) => uploadFile(e, "identity_verification_image_id")}
              onRemove={() =>
                setSellerField("identity_verification_image_id", "")
              }
              onZoom={setZoomFile}
            />
          </div>

          <button
            type="button"
            onClick={requestSeller}
            disabled={submittingSeller || !!uploadingField}
            className="btn-yellow mt-4"
          >
            {submittingSeller ? "در حال ارسال…" : "ارسال درخواست فروشندگی"}
          </button>
        </div>
      )}

      <ImageLightboxComponent
        file={zoomFile?.file}
        alt={zoomFile?.alt}
        onClose={() => setZoomFile(null)}
      />
    </div>
  );
}

export default ProfilePage;
