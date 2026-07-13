import Head from 'next/head';
import Link from 'next/link';
import { FAMILY_GUIDE_PATH, FAMILY_GUIDE_CANONICAL_URL } from '../lib/familyGuide';

export default function LegacyKidFriendlyMuseumsRedirect() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={FAMILY_GUIDE_CANONICAL_URL} />
        <meta httpEquiv="refresh" content={`0; url=${FAMILY_GUIDE_PATH}`} />
      </Head>
      <main className="page-intro">
        <h1 className="page-title">Deze gids is verhuisd</h1>
        <p className="page-subtitle">De canonieke pagina staat nu op <Link href={FAMILY_GUIDE_PATH}>kindvriendelijke musea in Amsterdam</Link>.</p>
      </main>
    </>
  );
}
