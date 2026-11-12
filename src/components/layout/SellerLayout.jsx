import { Outlet, Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import SellerNavbarComponent from '../panel/SellerNavbarComponent';
import { useShop } from '../../contexts/ShopContext';

const SellerLayout = () => {
  const { user } = useShop();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <Store size={38} className="mx-auto text-yellow" />
          <h1 className="font-black text-xl">ورود به پنل فروشندگان</h1>
          <Link to="/auth/pre" className="btn-yellow inline-block">
            ورود به حساب
          </Link>
        </div>
      </div>
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
