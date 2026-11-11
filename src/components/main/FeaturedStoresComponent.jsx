import React from 'react';
import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import StorageImageComponent from './StorageImageComponent';
import TitleComponent from './TitleComponent';

function FeaturedStoresComponent({ stores = [] }) {
  return (
    <section className="mt-8">
      <div className="mb-4">
        <TitleComponent partone="فروشگاه‌های" parttwo="برگزیده" icon={Store} />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stores.slice(0, 4).map((s) => (
          <Link
            key={s._id}
            to={`/store/${s._id}`}
            className="card rounded-2xl p-4 hover:-translate-y-1 transition-transform"
          >
            <StorageImageComponent
              file={s.profile_image_id}
              alt={s.name}
              className="w-12 h-12 rounded-2xl object-cover mb-3"
            />
            <div className="font-black">{s.name}</div>
            <div className="text-xs muted mt-1 line-clamp-2">
              {s.description || 'فروشگاه ایرانی'}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default FeaturedStoresComponent;
