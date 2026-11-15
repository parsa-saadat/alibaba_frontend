import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CircleDollarSign,
  Clock3,
  CreditCard,
  ExternalLink,
  FolderTree,
  Image as ImageIcon,
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import { authHeaders, getUser } from "../../utils/helpers/storage";
import { userFullName } from "../../utils/helpers/user";
import StorageImageComponent from "../../components/common/StorageImageComponent";
import ImageLightboxComponent from "../../components/common/ImageLightboxComponent";
import { Loading } from "../../components/common/ScroolToTopComponent";
import {
  formatPrice,
  toFa,
  statusFa,
  productImages,
  formatDate,
  formatDateLong,
  formatDayOfMonth,
} from "../../utils/helpers/format";
import { getId } from "../../utils/helpers/response";
import { flattenCategories } from "../../utils/helpers/categories";

const API =
  import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || "/api";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "صبح بخیر";
  if (hour < 18) return "بعدازظهر بخیر";
  return "شب بخیر";
};

const dayKey = (date) => {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return value.toISOString().slice(0, 10);
};

const ORDER_STATUS_TONE = {
  pending: { color: "#c2740a", bg: "rgba(194,116,10,0.14)" },
  awaiting_payment: { color: "#c2740a", bg: "rgba(194,116,10,0.14)" },
  paid: { color: "#17994f", bg: "rgba(23,153,79,0.14)" },
  delivered: { color: "#17994f", bg: "rgba(23,153,79,0.14)" },
  cancelled: { color: "#e53935", bg: "rgba(229,57,53,0.14)" },
  failed: { color: "#e53935", bg: "rgba(229,57,53,0.14)" },
};

const toneOf = (status) =>
  ORDER_STATUS_TONE[status] || { color: "var(--muted)", bg: "var(--card2)" };

/* نمایش فشرده‌ی مبلغ برای کارت‌های کوچک: ۷٬۱۴۷٬۰۰۰ -> ۷.۱ میلیون */
const compactMoney = (amount) => {
  const value = Number(amount) || 0;
  if (value >= 1_000_000_000)
    return `${toFa((value / 1_000_000_000).toFixed(1))} میلیارد تومان`;
  if (value >= 1_000_000)
    return `${toFa((value / 1_000_000).toFixed(1))} میلیون تومان`;
  return formatPrice(value);
};

/* ------------------------------------------------------------------ */
/* کارت آماری                                                          */
/* ------------------------------------------------------------------ */
function KpiTile({ label, value, hint, icon: Icon, tint, to }) {
  const body = (
    <div className="card rounded-2xl p-4 flex items-start justify-between gap-3 h-full transition-transform hover:-translate-y-0.5">
      <div className="min-w-0">
        <div className="text-[11px] font-bold muted truncate">{label}</div>
        <div
          className="mt-2 font-black leading-tight"
          style={{
            color: tint || "var(--text)",
            fontSize: String(value).length > 8 ? "0.9rem" : "1.05rem",
          }}
        >
          {value}
        </div>
        {hint && <div className="mt-1 text-[10px] muted truncate">{hint}</div>}
      </div>
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{
          background: "var(--card2)",
          color: tint || "var(--primary-color)",
        }}
      >
        <Icon size={17} />
      </span>
    </div>
  );

  return to ? <Link to={to}>{body}</Link> : body;
}

/* ------------------------------------------------------------------ */
/* بخش با سرصفحه                                                       */
/* ------------------------------------------------------------------ */
function Panel({ title, hint, icon: Icon, action, children, className = "" }) {
  return (
    <section className={`card rounded-2xl flex flex-col ${className}`}>
      <header className="flex items-center justify-between gap-2 border-b border-theme px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
            style={{ background: "var(--card2)" }}
          >
            <Icon size={15} style={{ color: "var(--primary-color)" }} />
          </span>
          <div className="min-w-0">
            <b className="block text-sm truncate">{title}</b>
            {hint && <span className="text-[10px] muted">{hint}</span>}
          </div>
        </div>
        {action}
      </header>
      <div className="p-3 sm:p-4 flex-1">{children}</div>
    </section>
  );
}

const EmptyRow = ({ text }) => (
  <div className="grid place-items-center py-8 text-center text-xs muted">
    {text}
  </div>
);

