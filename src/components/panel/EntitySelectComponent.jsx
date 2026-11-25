import StorageImage from '../common/StorageImageComponent';
import { productImages } from '../../utils/helpers/format';
import { useEffect, useId, useRef, useState } from 'react';
import axios from 'axios';
import {
  Search,
  ChevronDown,
  X,
  LoaderCircle,
  Package,
  Store,
  UserRound,
  Check,
} from 'lucide-react';
import { t } from '../../i18n/runtime';
import { authHeaders } from '../../utils/helpers/storage';
import { displayText } from '../../utils/helpers/display-text';
import { userFullName } from '../../utils/helpers/user';
const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';
export default function EntitySelect({
  kind,
  label,
  value,
  onChange,
  endpoint,
  localOptions = [],
  selectedLabel = '',
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(''),
    [options, setOptions] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [picked, setPicked] = useState(null),
    [active, setActive] = useState(0),
    [retry, setRetry] = useState(0);
  const root = useRef(null),
    trigger = useRef(null),
    id = useId();
  const Icon = kind === 'product' ? Package : kind === 'store' ? Store : UserRound;
  useEffect(() => {
    if (!open) return;
    const listener = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', listener);
    return () => document.removeEventListener('pointerdown', listener);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const c = new AbortController();
    setBusy(true);
    setError(false);
    const timer = setTimeout(async () => {
      try {
        let rows = localOptions;
        if (endpoint) {
          const r = await axios.get(`${API}${endpoint}`, {
            ...authHeaders(),
            signal: c.signal,
            params: { search: query || undefined, limit: 20 },
          });
          rows = r.data.body?.data || [];
        } else
          rows = rows.filter((r) =>
            `${r.label} ${r._id}`.toLowerCase().includes(query.toLowerCase()),
          );
        if (!c.signal.aborted) {
          setOptions(
            rows.map((r) => ({
              _id: String(r._id),
              image:
                kind === 'product'
                  ? productImages(r)[0]
                  : kind === 'store'
                    ? r.profile_image_id || r.banner_image_id
                    : null,
              label: displayText(r.label || r.name) || userFullName(r) || t('reviews.unnamed'),
            })),
          );
          setActive(0);
        }
      } catch {
        if (!c.signal.aborted) {
          setOptions([]);
          setError(true);
        }
      } finally {
        if (!c.signal.aborted) setBusy(false);
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [open, query, endpoint, retry]);
  const choose = (option) => {
    setPicked(option);
    onChange(option._id, option.label);
    setOpen(false);
    setQuery('');
    trigger.current?.focus();
  };
  const text = value
    ? picked?._id === value
      ? picked.label
      : selectedLabel || `${t('reviews.selectedItem')} · ${String(value).slice(-6)}`
    : t('reviews.choose');
  return (
    <div className="entity-select" ref={root}>
      <label id={`${id}-label`}>{label}</label>
      <div className={`entity-select-control ${open ? 'is-open' : ''}`}>
        <Icon size={17} />
        <button
          type="button"
          ref={trigger}
          role="combobox"
          aria-labelledby={`${id}-label`}
          aria-expanded={open}
          aria-controls={`${id}-list`}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={value ? '' : 'muted'}>{text}</span>
          <ChevronDown size={16} />
        </button>
        {value && (
          <button
            type="button"
            className="entity-select-clear"
            aria-label={`${t('reviews.reset')} ${label}`}
            onClick={() => {
              onChange('', '');
              setPicked(null);
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {open && (
        <div
          className="entity-select-popover"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setOpen(false);
              trigger.current?.focus();
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((v) => Math.min(options.length - 1, v + 1));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((v) => Math.max(0, v - 1));
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              if (options[active]) choose(options[active]);
            }
          }}
        >
          <div className="entity-select-search">
            <Search size={15} />
            <input
              autoFocus
              aria-label={t('reviews.searchOptions')}
              placeholder={t('reviews.searchOptions')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {busy && <LoaderCircle size={15} className="animate-spin" />}
          </div>
          <div
            id={`${id}-list`}
            className="entity-select-list"
            role="listbox"
            aria-labelledby={`${id}-label`}
          >
            {options.map((o, index) => (
              <button
                type="button"
                role="option"
                aria-selected={o._id === value}
                className={index === active ? 'is-highlighted' : ''}
                key={o._id}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(o)}
              >
                <span className="entity-option-icon">
                  {o.image ? (
                    <StorageImage
                      file={o.image}
                      alt={o.label}
                      compact
                      className="entity-option-thumbnail"
                    />
                  ) : (
                    <Icon size={16} />
                  )}
                </span>
                <span>
                  <b>{o.label}</b>
                  <small dir="ltr">#{o._id.slice(-6)}</small>
                </span>
                {value === o._id && <Check size={15} className="text-accent" />}
              </button>
            ))}
            {!busy && !options.length && !error && <p>{t('reviews.noOptions')}</p>}
            {error && (
              <button type="button" onClick={() => setRetry((v) => v + 1)}>
                {t('reviews.loadError')} · {t('reviews.retry')}
              </button>
            )}
          </div>
          {/^[a-f\d]{24}$/i.test(query) && !options.some((o) => o._id === query) && (
            <button
              type="button"
              className="entity-use-id"
              onClick={() =>
                choose({ _id: query, label: `${t('reviews.selectedItem')} · ${query.slice(-6)}` })
              }
            >
              {t('reviews.useId')} <code>{query.slice(-6)}</code>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
