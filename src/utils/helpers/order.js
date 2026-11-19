import { language, formatMoney } from '../../i18n/runtime';

// Stored order amounts are locked IRR, never amounts in the current catalog currency.
export const formatOrderPrice = (amount) => formatMoney(amount, 'IRR');
export const formatCompactOrderPrice = (amount) =>
  formatMoney(amount, 'IRR', { notation: 'compact', maximumFractionDigits: 1 });
export const orderItemName = (item) =>
  item?.translations?.[language]?.name ||
  item?.name ||
  item?.product_name ||
  { en: 'Item', fa: 'کالا', ar: 'عنصر', tr: 'Ürün' }[language];
export const orderItemUnitPrice = (item) =>
  Number(
    item?.price?.amount ?? item?.unit_price ?? (typeof item?.price === 'number' ? item.price : 0),
  ) || 0;
