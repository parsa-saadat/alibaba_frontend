import { t as translateText } from '../../../i18n/runtime.js';
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Smartphone, ArrowLeft } from 'lucide-react';
import { normalizePhoneNumber, validateAuthPhone } from '../../../utils/validators/phone.validator';
import AuthShellComponent from '../../../components/auth/AuthShellComponent';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

function PrePage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    /* هم ۰۹۱۲... و هم +98912... پذیرفته می‌شود و به شکل استاندارد +98 فرستاده می‌شود */
    const normalized = normalizePhoneNumber(phone);
    if (!validateAuthPhone(phone)) {
      toast.error(translateText("شماره موبایل معتبر نیست"));
      return;
    }
    axios
      .post(`${API}/auth/pre`, { phone: normalized })
      .then((res) => {
        if (res.data.success) {
          toast.success(translateText("کد تایید ارسال شد"));
          const dev = res.data.body ? `&code=${res.data.body}` : '';
          navigate(`/auth/verify?phone=${encodeURIComponent(normalized)}${dev}`);
        } else {
          toast.error(res.data.message || translateText("خطا در ارسال کد"));
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || translateText("ارتباط با سرور برقرار نشد")));
  };

  return (
    <AuthShellComponent
      title={translateText("ورود به حساب کاربری")}
      subtitle={translateText("ورود با شماره موبایل و کد تایید یک‌بارمصرف")}
      footer={
        <>{translateText("حساب ندارید؟")}{' '}
          <Link to="/auth/register" className="font-bold text-yellow">{translateText("ثبت‌نام کنید")}</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <span className="text-sm font-bold flex items-center gap-1 mb-2">
            <Smartphone size={15} />{translateText(" شماره موبایل ")}</span>
          <input className="input" dir="ltr" type="tel" placeholder="0912xxxxxxx" value={phone}
            onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <button type="submit" className="btn-yellow w-full flex items-center justify-center gap-2">{translateText("ارسال کد تایید ")}<ArrowLeft size={16} />
        </button>
      </form>
    </AuthShellComponent>
  );
}

export default PrePage;
