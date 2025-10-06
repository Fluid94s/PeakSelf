import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function Tracker() {
  const location = useLocation();
  const lastPathRef = useRef(null);

  useEffect(() => {
    try {
      // Deduplicate to avoid React Strict Mode double-invoking effects in dev
      const prevPath = lastPathRef.current;
      if (prevPath === location.pathname) return;
      lastPathRef.current = location.pathname;

      // First hit (direct page load): use document.referrer (often '') and do NOT rely on HTTP Referer
      // Subsequent SPA navigations: treat referrer as site origin, which is acceptable for internal links
      const isFirstRouteHit = prevPath == null;
      const refToSend = isFirstRouteHit ? (document.referrer || null) : window.location.origin;

      fetch(`${API_BASE}/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          referrer: refToSend,
          path: location.pathname
        })
      }).catch(() => {});
    } catch (_) {}
  }, [location.pathname]);

  return null;
}
