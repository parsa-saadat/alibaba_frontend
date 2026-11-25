import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Headset, ShieldCheck, Truck } from 'lucide-react';
import PageHeroComponent from '../common/PageHeroComponent';

const HERO_HIGHLIGHTS = [
  { icon: ShieldCheck, label: translateText("b2b.sellers") },
  { icon: Truck, label: translateText("b2b.multilingual") },
  { icon: Headset, label: translateText("b2b.webSupport") },
];

function AboutHeroComponent() {
  return (
    <PageHeroComponent
      breadcrumb={translateText("درباره ما")}
      badge={translateText("درباره ژئوکالا")}
      title={translateText("b2b.identity")}
      description={translateText("b2b.intro")}
      highlights={HERO_HIGHLIGHTS}
      actions={
        <>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">{translateText("شروع خرید ")}<ChevronLeft className="logical-icon" size={16} />
          </Link>
          <Link
            to="/seller"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-[var(--text)] transition-colors"
            style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
          >{translateText("فروش در ژئوکالا ")}</Link>
        </>
      }
    />
  );
}

export default AboutHeroComponent;
