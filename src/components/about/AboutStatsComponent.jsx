import { t as translateText } from '../../i18n/runtime.js';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, Store, FolderTree, Heart } from 'lucide-react';
import { getBody } from '../../utils/helpers/response';
import { toFa } from '../../utils/helpers/format';
import { API } from '../../config/api';

// عدد پشتیبان در صورت در دسترس نبودن بک‌اند
const FALLBACK = { products: null, stores: null, categories: null };
/* سال تجربه: فعالیت از ۱۳۸۳ تا امروز */


function AboutStatsComponent() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const pick = (result) => {
      if (result.status !== 'fulfilled') return null;
      const body = getBody(result.value);
      if (Array.isArray(body)) return body.length;
      return Number(body?.total ?? body?.totalDocs ?? body?.data?.length ?? 0) || 0;
    };

    Promise.allSettled([
      axios.get(`${API}/product`, { params: { limit: 1, page: 1 }, signal: controller.signal }),
      axios.get(`${API}/store`, { params: { limit: 1, page: 1 }, signal: controller.signal }),
      axios.get(`${API}/category`, { params: { limit: 100, page: 1 }, signal: controller.signal }),
    ]).then((results) => {
      if (controller.signal.aborted) return;
      setStats({
        products: pick(results[0]),
        stores: pick(results[1]),
        categories: pick(results[2]),
      });
    });

    return () => controller.abort();
  }, []);

  const items = [
    { icon: Package, value: stats?.products == null ? '—' : toFa(stats.products), label: translateText('v20.products') },
    { icon: Store, value: stats?.stores == null ? '—' : toFa(stats.stores), label: translateText("فروشنده و برند") },
    { icon: FolderTree, value: stats?.categories == null ? '—' : toFa(stats.categories), label: translateText("دسته‌بندی") },
    { icon: Heart, value: toFa(4), label: translateText('v20.languages') },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 -mt-12 relative z-10">
      <div className="card rounded-3xl grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 sm:p-6 shadow-xl">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`flex items-center gap-3 ${index > 0 ? 'lg:border-e lg:ps-4' : ''}`}
              style={index > 0 ? { borderColor: 'var(--border)' } : undefined}
            >
              <span
                className="w-11 h-11 rounded-2xl grid place-items-center shrink-0"
                style={{ background: 'rgba(255,214,10,0.14)', color: 'var(--primary-color)' }}
              >
                <Icon size={20} />
              </span>
              <span className="min-w-0">
                <b className="block text-lg font-black leading-tight text-yellow">{item.value}</b>
                <span className="block text-[11px] muted truncate">{item.label}</span>
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[10px] muted mt-2">{translateText('v20.live')}</p>
    </div>
  );
}

export default AboutStatsComponent;
