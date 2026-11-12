import { Outlet, Link } from 'react-router-dom';
import { ShieldAlert, Store } from 'lucide-react';
import DashboardNavbarComponent from '../panel/DahboardNavbarComponent';
import { useShop } from '../../contexts/ShopContext';

const DashboardLayout = () => {
  const { user } = useShop();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <ShieldAlert size={38} className="mx-auto text-yellow" />
          <h1 className="font-black text-xl">ورود به پنل مدیریت</h1>
          <Link to="/auth/pre" className="btn-yellow inline-block">
            ورود به حساب
          </Link>
        </div>
      </div>
    );
  }

  /*
   * گارد نقش: قبلاً هر کاربر لاگین‌شده می‌توانست وارد /dashboard شود و بک‌اند
   * همه‌ی روت‌های ادمین را ۴۰۳ می‌داد (پیام «Insufficient Permissions»).
   * حالا کاربر غیرادمین به‌جای صفحه‌ی خطازده، پیام روشن می‌بیند و به پنل خودش می‌رود.
   */
  if (String(user.role || '').toLowerCase() !== 'admin') {
    const isSeller = user.is_seller === true || String(user.role || '') === 'seller';

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <ShieldAlert size={38} className="mx-auto text-yellow" />
          <h1 className="font-black text-xl">این بخش مخصوص مدیر است</h1>
          <p className="text-sm muted leading-6">
            حساب فعلی شما نقش «{user.role || 'کاربر'}» دارد و دسترسی به پنل مدیریت ندارد.
            با حساب ادمین وارد شوید یا به پنل خودتان بروید.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link to="/auth/pre" className="btn-yellow inline-flex items-center gap-1.5">
              ورود با حساب ادمین
            </Link>
            <Link
              to={isSeller ? '/seller' : '/'}
              className="btn-ghost inline-flex items-center gap-1.5"
            >
              <Store size={15} />
              {isSeller ? 'پنل فروشندگی' : 'صفحه‌ی اصلی'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="admin-wrapper min-h-screen flex flex-col lg:flex-row">
      <DashboardNavbarComponent />
      <div className="flex-1 p-4 md:p-6 text-sm min-w-0">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
