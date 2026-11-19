import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../config/api';
import { authHeaders } from '../utils/helpers/storage';

const paths = {
  store: '/store/stats',
  product: '/product/stats',
  order: '/order/stats',
  user: '/user/stats',
  seller: '/seller/stats',
  category: '/category/stats',
  plan: '/plan/stats',
};
export default function usePanelStats(modules) {
  const key = (Array.isArray(modules) ? modules : [modules]).join(',');
  const [stats, setStats] = useState({});
  const [error, setError] = useState(false);
  const refresh = useCallback(async () => {
    const entries = await Promise.all(
      key.split(',').map(async (name) => {
        try {
          const response = await axios.get(`${API}${paths[name]}`, {
            ...authHeaders(),
            timeout: 20000,
          });
          return [name, response.data.body];
        } catch {
          return [name, null];
        }
      }),
    );
    setStats(Object.fromEntries(entries));
    setError(entries.some(([, value]) => !value));
  }, [key]);
  useEffect(() => {
    refresh();
    window.addEventListener('panel-stats-refresh', refresh);
    return () => window.removeEventListener('panel-stats-refresh', refresh);
  }, [refresh]);
  return { stats, error, refresh };
}
