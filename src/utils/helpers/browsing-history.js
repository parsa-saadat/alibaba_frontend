import { readList, writeList } from './storage';
// Browser-local, no claim of cross-device or server-side tracking.
export const SEARCH_HISTORY_KEY = 'search-history.v1';
export function rememberSearch(value) {
  const query = String(value || '').trim().replace(/\s+/g, ' ').slice(0, 160);
  if (!query) return;
  const rows = readList(SEARCH_HISTORY_KEY).filter(row => row && typeof row.query === 'string');
  if (rows[0]?.query === query && Date.now() - Number(rows[0]?.at || 0) < 2000) return;
  writeList(SEARCH_HISTORY_KEY, [{ query, at: Date.now() }, ...rows.filter(row => row.query.toLocaleLowerCase() !== query.toLocaleLowerCase())].slice(0, 30));
  window.dispatchEvent(new Event('geocala:history'));
}
