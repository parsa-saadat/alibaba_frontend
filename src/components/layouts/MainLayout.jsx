import { Outlet } from 'react-router-dom';
import NavbarComponent from '../main/NavbarComponent.jsx';
import FooterComponent from '../main/FooterComponent.jsx';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarComponent />
      <main className="flex-1 min-h-[70vh]">
        <Outlet />
      </main>
      <FooterComponent />
    </div>
  );
};

export default MainLayout;
