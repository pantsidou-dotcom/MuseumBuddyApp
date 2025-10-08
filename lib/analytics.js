const AnalyticsEvent = {
  CARD_CLICK: 'card_click',
  TICKETS_CLICK: 'tickets_click',
  CTA_EXHIBITIONS: 'cta_exhibitions',
  FAVORITE_ADD: 'favorite_add',
};

function sanitizeData(data) {
  if (!data || typeof data !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined && value !== null)
  );
}

function trackWithPlausible(eventName, payload) {
  const plausible = typeof window !== 'undefined' ? window.plausible : null;
  if (typeof plausible !== 'function') {
    return;
  }

  const args = [eventName];
  if (payload && Object.keys(payload).length > 0) {
    args.push({ props: payload });
  }

  try {
    plausible(...args);
  } catch (error) {
    // Swallow analytics errors so they never impact UX
  }
}

function trackWithUmami(eventName, payload) {
  if (typeof window === 'undefined') {
    return;
  }

  const umami = window.umami;
  if (typeof umami === 'function') {
    try {
      umami(eventName, payload);
    } catch (error) {
      // ignore
    }
    return;
  }

  if (umami && typeof umami.track === 'function') {
    try {
      umami.track(eventName, payload);
    } catch (error) {
      // ignore
    }
  }
}

export function trackEvent(eventName, data = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!eventName || typeof eventName !== 'string') {
    return;
  }

  const payload = sanitizeData(data);

  trackWithPlausible(eventName, payload);
  trackWithUmami(eventName, payload);
}

export function trackCardClick(data = {}) {
  trackEvent(AnalyticsEvent.CARD_CLICK, data);
}

export function trackTicketsClick(data = {}) {
  trackEvent(AnalyticsEvent.TICKETS_CLICK, data);
}

export function trackCtaExhibitions(data = {}) {
  trackEvent(AnalyticsEvent.CTA_EXHIBITIONS, data);
}

export function trackFavoriteAdd(data = {}) {
  trackEvent(AnalyticsEvent.FAVORITE_ADD, data);
}

export { AnalyticsEvent };
