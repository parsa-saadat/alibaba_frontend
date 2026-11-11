import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TitleComponent from './TitleComponent';
import ProductComponent, { ProductSkeleton } from './ProductComponent';

function ProductScrollerComponent({
  partone,
  parttwo,
  icon,
  subtitle,
  extra = null,
  products = [],
  loading = false,
  moreTo = '/products',
  emptyText = 'محصولی موجود نیست',
}) {
  const rowRef = useRef(null);

  // dir = 1 → جلو (در RTL یعنی به سمت چپ)، dir = -1 → عقب
  const scroll = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl';
    el.scrollBy({
      left: dir * (rtl ? -1 : 1) * el.clientWidth * 0.8,
      behavior: 'smooth',
    });
  };

  const arrow =
    'hidden md:grid w-9 h-9 rounded-full card place-items-center hover:text-yellow transition-colors';

  return (
    <section className="mt-8 card rounded-3xl p-4 sm:p-5">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-3">
        <div>
          <TitleComponent partone={partone} parttwo={parttwo} icon={icon} />
          {subtitle && <p className="text-xs muted mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {extra}
          <Link to={moreTo} className="text-sm font-bold flex items-center gap-1 text-yellow">
            مشاهده همه <ChevronLeft size={15} />
          </Link>
          <button type="button" onClick={() => scroll(-1)} className={arrow} aria-label="قبلی">
            <ChevronRight size={18} />
          </button>
          <button type="button" onClick={() => scroll(1)} className={arrow} aria-label="بعدی">
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {!loading && products.length === 0 ? (
        <div className="py-10 text-center text-sm muted">{emptyText}</div>
      ) : (
        <div
          ref={rowRef}
          className="flex items-stretch gap-3 overflow-x-auto snap-x snap-proximity scroll-smooth py-2 no-scrollbar"
        >
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="w-[172px] sm:w-[200px] lg:w-[220px] shrink-0">
                  <ProductSkeleton />
                </div>
              ))
            : products.map((p) => (
                <div
                  key={p._id}
                  className="w-[172px] sm:w-[200px] lg:w-[220px] shrink-0 snap-start flex"
                >
                  <ProductComponent product={p} />
                </div>
              ))}
        </div>
      )}
    </section>
  );
}

export default ProductScrollerComponent;