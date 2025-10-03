import Image from 'next/image';
import Link from 'next/link';
import type { EntityCardData } from '@/lib/types';

export type EntityCardProps = EntityCardData & {
  priority?: boolean;
};

const gradientByVariant: Record<EntityCardData['variant'], string> = {
  museum: 'from-brand/10 via-white to-white',
  exhibition: 'from-purple-200/40 via-white to-white',
};

export function EntityCard({
  variant,
  href,
  prefetchHref,
  title,
  subtitle,
  description,
  image,
  badges,
  ctaLabel,
  priority,
}: EntityCardProps) {
  const placeholder = typeof image.src === 'string' ? 'empty' : 'blur';

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card transition-shadow hover:shadow-xl focus-within:shadow-xl">
      <Link
        href={href}
        prefetch={prefetchHref ? true : undefined}
        className="absolute inset-0 z-10"
        aria-label={`${title} bekijken`}
      >
        <span className="sr-only">{`${title} bekijken`}</span>
      </Link>
      <div className="relative overflow-hidden">
        <div className="relative aspect-[3/2] w-full bg-slate-100">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            placeholder={placeholder}
            priority={priority}
          />
        </div>
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t ${gradientByVariant[variant]}`}
          aria-hidden="true"
        />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <header className="flex flex-col gap-2">
          {subtitle && <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{subtitle}</p>}
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          {description && <p className="text-sm leading-relaxed text-slate-600">{description}</p>}
        </header>
        {badges && badges.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Labels">
            {badges.map((badge) => (
              <li key={badge} className="rounded-full bg-brand-surface px-3 py-1 text-xs font-semibold text-brand">
                {badge}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex justify-between pt-2">
          <span className="text-sm font-semibold text-brand-ink transition-colors group-hover:text-brand">
            {ctaLabel ?? 'Meer informatie'}
          </span>
          <span aria-hidden="true" className="text-brand-ink group-hover:text-brand">
            →
          </span>
        </div>
      </div>
    </article>
  );
}
