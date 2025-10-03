'use client';

import { useCallback } from 'react';

export type ScrollButtonProps = {
  targetId: string;
  label: string;
  className?: string;
};

export function ScrollButton({ targetId, label, className }: ScrollButtonProps) {
  const handleClick = useCallback(() => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if ('focus' in el) {
        (el as HTMLElement).focus({ preventScroll: true });
      }
    }
  }, [targetId]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
    >
      {label}
    </button>
  );
}
