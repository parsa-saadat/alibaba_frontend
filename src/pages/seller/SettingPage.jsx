import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useShop } from '../../contexts/ShopContext';
import { authHeaders } from '../../utils/helpers/storage';
import { Loading } from '../../components/ScroolToTopComponent';
import { nationalIDValidator } from '../../utils/validators/national_id.validator';
import { cardNumberValidator } from '../../utils/validators/card_number.validator';
import { shebaNumberValidator } from '../../utils/validators/sheba_number.validator';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

function SettingPage() {
  const { user, refreshUser } = useShop();
  const [loading, setLoading] = useState(true);
  const [sellerForm, setSellerForm] = useState({
    seller_type: 'Individual_seller',
    national_ID: '',
    birth_date: '',
    province: '',
    city: '',
    full_address: '',
    card_number: '',
    sheba_number: '',
    firstname_lastname: '',
  });

  useEffect(() => {
    if (!user) return setLoading(false);
    axios
      .get(`${API}/seller/${user._id}`, authHeaders())
      .then((res) => {
        const sel = res.data.body;
        if (sel) {
          setSellerForm({
            seller_type: sel.seller_type || 'Individual_seller',
            national_ID: sel.national_ID || '',
            birth_date: sel.birth_date || '',
            province: sel.address?.province || '',
            city: sel.address?.city || '',
            full_address: sel.address?.full_address || '',
            card_number: sel.settlement_account?.card_number || '',
            sheba_number: sel.settlement_account?.sheba_number || '',
            firstname_lastname: sel.settlement_account?.firstname_lastname || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const saveSellerSettings = (e) => {
    e.preventDefault();
    if (!nationalIDValidator(sellerForm.national_ID)) {
      return toast.error('کد ملی معتبر ۱۰ رقمی وارد کنید');
    }
    if (!cardNumberValidator(sellerForm.card_number)) {
      return toast.error('شماره کارت ۱۶ رقمی معتبر نیست');
    }
    if (!shebaNumberValidator(sellerForm.sheba_number)) {
      return toast.error('شماره شبا معتبر نیست (IR + ۲۴ رقم)');
    }
    axios
      .put(
        `${API}/seller/${user._id}`,
        {
          seller_type: sellerForm.seller_type,
          national_ID: sellerForm.national_ID,
          birth_date: sellerForm.birth_date || undefined,
          address: {
            province: sellerForm.province,
            city: sellerForm.city,
            full_address: sellerForm.full_address,
          },
          settlement_account: {
            card_number: sellerForm.card_number.replace(/[\s-]/g, ''),
            sheba_number: sellerForm.sheba_number.toUpperCase().replace(/\s/g, ''),
            firstname_lastname: sellerForm.firstname_lastname,
          },
        },
        authHeaders(),
      )
      .then(() => {
        toast.success('مشخصات فروشندگی بروزرسانی شد');
        refreshUser();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'خطا در ذخیره تنظیمات'));
  };

  if (loading) {
    return (
      <div className="py-16">
        <Loading label="در حال دریافت مشخصات فروشنده…" />
      </div>
    );
  }

  return (
    <form onSubmit={saveSellerSettings} className="card rounded-3xl p-6 max-w-3xl space-y-4">
      <h2 className="font-black text-lg">تنظیمات و حساب تسویه فروشنده</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-xs muted">
          نوع فروشنده
          <select
            className="input mt-1"
            value={sellerForm.seller_type}
            onChange={(e) => setSellerForm({ ...sellerForm, seller_type: e.target.value })}
          >
            <option value="Individual_seller">فروشنده حقیقی</option>
            <option value="institutional_seller">فروشنده حقوقی</option>
          </select>
        </label>
        <label className="text-xs muted">
          کد ملی
          <input
            className="input mt-1"
            dir="ltr"
            value={sellerForm.national_ID}
            onChange={(e) => setSellerForm({ ...sellerForm, national_ID: e.target.value })}
            required
          />
        </label>
        <label className="text-xs muted">
          صاحب حساب تسویه
          <input
            className="input mt-1"
            value={sellerForm.firstname_lastname}
            onChange={(e) =>
              setSellerForm({ ...sellerForm, firstname_lastname: e.target.value })
            }
            required
          />
        </label>
        <label className="text-xs muted">
          شماره کارت ۱۶ رقمی
          <input
            className="input mt-1"
            dir="ltr"
            value={sellerForm.card_number}
            onChange={(e) => setSellerForm({ ...sellerForm, card_number: e.target.value })}
            required
          />
        </label>
        <label className="text-xs muted sm:col-span-2">
          شماره شبا (IR...)
          <input
            className="input mt-1"
            dir="ltr"
            value={sellerForm.sheba_number}
            onChange={(e) => setSellerForm({ ...sellerForm, sheba_number: e.target.value })}
            required
          />
        </label>
        <label className="text-xs muted">
          استان
          <input
            className="input mt-1"
            value={sellerForm.province}
            onChange={(e) => setSellerForm({ ...sellerForm, province: e.target.value })}
          />
        </label>
        <label className="text-xs muted">
          شهر
          <input
            className="input mt-1"
            value={sellerForm.city}
            onChange={(e) => setSellerForm({ ...sellerForm, city: e.target.value })}
          />
        </label>
        <label className="text-xs muted sm:col-span-2">
          آدرس کامل
          <input
            className="input mt-1"
            value={sellerForm.full_address}
            onChange={(e) => setSellerForm({ ...sellerForm, full_address: e.target.value })}
          />
        </label>
      </div>
      <button type="submit" className="btn-yellow">
        ذخیره مشخصات فروشنده
      </button>
    </form>
  );
}

export default SettingPage;
