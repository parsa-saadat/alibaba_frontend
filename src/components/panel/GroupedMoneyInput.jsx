import React, { useLayoutEffect, useRef, useState } from 'react';
import { language } from '../../i18n/runtime';
import {
  formatMoneyEntry,
  parseMoneyEntry,
  moneyInputSymbols,
  moneyDisplayCaret,
  moneyLogicalCaret,
} from '../../utils/helpers/money-input';

export default function GroupedMoneyInput({ value, onValueChange, ...props }) {
  const ref = useRef(null);
  const selection = useRef(null);
  const [revision, setRevision] = useState(0);
  const display = formatMoneyEntry(value, language);
  const symbols = moneyInputSymbols(language);
  const commit = (raw, caret) => {
    selection.current = caret;
    onValueChange(raw);
    setRevision((r) => r + 1);
  };
  useLayoutEffect(() => {
    if (selection.current !== null && ref.current === document.activeElement) {
      const caret = moneyDisplayCaret(display, selection.current, language);
      ref.current.setSelectionRange(caret, caret);
    }
    selection.current = null;
  }, [display, revision]);
  const keyDown = (event) => {
    const el = event.currentTarget;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const start = moneyLogicalCaret(display, el.selectionStart, language);
    const end = moneyLogicalCaret(display, el.selectionEnd, language);
    if (event.key === '.' || event.key === symbols.decimal) {
      event.preventDefault();
      const remaining = String(value).slice(0, start) + String(value).slice(end);
      if (remaining.includes('.')) return;
      let raw = remaining.slice(0, start) + '.' + remaining.slice(start);
      const leading = raw.startsWith('.');
      if (leading) raw = '0' + raw;
      commit(raw, start + 1 + Number(leading));
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      const from = start === end && event.key === 'Backspace' ? Math.max(0, start - 1) : start;
      const to =
        start === end && event.key === 'Delete' ? Math.min(String(value).length, end + 1) : end;
      commit(String(value).slice(0, from) + String(value).slice(to), from);
    }
  };
  return (
    <input
      {...props}
      ref={ref}
      type="text"
      inputMode="decimal"
      dir="ltr"
      autoComplete="off"
      spellCheck={false}
      value={display}
      onKeyDown={keyDown}
      onChange={(event) => {
        let text = event.target.value;
        const caret = event.target.selectionStart;
        if (
          language === 'tr' &&
          event.nativeEvent.inputType === 'insertText' &&
          event.nativeEvent.data === '.' &&
          caret > 0
        )
          text = text.slice(0, caret - 1) + ',' + text.slice(caret);
        const strictLocale =
          event.nativeEvent.inputType?.startsWith('delete') ||
          (event.nativeEvent.inputType === 'insertText' && event.nativeEvent.data?.length === 1);
        const parsed = parseMoneyEntry(text, language, caret, strictLocale);
        if (
          parsed &&
          parsed.value === String(value) &&
          text !== display &&
          event.nativeEvent.inputType?.startsWith('delete')
        ) {
          const from =
            event.nativeEvent.inputType === 'deleteContentBackward'
              ? Math.max(0, parsed.caret - 1)
              : parsed.caret;
          commit(String(value).slice(0, from) + String(value).slice(from + 1), from);
        } else if (parsed) commit(parsed.value, parsed.caret);
        else {
          selection.current = moneyLogicalCaret(display, event.target.selectionStart, language);
          setRevision((r) => r + 1);
        }
      }}
      onBlur={() => {
        const raw = String(value || '')
          .replace(/\.$/, '')
          .replace(/^0+(?=\d)/, '');
        if (raw !== value) onValueChange(raw);
      }}
    />
  );
}
