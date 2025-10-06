export function trackEvent(eventName, payload = {}) {
  if (typeof window === 'undefined') return;

  if (typeof window.plausible === 'function') {
    window.plausible(eventName, { props: payload });
    return;
  }

  const { dataLayer } = window;
  if (Array.isArray(dataLayer)) {
    dataLayer.push({ event: eventName, ...payload });
  }
}

export function logLegacyFilterUsage(filterName, page) {
  const name = typeof filterName === 'string' ? filterName.trim().toLowerCase() : '';
  if (!name || typeof page !== 'string') return;
  trackEvent('legacy_filter_used', { filter: name, page });
}
