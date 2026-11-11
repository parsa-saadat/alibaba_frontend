import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Store as StoreIcon,
  Package,
  Search,
  Sparkles,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import ProductGridComponent from '../../components/main/ProductGridComponent';
import StorageImageComponent from '../../components/main/StorageImageComponent';
import ImageLightboxComponent from '../../components/main/ImageLightboxComponent';
import { Loading } from '../../components/ScroolToTopComponent';
import {
  statusFa,
  toFa,
  formatDate,
  finalPrice,
  hasDiscount,
} from '../../utils/helpers/format';
import { getBody, getList } from '../../utils/helpers/response';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

const SORTS = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'cheap', label: 'ارزان‌ترین' },
  { value: 'expensive', label: 'گران‌ترین' },
  { value: 'discount', label: 'بیشترین تخفیف' },
  { value: 'sold', label: 'پرفروش‌ترین' },
];

function StorePage() {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [zoomFile, setZoomFile] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    Promise.all([
      axios.get(`${API}/store/${id}`, { signal: controller.signal, timeout: 15000 }),
      axios.get(`${API}/product`, {
        params: { store_id: id, limit: 100, page: 1 },
        signal: controller.signal,
        timeout: 15000,
      }),
    ])
      .then(([storeRes, prodRes]) => {
        const s = getBody(storeRes);
        if (!s) throw new Error('فروشگاه پیدا نشد.');
        setStore(s);
        setProducts(getList(prodRes));
      })
      .catch((err) => {
        if (!axios.isCancel(err)) {
          setError(err.response?.data?.message || err.message || 'فروشگاه پیدا نشد.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id, retry]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      if (q && !p.name?.toLowerCase().includes(q) && !p.brand?.toLowerCase().includes(q)) {
        return false;
      }
      if (onlyDiscount && !hasDiscount(p)) return false;
      if (onlyInStock && (p.stock_status === 'OUT_OF_STOCK' || (p.stock ?? 0) <= 0)) {
        return false;
      }
      return true;
    });

    switch (sort) {
      case 'cheap':
        list = [...list].sort((a, b) => finalPrice(a) - finalPrice(b));
        break;
      case 'expensive':
        list = [...list].sort((a, b) => finalPrice(b) - finalPrice(a));
        break;
      case 'discount':
        list = [...list].sort(
          (a, b) => (b.discount?.percentage ?? 0) - (a.discount?.percentage ?? 0),
        );
        break;
      case 'sold':
        list = [...list].sort((a, b) => (b.sold_count ?? 0) - (a.sold_count ?? 0));
        break;
      default:
        break;
    }
    return list;
  }, [products, query, sort, onlyDiscount, onlyInStock]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8" aria-busy="true">
        <Loading label="در حال بارگذاری فروشگاه…" />
        <div className="skeleton h-56 mt-6" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <StoreIcon size={40} className="mx-auto muted" />
        <p className="muted">{error || 'فروشگاه پیدا نشد.'}</p>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setRetry((v) => v + 1)}
            className="btn-yellow"
          >
            تلاش دوباره
          </button>
          <Link to="/products" className="btn-ghost">
            مشاهده همه محصولات
          </Link>
        </div>
      </div>
    );
  }

  const isActive = store.status === 'ENABLE';
  const contact = store.contact_info || {};
  const discountCount = products.filter(hasDiscount).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <section className="card rounded-3xl overflow-hidden">
        <div className="h-44 sm:h-60 w-full relative bg-navy">
          <StorageImageComponent
            file={store.banner_image_id}
            alt={`بنر ${store.name}`}
            eager
            className="w-full h-full object-cover"
            onZoom={
              store.banner_image_id
                ? (f, a) => setZoomFile({ file: f, alt: a })
                : null
            }
          />
          <div className="absolute top-4 left-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow ${
                isActive ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-[#0a1736]'
              }`}
            >
              {isActive ? <CheckCircle2 size={14} /> : <AlertOctagon size={14} />}
              {statusFa(store.status)}
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 relative">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-4 border-[var(--card)] shadow-xl bg-navy shrink-0 grid place-items-center font-black text-3xl">
                <StorageImageComponent
                  file={store.profile_image_id}
                  alt={store.name}
                  eager
                  className="w-full h-full object-cover"
                  onZoom={
                    store.profile_image_id
                      ? (f, a) => setZoomFile({ file: f, alt: a })
                      : null
                  }
                />
              </div>
              <div className="pb-1">
                <h1 className="font-black text-xl sm:text-3xl">{store.name}</h1>
                <p className="text-xs muted mt-1">
                  فروشگاه رسمی در علی‌بازار
                  {store.create_at ? ` • عضویت از ${formatDate(store.create_at)}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="card2 rounded-2xl px-4 py-2.5 text-center">
                <div className="font-black text-lg text-yellow">{toFa(products.length)}</div>
                <div className="text-[11px] muted">کالای فعال</div>
              </div>
              {discountCount > 0 && (
                <div className="card2 rounded-2xl px-4 py-2.5 text-center">
                  <div className="font-black text-lg text-yellow">{toFa(discountCount)}</div>
                  <div className="text-[11px] muted">تخفیف‌دار</div>
                </div>
              )}
            </div>
          </div>

          {store.description && (
            <p className="mt-5 text-sm leading-7 muted">{store.description}</p>
          )}

          {(contact.email || contact.phone || contact.address) && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5 pt-5 border-t border-theme text-xs">
              {contact.email && (
                <div className="card2 rounded-2xl p-3 flex items-center gap-2.5 min-w-0">
                  <Mail size={16} className="text-yellow shrink-0" />
                  <div className="min-w-0">
                    <div className="muted">ایمیل</div>
                    <div className="font-bold truncate" dir="ltr">
                      {contact.email}
                    </div>
                  </div>
                </div>
              )}
              {contact.phone && (
                <div className="card2 rounded-2xl p-3 flex items-center gap-2.5">
                  <Phone size={16} className="text-yellow shrink-0" />
                  <div>
                    <div className="muted">تلفن تماس</div>
                    <div className="font-bold" dir="ltr">
                      {toFa(contact.phone)}
                    </div>
                  </div>
                </div>
              )}
              {contact.address && (
                <div className="card2 rounded-2xl p-3 flex items-center gap-2.5">
                  <MapPin size={16} className="text-yellow shrink-0" />
                  <div className="min-w-0">
                    <div className="muted">نشانی فروشگاه</div>
                    <div className="font-bold truncate">{contact.address}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="card rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package size={19} className="text-yellow" />
            <h2 className="font-black text-base">
              محصولات فروشگاه ({toFa(filteredProducts.length)})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial sm:w-60">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو در این فروشگاه…"
                className="input !py-2 !pr-9 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => setOnlyDiscount((v) => !v)}
              className={`chip flex items-center gap-1 ${onlyDiscount ? 'on' : ''}`}
            >
              <Sparkles size={13} /> تخفیف‌دار
            </button>

            <button
              type="button"
              onClick={() => setOnlyInStock((v) => !v)}
              className={`chip ${onlyInStock ? 'on' : ''}`}
            >
              فقط موجود
            </button>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input !w-auto !py-1.5 text-xs"
              aria-label="مرتب‌سازی محصولات فروشگاه"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ProductGridComponent
          products={filteredProducts}
          loading={loading}
          columns={4}
          emptyTitle="محصولی مطابق فیلتر در این فروشگاه یافت نشد"
        />
      </section>

      <ImageLightboxComponent
        file={zoomFile?.file}
        alt={zoomFile?.alt}
        onClose={() => setZoomFile(null)}
      />
    </div>
  );
}

export default StorePage;
