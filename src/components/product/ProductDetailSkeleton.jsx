import React from 'react';
import { t } from '../../i18n/runtime.js';

const Block = ({ className = '' }) => <div className={`skeleton rounded-xl ${className}`} />;

/** Uses the same responsive columns and mobile order as the loaded product. */
export default function ProductDetailSkeleton({ direction }) {
  return (
    <main dir={direction} data-testid="product-detail-loading" aria-busy="true" className="product-detail-page product-detail-loading mx-auto site-width max-w-7xl px-4 pt-6 pb-24 md:pt-8 md:pb-24 lg:pb-12">
      <span role="status" className="sr-only">{t('در حال بارگذاری جزئیات محصول…')}</span>
      <div className="product-mobile-tabs product-loading-tabs" aria-hidden="true">
        {[0, 1, 2].map(i => <Block key={i} className="h-3 w-20" />)}
      </div>
      <div className="product-loading-breadcrumb mb-6 flex gap-2" aria-hidden="true"><Block className="h-4 w-16" /><Block className="h-4 w-28" /></div>
      <div className="product-hero-grid" aria-hidden="true">
        <div className="product-hero-gallery">
          <div className="card rounded-2xl p-3"><Block className="aspect-square w-full" /></div>
          <div className="product-loading-thumbs mt-3 flex gap-2">{[0,1,2,3].map(i => <Block key={i} className="h-16 flex-1" />)}</div>
        </div>
        <section className="product-mobile-summary space-y-3"><Block className="h-16 w-full" /><Block className="h-5 w-4/5" /><Block className="h-3 w-3/5" /></section>
        <div className="product-hero-info space-y-5">
          <div className="product-loading-desktop-intro space-y-4"><Block className="h-7 w-2/5" /><Block className="h-7 w-full" /><Block className="h-5 w-3/4" /><Block className="h-12 w-full" /></div>
          <div className="card rounded-2xl p-4 space-y-4"><Block className="h-5 w-2/5" /><div className="grid grid-cols-2 gap-3">{[0,1,2,3,4,5].map(i => <Block key={i} className="h-12" />)}</div></div>
        </div>
        <div className="product-hero-purchase">
          <div className="card rounded-2xl p-5 space-y-4"><Block className="h-9 w-3/4" /><Block className="h-4 w-1/2" /><Block className="h-12 w-full" /><div className="flex gap-2"><Block className="h-11 flex-1" /><Block className="h-11 flex-1" /></div><Block className="h-4 w-4/5" /></div>
          <aside className="card rounded-2xl p-5 mt-4 space-y-3"><Block className="h-12 w-full" /><Block className="h-4 w-3/4" /><Block className="h-10 w-full" /></aside>
        </div>
      </div>
      <div className="product-loading-mobile-actions" aria-hidden="true"><Block className="h-10 w-10" /><Block className="h-10 flex-1" /><Block className="h-10 w-24" /></div>
    </main>
  );
}
