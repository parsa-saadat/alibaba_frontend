import { Outlet, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
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
