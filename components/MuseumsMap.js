import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useLanguage } from './LanguageContext';

const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const DEFAULT_CENTER = { lat: 52.3727598, lng: 4.8936041 };

let leafletPromise = null;
let leafletStylesheetRequested = false;

function loadLeafletResources() {
  if (typeof window === 'undefined') return Promise.resolve(null);

  if (window.L) {
    return Promise.resolve(window.L);
  }

  if (!leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      try {
        if (!leafletStylesheetRequested) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = LEAFLET_CSS_URL;
          link.crossOrigin = '';
          link.referrerPolicy = 'no-referrer';
          document.head.appendChild(link);
          leafletStylesheetRequested = true;
        }

        const script = document.createElement('script');
        script.src = LEAFLET_JS_URL;
        script.async = true;
        script.crossOrigin = '';
        script.referrerPolicy = 'no-referrer';
        script.onload = () => {
          if (window.L) {
            resolve(window.L);
          } else {
            reject(new Error('Leaflet failed to load'));
          }
        };
        script.onerror = () => {
          reject(new Error('Leaflet script failed to load'));
        };
        document.head.appendChild(script);
      } catch (error) {
        reject(error);
      }
    });
  }

  return leafletPromise;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function MuseumsMap({ museums = [] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const cleanupRef = useRef(new Map());
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [hasMarkers, setHasMarkers] = useState(false);

  const points = useMemo(
    () =>
      museums
        .map((museum) => {
          const latitude = typeof museum.latitude === 'number' ? museum.latitude : Number(museum.latitude);
          const longitude = typeof museum.longitude === 'number' ? museum.longitude : Number(museum.longitude);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
          return {
            id: museum.id,
            slug: museum.slug,
            title: museum.title || museum.naam,
            city: museum.stad || museum.city,
            latitude,
            longitude,
          };
        })
        .filter(Boolean),
    [museums]
  );

  useEffect(() => {
    let isMounted = true;

    loadLeafletResources()
      .then((L) => {
        if (!isMounted || !containerRef.current || !L) return;
        const map = L.map(containerRef.current, {
          center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
          zoom: 12,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        mapRef.current = map;
        setIsReady(true);
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(error);
        }
      });

    return () => {
      isMounted = false;
      markersRef.current.forEach((marker) => {
        marker.remove();
      });
      markersRef.current = [];
      cleanupRef.current.forEach((cleanup) => {
        if (typeof cleanup === 'function') cleanup();
      });
      cleanupRef.current.clear();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady || !mapRef.current || !window.L) return;
    const map = mapRef.current;
    const L = window.L;

    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current = [];
    cleanupRef.current.forEach((cleanup) => {
      if (typeof cleanup === 'function') cleanup();
    });
    cleanupRef.current.clear();

    if (!points.length) {
      setHasMarkers(false);
      map.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 11);
      return;
    }

    setHasMarkers(true);

    const bounds = L.latLngBounds(points.map((point) => [point.latitude, point.longitude]));
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });

    points.forEach((point) => {
      const marker = L.marker([point.latitude, point.longitude], {
        title: point.title,
        keyboard: true,
      });

      const popup = L.popup({ closeButton: true, autoPanPadding: [24, 24] });
      popup.options.museumSlug = point.slug;
      const popupHtml = `
        <div class="home-map-popup">
          <h3 class="home-map-popup__title">${escapeHtml(point.title)}</h3>
          ${point.city ? `<p class="home-map-popup__subtitle">${escapeHtml(point.city)}</p>` : ''}
          <button type="button" class="home-map-popup__link">${escapeHtml(t('view'))}</button>
        </div>
      `;
      popup.setContent(popupHtml);
      marker.bindPopup(popup);

      marker.on('click', () => {
        marker.openPopup();
      });

      marker.on('keypress', (event) => {
        if (event.originalEvent && event.originalEvent.key !== 'Enter') return;
        router.push(`/museum/${point.slug}`);
      });

      markersRef.current.push(marker.addTo(map));
    });

    const handlePopupOpen = (event) => {
      const popup = event.popup;
      const slug = popup?.options?.museumSlug;
      if (!slug) return;
      const element = popup.getElement();
      if (!element) return;
      const button = element.querySelector('.home-map-popup__link');
      if (!button) return;
      const handleClick = (ev) => {
        ev.preventDefault();
        router.push(`/museum/${slug}`);
      };
      button.addEventListener('click', handleClick);
      cleanupRef.current.set(popup, () => {
        button.removeEventListener('click', handleClick);
      });
    };

    const handlePopupClose = (event) => {
      const cleanup = cleanupRef.current.get(event.popup);
      if (cleanup) {
        cleanup();
        cleanupRef.current.delete(event.popup);
      }
    };

    map.on('popupopen', handlePopupOpen);
    map.on('popupclose', handlePopupClose);

    return () => {
      map.off('popupopen', handlePopupOpen);
      map.off('popupclose', handlePopupClose);
    };
  }, [isReady, points, router, t]);

  if (loadError) {
    return (
      <div className="home-map home-map--error">
        <p>{t('mapUnavailable')}</p>
      </div>
    );
  }

  return (
    <div className="home-map">
      <div
        ref={containerRef}
        className="home-map__canvas"
        role="region"
        aria-label={t('mapViewAriaLabel')}
      />
      {isReady && !hasMarkers ? (
        <div className="home-map__empty" role="status" aria-live="polite">
          {t('mapNoResults')}
        </div>
      ) : null}
    </div>
  );
}
