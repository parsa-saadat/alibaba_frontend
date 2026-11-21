import React from 'react';
import { ChevronLeft } from 'lucide-react';

/*
 * عنوان بخش به سبک Alibaba.com: متن بولد در ابتدای سطر و فلش در انتهای آن
 * (در RTL فلش سمت چپ است). در دسکتاپ هم همان چیدمان با متن بزرگ‌تر.
 */
function SectionTitle({ children, id }) {
  return (
    <div id={id} className="flex items-center justify-between gap-3 py-4 sm:py-5">
      <h2 className="text-[15px] sm:text-lg font-black">{children}</h2>
      <ChevronLeft className="logical-icon shrink-0" size={18} style={{ color: 'var(--accent-text)' }} />
    </div>
  );
}

export default SectionTitle;
