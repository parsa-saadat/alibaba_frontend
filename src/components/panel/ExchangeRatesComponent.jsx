import StatTile from './StatTileComponent';
import { Banknote } from 'lucide-react';
import { formatNumber } from '../../i18n/runtime';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../../config/api';
import { authHeaders } from '../../utils/helpers/storage';
import { currency, formatMoney, t } from '../../i18n/runtime';

export default function ExchangeRates() {
  const [quote, setQuote] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const load = () =>
      axios
        .get(`${API}/fx/rates`, {
          ...authHeaders(),
          params: { currency },
          timeout: 20000,
          signal: controller.signal,
        })
        .then((response) => {
          setQuote(response.data.body);
          setFailed(false);
        })
        .catch(() => {
          if (!controller.signal.aborted) setFailed(true);
        });
    load();
    const timer = setInterval(load, 300000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, []);
  return (
    <section className="space-y-3">
      <h2 className="font-bold">{t('نرخ ارز')}</h2>
      {failed ? (
        <p role="status" className="text-sm muted">
          {t('نرخ ارز در دسترس نیست')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {(quote?.display_rates || [])
            .filter((row) => ['USD', 'EUR', 'TRY', 'AED'].includes(row.source))
            .map((row) => (
              <StatTile
                key={row.source}
                icon={Banknote}
                label={`${formatNumber(1)} ${row.source}`}
                value={formatMoney(row.amount, row.currency, { maximumFractionDigits: 4 })}
              />
            ))}
        </div>
      )}
      {quote && !failed && (
        <p className="text-xs muted" dir="ltr">
          {quote.provider} · {quote.fetched_at ? new Date(quote.fetched_at).toLocaleString() : ''}
        </p>
      )}
    </section>
  );
}
