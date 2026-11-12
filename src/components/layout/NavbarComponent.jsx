import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Heart,
  GitCompareArrows,
  User,
  Sun,
  Moon,
  Store,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { useShop } from "../../contexts/ShopContext";
import { userDisplayName } from "../../utils/helpers/user";
import {
  fetchCategories,
  buildCategoryTree,
} from "../../utils/helpers/categories";
import MegaMenuComponent from "./MegaMenuComponent";
import SearchBoxComponent from "./SearchBoxComponent";

function NavbarComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, cartCount, theme, toggleTheme, compare, favorites } =
    useShop();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [catsExpanded, setCatsExpanded] = useState(true);
  const [openBranchIds, setOpenBranchIds] = useState({});

  const accountMenuRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchCategories(controller.signal)
      .then(setCategories)
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("دریافت دسته‌بندی‌ها از بک‌اند ناموفق بود.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);

  // بستن منوها هنگام تغییر مسیر
  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [location.pathname, location.search]);

  // مدیریت کلید Escape و قفل اسکرول بدنه هنگام باز بودن منوی موبایل
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };

    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [mobileOpen]);

  // بستن منوی حساب کاربری با کلیک بیرون یا Escape (مناسب موبایل و دسکتاپ)
  useEffect(() => {
    if (!accountOpen) return undefined;

    const onOutside = (e) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target)
      ) {
        setAccountOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setAccountOpen(false);
    };

    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  const categoryTree = useMemo(
    () => buildCategoryTree(categories),
    [categories],
  );
  const isSeller =
    user &&
    ((user.role === "seller" &&
      user.seller_approved_status == true &&
      user.seller_active_status == "ACTIVE") ||
      user.role === "admin");
  const toggleBranch = (id) =>
    setOpenBranchIds((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleLogout = () => {
    setAccountOpen(false);
    setMobileOpen(false);
    logout();
    navigate("/");
  };

  const renderMobileCategory = (node, depth = 0) => {
    const hasChildren = (node.children || []).length > 0;
    const isOpen = Boolean(openBranchIds[node._id]);

    return (
      <div
        key={node._id}
        className={depth > 0 ? "pr-3 mr-2 border-r border-white/15" : ""}
      >
        {hasChildren ? (
          <>
            <button
              type="button"
              onClick={() => toggleBranch(node._id)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs text-gray-100 hover:bg-white/10 text-right font-semibold"
            >
              <span className="min-w-0 truncate">{node.name}</span>
              <ChevronDown
                size={14}
                className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <div className="space-y-0.5 mt-0.5 pb-1">
                <Link
                  to={`/products?category_id=${node._id}`}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 mr-3 rounded-lg text-[11px] font-bold text-brand-yellow hover:bg-white/10"
                >
                  همه محصولات {node.name}
                </Link>
                {node.children.map((child) =>
                  renderMobileCategory(child, depth + 1),
                )}
              </div>
            )}
          </>
        ) : (
          <Link
            to={`/products?category_id=${node._id}`}
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-xs text-gray-200 hover:bg-white/10 truncate"
          >
            {node.name}
          </Link>
        )}
      </div>
    );
  };

  return (
    <header className="site-header sticky top-0 z-50">
      {/* نوار اصلی هدر */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-x-2 gap-y-2.5 md:gap-3">
        {/* لوگو و دکمه منوی موبایل */}
        <div className="order-1 flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden btn-ghost !p-2 shrink-0"
            aria-label="باز کردن منو"
            aria-expanded={mobileOpen}
          >
            <Menu size={19} />
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0"
          >
            <span className="brand-logo w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl grid place-items-center font-black text-lg sm:text-xl shadow-md shrink-0">
              ع
            </span>
            <div className="min-w-0">
              <b className="text-base sm:text-lg tracking-tight block leading-5 whitespace-nowrap">
                علی‌بازار
              </b>
              <span className="hidden sm:block text-[11px] muted whitespace-nowrap">
                بازار داخلی ایران
              </span>
            </div>
          </Link>
        </div>

        {/* باکس جستجو — ردیف دوم تمام‌عرض در موبایل، وسط هدر در دسکتاپ */}
        <div className="order-3 w-full md:order-2 md:w-auto md:flex-1 md:max-w-xl search-shell">
          <SearchBoxComponent />
        </div>

        {/* اکشن‌های هدر */}
        <div className="order-2 md:order-3 flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden sm:inline-flex btn-ghost !p-2 sm:!p-2.5"
            title="تغییر تم"
            aria-label="تغییر تم روشن و تاریک"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <Link
            to="/compare"
            className="hidden sm:inline-flex btn-ghost !p-2 sm:!p-2.5 relative"
            title="مقایسه"
            aria-label="مقایسه محصولات"
          >
            <GitCompareArrows size={17} />
            {compare.length > 0 && (
              <span className="header-badge">{compare.length}</span>
            )}
          </Link>

          <Link
            to="/favorites"
            className="inline-flex btn-ghost !p-2 sm:!p-2.5 relative"
            title="علاقه‌مندی"
            aria-label="علاقه‌مندی‌ها"
          >
            <Heart size={17} />
            {favorites.length > 0 && (
              <span className="header-badge">{favorites.length}</span>
            )}
          </Link>

          <Link
            to="/cart"
            className="inline-flex btn-ghost !p-2 sm:!p-2.5 relative"
            title="سبد خرید"
            aria-label="سبد خرید"
          >
            <ShoppingCart size={17} />
            {cartCount > 0 && <span className="header-badge">{cartCount}</span>}
          </Link>

          {user ? (
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                aria-label="منوی حساب کاربری"
                className="btn-yellow !py-2 !px-2.5 sm:!px-3 text-xs sm:text-sm inline-flex items-center gap-1.5"
              >
                <User size={16} className="shrink-0" />
                <span className="hidden sm:inline max-w-[90px] truncate">
                  {userDisplayName(user, "حساب")}
                </span>
                <ChevronDown
                  size={13}
                  className={`hidden sm:inline transition-transform ${
                    accountOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {accountOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full pt-2 w-56 max-w-[calc(100vw-1.5rem)] z-50"
                >
                  <div className="card rounded-2xl p-2 shadow-2xl space-y-1">
                    <div className="sm:hidden px-3 py-2 border-b border-theme mb-1">
                      <span className="block text-xs font-black truncate">
                        {userDisplayName(user, "حساب کاربری")}
                      </span>
                      <span className="block text-[10px] muted">
                        مدیریت حساب
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setAccountOpen(false)}
                      className="account-link"
                    >
                      <User size={15} /> پروفایل من
                    </Link>
                    <Link
                      to="/address"
                      onClick={() => setAccountOpen(false)}
                      className="account-link"
                    >
                      <Store size={15} /> نشانی‌های من
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setAccountOpen(false)}
                      className="account-link"
                    >
                      <ShoppingCart size={15} /> سفارش‌های من
                    </Link>
                    {isSeller && (
                      <Link
                        to="/seller"
                        onClick={() => setAccountOpen(false)}
                        className="account-link text-yellow font-bold"
                      >
                        <Store size={15} /> پنل فروشنده
                      </Link>
                    )}
                    {user.role === "admin" && (
                      <Link
                        to="/dashboard"
                        onClick={() => setAccountOpen(false)}
                        className="account-link text-yellow font-bold"
                      >
                        <ShieldCheck size={15} /> پنل ادمین
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut size={15} /> خروج
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth/pre"
              className="btn-yellow !py-2 !px-3 sm:!px-4 text-xs sm:text-sm whitespace-nowrap"
            >
              <span className="sm:hidden">ورود</span>
              <span className="hidden sm:inline">ورود | ثبت‌نام</span>
            </Link>
          )}
        </div>
      </div>

      {/* زیرمنوی دسکتاپ */}
      <div className="hidden md:block border-t border-slate-400/20">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0 w-full">
            <MegaMenuComponent
              categories={categories}
              loading={loading}
              error={error}
              onRetry={() => setRetry((value) => value + 1)}
            />

            <nav
              className="flex items-center gap-1 overflow-x-auto no-scrollbar whitespace-nowrap"
              aria-label="لینک‌های اصلی"
            >
              <NavLink to="/" end className="header-nav-link shrink-0">
                خانه
              </NavLink>
              <NavLink to="/products" className="header-nav-link shrink-0">
                فروشگاه
              </NavLink>
              <Link
                to="/products?discount=true"
                className="header-nav-link shrink-0"
              >
                تخفیف‌دارها
              </Link>
              <NavLink to="/about" className="header-nav-link shrink-0">
                درباره ما
              </NavLink>
              <NavLink to="/contact" className="header-nav-link shrink-0">
                تماس با ما
              </NavLink>
              {isSeller && (
                <NavLink
                  to="/seller"
                  className="header-nav-link shrink-0 text-brand-yellow font-bold"
                >
                  پنل فروشندگی
                </NavLink>
              )}
              {user?.role === "admin" && (
                <NavLink
                  to="/dashboard"
                  className="header-nav-link shrink-0 text-brand-yellow font-bold"
                >
                  مدیریت سایت
                </NavLink>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* منوی کشویی موبایل */}
      {mobileOpen && (
        <>
          <div
            className="mobile-drawer-backdrop md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="mobile-drawer md:hidden flex flex-col w-[min(86vw,340px)] max-w-full"
            role="dialog"
            aria-modal="true"
            aria-label="منوی موبایل"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="brand-logo w-9 h-9 rounded-xl grid place-items-center font-black shrink-0">
                  ع
                </span>
                <div className="min-w-0">
                  <b className="text-sm block truncate">علی‌بازار</b>
                  <span className="text-[10px] text-gray-300 block truncate">
                    منوی دسترسی سریع
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="btn-ghost !p-2 !text-white !border-white/15 hover:!bg-white/10 shrink-0"
                aria-label="بستن منو"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 space-y-3 overflow-y-auto flex-1 overscroll-contain">
              {/* دسترسی سریع امکانات هدر در موبایل */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-gray-100 hover:bg-white/10"
                >
                  <span className="flex items-center gap-1.5">
                    {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                    <span>{theme === "dark" ? "تم روشن" : "تم تاریک"}</span>
                  </span>
                </button>

                <Link
                  to="/compare"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-gray-100 hover:bg-white/10"
                >
                  <span className="flex items-center gap-1.5">
                    <GitCompareArrows size={14} />
                    <span>مقایسه</span>
                  </span>
                  {compare.length > 0 && (
                    <span className="rounded-full bg-[#ffd60a] px-1.5 py-0.5 text-[10px] font-black text-[#0a1736]">
                      {compare.length}
                    </span>
                  )}
                </Link>

                <Link
                  to="/favorites"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-gray-100 hover:bg-white/10"
                >
                  <span className="flex items-center gap-1.5">
                    <Heart size={14} />
                    <span>علاقه‌مندی</span>
                  </span>
                  {favorites.length > 0 && (
                    <span className="rounded-full bg-[#ffd60a] px-1.5 py-0.5 text-[10px] font-black text-[#0a1736]">
                      {favorites.length}
                    </span>
                  )}
                </Link>

                <Link
                  to="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-gray-100 hover:bg-white/10"
                >
                  <span className="flex items-center gap-1.5">
                    <ShoppingCart size={14} />
                    <span>سبد خرید</span>
                  </span>
                  {cartCount > 0 && (
                    <span className="rounded-full bg-[#ffd60a] px-1.5 py-0.5 text-[10px] font-black text-[#0a1736]">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* حساب کاربری در منوی موبایل */}
              {user ? (
                <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 px-1">
                    <span className="flex items-center gap-2 text-xs font-bold text-white min-w-0">
                      <User size={14} className="text-brand-yellow shrink-0" />
                      <span className="truncate">
                        {userDisplayName(user, "حساب کاربری")}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 shrink-0"
                    >
                      <LogOut size={12} /> خروج
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg bg-white/5 px-2 py-1.5 text-center text-gray-200 hover:bg-white/10"
                    >
                      پروفایل
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg bg-white/5 px-2 py-1.5 text-center text-gray-200 hover:bg-white/10"
                    >
                      سفارش‌ها
                    </Link>
                    <Link
                      to="/address"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg bg-white/5 px-2 py-1.5 text-center text-gray-200 hover:bg-white/10"
                    >
                      نشانی‌ها
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  to="/auth/pre"
                  onClick={() => setMobileOpen(false)}
                  className="btn-yellow w-full flex items-center justify-center gap-2 text-xs !py-2.5"
                >
                  <User size={15} />
                  <span>ورود | ثبت‌نام</span>
                </Link>
              )}

              {/* لینک‌های اصلی */}
              <div className="space-y-0.5">
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-white/10"
                >
                  صفحه اصلی
                </NavLink>
                <NavLink
                  to="/products"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-white/10"
                >
                  همه محصولات
                </NavLink>
                <Link
                  to="/products?discount=true"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold text-brand-yellow hover:bg-white/10"
                >
                  پیشنهادهای شگفت‌انگیز
                </Link>
                <NavLink
                  to="/about"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm hover:bg-white/10"
                >
                  درباره ما
                </NavLink>
                <NavLink
                  to="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm hover:bg-white/10"
                >
                  تماس با ما
                </NavLink>

                {isSeller && (
                  <NavLink
                    to="/seller"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 rounded-xl text-sm font-bold text-brand-yellow hover:bg-white/10"
                  >
                    پنل فروشندگی
                  </NavLink>
                )}
                {user?.role === "admin" && (
                  <NavLink
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 rounded-xl text-sm font-bold text-brand-yellow hover:bg-white/10"
                  >
                    پنل مدیریت ادمین
                  </NavLink>
                )}
              </div>

              {/* دسته‌بندی کالاها */}
              <div className="pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCatsExpanded((v) => !v)}
                  aria-expanded={catsExpanded}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-brand-yellow"
                >
                  <span>دسته‌بندی کالاها</span>
                  <ChevronDown
                    size={15}
                    className={`transition-transform ${catsExpanded ? "rotate-180" : ""}`}
                  />
                </button>

                {catsExpanded && (
                  <div className="space-y-1 mt-1">
                    {loading ? (
                      <div className="space-y-2 px-2 py-1">
                        <div className="h-8 rounded-xl bg-white/10 animate-pulse" />
                        <div className="h-8 rounded-xl bg-white/10 animate-pulse" />
                        <div className="h-8 rounded-xl bg-white/10 animate-pulse" />
                      </div>
                    ) : error ? (
                      <div className="rounded-xl bg-white/5 p-3 text-center space-y-2">
                        <p className="text-[11px] text-rose-300">{error}</p>
                        <button
                          type="button"
                          onClick={() => setRetry((value) => value + 1)}
                          className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20"
                        >
                          <RefreshCw size={12} />
                          تلاش دوباره
                        </button>
                      </div>
                    ) : categoryTree.length === 0 ? (
                      <p className="px-3 py-2 text-[11px] text-gray-400">
                        دسته‌بندی‌ای یافت نشد.
                      </p>
                    ) : (
                      categoryTree.map((root) => renderMobileCategory(root, 0))
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </header>
  );
}

export default NavbarComponent;
