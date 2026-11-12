import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BadgeCheck, Info, Lock, Store } from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import { authHeaders } from '../../utils/helpers/storage';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { toFa } from '../../utils/helpers/format';
import { isSellerIdentityLocked, isTrustedSeller } from '../../utils/helpers/user';
import { nationalIDValidator } from '../../utils/validators/national_id.validator';
import { cardNumberValidator } from '../../utils/validators/card_number.validator';
import { shebaNumberValidator } from '../../utils/validators/sheba_number.validator';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

const EMPTY_FORM = {
  seller_type: 'Individual_seller',
  national_ID: '',
  birth_date: '',
  province: '',
  city: '',
  full_address: '',
  card_number: '',
  sheba_number: '',
  firstname_lastname: '',
};

function SettingPage() {
  const { user, refreshUser } = useShop();
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  /*
   * اطلاعات فروشنده از روت کاربر خوانده می‌شود (روت /seller/:id فقط برای ادمین است).
   * برای خود کاربر، GET /user/:id اطلاعات کامل (شامل فیلدهای فروشندگی) را برمی‌گرداند.
   */
  useEffect(() => {
    if (!user) return setLoading(false);
    const controller = new AbortController();

    axios
      .get(`${API}/user/${user._id}`, { ...authHeaders(), signal: controller.signal })
      .then((res) => {
        const data = res.data?.body;
        if (!data) return;
        setSeller(data);
        setForm({
          seller_type: data.seller_type || 'Individual_seller',
          national_ID: data.national_ID || '',
          birth_date: data.birth_date || '',
          province: data.address?.province || '',
          city: data.address?.city || '',
          full_address: data.address?.full_address || '',
          card_number: data.settlement_account?.card_number || '',
          sheba_number: data.settlement_account?.sheba_number || '',
          firstname_lastname: data.settlement_account?.firstname_lastname || '',
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [user]);

  /* بعد از تأیید فروشنده، فیلدهای هویتی قفل می‌شوند و فقط حساب تسویه قابل ویرایش است */
  const identityLocked = isSellerIdentityLocked(seller);
  const isApproved = seller?.seller_approved_status === true;
  const isActive = String(seller?.seller_active_status || '').toUpperCase() === 'ACTIVE';

  const save = (event) => {
    event.preventDefault();

    if (!cardNumberValidator(form.card_number)) {
      return toast.error('شماره کارت ۱۶ رقمی معتبر نیست');
    }
    if (!shebaNumberValidator(form.sheba_number)) {
      return toast.error('شماره شبا معتبر نیست (IR + ۲۴ رقم)');
    }

    const payload = {
      settlement_account: {
        type: 'card',
        card_number: form.card_number.replace(/[\s-]/g, ''),
        sheba_number: form.sheba_number.toUpperCase().replace(/\s/g, ''),
        firstname_lastname: form.firstname_lastname.trim(),
      },
    };

    /* فیلدهای هویتی فقط وقتی ارسال می‌شوند که قفل نباشند */
    if (!identityLocked) {
      if (!nationalIDValidator(form.national_ID)) {
        return toast.error('کد ملی معتبر ۱۰ رقمی وارد کنید');
      }
      payload.seller_type = form.seller_type;
      payload.national_ID = form.national_ID;
      if (form.birth_date) payload.birth_date = form.birth_date;
      payload.address = {
        province: form.province.trim(),
        city: form.city.trim(),
        full_address: form.full_address.trim(),
      };
    }

    axios
      .put(`${API}/seller/${user._id}`, payload, authHeaders())
      .then(() => {
        toast.success(
          identityLocked
            ? 'حساب تسویه به‌روزرسانی شد'
            : 'مشخصات فروشندگی به‌روزرسانی شد و در انتظار تأیید مدیر است',
        );
        refreshUser();
      })
      .catch((err) => {
        const status = err.response?.status;
        toast.error(
          status === 403
            ? 'اطلاعات هویتی بعد از تأیید فروشنده قابل ویرایش نیست؛ فقط حساب تسویه قابل تغییر است.'
            : err.response?.data?.message || 'خطا در ذخیره تنظیمات',
        );
      });
  };

  if (loading) {
    return (
      <div className="py-16">
        <Loading label="در حال دریافت مشخصات فروشنده…" />
      </div>
    );
  }

  /* کاربر فروشنده نیست */
  if (!seller?.is_seller) {
    return (
      <div className="card rounded-3xl p-8 max-w-2xl text-center">
        <Store size={32} className="mx-auto text-yellow" />
        <h2 className="font-black text-lg mt-3">هنوز فروشنده نیستید</h2>
        <p className="text-xs muted leading-6 mt-2">
          برای دسترسی به تنظیمات فروشندگی، ابتدا درخواست فروشنده ثبت کنید و پس از تأیید مدیر،
          فروشگاه خود را بسازید.
        </p>
        <Link to="/profile" className="btn-yellow inline-flex mt-4">
          ثبت درخواست فروشندگی
        </Link>
      </div>
    );
  }

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const lockedInput = identityLocked ? 'input mt-1 opacity-60 cursor-not-allowed' : 'input mt-1';

  return (
    <form onSubmit={save} className="card rounded-3xl p-6 max-w-3xl space-y-4">
      {/* وضعیت فروشنده */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-black text-lg me-auto">تنظیمات فروشندگی</h2>
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
            isApproved ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
          }`}
        >
          {isApproved ? 'تأییدشده' : 'در انتظار تأیید'}
        </span>
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
            isActive ? 'bg-blue-500/15 text-blue-400' : 'bg-red-500/15 text-red-400'
          }`}
        >
          {isActive ? 'فعال' : 'غیرفعال'}
        </span>
        {isTrustedSeller(seller) && (
          <span className="chip !cursor-default !py-1 !px-2.5 text-[11px] flex items-center gap-1">
            <BadgeCheck size={12} className="text-yellow" />
            فروشنده مورد اعتماد
          </span>
        )}
      </div>

      {/* توضیح قفل هویت */}
      {identityLocked ? (
        <div
          className="rounded-2xl p-3.5 flex items-start gap-2 text-[11px] leading-6"
          style={{ background: 'rgba(255,214,10,0.1)', border: '1px solid rgba(255,214,10,0.3)' }}
        >
          <Lock size={15} className="mt-0.5 shrink-0 text-yellow" />
          <span>
            حساب شما تأیید شده است؛ بنابراین اطلاعات هویتی (نوع فروشنده، کد ملی، تاریخ تولد و نشانی)
            قفل شده‌اند. برای تغییر آن‌ها از طریق{' '}
            <Link to="/contact" className="font-bold text-yellow">
              پشتیبانی
            </Link>{' '}
            درخواست بدهید. فقط حساب تسویه قابل ویرایش است.
          </span>
        </div>
      ) : (
        <div className="text-[11px] muted leading-6 flex items-start gap-2">
          <Info size={14} className="mt-0.5 shrink-0 text-yellow" />
          پس از تأیید مدیر، اطلاعات هویتی قفل می‌شود و فقط حساب تسویه قابل ویرایش خواهد بود.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-xs muted">
          نوع فروشنده
          <select
            className={lockedInput}
            value={form.seller_type}
            onChange={set('seller_type')}
            disabled={identityLocked}
          >
            <option value="Individual_seller">فروشنده حقیقی</option>
            <option value="institutional_seller">فروشنده حقوقی</option>
          </select>
        </label>

        <label className="text-xs muted">
          کد ملی
          <input
            className={lockedInput}
            dir="ltr"
            value={form.national_ID}
            onChange={set('national_ID')}
            disabled={identityLocked}
            required={!identityLocked}
          />
        </label>

        <label className="text-xs muted">
          تاریخ تولد
          <input
            className={lockedInput}
            dir="ltr"
            placeholder="1372/04/15"
            value={form.birth_date}
            onChange={set('birth_date')}
            disabled={identityLocked}
          />
        </label>

        <label className="text-xs muted">
          استان
          <input
            className={lockedInput}
            value={form.province}
            onChange={set('province')}
            disabled={identityLocked}
          />
        </label>

        <label className="text-xs muted">
          شهر
          <input
            className={lockedInput}
            value={form.city}
            onChange={set('city')}
            disabled={identityLocked}
          />
        </label>

        <label className="text-xs muted sm:col-span-2">
          آدرس کامل
          <input
            className={lockedInput}
            value={form.full_address}
            onChange={set('full_address')}
            disabled={identityLocked}
          />
        </label>
      </div>

      {/* حساب تسویه — همیشه قابل ویرایش */}
      <div className="pt-1">
        <h3 className="font-black text-sm">حساب تسویه</h3>
        <p className="text-[11px] muted mt-1 mb-3">
          واریز مبلغ فروش به این حساب انجام می‌شود؛ همیشه قابل ویرایش است.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs muted">
            صاحب حساب تسویه
            <input
              className="input mt-1"
              value={form.firstname_lastname}
              onChange={set('firstname_lastname')}
              required
            />
          </label>
          <label className="text-xs muted">
            شماره کارت ۱۶ رقمی
            <input
              className="input mt-1"
              dir="ltr"
              value={form.card_number}
              onChange={set('card_number')}
              required
            />
          </label>
          <label className="text-xs muted sm:col-span-2">
            شماره شبا (IR...)
            <input
              className="input mt-1"
              dir="ltr"
              value={form.sheba_number}
              onChange={set('sheba_number')}
              required
            />
          </label>
        </div>
      </div>

      {seller?.seller_plan?.plan_id ? (
        <p className="text-[11px] muted">
          پلن فعال: <b dir="ltr">{toFa(String(seller.seller_plan.plan_id))}</b>
        </p>
      ) : null}

      <button type="submit" className="btn-yellow">
        ذخیره تنظیمات
      </button>
    </form>
  );
}

export default SettingPage;
