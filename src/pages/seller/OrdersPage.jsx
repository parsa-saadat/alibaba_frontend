import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeftRight,
  Ban,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  Flame,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  StickyNote,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { authHeaders } from "../../utils/helpers/storage";
import { Loading } from "../../components/common/ScroolToTopComponent";
import {
  formatPrice,
  formatDate,
  toFa,
  statusFa,
} from "../../utils/helpers/format";
import PanelPageHeader from "../../components/panel/PanelPageHeaderComponent";
import {
  AddressLines,
  CancellationInfo,
  InfoBox,
  InfoLine,
  OrderItemRow,
  OrderTimeline,
  PayStatusChip,
} from "../../components/orders/OrderPartsComponent";
import { getId } from "../../utils/helpers/response";

const API =
  import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || "/api";

/* رنگ و آیکن هر وضعیت */
const STATUS_META = {
  awaiting_approval: {
    color: "#c2740a",
    bg: "rgba(194,116,10,0.14)",
    icon: Clock3,
  },
  preparing: { color: "#2563eb", bg: "rgba(37,99,235,0.14)", icon: Package },
  ready_to_ship: {
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.14)",
    icon: ClipboardList,
  },
  shipped: { color: "#0f766e", bg: "rgba(15,118,110,0.14)", icon: Truck },
  delivered: {
    color: "#17994f",
    bg: "rgba(23,153,79,0.14)",
    icon: CheckCircle2,
  },
  cancelled: { color: "#e53935", bg: "rgba(229,57,53,0.14)", icon: Ban },
  rejected: { color: "#b91c1c", bg: "rgba(185,28,28,0.14)", icon: Ban },
  finalized: {
    color: "#17994f",
    bg: "rgba(23,153,79,0.14)",
    icon: CheckCircle2,
  },
};

const metaOf = (status) =>
  STATUS_META[status] || {
    color: "var(--muted)",
    bg: "var(--card2)",
    icon: Package,
  };

const FILTERS = [
  { key: "ALL", label: "همه" },
  { key: "awaiting_approval", label: "در انتظار تأیید" },
  { key: "preparing", label: "در حال آماده‌سازی" },
  { key: "ready_to_ship", label: "آماده ارسال" },
  { key: "shipped", label: "ارسال‌شده" },
  { key: "delivered", label: "تحویل‌شده" },
  { key: "cancelled", label: "لغوشده" },
];

/* مسیر پیشرفت سفارش */
const FLOW = [
  "awaiting_approval",
  "preparing",
  "ready_to_ship",
  "shipped",
  "delivered",
];

const itemPrice = (item) =>
  Number(item?.price?.amount ?? item?.unit_price ?? item?.price ?? 0) || 0;
const itemQty = (item) => Number(item?.quantity ?? 1) || 1;
const itemName = (item) => item?.name || item?.product_name || "کالا";
const itemDiscount = (item) => Number(item?.discount?.amount ?? 0) || 0;

/* نمایش فشرده‌ی مبلغ برای کارت‌های کوچک */
const compactMoney = (amount) => {
  const value = Number(amount) / 10 || 0;
  if (value >= 1_000_000_000)
    return `${toFa((value / 1_000_000_000).toFixed(1))} میلیارد تومان`;
  if (value >= 1_000_000)
    return `${toFa((value / 1_000_000).toFixed(1))} میلیون تومان`;
  return formatPrice(value);
};

const netOf = (sub) => {
  const amount = Number(sub.amount ?? sub.subtotal ?? 0) || 0;
  const discount = Number(sub.discount_applied ?? 0) || 0;
  return amount - discount;
};

