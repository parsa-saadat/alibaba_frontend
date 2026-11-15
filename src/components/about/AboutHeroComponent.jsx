import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Headset, ShieldCheck, Truck } from 'lucide-react';
import PageHeroComponent from '../common/PageHeroComponent';

const HERO_HIGHLIGHTS = [
  { icon: ShieldCheck, label: 'کالای اصل با گارانتی' },
  { icon: Truck, label: 'ارسال به سراسر کشور' },
  { icon: Headset, label: 'مشاوره فنی تخصصی' },
];

function AboutHeroComponent() {
  return (
    <PageHeroComponent
      breadcrumb="درباره ما"
      badge="درباره ژئو کالا"
      title="بازارگاه تخصصی تجهیزات نقشه‌برداری"
      description="ژئو کالا زیرمجموعه‌ی شرکت بازرگانی فناوری سران ماهان آسیا است؛ مجموعه‌ای با بیش از دو دهه تجربه در واردات و تجارت تجهیزات نقشه‌برداری. این‌جا جی‌پی‌اس ایستگاهی، توتال استیشن، دوربین نقشه‌برداری، کنترولر و لوازم جانبی را با مشاوره‌ی فنی و ضمانت اصالت کالا پیدا می‌کنید."
      highlights={HERO_HIGHLIGHTS}
      actions={
        <>
          <Link to="/products" className="btn-yellow inline-flex items-center gap-2">
            شروع خرید
            <ChevronLeft size={16} />
          </Link>
          <Link
            to="/seller"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }}
          >
            فروش در ژئو کالا
          </Link>
        </>
      }
    />
  );
}

export default AboutHeroComponent;
