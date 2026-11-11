export const PLACEHOLDER = 'https://placehold.co/400x400?text=No+Image';

export const getId = (p) => p?._id || p?.id;

export const getName = (p) => p?.name || p?.title || 'بدون نام';

export const getImage = (p) => {
  const img = p?.images?.[0] ?? p?.image ?? p?.thumbnail;
  if (!img) return PLACEHOLDER;
  return typeof img === 'string' ? img : img.url || PLACEHOLDER;
};

export const getPrice = (p) => Number(p?.price) || 0;

export const getDiscount = (p) => Number(p?.discount) || 0;

export const getFinalPrice = (p) => {
  const price = getPrice(p);
  const d = getDiscount(p);
  return d > 0 ? Math.round(price - (price * d) / 100) : price;
};

export const formatPrice = (n) => Number(n || 0).toLocaleString('fa-IR');