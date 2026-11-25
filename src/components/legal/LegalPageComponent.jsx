import { t as translateText } from '../../i18n/runtime.js';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, FileText, ListTree, ShieldQuestion } from 'lucide-react';

/*
 * قالب مشترک صفحه‌های حقوقی (قوانین خریداران، قوانین فروشندگان، حریم خصوصی).
 * - هدر با گرادیان و نشان
 * - فهرست مطالب چسبان در دسکتاپ
 * - بخش‌ها به‌صورت شماره‌دار و کارت‌بندی‌شده
 * - لینک سریع به بخش تماس در انتها
 */

function SectionCard({ section, index }) {
  return (
    <article
      id={section.id}
      className="card scroll-mt-28 rounded-3xl p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[11px] font-black tabular-nums"
          style={{ background: 'rgba(255,106,0,0.14)', color: 'var(--accent-text)' }}
        >
          {index}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-black leading-6 sm:text-base">{section.title}</h2>

          {section.paragraphs?.map((text, i) => (
            <p key={i} className="mt-2 text-xs leading-7 muted">
              {text}
            </p>
          ))}

          {section.items?.length > 0 && (
            <ul className="mt-3 space-y-2">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs leading-6">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: 'var(--primary-color)' }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}

          {section.note && (
            <p
              className="mt-3 rounded-xl px-3 py-2 text-[11px] leading-6"
              style={{
                background: 'color-mix(in srgb, var(--primary-color) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--primary-color) 26%, transparent)',
              }}
            >
              {section.note}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function LegalPageComponent({
  icon: Icon = FileText,
  badge,
  title,
  subtitle,
  updated,
  sections = [],
  highlights = [],
  footerNote,
  tabs = [],
  activeTab = '',
  crumb = translateText("قوانین و مقررات"),
}) {
  const [active, setActive] = useState(sections[0]?.id || '');

  /* تشخیص بخش فعال با اسکرول */
  useEffect(() => {
    const onScroll = () => {
      let current = sections[0]?.id || '';
      sections.forEach((section) => {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= 180) current = section.id;
      });
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sections]);

  const numbered = useMemo(
    () => sections.map((section, index) => ({ ...section, no: index + 1 })),
    [sections],
  );

  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-7">
      {/* مسیر */}
      <nav className="mb-3 flex items-center gap-1 text-[11px] muted">
        <Link to="/" className="hover-accent">{translateText("خانه ")}</Link>
        <ChevronLeft className="logical-icon" size={12} />
        <span>{crumb}</span>
        <ChevronLeft className="logical-icon" size={12} />
        <span className="font-bold" style={{ color: 'var(--accent-text)' }}>
          {title}
        </span>
      </nav>

      {/* تب‌های نسخه‌های قوانین */}
      {tabs.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-2xl p-1.5" style={{ background: 'var(--card2)' }}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Link
                key={tab.key}
                to={tab.to}
                aria-current={isActive ? 'page' : undefined}
                className="rounded-xl px-3 py-1.5 text-[11px] font-bold transition-colors"
                style={{
                  background: isActive ? 'var(--card)' : 'transparent',
                  color: isActive ? 'var(--accent-text)' : 'var(--muted)',
                  boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* هدر */}
      <header
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
        style={{
          background:
            'radial-gradient(circle at 85% 10%, rgba(255,106,0,0.20) 0%, rgba(255,106,0,0) 55%), linear-gradient(150deg, var(--charcoal-soft), var(--charcoal-deep))',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-lg"
              style={{ background: 'var(--primary-color)', color: 'var(--on-primary)' }}
            >
              <Icon size={22} />
            </span>
            <div className="min-w-0">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold"
                style={{ background: 'rgba(255,106,0,0.14)', color: 'var(--primary-color)' }}
              >
                <ShieldQuestion size={12} />
                {badge}
              </span>
              <h1 className="mt-2 text-lg font-black text-white sm:text-2xl">{title}</h1>
              <p className="mt-2 max-w-xl text-xs leading-6 text-white/70">{subtitle}</p>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl px-4 py-3 text-center ring-1 ring-white/10">
            <span className="block text-[10px] text-white/60">{translateText("آخرین بازنگری")}</span>
            <b className="mt-0.5 block text-xs text-white">{updated}</b>
          </div>
        </div>

        {highlights.length > 0 && (
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {highlights.map((item) => (
              <li
                key={item}
                className="rounded-xl bg-white/[0.06] px-3 py-2 text-[11px] leading-6 text-white/80 ring-1 ring-white/[0.08]"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[260px_1fr]">
        {/* فهرست مطالب */}
        <aside className="hidden lg:block">
          <div className="card sticky top-[calc(var(--header-h,96px)+12px)] rounded-3xl p-4">
            <b className="flex items-center gap-1.5 text-xs font-black">
              <ListTree size={14} style={{ color: 'var(--accent-text)' }} />{translateText("فهرست مطالب ")}</b>
            <nav className="mt-3 space-y-1">
              {numbered.map((section) => {
                const isActive = active === section.id;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] leading-5 transition"
                    style={{
                      background: isActive
                        ? 'color-mix(in srgb, var(--primary-color) 14%, transparent)'
                        : 'transparent',
                      color: isActive ? 'var(--accent-text)' : 'var(--muted)',
                      fontWeight: isActive ? 800 : 600,
                    }}
                  >
                    <span className="tabular-nums">{section.no}.</span>
                    <span className="truncate">{section.title}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* متن */}
        <div className="space-y-3">
          {numbered.map((section) => (
            <SectionCard key={section.id} section={section} index={section.no} />
          ))}

          <div className="card rounded-3xl p-5 sm:p-6">
            <b className="text-sm font-black">{translateText("سؤالی مانده؟")}</b>
            <p className="mt-2 text-xs leading-6 muted">
              {footerNote ||
                translateText("b2b.webSupportDesc")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/contact" className="btn-primary !py-2 text-xs">{translateText("b2b.webSupport")}</Link>
              <Link to="/about" className="btn-ghost !py-2 text-xs">{translateText("درباره ژئوکالا ")}</Link>
              {tabs
                .filter((tab) => tab.key !== activeTab)
                .map((tab) => (
                  <Link key={tab.key} to={tab.to} className="btn-ghost !py-2 text-xs">
                    {tab.label}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LegalPageComponent;
