import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MapPin, Plus, Trash2, Pencil } from 'lucide-react';
import { useShop } from '../../../contexts/ShopContext';
import { authHeaders } from '../../../utils/helpers/storage';
import { toFa } from '../../../utils/helpers/format';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
const EMPTY = {
  full_name: '',
  province: '',
  city: '',
  neighborhood: '',
  full_address: '',
  building_number: '',
  unit: '',
  postal_code: '',
};

function AddressPage() {
  const { user } = useShop();
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const loadAddresses = useCallback(() => {
    if (!user) return;
    axios
      .get(`${API}/users/${user._id}/address`, authHeaders())
      .then((res) =>
        setAddresses(Array.isArray(res.data.body) ? res.data.body : res.data.body?.data || []),
      )
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <MapPin size={36} className="mx-auto muted mb-3" />
        <p className="muted mb-4">برای مدیریت نشانی‌ها وارد شوید</p>
        <Link to="/auth/pre" className="btn-yellow">
          ورود
        </Link>
      </div>
    );
  }

  const addAddress = (e) => {
    e.preventDefault();
    if (
      !form.full_name ||
      !form.province ||
      !form.city ||
      !form.neighborhood ||
      !form.full_address ||
      !form.building_number ||
      !form.unit ||
      !form.postal_code
    ) {
      return toast.error('لطفاً تمام فیلدهای آدرس را کامل وارد کنید');
    }
    axios
      .post(
        `${API}/users/${user._id}/address`,
        {
          address: {
            full_name: form.full_name,
            province: form.province,
            city: form.city,
            neighborhood: form.neighborhood,
            full_address: form.full_address,
            building_number: Number(form.building_number),
            unit: Number(form.unit),
            postal_code: form.postal_code,
            is_default: addresses.length === 0,
          },
        },
        authHeaders(),
      )
      .then(() => {
        toast.success('آدرس اضافه شد');
        setShowForm(false);
        setForm(EMPTY);
        loadAddresses();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'خطا در ثبت آدرس'));
  };

  const removeAddress = (id) => {
    axios
      .delete(`${API}/users/${user._id}/address/${id}`, authHeaders())
      .then(() => {
        toast.success('آدرس حذف شد');
        loadAddresses();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'خطا در حذف آدرس'));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-black text-2xl flex items-center gap-2">
          <MapPin size={22} className="text-yellow" /> نشانی‌های من ({toFa(addresses.length)})
        </h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-yellow !py-2 !px-4 text-xs flex items-center gap-1"
        >
          <Plus size={15} /> افزودن نشانی جدید
        </button>
      </div>

      {showForm && (
        <form onSubmit={addAddress} className="card rounded-3xl p-5 grid sm:grid-cols-2 gap-3">
          <input
            className="input sm:col-span-2"
            placeholder="نام و نام خانوادگی گیرنده"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <input
            className="input"
            placeholder="استان"
            value={form.province}
            onChange={(e) => setForm({ ...form, province: e.target.value })}
          />
          <input
            className="input"
            placeholder="شهر"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <input
            className="input"
            placeholder="محله"
            value={form.neighborhood}
            onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
          />
          <input
            className="input"
            dir="ltr"
            placeholder="کد پستی ۱۰ رقمی"
            value={form.postal_code}
            onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
          />
          <input
            className="input sm:col-span-2"
            placeholder="آدرس کامل"
            value={form.full_address}
            onChange={(e) => setForm({ ...form, full_address: e.target.value })}
          />
          <input
            className="input"
            type="number"
            placeholder="پلاک"
            value={form.building_number}
            onChange={(e) => setForm({ ...form, building_number: e.target.value })}
          />
          <input
            className="input"
            type="number"
            placeholder="واحد"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
          <button type="submit" className="btn-yellow sm:col-span-2">
            ذخیره نشانی
          </button>
        </form>
      )}

      <div className="space-y-3">
        {addresses.map((a) => {
          const ad = a.address || a;
          return (
            <div
              key={a._id}
              className="card rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap"
            >
              <div>
                <div className="font-black text-sm">
                  {ad.full_name || 'نشانی'} — {ad.province}، {ad.city}
                </div>
                <div className="text-xs muted mt-1">
                  {ad.neighborhood}، {ad.full_address} — پلاک {toFa(ad.building_number)}، واحد{' '}
                  {toFa(ad.unit)}
                </div>
                <div className="text-xs muted mt-0.5" dir="ltr">
                  کد پستی: {toFa(ad.postal_code)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/address/${a._id}`}
                  className="btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1"
                >
                  <Pencil size={13} /> ویرایش
                </Link>
                <button
                  type="button"
                  onClick={() => removeAddress(a._id)}
                  className="btn-ghost !p-2 text-red-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AddressPage;
