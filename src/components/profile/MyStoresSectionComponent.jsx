import { t as translateText } from '../../i18n/runtime.js';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpLeft, CheckCircle2, PauseCircle, Ban, Plus, Store } from 'lucide-react';
import StorageImageComponent from '../common/StorageImageComponent';
import StoreEditorModalComponent from '../panel/StoreEditorModalComponent';
import StoreCapacityComponent from '../panel/StoreCapacityComponent';
import useStoreCapacity from '../../hooks/useStoreCapacity';
import { getId } from '../../utils/helpers/response';
import { toFa, statusFa } from '../../utils/helpers/format';

/*
 * بخش «فروشگاه‌های من» در پنل کاربری مشتری
 * ----------------------------------------
 * مشتری فروشگاه‌های خودش را می‌بیند، ظرفیت پلن را می‌داند و اگر پلن ظرفیت داشت
 * می‌تواند فروشگاه جدید بسازد. اگر ظرفیت پر باشد یا پلن نداشته باشد، دکمه‌ی
 * ساخت فروشگاه غیرفعال می‌شود و دلیلش نوشته می‌شود.
 */
const STATUS_META = {
  ENABLE: { color: '#17994f', bg: 'rgba(23,153,79,0.14)', icon: CheckCircle2 },
  DISABLE: { color: '#c2740a', bg: 'rgba(194,116,10,0.14)', icon: PauseCircle },
  ROOT_DISABLE: { color: '#e53935', bg: 'rgba(229,57,53,0.14)', icon: Ban },
};

function MyStoresSectionComponent() {
  const capacity = useStoreCapacity();
  const [creating, setCreating] = useState(false);
  const { stores = [], loading } = capacity;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <b className="flex items-center gap-2 text-sm">
          <Store size={16} className="text-yellow" />{translateText("فروشگاه‌های من ")}<span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: 'var(--card2)' }}>
            {toFa(stores.length)}
          </span>
        </b>
        <Link to="/seller/stores" className="btn-ghost !py-1.5 !px-2.5 text-[11px] flex items-center gap-1">{translateText("مدیریت در پنل فروشنده ")}<ArrowUpLeft size={12} />
        </Link>
      </div>

      <StoreCapacityComponent capacity={capacity} onCreate={() => setCreating(true)} />

      {loading ? (
        <div className="card rounded-2xl p-6 text-center text-xs muted">{translateText("در حال دریافت فروشگاه‌ها…")}</div>
      ) : stores.length === 0 ? (
        <div className="card rounded-2xl p-6 text-center space-y-2">
          <Store size={22} className="mx-auto muted" />
          <p className="text-xs muted">{translateText("هنوز فروشگاهی نساخته‌اید.")}</p>
          {capacity.canCreate ? (
            <button type="button" onClick={() => setCreating(true)} className="btn-yellow !py-2 !px-3 text-xs inline-flex items-center gap-1.5">
              <Plus size={14} />{translateText(" ساخت فروشگاه ")}</button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {stores.map((store) => {
            const id = getId(store);
            const meta = STATUS_META[store.status] || STATUS_META.DISABLE;
            const StatusIcon = meta.icon;
            return (
              <article key={id} className="card rounded-2xl p-3 flex items-center gap-3">
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl" style={{ background: 'var(--card2)' }}>
                  {store.profile_image_id ? (
                    <StorageImageComponent file={store.profile_image_id} alt={store.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center font-black text-yellow">
                      {(store.name || translateText("ف"))[0]}
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-xs">{store.name || translateText("فروشگاه")}</b>
                  <span
                    className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <StatusIcon size={11} /> {statusFa(store.status)}
                  </span>
                </div>
                {id ? (
                  <Link to={`/store/${id}`} className="btn-ghost !py-1 !px-2 text-[11px] shrink-0">{translateText("مشاهده ")}</Link>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {creating ? (
        <StoreEditorModalComponent
          store={null}
          onClose={() => setCreating(false)}
          onSaved={() => {
            capacity.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

export default MyStoresSectionComponent;
