import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Lock, Plus, Store, Sparkles } from 'lucide-react';
import { toFa } from '../../utils/helpers/format';

/*
 * کارت ظرفیت فروشگاه بر اساس پلن
 * -------------------------------
 * نمایش «۲ از ۳ فروشگاه» با نوار پیشرفت + دکمه‌ی ساخت فروشگاه.
 * اگر ساخت مجاز نباشد، دکمه غیرفعال می‌شود و دلیل + مسیر رفع آن نشان داده می‌شود.
 */
function StoreCapacityComponent({ capacity, onCreate = null, className = '' }) {
  const {
    maxShops = 0,
    used = 0,
    remaining = 0,
    canCreate = false,
    reason = null,
    blockedText = '',
    plan = null,
    planActive = false,
  } = capacity || {};

  const percent = maxShops > 0 ? Math.min(100, Math.round((used / maxShops) * 100)) : 0;
  const full = reason === 'full';
  const barColor = full ? '#e53935' : percent >= 70 ? '#c2740a' : 'var(--primary-color)';

  return (
    <section className={`card rounded-2xl p-4 sm:p-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <b className="flex items-center gap-2 text-sm">
            <Store size={16} className="text-yellow" />{translateText("ظرفیت فروشگاه‌های شما ")}</b>
          <p className="mt-1 text-xs muted">
            {plan
              ? translateText("پلن «{{v0}}» — {{v1}} فروشگاه مجاز", {v0: (plan.name),v1: (toFa(maxShops))})
              : translateText("پلن فروشندگی فعالی برای این حساب ثبت نشده است.")}
            {planActive && remaining > 0 ? translateText(" • {{v0}} ظرفیت آزاد", {v0: (toFa(remaining))}) : ''}
          </p>
        </div>

        {onCreate && canCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="btn-yellow !py-2 !px-3 text-xs flex items-center gap-1.5"
          >
            <Plus size={14} />{translateText(" فروشگاه جدید ")}</button>
        ) : onCreate ? (
          <button
            type="button"
            disabled
            title={blockedText}
            className="btn-ghost !py-2 !px-3 text-xs flex items-center gap-1.5 opacity-60 cursor-not-allowed"
          >
            <Lock size={14} />{translateText(" فروشگاه جدید ")}</button>
        ) : null}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] muted mb-1.5">
          <span>
            {toFa(used)}{translateText(" از ")}{toFa(maxShops)}{translateText(" فروشگاه ")}</span>
          <span>{toFa(percent)}{translateText("٪")}</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ background: 'var(--card2)' }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${percent}%`, background: barColor }}
          />
        </div>
      </div>

      {!canCreate && blockedText ? (
        <div
          className="mt-3 flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-[11px]"
          style={{ background: 'rgba(229,57,53,0.10)', color: 'var(--text)' }}
        >
          <AlertTriangle size={14} className="text-red-400 shrink-0" />
          <span className="min-w-0">{blockedText}</span>
          {reason === 'not-seller' || reason === 'no-plan' || reason === 'expired' ? (
            <Link to="/seller/plans" className="btn-yellow !py-1 !px-2.5 text-[11px] flex items-center gap-1">
              <Sparkles size={12} /> {reason === 'expired' ? translateText("تمدید پلن") : translateText("تهیه پلن")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default StoreCapacityComponent;
