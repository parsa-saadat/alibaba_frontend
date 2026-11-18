import { language } from '../../i18n/runtime';
import { t as translateText } from '../../i18n/runtime.js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import {
  JALALI_MONTHS,
  JALALI_WEEKDAYS,
  enDigits,
  faDigits,
  jalaliMonthLength,
  jalaliOfDate,
  pad2,
  parseLocalInputValue,
  toGregorian,
  weekdayColumn,
  toLocalInputValue,
} from '../../utils/helpers/jalali';

/*
 * انتخابگر تاریخ و ساعت شمسی
 * --------------------------
 * مقدار ورودی/خروجی همان رشته‌ی «YYYY-MM-DDTHH:mm» است که input datetime-local
 * تولید می‌کرد؛ پس هیچ‌جای دیگری از کد لازم نیست عوض شود. فقط کاربر به‌جای
 * تقویم میلادی مرورگر، تقویم شمسی می‌بیند.
 */

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function DayCell({ day, selected, today, onClick }) {
  const base =
    'h-8 w-8 rounded-lg text-xs font-bold grid place-items-center transition-colors';
  const style = selected
    ? { background: 'var(--primary-color)', color: '#0a1736' }
    : today
      ? { background: 'rgba(255,214,10,0.16)', color: 'var(--text)' }
      : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${selected ? '' : 'hover:bg-white/10'}`}
      style={style}
      aria-pressed={selected}
    >
      {faDigits(day)}
    </button>
  );
}

export default function JalaliDateTimePicker({
  value = '',
  onChange,
  placeholder = translateText("انتخاب تاریخ شمسی"),
  withTime = true,
  /* قالب مقدار: 'local' → «YYYY-MM-DDTHH:mm» (فرم محصول)
                  'jalali' → «1403/05/22» (تاریخ تولد در پنل) */
  valueFormat = 'local',
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const boxRef = useRef(null);
  const triggerRef = useRef(null);

  const parseValue = useCallback((raw) => {
    if (!raw) return null;
    if (valueFormat !== 'jalali') return parseLocalInputValue(raw);
    const parts = enDigits(raw)
      .replace(/[^\d]/g, ' ')
      .trim()
      .split(/\s+/)
      .map(Number);
    if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return null;
    const [jy, jm, jd] = parts;
    const g = toGregorian(jy, jm, jd);
    const date = new Date(g.gy, g.gm - 1, g.gd, 0, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [valueFormat]);

  /* خروجی بر اساس قالب انتخاب‌شده */
  const emit = useCallback(
    (date) => {
      if (!date) return onChange?.('');
      if (valueFormat !== 'jalali') return onChange?.(toLocalInputValue(date));
      const j = jalaliOfDate(date);
      return onChange?.(`${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`);
    },
    [onChange, valueFormat],
  );

  const selectedDate = useMemo(() => parseValue(value), [parseValue, value]);
  const today = useMemo(() => new Date(), []);

  /* ماهی که تقویم نشان می‌دهد */
  const [cursor, setCursor] = useState(() => {
    const base = selectedDate || today;
    const j = jalaliOfDate(base);
    return { jy: j.jy, jm: j.jm };
  });

  useEffect(() => {
    if (!open) return;
    const base = selectedDate || today;
    const j = jalaliOfDate(base);
    setCursor({ jy: j.jy, jm: j.jm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* بستن با کلیک بیرون یا Esc */
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  /*
   * جای تقویم با position: fixed حساب می‌شود تا داخل کارت‌های باریک بریده نشود
   * و همیشه داخل کادر دید بماند (در موبایل هم).
   */
  const POPOVER_W = 268;
  const POPOVER_H = 372;

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.min(POPOVER_W, window.innerWidth - 24);
    const left = Math.min(
      Math.max(12, rect.right - width),
      Math.max(12, window.innerWidth - width - 12),
    );
    let top = rect.bottom + 6;
    if (top + POPOVER_H > window.innerHeight - 12) {
      top = Math.max(12, rect.top - POPOVER_H - 6);
    }
    setPos({ left, top, width });
  }, []);

  useEffect(() => {
    if (!open) {
      setPos(null);
      return undefined;
    }
    place();
    const onScroll = () => place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, place]);

  const selectedJalali = selectedDate ? jalaliOfDate(selectedDate) : null;
  const todayJalali = jalaliOfDate(today);

  /* فهرست سال‌ها: ۱۱۰ سال گذشته (تاریخ تولد) تا ۱۵ سال آینده (انقضای تخفیف)؛ سال انتخاب‌شده همیشه در فهرست است */
  const yearOptions = useMemo(() => {
    const from = Math.min(todayJalali.jy - 110, cursor.jy);
    const to = Math.max(todayJalali.jy + 15, cursor.jy);
    return Array.from({ length: to - from + 1 }, (_, i) => to - i);
  }, [todayJalali.jy, cursor.jy]);

  const monthLength = jalaliMonthLength(cursor.jy, cursor.jm);
  const firstGregorian = toGregorian(cursor.jy, cursor.jm, 1);
  const firstWeekday = weekdayColumn(new Date(firstGregorian.gy, firstGregorian.gm - 1, 1).getDay());
  const blanks = Array.from({ length: firstWeekday }, (_, i) => i);
  const days = Array.from({ length: monthLength }, (_, i) => i + 1);

  const pickDay = (day) => {
    const hour = selectedDate ? selectedDate.getHours() : 23;
    const minute = selectedDate ? selectedDate.getMinutes() : 0;
    const g = toGregorian(cursor.jy, cursor.jm, day);
    emit(new Date(g.gy, g.gm - 1, g.gd, hour, withTime ? minute : 0, 0, 0));
    if (!withTime) setOpen(false);
  };

  const setTime = (hour, minute) => {
    const base = selectedDate || today;
    const j = jalaliOfDate(base);
    const g = toGregorian(j.jy, j.jm, j.jd);
    emit(new Date(g.gy, g.gm - 1, g.gd, hour, minute, 0, 0));
  };

  const moveMonth = (step) => {
    setCursor((prev) => {
      let jm = prev.jm + step;
      let jy = prev.jy;
      if (jm < 1) {
        jm = 12;
        jy -= 1;
      }
      if (jm > 12) {
        jm = 1;
        jy += 1;
      }
      return { jy, jm };
    });
  };

  const shiftDays = (count) => {
    const base = selectedDate || today;
    const next = new Date(base);
    next.setDate(next.getDate() + count);
    emit(next);
  };

  const label = selectedDate
    ? `${faDigits(String(selectedJalali.jy))}/${faDigits(pad2(selectedJalali.jm))}/${faDigits(
        pad2(selectedJalali.jd),
      )}${withTime ? ` — ${faDigits(pad2(selectedDate.getHours()))}:${faDigits(pad2(selectedDate.getMinutes()))}` : ''}`
    : placeholder;

  /* ورود دستی تاریخ شمسی: ۱۴۰۵/۰۸/۲۰ */
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');

  const commitDraft = () => {
    const nums = enDigits(draft)
      .replace(/[^\d]/g, ' ')
      .trim()
      .split(/\s+/)
      .map(Number)
      .filter((n) => Number.isFinite(n));
    if (nums.length >= 3) {
      const [jy, jm, jd] = nums;
      const monthOk = jm >= 1 && jm <= 12;
      const dayOk = jd >= 1 && jd <= jalaliMonthLength(jy, jm);
      if (monthOk && dayOk) {
        const hour = selectedDate ? selectedDate.getHours() : 23;
        const minute = selectedDate ? selectedDate.getMinutes() : 0;
        const g = toGregorian(jy, jm, jd);
        emit(new Date(g.gy, g.gm - 1, g.gd, hour, withTime ? minute : 0, 0, 0));
        setCursor({ jy, jm });
      }
    }
    setTyping(false);
    setDraft('');
  };

  if (language !== 'fa') return <input className="input" dir="ltr" type={withTime ? 'datetime-local' : 'date'}
    value={selectedDate ? toLocalInputValue(selectedDate).slice(0, withTime ? 16 : 10) : ''}
    onChange={e => emit(e.target.value ? new Date(e.target.value.length === 10 ? e.target.value + 'T00:00' : e.target.value) : null)} />;

  return (
    <div className="relative" ref={boxRef}>
      <div className="flex items-center gap-1 mt-1">
        {typing ? (
          <input
            autoFocus
            className="input !py-2 text-xs w-full"
            placeholder={translateText("۱۴۰۵/۰۸/۲۰")}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitDraft();
              }
              if (e.key === 'Escape') {
                setTyping(false);
                setDraft('');
              }
            }}
            dir="ltr"
          />
        ) : (
          <button
            type="button"
            ref={triggerRef}
            onClick={() => setOpen((v) => !v)}
            className="input !py-2 flex items-center justify-between gap-2 text-xs text-start"
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <span className={selectedDate ? '' : 'muted'}>{label}</span>
            <CalendarDays size={14} className="text-yellow shrink-0" />
          </button>
        )}
      </div>

      {selectedDate && !typing && (
        <div className="mt-1 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTyping(true)}
            className="text-[10px] muted hover:text-yellow underline decoration-dotted"
          >{translateText("ورود دستی ")}</button>
          <span className="muted text-[10px]">·</span>
          <button
            type="button"
            onClick={() => emit(null)}
            className="text-[10px] muted hover:text-red-400 inline-flex items-center gap-0.5"
          >
            <X size={10} />{translateText(" پاک کردن ")}</button>
        </div>
      )}

      {open && (
        <div
          className="fixed z-[320] card rounded-2xl p-2.5 shadow-2xl"
          style={{
            left: pos?.left ?? 12,
            top: pos?.top ?? 12,
            width: pos?.width ?? 268,
            visibility: pos ? 'visible' : 'hidden',
          }}
          role="dialog"
          aria-label={translateText("تقویم شمسی")}
        >
          {/* هدر تقویم */}
          <div className="flex items-center justify-between gap-1 mb-2">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="btn-ghost !p-1"
              aria-label={translateText("ماه قبل")}
            >
              <ChevronRight className="logical-icon" size={14} />
            </button>
            <div className="flex items-center justify-center gap-1">
              <select
                className="input !py-1 !px-1.5 text-[11px] font-black !w-auto"
                value={cursor.jm}
                onChange={(e) => setCursor((prev) => ({ ...prev, jm: Number(e.target.value) }))}
                aria-label={translateText("ماه")}
              >
                {JALALI_MONTHS.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                className="input !py-1 !px-1.5 text-[11px] font-black !w-auto"
                value={cursor.jy}
                onChange={(e) => setCursor((prev) => ({ ...prev, jy: Number(e.target.value) }))}
                aria-label={translateText("سال")}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {faDigits(y)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="btn-ghost !p-1"
              aria-label={translateText("ماه بعد")}
            >
              <ChevronLeft className="logical-icon" size={14} />
            </button>
          </div>

          {/* روزهای هفته */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {JALALI_WEEKDAYS.map((d, i) => (
              <span key={i} className="text-[10px] muted text-center font-bold">
                {d}
              </span>
            ))}
          </div>

          {/* شبکه‌ی روزها */}
          <div className="grid grid-cols-7 gap-1">
            {blanks.map((i) => (
              <span key={`b-${i}`} />
            ))}
            {days.map((day) => (
              <DayCell
                key={day}
                day={day}
                selected={
                  !!selectedJalali &&
                  selectedJalali.jy === cursor.jy &&
                  selectedJalali.jm === cursor.jm &&
                  selectedJalali.jd === day
                }
                today={
                  todayJalali.jy === cursor.jy &&
                  todayJalali.jm === cursor.jm &&
                  todayJalali.jd === day
                }
                onClick={() => pickDay(day)}
              />
            ))}
          </div>

          {/* ساعت */}
          {withTime && (
            <div className="mt-2 pt-2 border-t border-theme flex items-center gap-1.5">
              <Clock size={13} className="muted shrink-0" />
              <select
                className="input !py-1 !px-1.5 text-[11px] !w-auto"
                value={selectedDate ? selectedDate.getHours() : 23}
                onChange={(e) => setTime(Number(e.target.value), selectedDate?.getMinutes() ?? 0)}
                aria-label={translateText("ساعت")}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {faDigits(pad2(h))}
                  </option>
                ))}
              </select>
              <span className="muted">:</span>
              <select
                className="input !py-1 !px-1.5 text-[11px] !w-auto"
                value={selectedDate ? Math.round(selectedDate.getMinutes() / 5) * 5 : 0}
                onChange={(e) => setTime(selectedDate?.getHours() ?? 23, Number(e.target.value))}
                aria-label={translateText("دقیقه")}
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {faDigits(pad2(m))}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* میان‌برها */}
          <div className="mt-2 flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const j = jalaliOfDate(today);
                setCursor({ jy: j.jy, jm: j.jm });
                setTime(today.getHours(), Math.ceil(today.getMinutes() / 5) * 5);
              }}
              className="chip !py-1 !px-2 text-[10px]"
            >{translateText("امروز ")}</button>
            <button type="button" onClick={() => shiftDays(1)} className="chip !py-1 !px-2 text-[10px]">{translateText("فردا ")}</button>
            <button type="button" onClick={() => shiftDays(7)} className="chip !py-1 !px-2 text-[10px]">{translateText("یک هفته ")}</button>
            <button type="button" onClick={() => shiftDays(30)} className="chip !py-1 !px-2 text-[10px]">{translateText("یک ماه ")}</button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-yellow !py-1 !px-2.5 text-[10px] flex items-center gap-1 me-auto"
            >
              <Check size={10} />{translateText(" تأیید ")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
