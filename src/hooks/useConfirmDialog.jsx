import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Copy, X } from 'lucide-react';
import { t } from '../i18n/runtime';

function ConfirmDialog({ options, settle }) {
  const box = useRef(null);
  const cancel = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancel.current?.focus();
    const key = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        settle(false);
      }
      if (event.key === 'Tab') {
        const buttons = [...box.current.querySelectorAll('button:not(:disabled)')];
        const first = buttons[0],
          last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [settle]);
  const Icon = options.danger ? AlertTriangle : Copy;
  return createPortal(
    <div
      className="fixed inset-0 z-[250] bg-black/65 backdrop-blur-sm grid place-items-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) settle(false);
      }}
    >
      <section
        ref={box}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="card rounded-3xl shadow-2xl w-full max-w-md max-h-[90dvh] overflow-auto p-5 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span
            className={`grid place-items-center h-11 w-11 shrink-0 rounded-2xl ${options.danger ? 'bg-red-500/10 text-red-500' : 'card2 text-accent'}`}
          >
            <Icon size={22} />
          </span>
          <h2 id="confirm-title" className="font-black flex-1 min-w-0 pt-2 break-words">
            {options.title}
          </h2>
          <button
            type="button"
            className="btn-ghost !p-2 icon-control"
            aria-label={t('بستن')}
            onClick={() => settle(false)}
          >
            <X size={18} />
          </button>
        </div>
        <p id="confirm-description" className="text-sm muted leading-7 my-5 break-words">
          {options.message}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            ref={cancel}
            type="button"
            className="btn-ghost !py-2.5 text-sm"
            onClick={() => settle(false)}
          >
            {t('انصراف')}
          </button>
          <button
            type="button"
            className={
              options.danger
                ? 'rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 text-sm'
                : 'btn-primary !py-2.5 text-sm'
            }
            onClick={() => settle(true)}
          >
            {options.confirmLabel || t('تأیید')}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
export default function useConfirmDialog() {
  const [options, setOptions] = useState(null);
  const pending = useRef(null);
  const settle = useCallback((value) => {
    const resolve = pending.current;
    pending.current = null;
    setOptions(null);
    resolve?.(value);
  }, []);
  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        pending.current?.(false);
        pending.current = resolve;
        setOptions(options);
      }),
    [],
  );
  useEffect(() => () => pending.current?.(false), []);
  return { confirm, dialog: options ? <ConfirmDialog options={options} settle={settle} /> : null };
}
