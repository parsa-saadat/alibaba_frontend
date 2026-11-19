import { readContent, writeContent } from './content-fields';
import axios from 'axios';
import { API } from '../config/api';
import { language, currency } from './runtime';
axios.interceptors.request.use((config) => {
  const url = new URL(config.url || '', window.location.origin);
  const base = new URL(API.endsWith('/') ? API : API + '/', window.location.origin);
  if (url.origin !== base.origin || !(url.pathname + '/').startsWith(base.pathname)) return config;
  config.headers.set('Accept-Language', language);
  if (config.data && Object.getPrototypeOf(config.data) === Object.prototype)
    config.data = writeContent(config.data);
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

axios.interceptors.response.use((response) => {
  if (
    response.data?.success &&
    !['get', 'head', 'options'].includes(response.config.method || 'get')
  )
    window.dispatchEvent(new Event('panel-stats-refresh'));
  const url = new URL(response.config.url || '', window.location.origin);
  const base = new URL(API.endsWith('/') ? API : API + '/', window.location.origin);
  if (
    url.origin === base.origin &&
    (url.pathname + '/').startsWith(base.pathname) &&
    response.data?.body
  )
    response.data.body = readContent(response.data.body);
  return response;
});
