import LanguageSelector from '../common/locale/LanguageSelectorComponent';
import { direction as i18nDirection } from '../../i18n/runtime';
import { t as translateText } from '../../i18n/runtime.js';
import { Outlet, Link } from 'react-router-dom';
import { Clock3, ShieldAlert, Store } from 'lucide-react';
import SellerNavbarComponent from '../panel/SellerNavbarComponent';
import { useShop } from '../../contexts/ShopContext';

/* کارت پیام تمام‌صفحه برای حالت‌هایی که کاربر اجازه‌ی ورود به پنل فروشنده را ندارد */
function GateCard({ icon: Icon, title, text, actions }) {
  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center p-6">
      <LanguageSelector variant="seller" />
      <div className="card rounded-3xl p-8 max-w-md w-full text-center space-y-4">
        <Icon size={38} className="mx-auto text-accent" />
        <h1 className="font-black text-xl">{title}</h1>
        {text && <p className="text-sm muted leading-6">{text}</p>}
        <div className="flex flex-wrap items-center justify-center gap-2">{actions}</div>
      </div>
    </div>
  );
}

const SellerLayout = () => {
  const { user } = useShop();

  if (!user) {
    return (
      <GateCard
        icon={Store}
        title={translateText('ورود به پنل فروشندگان')}
        actions={
          <Link to="/auth/pre" className="btn-primary inline-block">
            {translateText('ورود به حساب ')}
          </Link>
        }
      />
    );
  }

  const isAdmin = String(user.role || '').toLowerCase() === 'admin';
  const isSeller = user.is_seller === true || String(user.role || '').toLowerCase() === 'seller';

  /* کاربر عادی: فقط راهنمایی به فرم درخواست فروشندگی در پروفایل (مدیر مثل قبل اجازه‌ی ورود دارد) */
  if (!isSeller && !isAdmin) {
    return (
      <GateCard
        icon={ShieldAlert}
        title={translateText('این بخش مخصوص فروشندگان است')}
        text={translateText(
          'حساب شما هنوز فروشنده نیست. برای شروع فروش، درخواست فروشندگی را از صفحه‌ی پروفایل ثبت کنید.',
        )}
        actions={
          <>
            <Link to="/profile" className="btn-primary inline-block">
              {translateText('ثبت درخواست فروشندگی ')}
            </Link>
            <Link to="/" className="btn-ghost inline-block">
              {translateText('صفحه‌ی اصلی ')}
            </Link>
          </>
        }
      />
    );
  }

  /* درخواست ثبت شده ولی هنوز توسط مدیر تأیید نشده */
  if (!isAdmin && user.seller_approved_status === false) {
    return (
      <GateCard
        icon={Clock3}
        title={translateText('درخواست فروشندگی در انتظار تأیید است')}
        text={translateText(
          'درخواست شما ثبت شده و پس از بررسی و تأیید مدیر، پنل فروشنده برایتان باز می‌شود. بعد از تأیید یک‌بار خارج و دوباره وارد شوید.',
        )}
        actions={
          <>
            <Link to="/profile" className="btn-primary inline-block">
              {translateText('مشاهده پروفایل ')}
            </Link>
            <Link to="/" className="btn-ghost inline-block">
              {translateText('صفحه‌ی اصلی ')}
            </Link>
          </>
        }
      />
    );
  }

  return (
    <div dir={i18nDirection} className="admin-wrapper min-h-screen flex flex-col lg:flex-row">
      <SellerNavbarComponent />
      <div className="flex-1 p-4 md:p-6 text-sm min-w-0">
        <Outlet />
      </div>
    </div>
  );
};

export default SellerLayout;
