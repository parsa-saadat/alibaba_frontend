import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Sparkles } from 'lucide-react';

/* بنر مشترک صفحات «درباره ما»، «تماس با ما» و ورود/ثبت‌نام */
function PageHeroComponent({ breadcrumb, badge, title, description, highlights = [], actions = null, children = null }) {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 14% 16%, rgba(255,214,10,0.16) 0%, rgba(255,214,10,0) 52%), linear-gradient(135deg, var(--navy-mid) 0%, var(--navy-deep) 100%)',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 pt-6 pb-20">
        <nav className="flex items-center gap-1.5 text-[11px] text-white/60">
          <Link to="/" className="hover:text-white transition-colors">خانه</Link>
          <ChevronLeft size={12} />
          <span className="text-white/90">{breadcrumb}</span>
        </nav>

        <div className="mt-7 max-w-2xl">
          {badge && (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full px-3 py-1"
              style={{ background: 'rgba(255,214,10,0.14)', color: 'var(--primary-color)' }}
            >
              <Sparkles size={12} />
              {badge}
            </span>
          )}
          <h1 className="font-black text-2xl sm:text-4xl text-white mt-3 leading-tight">{title}</h1>
          {description && <p className="text-xs sm:text-sm text-white/70 leading-7 mt-3">{description}</p>}
          {actions && <div className="flex flex-wrap items-center gap-3 mt-5">{actions}</div>}
        </div>

        {highlights.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-white/70">
                  {Icon && <Icon size={14} style={{ color: 'var(--primary-color)' }} />}
                  {item.label}
                </span>
              );
            })}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export default PageHeroComponent;
