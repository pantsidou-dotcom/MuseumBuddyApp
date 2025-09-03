import MuseumListingCard from '../components/MuseumListingCard';

export default function CardDemo() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background:'#f0f0f0' }}>
      <MuseumListingCard
        title="1646 Experimental Art Space"
        location="1646 Experimental Art Space, Den Haag"
        image="/images/Amsterdam Museum.webp"
      />
    </div>
  );
}
