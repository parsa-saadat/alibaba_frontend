import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import StorageImageComponent from './StorageImageComponent';
import { productImages } from '../../utils/helpers/format';

function HeaderComponent({ products = [], categories = [], loading = false }) {
  return (
    <>
      <section
        className="mt-4 rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg,#0a1736 0%,#162e66 55%,#0f2150 100%)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="grid md:grid-cols-2 gap-6 p-8 md:p-12 items-center">
          <div>
            <span className="chip on !cursor-default">بازار داخلی ایران • بدون واردات</span>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mt-4 text-white">
              خرید مستقیم از <span className="text-brand-yellow">فروشندگان ایرانی</span>
            </h1>
            <p className="mt-3 leading-8 text-gray-300">
              هزاران کالا از فروشگاه‌های داخلی با ضمانت اصالت، قیمت شفاف و ارسال سریع به سراسر کشور.
            </p>
            <div className="flex gap-3 mt-6 flex-wrap">
              <Link to="/products" className="btn-yellow">
                شروع خرید
              </Link>
              <Link to="/products?discount=true" className="btn-ghost text-white">
                پیشنهادهای ویژه
              </Link>
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-3 floaty">
            {loading
              ? Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="skeleton aspect-square" />
                ))
              : products.slice(0, 4).map((p) => (
                  <Link
                    key={p._id}
                    to={`/product/${p._id}`}
                    className="rounded-2xl overflow-hidden aspect-square block"
                  >
                    <StorageImageComponent
                      file={productImages(p)[0]}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                ))}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-lg">دسته‌بندی‌ها</h2>
          <Link to="/products" className="text-sm font-bold flex items-center gap-1 text-yellow">
            همه <ChevronLeft size={15} />
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 min-h-10">
          {loading
            ? [0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="skeleton h-8 w-28 shrink-0" />
              ))
            : categories.map((c) => (
                <Link
                  key={c._id}
                  to={`/products?category_id=${c._id}`}
                  className="chip whitespace-nowrap"
                >
                  {c.name}
                </Link>
              ))}
        </div>
      </section>
    </>
  );
}

export default HeaderComponent;
