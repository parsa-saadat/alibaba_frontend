import React from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, ChevronLeft } from 'lucide-react';
import MiniProductComponent, { MiniProductSkeleton } from './MiniProductComponent';

function DealPanel({
  title,
  icon: Icon,
  perks = [],
  extra = null,
  products = [],
  loading = false,
  moreTo = '/products',
  emptyText = 'محصولی موجود نیست',
}) {
  return (
    <section
      className="relative rounded-xl overflow-hidden text-white"
      style={{ background: 'linear-gradient(180deg,#8f2236 0%,#5e1423 100%)' }}
    >
      <div className="px-5 pt-5 text-center">
        <Link
          to={moreTo}
          className="hidden sm:flex absolute top-5 start-5 items-center gap-0.5 text-xs text-white/80 hover:text-white"
        >
          مشاهده همه <ChevronLeft size={13} />
        </Link>

        <h2 className="text-2xl md:text-[28px] font-extrabold flex items-center justify-center gap-2">
          {Icon && <Icon size={26} />}
          {title}
        </h2>

        <div className="mt-2 flex items-center justify-center gap-x-4 gap-y-1 flex-wrap text-[13px] font-semibold">
          {perks.map((t) => (
            <span key={t} className="flex items-center gap-1">
              <BadgeCheck size={15} /> {t}
            </span>
          ))}
          {extra}
        </div>
      </div>

      <div className="p-4">
        {!loading && products.length === 0 ? (
          <div className="py-10 text-center text-sm text-white/80">{emptyText}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {loading
              ? Array.from({ length: 4 }, (_, i) => <MiniProductSkeleton key={i} />)
              : products.map((p) => <MiniProductComponent key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </section>
  );
}

export default DealPanel;