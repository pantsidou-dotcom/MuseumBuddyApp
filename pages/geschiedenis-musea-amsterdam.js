import { FilterLandingPage, LANDING_PAGE_CONFIGS } from '../lib/seoLandingPages';

const CANONICAL_PATH = '/geschiedenis-musea-amsterdam';

export default function LandingPage() {
  return <FilterLandingPage config={LANDING_PAGE_CONFIGS[CANONICAL_PATH]} canonicalPath={CANONICAL_PATH} />;
}
