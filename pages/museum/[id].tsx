import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import museaData from '../../musea.json';

interface Museum {
  id: string;
  title: string;
  description: string;
  openingHours: string;
  images: string[];
}

interface MuseumPageProps {
  museum: Museum | null;
}

export default function MuseumPage({ museum }: MuseumPageProps) {
  if (!museum) {
    return <div>Museum niet gevonden.</div>;
  }

  return (
    <div>
      <h1>{museum.title}</h1>
      <p>{museum.description}</p>
      <p><strong>Openingstijden:</strong> {museum.openingHours}</p>
      <div>
        {museum.images.map((src, idx) => (
          <img key={idx} src={src} alt={`${museum.title} afbeelding ${idx + 1}`} />
        ))}
      </div>
      <p>
        <Link href="/">Terug naar overzicht</Link>
      </p>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = (museaData as Museum[]).map((m) => ({ params: { id: m.id } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const musea = museaData as Museum[];
  const museum = musea.find((m) => m.id === params?.id) || null;
  return { props: { museum } };
};
