import React from 'react';

export default function SkeletonMuseumCard() {
  return (
    <article className="museum-card skeleton-card" aria-hidden="true">
      <div className="museum-card-image skeleton-block skeleton-block--media" />
      <div className="museum-card-info">
        <div className="skeleton-block skeleton-line skeleton-line--title" />
        <div className="skeleton-block skeleton-line" />
        <div className="skeleton-block skeleton-line skeleton-line--short" />
        <div className="skeleton-block skeleton-line skeleton-line--short" />
      </div>
    </article>
  );
}
