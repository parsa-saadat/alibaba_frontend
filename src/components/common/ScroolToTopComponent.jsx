import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';

export function Loading({ label = 'در حال بارگذاری…', className = '' }) {
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

  useEffect(() => {
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
    window.scrollTo(0, 0);
    return undefined;
  }, [location.pathname, location.search, location.hash]);

  return null;
};

export default ScrollToTopComponent;