/* ------------------------------------------------------------------ */
/* کارت آماری                                                          */
/* ------------------------------------------------------------------ */
function StatTile({ label, value, hint, icon: Icon, tint }) {
  return (
    <div className="card rounded-2xl p-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[11px] font-bold muted truncate">{label}</div>
        <div
          className="mt-2 font-black leading-tight"
          style={{
            color: tint || "var(--text)",
            fontSize: String(value).length > 9 ? "0.85rem" : "1.05rem",
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
}

/* ------------------------------------------------------------------ */
/* صفحه                                                               */
/* ------------------------------------------------------------------ */
function OrdersPage() {
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelPreset, setCancelPreset] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await axios.get(
        `${API}/order/sub/all?limit=100`,
        authHeaders(),
      );
      setSubOrders(res.data.body?.data || res.data.body || []);
    } catch {
      setSubOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const map = { ALL: subOrders.length };
    subOrders.forEach((o) => {
      map[o.status] = (map[o.status] || 0) + 1;
    });
    return map;
  }, [subOrders]);

  const totals = useMemo(() => {
    const total = subOrders.reduce((sum, o) => sum + netOf(o), 0);
    const waiting = subOrders.filter(
      (o) => o.status === "awaiting_approval",
    ).length;
    const inProgress = subOrders.filter((o) =>
      ["preparing", "ready_to_ship"].includes(o.status),
    ).length;
    const done = subOrders.filter((o) =>
      ["delivered", "finalized"].includes(o.status),
    ).length;
    const items = subOrders.reduce(
      (sum, o) => sum + (o.items || []).reduce((s, it) => s + itemQty(it), 0),
      0,
    );
    return { total, waiting, inProgress, done, items };
  }, [subOrders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subOrders.filter((sub) => {
      if (statusFilter !== "ALL" && sub.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        sub.order_number,
        sub.parent_order_number,
        String(sub._id),
        sub.shipping_address?.full_name,
        sub.shipping_address?.city,
        ...(sub.items || []).flatMap((it) => [itemName(it), it.brand]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [subOrders, statusFilter, search]);

  const runAction = (id, promise, successMessage) => {
    setBusyId(id);
    promise
      .then(() => {
        toast.success(successMessage);
        return load(true);
      })
      .catch((error) =>
        toast.error(error.response?.data?.message || "خطا در انجام عملیات"),
      )
      .finally(() => setBusyId(""));
  };

  const approveSubOrder = (subId) =>
    runAction(
      subId,
      axios.put(`${API}/order/sub/${subId}/approve`, {}, authHeaders()),
      "سفارش تأیید شد",
    );

  const updateSubOrderStatus = (subId, status) =>
    runAction(
      subId,
      axios.put(`${API}/order/sub/${subId}/status`, { status }, authHeaders()),
      `وضعیت به «${statusFa(status)}» تغییر کرد`,
    );

  const submitCancelSubOrder = (e) => {
    e.preventDefault();
    const reason = [cancelPreset, cancelReason.trim()]
      .filter(Boolean)
      .join(" — ");
    if (!reason) return toast.error("لطفاً دلیل لغو را وارد کنید");
    const id = cancelTarget;
    setBusyId(id);
    axios
      .put(`${API}/order/sub/${id}/cancel`, { reason }, authHeaders())
      .then(() => {
        setCancelTarget(null);
        setCancelReason("");
        setCancelPreset("");
        toast.success("سفارش لغو شد");
        return load(true);
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || "خطا در لغو سفارش"),
      )
      .finally(() => setBusyId(""));
  };

  if (loading) {
    return (
      <div className="py-16">
        <Loading label="در حال بارگذاری سفارش‌ها…" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ───── سرصفحه ───── */}
      <PanelPageHeader
        icon={ClipboardList}
        title="سفارش‌های فروشگاه"
        subtitle={`تأیید، آماده‌سازی و پیگیری سفارش‌های فروشنده • ${toFa(subOrders.length)} سفارش`}
        onRefresh={() => load(true)}
        refreshing={refreshing}
      />

      {/* ───── کارت‌های آماری ───── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="کل سفارش‌ها"
          value={toFa(subOrders.length)}
          hint={`${toFa(totals.items)} قلم کالا`}
          icon={ShoppingBag}
        />
        <StatTile
          label="در انتظار تأیید"
          value={toFa(totals.waiting)}
          hint="نیازمند اقدام شما"
          icon={Clock3}
          tint="#c2740a"
        />
        <StatTile
          label="در حال پردازش"
          value={toFa(totals.inProgress)}
          hint="آماده‌سازی و آماده‌ی ارسال"
          icon={Flame}
          tint="#2563eb"
        />
        <StatTile
          label="فروش خالص"
          value={compactMoney(totals.total / 10)}
          hint={`${toFa(totals.done)} سفارش تحویل‌شده`}
          icon={Wallet}
          tint="#17994f"
        />
      </div>

      {/* ───── نوار فیلتر و جستجو ───── */}
      <section className="card rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((filter) => {
            const active = statusFilter === filter.key;
            const count = counts[filter.key] || 0;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className="chip flex items-center gap-1.5"
                style={
                  active
                    ? {
                        background: "var(--primary-color)",
                        color: "#0a1736",
                        borderColor: "transparent",
                      }
                    : undefined
                }
              >
                <span>{filter.label}</span>
                <span
                  className="rounded-full px-1.5 text-[10px] font-black"
                  style={{
                    background: active ? "rgba(10,23,54,0.16)" : "var(--card2)",
                  }}
                >
                  {toFa(count)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search
            size={15}
            className="absolute right-3 top-1/2 -translate-y-1/2 muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو با شماره سفارش یا نام کالا…"
            className="input !py-2.5 !pr-9 text-xs w-full"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="btn-ghost !p-1 absolute left-2 top-1/2 -translate-y-1/2"
              aria-label="پاک کردن جستجو"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </section>

      {/* ───── لیست سفارش‌ها ───── */}
      {filtered.length === 0 ? (
        <section className="card rounded-3xl p-10 text-center space-y-3">
          <span
            className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: "var(--card2)", color: "var(--muted)" }}
          >
            <ShoppingBag size={24} />
          </span>
          <b className="block text-sm">سفارشی برای نمایش نیست</b>
          <p className="text-xs muted">
            {subOrders.length === 0
              ? "هنوز سفارشی از فروشگاه شما ثبت نشده است."
              : "با این فیلتر یا عبارت جستجو سفارشی پیدا نشد."}
          </p>
          {(search || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
              className="btn-ghost !py-2 !px-3 text-xs"
            >
              پاک کردن فیلترها
            </button>
          )}
        </section>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => {
            const meta = metaOf(sub.status);
            const StatusIcon = meta.icon;
            const stepIndex = FLOW.indexOf(sub.status);
            const cancelled = ["cancelled", "rejected"].includes(sub.status);
            const busy = busyId === sub._id;

            return (
              <article
                key={sub._id}
                className="card rounded-2xl overflow-hidden"
              >
                {/* سر کارت */}
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-theme px-4 py-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      <StatusIcon size={16} />
                    </span>
                    <div className="min-w-0">
                      <b className="block text-sm" dir="ltr">
                        #{sub.order_number || String(sub._id).slice(-8)}
                      </b>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] muted">
                        <CalendarDays size={11} />
                        {formatDate(sub.created_at || sub.create_at)}
                      </span>
                    </div>
                  </div>

                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-black"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {statusFa(sub.status)}
                  </span>
                </header>

                {/* مسیر پیشرفت */}
                {!cancelled && stepIndex >= 0 && (
                  <div
                    className="flex items-center gap-1 px-4 pt-3"
                    aria-hidden
                  >
                    {FLOW.map((step, index) => {
                      const done = index <= stepIndex;
                      return (
                        <div
                          key={step}
                          className="flex-1 flex items-center gap-1"
                        >
                          <span
                            className="h-1.5 flex-1 rounded-full"
                            style={{
                              background: done ? meta.color : "var(--card2)",
                              opacity: done ? 1 : 0.7,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* اقلام: عکس و نام کالا هر دو لینک صفحه‌ی محصول هستند */}
                <div className="px-4 py-3 space-y-2">
                  {(sub.items || []).map((item, index) => (
                    <OrderItemRow
                      key={`${getId(item.product_id) || index}-${index}`}
                      item={item}
                    />
                  ))}
                </div>

                {/* جزئیات تحویل، پرداخت و تاریخچه */}
                <div className="px-4 pb-3 space-y-2">
                  <CancellationInfo sub={sub} />
                  <details
                    className="rounded-xl p-3"
                    style={{ background: "var(--card2)" }}
                  >
                    <summary className="cursor-pointer text-[11px] font-black">
                      جزئیات تحویل، پرداخت و تاریخچه‌ی سفارش
                    </summary>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <InfoBox icon={MapPin} title="نشانی تحویل">
                        <AddressLines address={sub.shipping_address} />
                      </InfoBox>
                      <InfoBox icon={CreditCard} title="پرداخت و سفارش">
                        <InfoLine
                          label="وضعیت پرداخت"
                          value={
                            <PayStatusChip
                              status={sub.payment_status || "pending"}
                            />
                          }
                        />
                        <InfoLine
                          label="شماره سفارش اصلی"
                          value={sub.parent_order_number}
                          ltr
                        />
                        <InfoLine
                          label="جمع اقلام"
                          value={formatPrice(sub.amount ?? sub.subtotal ?? 0)}
                        />
                        <InfoLine
                          label="تخفیف"
                          value={formatPrice(sub.discount_applied ?? 0)}
                        />
                        <InfoLine
                          label="خالص مرسوله"
                          value={formatPrice(netOf(sub))}
                        />
                      </InfoBox>
                      {sub.customer_notes && (
                        <InfoBox
                          icon={StickyNote}
                          title="یادداشت مشتری"
                          className="md:col-span-2"
                        >
                          <p className="leading-6 break-words">
                            {sub.customer_notes}
                          </p>
                        </InfoBox>
                      )}
                      <div className="md:col-span-2">
                        <div className="mb-2 text-[11px] font-black">
                          تاریخچه‌ی وضعیت
                        </div>
                        <OrderTimeline history={sub.status_history || []} />
                      </div>
                    </div>
                  </details>
                </div>

                {/* جمع و عملیات */}
                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-theme px-4 py-3">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="muted">
                      جمع اقلام:{" "}
                      <b style={{ color: "var(--text)" }}>
                        {formatPrice(sub.amount ?? sub.subtotal ?? 0)}
                      </b>
                    </span>
                    {Number(sub.discount_applied) > 0 && (
                      <span style={{ color: "#e53935" }}>
                        تخفیف: {formatPrice(sub.discount_applied)}
                      </span>
                    )}
                    <span className="muted">
                      خالص:{" "}
                      <b style={{ color: "var(--primary-color)" }}>
                        {formatPrice(netOf(sub))}
                      </b>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {sub.status === "awaiting_approval" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => approveSubOrder(sub._id)}
                        className="btn-yellow !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-60"
                      >
                        <Check size={13} /> تأیید سفارش
                      </button>
                    )}
                    {sub.status === "preparing" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          updateSubOrderStatus(sub._id, "ready_to_ship")
                        }
                        className="btn-yellow !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-60"
                      >
                        <ClipboardList size={13} /> آماده ارسال
                      </button>
                    )}
                    {sub.status === "ready_to_ship" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updateSubOrderStatus(sub._id, "shipped")}
                        className="btn-yellow !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-60"
                      >
                        <Truck size={13} /> ثبت ارسال
                      </button>
                    )}
                    {sub.status === "shipped" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          updateSubOrderStatus(sub._id, "delivered")
                        }
                        className="btn-yellow !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-60"
                      >
                        <CheckCircle2 size={13} /> ثبت تحویل
                      </button>
                    )}
                    {![
                      "delivered",
                      "cancelled",
                      "rejected",
                      "finalized",
                    ].includes(sub.status) && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setCancelTarget(sub._id);
                          setCancelReason("");
                          setCancelPreset("");
                        }}
                        className="btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-60"
                        style={{ color: "#e53935" }}
                      >
                        <Ban size={13} /> لغو
                      </button>
                    )}
                    {[
                      "delivered",
                      "finalized",
                      "cancelled",
                      "rejected",
                    ].includes(sub.status) && (
                      <span className="flex items-center gap-1 text-[11px] muted">
                        <ArrowLeftRight size={12} /> پرونده‌ی سفارش بسته شده است
                      </span>
                    )}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {/* ───── مودال لغو سفارش ───── */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCancelTarget(null)}
        >
          <form
            onSubmit={submitCancelSubOrder}
            onClick={(e) => e.stopPropagation()}
            className="card rounded-3xl p-5 w-full max-w-md space-y-4"
          >
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="flex items-center gap-2 font-black text-sm">
                <Ban size={16} style={{ color: "#e53935" }} /> لغو سفارش
              </h3>
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="btn-ghost !p-1.5"
                aria-label="بستن"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-bold muted">دلیل لغو</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "ناموجود شدن کالا",
                  "اشتباه در قیمت",
                  "درخواست مشتری",
                  "مشکل در ارسال",
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() =>
                      setCancelPreset(reason === cancelPreset ? "" : reason)
                    }
                    className="chip text-[11px]"
                    style={
                      cancelPreset === reason
                        ? {
                            background: "var(--primary-color)",
                            color: "#0a1736",
                            borderColor: "transparent",
                          }
                        : undefined
                    }
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-[11px] font-bold muted">
              توضیح تکمیلی (اختیاری)
              <textarea
                className="input mt-1.5 !text-xs"
                rows={3}
                placeholder="مثلاً: موجودی انبار تمام شده است…"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </label>

            <p className="text-[11px] muted leading-5">
              لغو سفارش به مشتری اطلاع داده می‌شود و مبلغ طبق قوانین بازگشت داده
              خواهد شد.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="btn-ghost !py-2 !px-4 text-xs"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="btn-yellow !py-2 !px-4 text-xs"
                style={{ background: "#e53935", color: "#fff" }}
              >
                تأیید لغو سفارش
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
