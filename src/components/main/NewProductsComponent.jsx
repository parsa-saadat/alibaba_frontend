import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import ProductScrollerComponent from './ProductScrollerComponent';
import { useShop } from '../../contexts/ShopContext';
import { hasDiscount, ratingOf } from '../../utils/helpers/format';
import { readList } from '../../utils/helpers/storage';

function NewProductsComponent({ products = [], loading = false }) {
  const { user, favorites } = useShop();

  const bestSellers = useMemo(
    () => [...products].sort((a, b) => (b.sold_count ?? 0) - (a.sold_count ?? 0)).slice(0, 14),
    [products],
  );

  const personalised = useMemo(() => {
    if (!user) return bestSellers;
    const history = readList('history');
    const favProducts = products.filter((p) => favorites.includes(p._id));
    const brands = new Set(favProducts.map((p) => p.brand));
    const cats = new Set(favProducts.map((p) => String(p.category_id)));
    return [...products]
      .map((p) => {
        let score = (p.sold_count ?? 0) / 10 + ratingOf(p);
        if (brands.has(p.brand)) score += 50;
        if (cats.has(String(p.category_id))) score += 40;
        if (history.includes(p._id)) score += 30;
        if (hasDiscount(p)) score += 12;
        return { p, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((x) => x.p)
      .slice(0, 14);
  }, [products, user, favorites, bestSellers]);

  return (
    <ProductScrollerComponent
      partone={user ? 'پیشنهاد ویژه' : 'پرفروش‌ترین'}
      parttwo={user ? 'برای شما' : 'محصولات'}
      icon={Sparkles}
      subtitle={user ? 'بر اساس علاقه‌مندی‌ها، برندهای محبوب و بازدیدهای شما' : undefined}
      products={personalised}
      loading={loading}
      moreTo="/products"
    />
  );
}

export default NewProductsComponent;