/* ------------------------------------------------------------------ */
/* صفحه                                                               */
/* ------------------------------------------------------------------ */
function CounterPage() {
  const [data, setData] = useState({
    users: [],
    sellers: [],
    stores: [],
    products: [],
    categories: [],
    plans: [],
    orders: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [zoomFile, setZoomFile] = useState(null);

  const admin = getUser() || {};
  const adminName = userFullName(admin) || admin.username || "مدیر";

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    const get = (url) =>
      axios
        .get(`${API}${url}`, authHeaders())
        .then((r) => r.data.body?.data || r.data.body || [])
        .catch(() => []);
    const [users, sellers, stores, products, categories, plans, orders] =
      await Promise.all([
        get("/user?limit=100"),
        get("/sellers?limit=100"),
        get("/perm/stores?limit=100"),
        get("/perm/products?limit=100"),
        get("/category?limit=100"),
        get("/plan?limit=50"),
        get("/orders?limit=100"),
      ]);

    setData({
      users: Array.isArray(users) ? users : [],
      sellers: Array.isArray(sellers) ? sellers : [],
      stores: Array.isArray(stores) ? stores : [],
      products: Array.isArray(products) ? products : [],
      categories: flattenCategories(
        Array.isArray(categories) ? categories : [],
      ),
      plans: Array.isArray(plans) ? plans : [],
      orders: Array.isArray(orders) ? orders : [],
    });
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { users, sellers, stores, products, categories, plans, orders } = data;

  const userMap = useMemo(
    () => Object.fromEntries(users.map((u) => [getId(u), u])),
    [users],
  );
  const storeMap = useMemo(
    () => Object.fromEntries(stores.map((s) => [getId(s), s])),
    [stores],
  );

  const pendingSellers = useMemo(
    () => sellers.filter((s) => !s.seller_approved_status),
    [sellers],
  );
  const trustedSellers = useMemo(
    () => sellers.filter((s) => s.seller_trust === true),
    [sellers],
  );

  const revenue = useMemo(
    () =>
      orders.reduce(
        (sum, o) => sum + Number(o.final_amount ?? o.total_amount ?? 0),
        0,
      ),
    [orders],
  );
  const paidOrders = useMemo(
    () =>
      orders.filter((o) =>
        ["paid", "delivered"].includes(o.payment?.status || o.payment_status),
      ).length,
    [orders],
  );

  /* نمودار ساده‌ی ۷ روز اخیر (بدون کتابخانه) */
  const chart = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return { key: dayKey(date), label: formatDayOfMonth(date), value: 0 };
    });
    const map = Object.fromEntries(days.map((day) => [day.key, day]));
    orders.forEach((order) => {
      const key = dayKey(order.created_at || order.create_at);
      if (map[key])
        map[key].value += Number(order.final_amount ?? order.total_amount ?? 0);
    });
    const max = Math.max(...days.map((d) => d.value), 1);
    return { days, max };
  }, [orders]);

  const approveSeller = (id) =>
    axios
      .put(
        `${API}/seller/${id}`,
        { seller_approved_status: true, seller_active_status: "ACTIVE" },
        authHeaders(),
      )
      .then(() => {
        toast.success("درخواست فروشندگی تأیید و فعال شد");
        return load(true);
      })
      .catch((e) =>
        toast.error(e.response?.data?.message || "خطا در تأیید فروشنده"),
      );

  if (loading) {
    return (
      <div className="py-16">
        <Loading label="در حال بارگذاری اطلاعات پیشخوان…" />
      </div>
    );
  }

  const quickLinks = [
    {
      to: "/dashboard/sellers",
      label: "فروشندگان",
      icon: Store,
      hint: `${toFa(pendingSellers.length)} در انتظار`,
    },
    {
      to: "/dashboard/users",
      label: "کاربران",
      icon: Users,
      hint: `${toFa(users.length)} نفر`,
    },
    {
      to: "/dashboard/products",
      label: "محصولات",
      icon: Package,
      hint: `${toFa(products.length)} کالا`,
    },
    {
      to: "/dashboard/orders",
      label: "سفارش‌ها",
      icon: ShoppingBag,
      hint: `${toFa(orders.length)} سفارش`,
    },
    {
      to: "/dashboard/stores",
      label: "فروشگاه‌ها",
      icon: Store,
      hint: `${toFa(stores.length)} فروشگاه`,
    },
    {
      to: "/dashboard/categories",
      label: "دسته‌بندی‌ها",
      icon: FolderTree,
      hint: `${toFa(categories.length)} دسته`,
    },
    {
      to: "/dashboard/plans",
      label: "پلن‌ها",
      icon: CreditCard,
      hint: `${toFa(plans.length)} پلن`,
    },
    {
      to: "/dashboard/media",
      label: "رسانه‌ها",
      icon: ImageIcon,
      hint: "فایل‌ها",
    },
  ];

  return (
    <div className="space-y-5">
      {/* ───── هدر خوش‌آمد ───── */}
      <section
        className="card rounded-3xl overflow-hidden relative"
        style={{
          background:
            "linear-gradient(120deg, rgba(255,214,10,0.20), rgba(255,214,10,0.04) 45%, rgba(37,99,235,0.10))",
        }}
      >
        <div className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black"
              style={{
                background: "rgba(10,23,54,0.35)",
                color: "var(--primary-color)",
              }}
            >
              <Sparkles size={12} /> پیشخوان مدیریت
            </span>
            <h1 className="mt-2 text-lg sm:text-xl font-black">
              {greeting()}، {adminName}
            </h1>
            <p className="mt-1 text-xs muted">
              {formatDateLong(new Date())}
              {" • "}
              {pendingSellers.length > 0
                ? `${toFa(pendingSellers.length)} درخواست فروشندگی منتظر تأیید شماست`
                : "همه‌ی درخواست‌های فروشندگی بررسی شده‌اند"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="btn-ghost !py-2 !px-3 text-xs flex items-center gap-1.5"
            >
              <ExternalLink size={14} /> مشاهده‌ی سایت
            </Link>
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="btn-yellow !py-2 !px-3 text-xs flex items-center gap-1.5 disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "به‌روزرسانی…" : "به‌روزرسانی"}
            </button>
          </div>
        </div>
      </section>

      {/* ───── کارت‌های کلیدی ───── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <KpiTile
          label="درآمد سفارش‌ها"
          value={compactMoney(revenue / 10)}
          hint={`${toFa(paidOrders)} سفارش پرداخت‌شده`}
          icon={CircleDollarSign}
          tint="#17994f"
        />
        <KpiTile
          label="سفارش‌ها"
          value={toFa(orders.length)}
          hint="کل ثبت‌شده"
          icon={ShoppingBag}
          to="/dashboard/orders"
        />
        <KpiTile
          label="در انتظار تأیید"
          value={toFa(pendingSellers.length)}
          hint="درخواست فروشندگی"
          icon={Clock3}
          tint="#c2740a"
          to="/dashboard/sellers"
        />
        <KpiTile
          label="کاربران"
          value={toFa(users.length)}
          hint="همه‌ی نقش‌ها"
          icon={Users}
          tint="#2563eb"
          to="/dashboard/users"
        />
        <KpiTile
          label="محصولات"
          value={toFa(products.length)}
          hint="فعال در سایت"
          icon={Package}
          to="/dashboard/products"
        />
        <KpiTile
          label="فروشگاه‌ها"
          value={toFa(stores.length)}
          hint={`${toFa(trustedSellers.length)} فروشنده‌ی مورد اعتماد`}
          icon={Store}
          tint="#7c3aed"
          to="/dashboard/stores"
        />
      </div>

      {/* ───── نمودار + صف تأیید ───── */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel
          title="روند فروش ۷ روز اخیر"
          hint="مجموع مبلغ سفارش‌ها"
          icon={TrendingUp}
          className="lg:col-span-3"
        >
          <div className="flex items-end justify-between gap-2 h-40">
            {chart.days.map((day) => {
              const height = Math.max(
                6,
                Math.round((day.value / chart.max) * 100),
              );
              return (
                <div
                  key={day.key}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                >
                  <span className="text-[9px] muted" dir="ltr">
                    {day.value > 0
                      ? toFa(Math.round(day.value / 1000000)) + "م"
                      : "—"}
                  </span>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${height}%`,
                      background:
                        day.value > 0
                          ? "linear-gradient(180deg, var(--primary-color), rgba(255,214,10,0.35))"
                          : "var(--card2)",
                    }}
                    title={`${day.label}: ${formatPrice(day.value)}`}
                  />
                  <span className="text-[10px] muted">{day.label}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel
          title="در انتظار تأیید فروشندگی"
          hint={`${toFa(pendingSellers.length)} درخواست`}
          icon={BadgeCheck}
          className="lg:col-span-2"
          action={
            <Link
              to="/dashboard/sellers"
              className="text-[11px] font-bold"
              style={{ color: "var(--primary-color)" }}
            >
              همه
            </Link>
          }
        >
          {pendingSellers.length === 0 ? (
            <EmptyRow text="درخواست جدیدی وجود ندارد." />
          ) : (
            <div className="space-y-2">
              {pendingSellers.slice(0, 4).map((seller) => (
                <div
                  key={seller._id}
                  className="card2 rounded-xl p-2.5 flex items-center gap-2"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-black"
                    style={{
                      background: "rgba(194,116,10,0.16)",
                      color: "#c2740a",
                    }}
                  >
                    {(userFullName(seller) || seller.username || "؟")[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-xs">
                      {userFullName(seller) || seller.username}
                    </b>
                    <span
                      className="text-[10px] muted truncate block"
                      dir="ltr"
                    >
                      {toFa(seller.phone || "—")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {seller.identity_image_id && (
                      <button
                        type="button"
                        onClick={() =>
                          setZoomFile({
                            file: seller.identity_image_id,
                            alt: `مدرک ${seller.username}`,
                          })
                        }
                        className="btn-ghost !p-1.5"
                        title="مشاهده مدرک"
                      >
                        <ImageIcon size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => approveSeller(seller._id)}
                      className="btn-yellow !py-1.5 !px-2 text-[11px] flex items-center gap-1"
                    >
                      <Check size={12} /> تأیید
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* ───── سفارش‌ها و محصولات ───── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="آخرین سفارش‌ها"
          hint={`${toFa(orders.length)} سفارش`}
          icon={ShoppingBag}
          action={
            <Link
              to="/dashboard/orders"
              className="text-[11px] font-bold"
              style={{ color: "var(--primary-color)" }}
            >
              مدیریت
            </Link>
          }
        >
          {(orders.length ? orders : []).slice(0, 5).length === 0 ? (
            <EmptyRow text="سفارشی ثبت نشده است." />
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 5).map((order) => {
                const customer =
                  userMap[getId(order.customer_id ?? order.user_id)];
                const payStatus = order.payment?.status || order.payment_status;
                const tone = toneOf(payStatus);
                return (
                  <div
                    key={order._id}
                    className="card2 rounded-xl p-2.5 flex items-center gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <b className="text-xs" dir="ltr">
                          #{order.order_number || String(order._id).slice(-8)}
                        </b>
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-black"
                          style={{ background: tone.bg, color: tone.color }}
                        >
                          {statusFa(payStatus)}
                        </span>
                      </div>
                      <span className="mt-0.5 block text-[10px] muted truncate">
                        {customer
                          ? userFullName(customer)
                          : order.shipping_address?.full_name || "مشتری"}
                        {" • "}
                        {formatDate(order.created_at || order.create_at)}
                      </span>
                    </div>
                    <b
                      className="shrink-0 text-xs"
                      style={{ color: "var(--primary-color)" }}
                    >
                      {formatPrice(order.final_amount ?? order.total_amount)}
                    </b>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel
          title="آخرین محصولات"
          hint={`${toFa(products.length)} کالا`}
          icon={Package}
          action={
            <Link
              to="/dashboard/products"
              className="text-[11px] font-bold"
              style={{ color: "var(--primary-color)" }}
            >
              مدیریت
            </Link>
          }
        >
          {products.length === 0 ? (
            <EmptyRow text="محصولی ثبت نشده است." />
          ) : (
            <div className="space-y-2">
              {products.slice(0, 5).map((product) => {
                const seller = userMap[getId(product.seller_id)];
                const store = storeMap[getId(product.store_id)];
                return (
                  <Link
                    key={product._id}
                    to={`/dashboard/products/${product._id}`}
                    className="card2 rounded-xl p-2 flex items-center gap-2.5 hover:opacity-90"
                  >
                    <StorageImageComponent
                      file={productImages(product)[0]}
                      alt={product.name}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      compact
                    />
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-xs">{product.name}</b>
                      <span className="text-[10px] muted truncate block">
                        {store?.name || product.store_name || "بدون فروشگاه"}
                        {" • "}
                        {userFullName(seller) || seller?.username || "نامشخص"}
                      </span>
                    </div>
                    <ArrowLeft size={13} className="shrink-0 muted" />
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* ───── دسترسی سریع ───── */}
      <Panel title="دسترسی سریع" hint="بخش‌های مدیریتی" icon={ExternalLink}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="card2 rounded-xl p-3 flex items-center gap-2.5 transition-transform hover:-translate-y-0.5"
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                style={{ background: "var(--card)" }}
              >
                <link.icon
                  size={15}
                  style={{ color: "var(--primary-color)" }}
                />
              </span>
              <div className="min-w-0">
                <b className="block truncate text-xs">{link.label}</b>
                <span className="text-[10px] muted truncate block">
                  {link.hint}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Panel>

      <ImageLightboxComponent
        file={zoomFile?.file}
        alt={zoomFile?.alt}
        onClose={() => setZoomFile(null)}
      />
    </div>
  );
}

export default CounterPage;
