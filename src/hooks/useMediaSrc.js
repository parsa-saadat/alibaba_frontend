import { useEffect, useState } from 'react';
import { isStorageSrc, resolveStorageSrc } from '../utils/helpers/storage-files';

/*
 * یک آدرس رسانه بگیر، آدرس قابل نمایش بده.
 * - لینک‌های معمولی (https، data:) همان‌طور برمی‌گردند.
 * - آدرس‌های استوریج (<API>/storage/<id>) با درخواست به API به data-url تبدیل می‌شوند،
 *   چون خود این آدرس فایل تصویری برنمی‌گرداند.
 */
export default function useMediaSrc(src) {
  const [state, setState] = useState({ key: src || '', url: src || '' });

  useEffect(() => {
    let active = true;
    if (!src) {
      setState({ key: '', url: '' });
      return undefined;
    }
    if (!isStorageSrc(src)) {
      setState({ key: src, url: src });
      return undefined;
    }

    setState({ key: src, url: '' });
    resolveStorageSrc(src).then((url) => {
      if (active) setState({ key: src, url });
    });

    return () => {
      active = false;
    };
  }, [src]);

  const ready = state.key === (src || '');
  const url = ready ? state.url : '';
  return { url, loading: Boolean(src) && !url, failed: Boolean(src) && ready && !url };
}
