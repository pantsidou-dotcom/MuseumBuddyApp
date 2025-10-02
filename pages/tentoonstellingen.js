import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SEO from '../components/SEO';
import { useLanguage } from '../components/LanguageContext';
import ExhibitionGridCard from '../components/ExhibitionGridCard';
import { resolveImageUrl } from '../lib/resolveImageSource';
import { loadExhibitions } from '../lib/exhibitions';
import { supabase as supabaseClient } from '../lib/supabase';
import { createServerSupabaseClient } from '../lib/supabaseServer';

export default function ExhibitionsPage({ exhibitions = [], error = null }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState(() => {
    const q = router.query?.q;
    return typeof q === 'string' ? q : '';
  });
  const prefetchedSlugsRef = useRef(new Set());
  const prefetchedImagesRef = useRef(new Set());
  const clientFetchAttemptedRef = useRef(false);

  const [exhibitionState, setExhibitionState] = useState(() => ({
    exhibitions: Array.isArray(exhibitions) ? exhibitions : [],
    error: error || null,
    loading: false,
  }));

  const queryParam = router.query?.q;

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof queryParam === 'string') {
      if (queryParam !== query) {
        setQuery(queryParam);
      }
      return;
    }
    if (query && queryParam === undefined) {
      setQuery('');
    }
  }, [router.isReady, queryParam, query]);

  useEffect(() => {
    const nextExhibitions = Array.isArray(exhibitions) ? exhibitions : [];
    const nextError = error || null;
    clientFetchAttemptedRef.current = false;
    setExhibitionState((prev) => {
      if (
        prev.exhibitions === nextExhibitions &&
        prev.error === nextError &&
        prev.loading === false
      ) {
        return prev;
      }
      return {
        exhibitions: nextExhibitions,
        error: nextError,
        loading: false,
      };
    });
  }, [exhibitions, error]);

  useEffect(() => {
    if (clientFetchAttemptedRef.current) return;
    if (exhibitionState.loading) return;

    const hasServerData = exhibitionState.exhibitions.length > 0 && !exhibitionState.error;
    if (hasServerData) return;

    let cancelled = false;
    clientFetchAttemptedRef.current = true;
    setExhibitionState((prev) => ({ ...prev, loading: true }));

    const applyResult = (result) => {
      if (cancelled) return;
      setExhibitionState({
        exhibitions: Array.isArray(result.exhibitions) ? result.exhibitions : [],
        error: result.error || null,
        loading: false,
      });
    };

    const handleFailure = () => {
      if (cancelled) return;
      setExhibitionState((prev) => ({ ...prev, loading: false }));
    };

    const fetchExhibitions = async () => {
      try {
        if (supabaseClient) {
          const supabaseResult = await loadExhibitions(supabaseClient);
          if (!supabaseResult.error || supabaseResult.exhibitions.length > 0) {
            applyResult(supabaseResult);
            return;
          }
        }

        const response = await fetch('/api/exhibitions');
        if (!response.ok) {
          applyResult({ exhibitions: [], error: 'apiFailed' });
          return;
        }

        const payload = await response.json();
        applyResult({
          exhibitions: Array.isArray(payload.exhibitions) ? payload.exhibitions : [],
          error: payload.error || null,
        });
      } catch (err) {
        handleFailure();
      }
    };

    fetchExhibitions();

    return () => {
      cancelled = true;
    };
  }, [
    exhibitionState.error,
    exhibitionState.exhibitions.length,
    exhibitionState.loading,
    supabaseClient,
  ]);

  const filteredExhibitions = useMemo(() => {
    const activeList = exhibitionState.exhibitions;
    if (!query) return activeList;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return activeList;
    return activeList.filter((exhibition) => {
      const haystacks = [
        exhibition.title,
        exhibition.museum?.name,
        exhibition.museum?.city,
        exhibition.description,
      ]
        .filter(Boolean)
        .map((value) => value.toLowerCase());
      return haystacks.some((value) => value.includes(normalized));
    });
  }, [exhibitionState.exhibitions, query]);

  const resultCount = filteredExhibitions.length;
  const isSearching = Boolean(query.trim());
  const isLoading = exhibitionState.loading && exhibitionState.exhibitions.length === 0;
  const showError = exhibitionState.error && !isLoading && exhibitionState.exhibitions.length === 0;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const candidates = (resultCount > 0 ? filteredExhibitions : exhibitionState.exhibitions).slice(0, 12);

    candidates.forEach((exhibition) => {
      const slug = exhibition?.museum?.slug;
      if (slug && !prefetchedSlugsRef.current.has(slug)) {
        prefetchedSlugsRef.current.add(slug);
        router.prefetch(`/museum/${slug}`).catch(() => {});
      }

      const imageCandidate = resolveImageUrl(exhibition?.image);
      if (imageCandidate && !prefetchedImagesRef.current.has(imageCandidate)) {
        prefetchedImagesRef.current.add(imageCandidate);
        if (typeof window !== 'undefined' && window.Image) {
          const preloadImage = new window.Image();
          preloadImage.src = imageCandidate;
        }
      }
    });

    return undefined;
  }, [
    filteredExhibitions,
    exhibitionState.exhibitions,
    resultCount,
    router,
  ]);

  const emptyStateMessage = isSearching ? t('noFilteredExhibitions') : t('noExhibitions');

  return (
    <>
      <SEO
        title={t('exhibitionsPageTitle')}
        description={t('exhibitionsPageDescription')}
      />
      <header className="hero" role="banner">
        <div className="hero-content">
          <span className="hero-tagline">{t('heroTagline')}</span>
          <h1 className="hero-title">{t('exhibitionsHeroTitle')}</h1>
          <p className="hero-subtext">{t('exhibitionsHeroSubtitle')}</p>
          <div className="hero-cta-group">
            <Link href="/#museum-resultaten" className="hero-quick-link hero-quick-link--primary">
              {t('heroPrimaryCta')}
            </Link>
            <Link href="#tentoonstellingen-lijst" className="hero-quick-link hero-quick-link--ghost">
              {t('heroSecondaryCta')}
            </Link>
          </div>
        </div>
        <form className="hero-card hero-search" onSubmit={(e) => e.preventDefault()}>
          <input
            type="search"
            className="input hero-input"
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t('searchPlaceholder')}
          />
        </form>
      </header>

      <p className="count" id="tentoonstellingen-lijst">
        {resultCount} {t('results')}
      </p>

      {showError ? (
        <p>{t('somethingWrong')}</p>
      ) : null}

      {isLoading ? (
        <p>{t('loading')}</p>
      ) : resultCount === 0 ? (
        <p>{emptyStateMessage}</p>
      ) : (
        <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {filteredExhibitions.map((exhibition, index) => (
            <li key={exhibition.id}>
              <ExhibitionGridCard exhibition={exhibition} priority={index < 6} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export async function getStaticProps() {
  const serverSupabase = createServerSupabaseClient();
  const { exhibitions: loadedExhibitions, error } = await loadExhibitions(serverSupabase);

  return {
    props: {
      exhibitions: loadedExhibitions,
      error,
    },
    revalidate: 1800,
  };
}
