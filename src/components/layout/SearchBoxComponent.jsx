import React from 'react';
import ProductSearchBox from '../common/ProductSearchBox';

/* باکس جستجوی هدر — منطق مشترکش با جستجوی صفحه اول در ProductSearchBox است */
function SearchBoxComponent({ placeholder }) {
  return <ProductSearchBox variant="compact" placeholder={placeholder} />;
}

export default SearchBoxComponent;
