import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { RefreshCw } from 'lucide-react';

/*
 * سرصفحه‌ی مشترک صفحه‌های پنل (ادمین و فروشنده)
 * ---------------------------------------------
 * همه‌ی صفحه‌های پنل یک هدر یکسان دارند: آیکن در کادر زرد، عنوان، توضیح کوتاه،
 * دکمه‌های میان‌بر و دکمه‌ی «به‌روزرسانی» — دقیقاً همان طراحی صفحه‌ی کاربران.
 *
 * مثال:
 * <PanelPageHeader
 *   icon={Package}
 *   title="مدیریت محصولات"
 *   subtitle="همه‌ی کالاهای فروشگاه"
 *   onRefresh={() => load(true)}
 *   refreshing={refreshing}
 * />
 */
function PanelPageHeader({
  icon: Icon,
  title,
  subtitle = '',
  actions = null,
  onRefresh = null,
  refreshing = false,
  refreshLabel = translateText("به‌روزرسانی"),
  children = null,
}) {
  return (
    <section className="card rounded-3xl overflow-hidden">
      <div
        className="p-5 flex flex-wrap items-center justify-between gap-4"
        style={{
          background: 'linear-gradient(115deg, rgba(255,106,0,0.16), rgba(255,106,0,0) 58%)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {Icon ? (
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
              style={{ background: 'var(--primary-color)', color: '#242424' }}
            >
              <Icon size={22} />
            </span>
          ) : null}
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black truncate">{title}</h1>
            {subtitle ? <p className="mt-1 text-xs muted">{subtitle}</p> : null}
          </div>
        </div>

        {(actions || onRefresh) && (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="btn-primary !py-2 !px-3 text-xs flex items-center gap-1.5 disabled:opacity-60"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? translateText("در حال به‌روزرسانی…") : refreshLabel}
              </button>
            ) : null}
          </div>
        )}
      </div>

      {children ? <div className="border-t border-theme p-4">{children}</div> : null}
    </section>
  );
}

export default PanelPageHeader;
