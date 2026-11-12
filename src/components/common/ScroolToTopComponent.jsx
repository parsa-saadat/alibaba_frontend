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
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  return null;
};

export default ScrollToTopComponent;
