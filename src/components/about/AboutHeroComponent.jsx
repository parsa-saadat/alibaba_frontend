import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Headset, ShieldCheck, Truck } from 'lucide-react';
import PageHeroComponent from '../common/PageHeroComponent';

const HERO_HIGHLIGHTS = [
  { icon: ShieldCheck, label: translateText("کالای اصل با گارانتی") },
  { icon: Truck, label: translateText("ارسال به سراسر کشور") },
  { icon: Headset, label: translateText("مشاوره فنی تخصصی") },
];

function AboutHeroComponent() {
  return (
    <PageHeroComponent
      breadcrumb={translateText("درباره ما")}
      badge={translateText("درباره ژئوکالا")}
      title={translateText("فروشگاه تخصصی تجهیزات نقشه‌برداری")}
      description={translateText("ژئوکالا زیرمجموعه‌ی شرکت بازرگانی فناوری سران ماهان آسیا است؛ مجموعه‌ای با بیش از دو دهه تجربه در واردات و تجارت تجهیزات نقشه‌برداری. این‌جا جی‌پی‌اس ایستگاهی، توتال استیشن، دوربین نقشه‌برداری، کنترولر و لوازم جانبی را با مشاوره‌ی فنی و ضمانت اصالت کالا پیدا می‌کنید.")}
      highlights={HERO_HIGHLIGHTS}
      actions={
        <>
          <Link to="/products" className="btn-yellow inline-flex items-center gap-2">{translateText("شروع خرید ")}<ChevronLeft className="logical-icon" size={16} />
          </Link>
          <Link
            to="/seller"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }}
          >{translateText("فروش در ژئوکالا ")}</Link>
        </>
      }
    />
  );
}

export default AboutHeroComponent;
