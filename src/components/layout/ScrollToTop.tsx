import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets the scroll position to the top of the page on every route change.
 *
 * Without this, the browser keeps the previous page's scroll offset when
 * navigating (the new page appears to "load at the bottom"). In-page
 * anchor/hash navigation (e.g. /dashboard#live-chat, #main-content) is
 * skipped so the browser's native anchor jump still works.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
