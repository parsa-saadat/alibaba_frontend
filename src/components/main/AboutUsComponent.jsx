import React from 'react';

function AboutUsComponent() {
  return (
    <div className="text-center mb-10">
      <div
        className="w-16 h-16 rounded-3xl grid place-items-center font-black text-3xl mx-auto mb-4"
        style={{ background: 'var(--primary-color)', color: 'var(--navy)' }}
      >
        ع
      </div>
      <h1 className="font-black text-3xl">درباره علی‌بازار</h1>
      <p className="muted mt-3 leading-8 max-w-2xl mx-auto">
        علی‌بازار یک بازارگاه داخلی ایرانی است؛ الهام‌گرفته از علی‌اکسپرس و علی‌بابا، اما بدون واردات
        و صادرات. ما فروشندگان ایرانی را مستقیم به خریداران وصل می‌کنیم.
      </p>
    </div>
  );
}

export default AboutUsComponent;
