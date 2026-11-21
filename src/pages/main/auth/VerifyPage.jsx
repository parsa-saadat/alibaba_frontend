import { t as translateText } from '../../../i18n/runtime.js';
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import {
  validateAuthPhone,
  validateOtpSyntax,
} from '../../../utils/validators/phone.validator';
import { useShop } from '../../../contexts/ShopContext';
import { toFa } from '../../../utils/helpers/format';
import AuthShellComponent from '../../../components/auth/AuthShellComponent';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

function VerifyPage() {
  const navigate = useNavigate();
  const { login } = useShop();
  const urlParams = new URLSearchParams(window.location.search);
  const phone = urlParams.get('phone');
  const devCode = urlParams.get('code');
  const [code, setCode] = useState(devCode || '');

  function handleSubmit(e) {
    e.preventDefault();
    if (!validateAuthPhone(phone)) {
      toast.error(translateText("شماره موبایل نامعتبر است"));
      navigate('/auth/pre');
      return;
    }
    if (!validateOtpSyntax(code)) {
      toast.error(translateText("کد ۶ رقمی را وارد کنید"));
      return;
    }
    axios
      .post(`${API}/auth/login`, { phone, code })
      .then((res) => {
        const { token, user } = res.data.body;
        login(token, user);
        toast.success(translateText("خوش آمدید!"));
        navigate('/');
      })
      .catch((err) => toast.error(err.response?.data?.message || translateText("کد نامعتبر است")));
  }

  return (
    <AuthShellComponent
      title={translateText("کد تایید")}
      subtitle={<>{translateText("کد ۶ رقمی ارسال‌شده به ")}<span dir="ltr">{toFa(phone || '')}</span>{translateText(" را وارد کنید")}</>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <span className="text-sm font-bold flex items-center gap-1 mb-2">
            <KeyRound size={15} />{translateText(" کد ۶ رقمی ")}</span>
          <input className="input text-center tracking-[.5em] text-xl font-black" dir="ltr" maxLength={6}
            placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
          {devCode && (
            <div className="text-xs mt-2 p-2 rounded-lg text-center bg-navy text-brand-yellow">{translateText("حالت توسعه — کد شما: ")}<b dir="ltr">{toFa(devCode)}</b>
            </div>
          )}
        </div>
        <button type="submit" className="btn-yellow w-full">{translateText("ورود")}</button>
        <Link to="/auth/pre" className="block text-center text-sm muted">{translateText("تغییر شماره موبایل")}</Link>
      </form>
    </AuthShellComponent>
  );
}

export default VerifyPage;
