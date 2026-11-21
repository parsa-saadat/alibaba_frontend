import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, Flag, Target, Users } from 'lucide-react';

// سه تعهد اصلی برند
const COMMITMENTS = [
  translateText("b2b.sellersDesc"),
  translateText("b2b.compareDesc"),
  translateText("b2b.webSupportDesc"),
];

function AboutStoryComponent() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 py-10 grid gap-6 lg:grid-cols-3">
      {/* داستان */}
      <div className="lg:col-span-2 card rounded-3xl p-6 sm:p-8">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-yellow">
          <Flag size={13} />{translateText("داستان ما ")}</span>
        <h2 className="font-black text-xl sm:text-2xl mt-2 leading-tight">{translateText("v20.communication")}</h2>

        <p className="text-sm muted leading-8 mt-4">{translateText("b2b.intro")}{' '}
          <a
            href="/products"
            target="_blank"
            rel="noreferrer"
            className="font-bold hover-yellow transition-colors"
            style={{ color: 'var(--primary-color)' }}
          >{translateText("b2b.catalog")}</a>{' '}{translateText("v20.explore")}</p>
        <p className="text-sm muted leading-8 mt-3">{translateText("b2b.responsibilityDesc")}</p>

        <ul className="mt-5 space-y-2">
          {COMMITMENTS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs sm:text-sm leading-6">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-yellow" />
              {item}
            </li>
          ))}
        </ul>

        <div
          className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl px-3 py-2 text-[11px]"
          style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
        >
          <span className="muted">{translateText("v20.scope")}</span>
          <b className="font-black">{translateText("v20.platform")}</b>
          <span className="muted">{translateText("v20.noRetail")}</span>
        </div>

        <Link
          to="/contact"
          className="inline-flex items-center gap-1 text-xs font-bold text-yellow mt-4"
        >{translateText("گفتگو با تیم ژئوکالا ")}<ChevronLeft className="logical-icon" size={14} />
        </Link>
      </div>

      {/* ماموریت و چشم‌انداز */}
      <div className="flex flex-col gap-4">
        <div
          className="rounded-3xl p-6 text-white"
          style={{
            background: 'linear-gradient(150deg, var(--navy-soft), var(--navy-deep))',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span
            className="w-10 h-10 rounded-xl grid place-items-center"
            style={{ background: 'rgba(255,106,0,0.16)', color: 'var(--primary-color)' }}
          >
            <Target size={18} />
          </span>
          <b className="block font-black text-sm mt-3">{translateText("ماموریت ما")}</b>
          <p className="text-[11px] leading-6 text-white/70 mt-1.5">{translateText("v20.mission")}</p>
        </div>

        <div className="card rounded-3xl p-6 flex-1">
          <span
            className="w-10 h-10 rounded-xl grid place-items-center"
            style={{ background: 'rgba(255,106,0,0.14)', color: 'var(--primary-color)' }}
          >
            <Users size={18} />
          </span>
          <b className="block font-black text-sm mt-3">{translateText("چشم‌انداز ما")}</b>
          <p className="text-[11px] muted leading-6 mt-1.5">{translateText("v20.vision")}</p>
        </div>
      </div>
    </section>
  );
}

export default AboutStoryComponent;
