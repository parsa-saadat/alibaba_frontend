import { Routes, Route } from 'react-router-dom';
import { Bounce, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import HomePage from './pages/main/HomePage';
import ShopPage from './pages/main/ShopPage';
import AboutPage from './pages/main/AboutPage';
import ContactPage from './pages/main/ContactPage';
import CartPage from './pages/main/CartPage';
import FavoritesPage from './pages/main/FavoritesPage';
import ComparePage from './pages/main/ComparePage';
import ProductPage from './pages/main/ProductPage';
import StorePage from './pages/main/StorePage';
import ProfilePage from './pages/main/ProfilePage';
import AddressPage from './pages/main/address/AddressPage';
import EditAddressPage from './pages/main/address/EditAddressPage';
import PrePage from './pages/main/auth/PrePage';
import VerifyPage from './pages/main/auth/VerifyPage';
import RegisterPage from './pages/main/auth/RegisterPage';
import CreateOrderPage from './pages/main/order/CreateOrderPage';
import OrdersPage from './pages/main/order/OrdersPage';
import SingleOrderPage from './pages/main/order/SingleOrderPage';

// Admin Dashboard Pages
import CounterPage from './pages/dashboard/CounterPage';
import SellersPage from './pages/dashboard/SellersPage';
import UsersPage from './pages/dashboard/UsersPage';
import StoresPage from './pages/dashboard/StoresPage';
import ProductsPage from './pages/dashboard/ProductsPage';
import CreateProductPage from './pages/dashboard/CreateProductPage';
import EditProductPage from './pages/dashboard/EditProductPage';
import CategoriesPage from './pages/dashboard/CategoriesPage';
import AdminOrdersPage from './pages/dashboard/OrdersPage';
import PlansPage from './pages/dashboard/PlansPage';
import PreAdminPage from './pages/authAdmin/PreAdminPage';
import VerifyAdminPage from './pages/authAdmin/VerifyAdminPage';

// Seller Dashboard Pages
import SellerCounterPage from './pages/seller/CounterPage';
import SellerProductsPage from './pages/seller/ProductsPage';
import SellerCreateProductPage from './pages/seller/CreateProductPage';
import SellerEditProductPage from './pages/seller/EditProductPage';
import SellerStoresPage from './pages/seller/StoresPage';
import SellerOrdersPage from './pages/seller/OrdersPage';
import SellerPlansPage from './pages/seller/PlansPage';
import SellerSettingPage from './pages/seller/SettingPage';

// Layouts
import MainLayout from './components/layout/MainLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import SellerLayout from './components/layout/SellerLayout';
import AuthLayout from './components/layout/AuthAdminLayout';

// Context & Shared
import { ShopProvider } from './contexts/ShopContext';
import NotFoundPage from './pages/NotFoundPage';
import ScrollToTopComponent, { RouteProgress } from './components/common/ScroolToTopComponent';

const App = () => {
  return (
    <ShopProvider>
      <MainApp />
    </ShopProvider>
  );
};

const MainApp = () => {
  return (
    <>
      <ToastContainer
        position="bottom-left"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Bounce}
      />
      <ScrollToTopComponent />
      <RouteProgress />
      <Routes>
        {/* Main Layout Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ShopPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/address" element={<AddressPage />} />
          <Route path="/address/:addressId" element={<EditAddressPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/store/:id" element={<StorePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/auth/pre" element={<PrePage />} />
          <Route path="/auth/verify" element={<VerifyPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/checkout" element={<CreateOrderPage />} />
          <Route path="/order/create" element={<CreateOrderPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/order" element={<OrdersPage />} />
          <Route path="/orders/:orderId" element={<SingleOrderPage />} />
          <Route path="/order/:orderId" element={<SingleOrderPage />} />
        </Route>

        {/* Admin Dashboard Routes (/dashboard & /admin) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<CounterPage />} />
          <Route path="sellers" element={<SellersPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/create" element={<CreateProductPage />} />
          <Route path="products/:productId" element={<EditProductPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="plans" element={<PlansPage />} />
        </Route>

        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<CounterPage />} />
          <Route path="sellers" element={<SellersPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/create" element={<CreateProductPage />} />
          <Route path="products/:productId" element={<EditProductPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="plans" element={<PlansPage />} />
        </Route>

        {/* Seller Dashboard Routes */}
        <Route path="/seller" element={<SellerLayout />}>
          <Route index element={<SellerCounterPage />} />
          <Route path="products" element={<SellerProductsPage />} />
          <Route path="products/create" element={<SellerCreateProductPage />} />
          <Route path="products/:productId" element={<SellerEditProductPage />} />
          <Route path="stores" element={<SellerStoresPage />} />
          <Route path="orders" element={<SellerOrdersPage />} />
          <Route path="plans" element={<SellerPlansPage />} />
          <Route path="settings" element={<SellerSettingPage />} />
        </Route>

        {/* Admin Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/dashboard/pre" element={<PreAdminPage />} />
          <Route path="/dashboard/verify" element={<VerifyAdminPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} /> {/* 404 Page */}
      </Routes>
    </>
  );
};

export default App;
