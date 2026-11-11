import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MapPin, ArrowRight } from 'lucide-react';
import { useShop } from '../../../contexts/ShopContext';
import { authHeaders } from '../../../utils/helpers/storage';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

function EditAddressPage() {
  const { addressId } = useParams();
  const navigate = useNavigate();
  const { user } = useShop();
  const [form, setForm] = useState({
    full_name: '',
    province: '',
    city: '',
    neighborhood: '',
    full_address: '',
    building_number: '',
    unit: '',
    postal_code: '',
  });

  useEffect(() => {
    if (!user) return;
    axios
      .get(`${API}/users/${user._id}/address`, authHeaders())
      .then((res) => {
        const list = Array.isArray(res.data.body) ? res.data.body : res.data.body?.data || [];
        const found = list.find((a) => a._id === addressId);
        if (found) {
          const ad = found.address || found;
          setForm({
            full_name: ad.full_name || '',
            province: ad.province || '',
            city: ad.city || '',
            neighborhood: ad.neighborhood || '',
            full_address: ad.full_address || '',
            building_number: ad.building_number || '',
            unit: ad.unit || '',
            postal_code: ad.postal_code || '',
          });
        }
      })
      .catch(() => {});
  }, [user, addressId]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!user) return;
    axios
      .put(
        `${API}/users/${user._id}/address/${addressId}`,
        {
          address: {
            ...form,
            building_number: Number(form.building_number),
            unit: Number(form.unit),
          },
        },
        authHeaders(),
      )
      .then(() => {
        toast.success('نشانی بروزرسانی شد');
        navigate('/address');
      })
      .catch((err) => toast.error(err.response?.data?.message || 'خطا در ویرایش نشانی'));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate('/address')}
          className="btn-ghost !p-2"
        >
          <ArrowRight size={17} />
        </button>
        <h1 className="font-black text-xl flex items-center gap-2">
          <MapPin size={20} className="text-yellow" /> ویرایش نشانی
        </h1>
      </div>

      <form onSubmit={handleSave} className="card rounded-3xl p-6 grid sm:grid-cols-2 gap-3">
        <input
          className="input sm:col-span-2"
          placeholder="نام و نام خانوادگی گیرنده"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="استان"
          value={form.province}
          onChange={(e) => setForm({ ...form, province: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="شهر"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="محله"
          value={form.neighborhood}
          onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
          required
        />
        <input
          className="input"
          dir="ltr"
          placeholder="کد پستی ۱۰ رقمی"
          value={form.postal_code}
          onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
          required
        />
        <input
          className="input sm:col-span-2"
          placeholder="آدرس کامل"
          value={form.full_address}
          onChange={(e) => setForm({ ...form, full_address: e.target.value })}
          required
        />
        <input
          className="input"
          type="number"
          placeholder="پلاک"
          value={form.building_number}
          onChange={(e) => setForm({ ...form, building_number: e.target.value })}
          required
        />
        <input
          className="input"
          type="number"
          placeholder="واحد"
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          required
        />
        <button type="submit" className="btn-yellow sm:col-span-2 mt-2">
          ذخیره تغییرات
        </button>
      </form>
    </div>
  );
}

export default EditAddressPage;
