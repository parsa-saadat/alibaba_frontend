import React from 'react';
import { PackageSearch } from 'lucide-react';
import ProductComponent from './ProductComponent';
import { Loading } from '../common/ScroolToTopComponent';
import { getId } from '../../utils/helpers/response';

function ProductGridComponent({
  products = [],
  loading = false,
  emptyTitle = 'محصولی یافت نشد',
  columns = 4,
  skeletonCount,
  /* اگر مقدار داشته باشد، تعداد ستون‌ها بر اساس عرض واقعی ظرف حساب می‌شود
     تا کارت‌ها در نمایشگرهای کوچک‌تر فشرده نشوند */
  minColumn = null,
}) {
  const fixedGridClass =
    columns === 3
      ? 'grid-cols-2 md:grid-cols-3'
      : columns === 5
        ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'
        : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4';

  const gridClass = minColumn ? 'grid' : `grid ${fixedGridClass}`;

  const gridStyle = minColumn
    ? { gridTemplateColumns: `repeat(auto-fit, minmax(min(${minColumn}px, 100%), 1fr))` }
    : undefined;

  if (loading && !products.length) {
    return (
      <div
        className={`${gridClass} gap-3`}
        style={gridStyle}
        aria-busy="true"
        aria-label="در حال بارگذاری محصولات"
      >
        {Array.from({ length: skeletonCount || columns * 2 }, (_, index) => (
          <div key={index} className="card rounded-2xl overflow-hidden" aria-hidden="true">
            <div className="skeleton aspect-square !rounded-none" />
            <div className="p-3 space-y-3">
              <div className="skeleton h-4" />
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-6 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="card rounded-3xl p-12 text-center min-h-52">
        <PackageSearch size={36} className="mx-auto muted mb-3" />
        <div className="font-black">{emptyTitle}</div>
      </div>
    );
  }

  return (
    <div className="relative" aria-busy={loading}>
      <div
        className={`${gridClass} gap-3 transition-opacity duration-150 ${loading ? 'opacity-35 pointer-events-none' : ''}`}
        style={gridStyle}
        inert={loading ? true : undefined}
      >
        {products.map((product) => (
          <ProductComponent key={getId(product)} product={product} />
        ))}
      </div>
      {loading && (
        <div className="absolute inset-0 flex justify-center items-start pt-16">
          <Loading
            label="در حال به‌روزرسانی محصولات…"
            className="card rounded-full px-5 py-3 shadow-xl sticky top-44"
          />
        </div>
      )}
    </div>
  );
}

export default ProductGridComponent;
