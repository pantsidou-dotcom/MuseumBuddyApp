import Image from 'next/image';
import styles from './MuseumListingCard.module.css';

/**
 * Card component for displaying a single museum.
 * Renders a photo with share and favorite actions and a text section.
 */
export default function MuseumListingCard({ title, location, image }) {
  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image src={image} alt={title} fill sizes="(max-width: 600px) 100vw, 400px" className={styles.image} />
        <div className={styles.actions}>
          <button className={styles.iconButton} aria-label="Deel">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
          <button className={styles.iconButton} aria-label="Favoriet">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.location}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.pin}>
            <path d="M21 10c0 5.25-9 13-9 13s-9-7.75-9-13a9 9 0 1 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className={styles.locationText}>{location}</span>
        </div>
      </div>
    </div>
  );
}
