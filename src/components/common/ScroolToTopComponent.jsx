import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';

export function Loading({ label = translateText("در حال بارگذاری…"), className = '' }) {
  return (
    <div className={`loading-label ${className}`} role="status" aria-live="polite">
      <LoaderCircle size={19} className="animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function RouteProgress() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 360);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!visible) return null;
  return <div className="route-progress" aria-hidden="true" />;
}

const ScrollToTopComponent = () => {
  const location = useLocation();
  const previousPath = useRef(location.pathname);

  useEffect(() => {
    const samePage = previousPath.current === location.pathname;
    previousPath.current = location.pathname;

    /* لینک با #بخش (مثل /contact#faq): بعد از رندر صفحه به همان بخش برو */
    const id = decodeURIComponent((location.hash || '').replace('#', ''));
    if (id) {
      const timer = window.setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo(0, 0);
      }, 120);
      return () => window.clearTimeout(timer);
    }
    /* صفحه‌ی تازه: بالا بپر. فقط پارامتر جستجو/فیلتر عوض شده: آرام و روان بالا بیا */
    if (samePage) {
      if (window.scrollY > 4) window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }
    return undefined;
  }, [location.pathname, location.search, location.hash]);

  return null;
};

export default ScrollToTopComponent;
