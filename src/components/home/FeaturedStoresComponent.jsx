import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import StorageImageComponent from '../common/StorageImageComponent';
import SectionTitle from '../common/SectionTitle';

function FeaturedStoresComponent({ stores = [] }) {
  if (!stores.length) return null;

  return (
    <section className="pb-4">
      <div className="max-w-[1440px] mx-auto px-4">
        <SectionTitle id="stores">{translateText("فروشگاه‌های برگزیده")}</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stores.slice(0, 4).map((s) => (
            <Link
              key={s._id}
              to={`/store/${s._id}`}
              className="card rounded-2xl p-4 flex gap-3 hover:-translate-y-1 transition-transform"
            >
              <StorageImageComponent
                compact
                file={s.profile_image_id}
                alt={s.name}
                className="w-14 h-14 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0">
                <div className="font-black truncate">{s.name}</div>
                <div className="mt-0.5 flex items-center gap-1 text-xs font-bold text-yellow">
                  <BadgeCheck size={14} />{translateText(" فروشنده تأیید شده ")}</div>
                <p className="mt-1 text-xs muted line-clamp-2">
                  {s.description || translateText("فروشگاه ایرانی")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedStoresComponent;