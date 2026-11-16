import { Outlet, Link } from 'react-router-dom';
import { Clock3, ShieldAlert, Store } from 'lucide-react';
import SellerNavbarComponent from '../panel/SellerNavbarComponent';
import { useShop } from '../../contexts/ShopContext';

/* کارت پیام تمام‌صفحه برای حالت‌هایی که کاربر اجازه‌ی ورود به پنل فروشنده را ندارد */
function GateCard({ icon: Icon, title, text, actions }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card rounded-3xl p-8 max-w-md w-full text-center space-y-4">
        <Icon size={38} className="mx-auto text-yellow" />
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
        title="ورود به پنل فروشندگان"
        actions={
          <Link to="/auth/pre" className="btn-yellow inline-block">
            ورود به حساب
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
        title="این بخش مخصوص فروشندگان است"
        text={
          'حساب شما هنوز فروشنده نیست. برای شروع فروش، درخواست فروشندگی را از صفحه‌ی پروفایل ثبت کنید.'
        }
        actions={
          <>
            <Link to="/profile" className="btn-yellow inline-block">
              ثبت درخواست فروشندگی
            </Link>
            <Link to="/" className="btn-ghost inline-block">
              صفحه‌ی اصلی
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
        title="درخواست فروشندگی در انتظار تأیید است"
        text="درخواست شما ثبت شده و پس از بررسی و تأیید مدیر، پنل فروشنده برایتان باز می‌شود. بعد از تأیید یک‌بار خارج و دوباره وارد شوید."
        actions={
          <>
            <Link to="/profile" className="btn-yellow inline-block">
              مشاهده پروفایل
            </Link>
            <Link to="/" className="btn-ghost inline-block">
              صفحه‌ی اصلی
            </Link>
          </>
        }
      />
    );
  }

  return (
    <div dir="rtl" className="admin-wrapper min-h-screen flex flex-col lg:flex-row">
      <SellerNavbarComponent />
      <div className="flex-1 p-4 md:p-6 text-sm min-w-0">
        <Outlet />
      </div>
    </div>
  );
};

export default SellerLayout;
