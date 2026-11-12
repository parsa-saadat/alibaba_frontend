import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { validateEmailSyntax } from '../../utils/validators/email.validator';

const EMPTY = { name: '', email: '', phone: '', subject: 'پشتیبانی خرید', message: '' };

const SUBJECTS = [
  'پشتیبانی خرید',
  'پشتیبانی فروشندگان',
  'همکاری و تبلیغات',
  'پیگیری سفارش',
  'پیشنهاد و انتقاد',
  'سایر موارد',
];

function ContactFormComponent() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const change = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  // اعتبارسنجی سمت کاربر پیش از ارسال
  const validate = () => {
    const next = {};
    if (form.name.trim().length < 3) next.name = 'نام و نام خانوادگی را کامل وارد کنید.';
    if (!form.email.trim()) next.email = 'ایمیل الزامی است.';
    else if (!validateEmailSyntax(form.email.trim())) next.email = 'قالب ایمیل درست نیست.';
    if (form.phone && !/^0?9\d{9}$/.test(form.phone.replace(/[^\d]/g, ''))) {
      next.phone = 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.';
    }
    if (form.message.trim().length < 10) next.message = 'متن پیام باید حداقل ۱۰ کاراکتر باشد.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      toast.error('لطفاً خطاهای فرم را برطرف کنید.');
      return;
    }
    setSending(true);
    try {
      // در نسخه دمو، پیام فقط در سمت کاربر شبیه‌سازی می‌شود
      await new Promise((resolve) => setTimeout(resolve, 900));
      setSent(true);
      setForm(EMPTY);
      toast.success('پیام شما ثبت شد؛ کارشناسان تا ۲۴ ساعت پاسخ می‌دهند.');
    } catch {
      toast.error('ارسال پیام ناموفق بود، دوباره تلاش کنید.');
    } finally {
      setSending(false);
    }
  };

  // پس از ارسال موفق
  if (sent) {
    return (
      <div className="card rounded-3xl p-8 text-center">
        <span
          className="w-14 h-14 rounded-2xl grid place-items-center mx-auto"
          style={{ background: 'rgba(34,197,94,0.14)', color: '#22c55e' }}
        >
          <CheckCircle2 size={28} />
        </span>
        <h3 className="font-black text-lg mt-4">پیام شما ثبت شد</h3>
        <p className="text-sm muted mt-2 leading-6">
          شماره پیگیری پیام شما در ایمیل‌تان ارسال می‌شود. میانگین زمان پاسخ‌دهی ما کمتر از ۲۴ ساعت
          کاری است.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="btn-yellow mt-5 inline-flex items-center gap-2"
        >
          <Send size={16} />
          ارسال پیام جدید
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card rounded-3xl p-5 sm:p-7" noValidate>
      <h2 className="font-black text-xl">فرم تماس</h2>
      <p className="text-xs muted mt-1 mb-5">فرم زیر را کامل کنید؛ همه فیلدهای ستاره‌دار الزامی‌اند.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-bold mb-1.5 block">
            نام و نام خانوادگی <span className="text-yellow">*</span>
          </span>
          <input
            className="input"
            placeholder="مثل: سارا محمدی"
            value={form.name}
            onChange={change('name')}
            style={errors.name ? { borderColor: '#ef4444' } : undefined}
          />
          {errors.name ? <span className="text-[11px] mt-1 block" style={{ color: '#ef4444' }}>{errors.name}</span> : null}
        </label>

        <label className="block">
          <span className="text-xs font-bold mb-1.5 block">
            ایمیل <span className="text-yellow">*</span>
          </span>
          <input
            className="input"
            dir="ltr"
            placeholder="name@example.com"
            value={form.email}
            onChange={change('email')}
            style={errors.email ? { borderColor: '#ef4444' } : undefined}
          />
          {errors.email ? <span className="text-[11px] mt-1 block" style={{ color: '#ef4444' }}>{errors.email}</span> : null}
        </label>

        <label className="block">
          <span className="text-xs font-bold mb-1.5 block">شماره موبایل (اختیاری)</span>
          <input
            className="input"
            dir="ltr"
            inputMode="numeric"
            placeholder="09120000000"
            value={form.phone}
            onChange={change('phone')}
            style={errors.phone ? { borderColor: '#ef4444' } : undefined}
          />
          {errors.phone ? <span className="text-[11px] mt-1 block" style={{ color: '#ef4444' }}>{errors.phone}</span> : null}
        </label>

        <label className="block">
          <span className="text-xs font-bold mb-1.5 block">موضوع</span>
          <select className="input" value={form.subject} onChange={change('subject')}>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="text-xs font-bold mb-1.5 block">
            متن پیام <span className="text-yellow">*</span>
          </span>
          <textarea
            className="input resize-y"
            rows={6}
            placeholder="مشکل یا درخواست خود را با جزئیات بنویسید…"
            value={form.message}
            onChange={change('message')}
            style={errors.message ? { borderColor: '#ef4444' } : undefined}
          />
          <div className="flex items-center justify-between mt-1">
            {errors.message ? (
              <span className="text-[11px]" style={{ color: '#ef4444' }}>{errors.message}</span>
            ) : (
              <span className="text-[11px] muted">هرچه دقیق‌تر بنویسید، سریع‌تر پاسخ می‌گیرید.</span>
            )}
            <span className="text-[11px] muted">{form.message.length} کاراکتر</span>
          </div>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
        <span className="text-[11px] muted leading-5">
          با ارسال این فرم، قوانین حریم خصوصی علی‌بازار را می‌پذیرید.
        </span>
        <button type="submit" className="btn-yellow inline-flex items-center gap-2" disabled={sending}>
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {sending ? 'در حال ارسال…' : 'ارسال پیام'}
        </button>
      </div>
    </form>
  );
}

export default ContactFormComponent;
