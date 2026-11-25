import PromoBanner from '../home/PromoBannerComponent';
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import NavbarComponent from './NavbarComponent';
import FooterComponent from './FooterComponent';
import MobileBottomNavComponent from './MobileBottomNavComponent';
import ChatDockComponent from '../chat/ChatDockComponent';

const MainLayout = () => {
  const { pathname } = useLocation();
  const [atTop, setAtTop] = useState(window.scrollY < 32);
  useEffect(() => {
    const update = () => setAtTop(window.scrollY < 32);
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [pathname]);

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
    <div className={`main-site-layout min-h-screen flex flex-col pb-14 lg:pb-0 ${pathname === '/' && atTop ? 'home-ambient-active' : ''}`}>
      {pathname === '/' && atTop && <div className="home-ambient-light" aria-hidden="true"><div /></div>}
      {pathname === '/' && <PromoBanner />}
      <NavbarComponent />
      <main className="flex-1 min-h-[70vh]">
        <Outlet />
      </main>
      <FooterComponent />
      <MobileBottomNavComponent />
      <ChatDockComponent />
    </div>
  );
};

export default MainLayout;
