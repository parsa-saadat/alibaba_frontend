import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GitCompareArrows, Trash2, ShoppingCart, X } from 'lucide-react';
import { useShop } from '../../contexts/ShopContext';
import { cartErrorMessage } from '../../utils/helpers/cart';
import StorageImageComponent from '../../components/common/StorageImageComponent';
import {
  formatPrice,
  finalPrice,
  toFa,
  productImages,
  hasDiscount,
  formatDimensions,
  formatWeight,
} from '../../utils/helpers/format';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ROWS = [
  ['قیمت نهایی', (p) => formatPrice(finalPrice(p))],
  ['قیمت اصلی', (p) => formatPrice(p.price?.amount)],
  ['تخفیف', (p) => (hasDiscount(p) ? `${toFa(p.discount.percentage)}٪` : '—')],
  ['برند', (p) => p.brand || '—'],
  ['سال تولید', (p) => toFa(p.production)],
  ['گارانتی', (p) => (p.warranty ? 'دارد' : 'ندارد')],
  ['موجودی', (p) => `${toFa(p.stock)} عدد`],
  ['ابعاد', (p) => formatDimensions(p.dimensions)],
  ['وزن', (p) => formatWeight(p.weight)],
];

function ComparePage() {
  const { compare, toggleCompare, clearCompare, user, addToCart } = useShop();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!compare.length) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      compare.map((id) =>
        axios
          .get(`${API}/product/${id}`)
          .then((r) => r.data.body)
          .catch(() => null),
      ),
    )
      .then((list) => setProducts(list.filter(Boolean)))
      .finally(() => setLoading(false));
  }, [compare]);

  /* افزودن به سبد: addToCart اول وضعیت محصول را از بک‌اند می‌پرسد */
  const handleAddToCart = (id) => {
    if (!user) return toast.error('ابتدا وارد شوید');
    addToCart(id, 1)
      .then((result) => {
        toast.success(
          result.status === 'updated'
            ? 'تعداد این محصول در سبد خرید افزایش یافت'
            : 'به سبد خرید اضافه شد',
        );
      })
      .catch((error) => toast.error(cartErrorMessage(error, 'خطا در افزودن به سبد')));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="font-black text-2xl flex items-center gap-2">
          <GitCompareArrows size={24} className="text-yellow" /> مقایسه محصولات (
          {toFa(products.length)} از ۴)
        </h1>
        {products.length > 0 && (
          <button
            type="button"
            onClick={clearCompare}
            className="btn-ghost text-xs flex items-center gap-1 text-red-400"
          >
            <Trash2 size={14} /> پاک‌سازی لیست
          </button>
        )}
      </div>

      {!loading && products.length === 0 ? (
        <div className="card rounded-3xl p-12 text-center">
          <GitCompareArrows size={36} className="mx-auto muted mb-3" />
          <div className="font-black">محصولی برای مقایسه انتخاب نشده است</div>
          <Link to="/products" className="btn-yellow inline-block mt-4">
            انتخاب محصول
          </Link>
        </div>
      ) : (
        <div className="card rounded-3xl overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-theme">
                <th className="p-4 text-right muted w-40">مشخصه</th>
                {products.map((p) => (
                  <th key={p._id} className="p-4 align-top">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleCompare(p._id)}
                        className="absolute top-1 left-1 p-1 rounded-full bg-black/50 text-white"
                      >
                        <X size={14} />
                      </button>
                      <StorageImageComponent
                        file={productImages(p)[0]}
                        alt={p.name}
                        className="w-28 h-28 mx-auto rounded-2xl object-cover"
                      />
                      <Link
                        to={`/product/${p._id}`}
                        className="block font-bold mt-2 line-clamp-2"
                      >
                        {p.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(p._id)}
                        className="btn-yellow !py-1.5 !px-3 text-xs mt-2 inline-flex items-center gap-1"
                      >
                        <ShoppingCart size={13} /> افزودن به سبد
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, fn]) => (
                <tr key={label} className="border-b border-theme last:border-0">
                  <td className="p-3.5 muted font-bold">{label}</td>
                  {products.map((p) => (
                    <td key={p._id} className="p-3.5 text-center font-bold">
                      {fn(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ComparePage;
