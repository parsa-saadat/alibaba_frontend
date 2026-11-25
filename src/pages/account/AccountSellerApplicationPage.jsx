import React, { useState } from 'react';
import axios from 'axios';
import { Link, Navigate } from 'react-router-dom';
import { Store, UserRound, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useShop } from '../../contexts/ShopContext';
import { API } from '../../config/api';
import { authHeaders } from '../../utils/helpers/storage';
import { normalizePhoneNumber, validateAuthPhone } from '../../utils/validators/phone.validator';
import { t } from '../../i18n/runtime';

export default function AccountSellerApplicationPage() {
  const { user, syncSession } = useShop();
  const [form, setForm] = useState({ firstname: user?.firstname || '', lastname: user?.lastname || '', phone: user?.seller_contact_phone || user?.phone || '' });
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const role = String(user?.role || '').toLowerCase();
  const admin = ['admin','root'].includes(role);
  const seller = user?.is_seller === true || role === 'seller';
  if (!submitted && (admin || seller)) return <Navigate to={admin ? '/admin' : '/seller'} replace />;
  const submit = async event => {
    event.preventDefault();
    if (busy || submitted || admin || seller) return;
    const next = {};
    if (!form.firstname.trim() || form.firstname.trim().length > 80) next.firstname = t('seller.applicationNameError');
    if (!form.lastname.trim() || form.lastname.trim().length > 80) next.lastname = t('seller.applicationNameError');
    if (!validateAuthPhone(form.phone)) next.phone = t('seller.applicationPhoneError');
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await axios.post(`${API}/seller`, { firstname: form.firstname.trim(), lastname: form.lastname.trim(), phone: normalizePhoneNumber(form.phone) }, authHeaders());
      setSubmitted(true);
      toast.success(t('درخواست فروشندگی ثبت شد و در انتظار تأیید مدیر است'));
      await syncSession();
    } catch(error) { toast.error(error.response?.data?.message || t('خطا در ثبت درخواست')); }
    finally { setBusy(false); }
  };
  return <div className="account-page seller-application-page">
    <header className="account-page-head"><h1>{t('account.becomeSeller')}</h1></header>
    {submitted ? <section className="seller-application-success card"><CheckCircle2 size={40} /><h2>{t('درخواست فروشندگی ثبت شد و در انتظار تأیید مدیر است')}</h2><p>{t('seller.pendingHint')}</p><Link className="btn-primary inline-flex" to="/seller/settings">{t('account.settings')}</Link></section> : <section className="seller-application-layout card">
      <aside className="seller-application-intro"><span className="seller-application-mark"><Store size={28} /></span><h2>{t(' درخواست فروشندگی در ژئوکالا ')}</h2><p>{t('seller.applicationHint')}</p><div className="seller-application-note"><UserRound size={18} /><span>{t('application.contactOnly')}</span></div></aside>
      <form onSubmit={submit} className="seller-application-form" noValidate>
        <h2>{t('application.contactDetails')}</h2><p className="muted">{t('application.reviewNote')}</p>
        <div className="seller-application-fields">{[['firstname','نام ','given-name'],['lastname','نام خانوادگی ','family-name'],['phone','تلفن تماس','tel']].map(([field,label,complete]) => <label key={field} className={field==='phone'?'application-phone':''}><span>{field==='phone'?<Phone size={15}/>:<UserRound size={15}/>}{t(label)}</span><input required className="input" name={field} maxLength={field === 'phone' ? 20 : 80} type={field === 'phone' ? 'tel' : 'text'} autoComplete={complete} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field]?`application-${field}-error`:undefined} dir={field === 'phone' ? 'ltr' : undefined} value={form[field]} onChange={event => { setForm(prev => ({...prev, [field]: event.target.value})); setErrors(prev => ({...prev,[field]:''})); }} />{errors[field] && <small id={`application-${field}-error`} role="alert">{errors[field]}</small>}</label>)}</div>
        <button type="submit" disabled={busy} className="btn-primary application-submit">{t(busy ? 'در حال ارسال…' : 'ارسال درخواست فروشندگی')}<ArrowRight size={17} className="logical-icon" /></button>
      </form>
    </section>}
  </div>;
}
