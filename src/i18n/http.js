import axios from 'axios';
import { API } from '../config/api';
import { language, currency } from './runtime';
axios.interceptors.request.use((config) => {
  const url = new URL(config.url || '', window.location.origin);
  const base = new URL(API.endsWith('/') ? API : API + '/', window.location.origin);
  if (url.origin !== base.origin || !(url.pathname + '/').startsWith(base.pathname)) return config;
  config.headers.set('Accept-Language', language);
  const params = new URLSearchParams(url.search);
  const existing =
    config.params instanceof URLSearchParams
      ? Object.fromEntries(config.params)
      : config.params || {};
  config.params = {
    ...(!params.has('lang') ? { lang: language } : {}),
    ...(!params.has('currency') ? { currency } : {}),
    ...existing,
  };
  return config;
});
