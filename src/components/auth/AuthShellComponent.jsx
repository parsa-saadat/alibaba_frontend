import LanguageSelector from '../common/locale/LanguageSelectorComponent';
import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import BrandLogoComponent from '../common/BrandLogoComponent';

/*
 * قاب مشترک صفحات ورود، کد تأیید و ثبت‌نام.
 * پس‌زمینه همان سرمه‌ای برند با هاله‌ی زرد است و فرم داخل یک کارت مرکزی (هماهنگ با تم روشن
 * و تاریک) می‌نشیند؛ هدر سنگین حذف شده و لوگوی واقعی سایت بالای کارت است.
 */
function AuthShellComponent({ title, subtitle, children, footer }) {
  return (
    <div
      className="relative isolate overflow-hidden"
      style={{
        minHeight: '100vh',
        display: 'grid',
        alignItems: 'center',
        background:
          'radial-gradient(circle at 15% 10%, rgba(255,106,0,0.16) 0%, rgba(255,106,0,0) 45%), radial-gradient(circle at 90% 90%, rgba(255,106,0,0.18) 0%, rgba(255,106,0,0) 50%), linear-gradient(135deg, var(--charcoal-mid) 0%, var(--charcoal-deep) 100%)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <div className="relative mx-auto flex w-full max-w-[440px] flex-col px-4 py-8 sm:py-12">
        <Link
          to="/"
          className="mb-5 inline-flex w-max items-center gap-1.5 text-[11px] text-white/70 transition hover:text-white"
        >
          <ArrowRight size={13} />
          {translateText('بازگشت به فروشگاه ')}
        </Link>

        <div className="card rounded-[28px] p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col items-center text-center">
            <BrandLogoComponent variant="full" size="md" />
            <div
              aria-hidden="true"
              className="my-5 h-px w-20"
              style={{
                background:
                  'linear-gradient(90deg, transparent, var(--primary-color), transparent)',
              }}
            />
            <h1 className="text-lg font-black sm:text-xl">{title}</h1>
            {subtitle && <p className="mt-2 text-xs leading-6 muted">{subtitle}</p>}
          </div>

          <LanguageSelector variant="auth" placement="card" />
          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-5 text-center text-sm text-white/75">{footer}</div>}
      </div>
    </div>
  );
}

export default AuthShellComponent;
