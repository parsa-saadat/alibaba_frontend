import { Outlet, useLocation } from 'react-router-dom';
import NavbarComponent from './NavbarComponent';
import FooterComponent from './FooterComponent';
import MobileBottomNavComponent from './MobileBottomNavComponent';

const MainLayout = () => {
  const { pathname } = useLocation();

  /* صفحه‌های ورود/ثبت‌نام: بدون هدر و فوتر سنگین سایت، فقط کارت فرم روی پس‌زمینه‌ی برند */
  if (pathname.startsWith('/auth/')) {
    return (
      <main className="min-h-screen">
        <Outlet />
      </main>
    );
  }

  return (
    /* pb برای نوار پایین موبایل (مثل اپ علی‌بابا) تا فوتر زیر آن گم نشود */
    <div className="min-h-screen flex flex-col pb-14 lg:pb-0">
      <NavbarComponent />
      <main className="flex-1 min-h-[70vh]">
        <Outlet />
      </main>
      <FooterComponent />
      <MobileBottomNavComponent />
    </div>
  );
};

export default MainLayout;
