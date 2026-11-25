import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { t } from '../../i18n/runtime';
import { API } from '../../config/api';
import { authHeaders } from '../../utils/helpers/storage';
import { formatPrice } from '../../utils/helpers/format';

export default function RefundActions({ sub, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState('PAYA');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  const status = sub.refund?.status;
  if (!status || status === 'none') return null;
  const pending = ['processing', 'submitted', 'unknown'].includes(status);
  const canRequest =
    ['pending', 'failed'].includes(status) &&
    ['cancelled', 'rejected', 'finalized'].includes(sub.status);
  const amount = sub.refund?.amount || 0;
  const run = async (check = false) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await axios.post(
        `${API}/order/sub/${sub._id}/refund${check ? '/status' : ''}`,
        check ? {} : { method },
        authHeaders(),
      );
      setOpen(false);
      await onRefresh?.();
    } catch {
      setError(t('refund.actionError'));
      // Refresh even after errors: a timed-out request may have been accepted by the gateway.
      await onRefresh?.();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2" data-testid="refund-actions">
      {pending && (
        <p className="text-xs muted leading-6">
          {t(
            status === 'unknown' || status === 'processing' ? 'refund.unknown' : 'refund.submitted',
          )}
        </p>
      )}
      {status === 'completed' && (
        <p className="text-xs font-bold" style={{ color: '#17994f' }}>
          {t('refund.completed')}
        </p>
      )}
      {canRequest && (
        <button
          type="button"
          onClick={() => {
            setError('');
            setOpen(true);
          }}
          className="btn-ghost text-xs !py-2"
          disabled={busy || amount < 20000}
        >
          {t('refund.request')}
        </button>
      )}
      {canRequest && amount < 20000 && <p className="text-xs muted">{t('refund.minimum')}</p>}
      {pending && sub.refund?.gateway_id && (
        <button
          type="button"
          disabled={busy}
          onClick={() => run(true)}
          className="btn-ghost text-xs !py-2"
        >
          {t(busy ? 'refund.checking' : 'refund.check')}
        </button>
      )}
      {error && !open && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            onCancel={(event) => {
              if (busy) event.preventDefault();
              else setOpen(false);
            }}
            className="card rounded-2xl p-5 w-[min(92vw,440px)] m-auto backdrop:bg-black/60"
            style={{ color: 'var(--text)' }}
            aria-labelledby={`refund-title-${sub._id}`}
          >
            <div className="space-y-4">
              <h2 className="text-lg font-black" id={`refund-title-${sub._id}`}>
                {t('refund.request')}
              </h2>
              <p className="text-sm leading-7">{t('refund.confirm')}</p>
              <p className="text-lg font-black text-accent">{formatPrice(amount, 'IRR')}</p>
              <label className="block text-sm space-y-2">
                <span>{t('refund.method')}</span>
                <select
                  className="input"
                  disabled={busy}
                  value={method}
                  onChange={(event) => setMethod(event.target.value)}
                >
                  <option value="PAYA">{t('refund.paya')}</option>
                  <option value="CARD">{t('refund.card')}</option>
                </select>
              </label>
              {error && (
                <p role="alert" className="text-xs text-red-500 leading-6">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className="btn-ghost text-sm"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                >
                  {t('انصراف')}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run()}
                  className="btn-primary text-sm"
                >
                  {t(busy ? 'refund.checking' : 'refund.send')}
                </button>
              </div>
            </div>
          </dialog>,
          document.body,
        )}
    </div>
  );
}
