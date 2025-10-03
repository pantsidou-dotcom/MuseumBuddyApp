'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { EntityCardData } from '@/lib/types';
import { EntityCard } from './EntityCard';

export type EntityGridProps = {
  items: EntityCardData[];
  isLoading?: boolean;
  skeletonCount?: number;
  gridLabel: string;
};

export function EntityGrid({ items, isLoading = false, skeletonCount = 6, gridLabel }: EntityGridProps) {
  const router = useRouter();

  useEffect(() => {
    items.slice(0, 12).forEach((item) => {
      if (item.prefetchHref) {
        router.prefetch(item.prefetchHref);
      }
    });
  }, [items, router]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-label={gridLabel} role="status">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-3xl bg-white shadow-card"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-label={gridLabel} role="list">
      {items.map((item, index) => (
        <div key={item.id} role="listitem" className="h-full">
          <EntityCard {...item} priority={index < 12} />
        </div>
      ))}
    </div>
  );
}
