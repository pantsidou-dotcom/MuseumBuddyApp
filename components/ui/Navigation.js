import Link from 'next/link';
import Badge from './Badge';

function composeClassName(...tokens) {
  return tokens.filter(Boolean).join(' ');
}

export function NavBar({ children, className, ...props }) {
  return (
    <nav className={composeClassName('ds-nav', className)} {...props}>
      {children}
    </nav>
  );
}

export function NavSection({ children, className, ...props }) {
  return (
    <div className={composeClassName('ds-nav__section', className)} {...props}>
      {children}
    </div>
  );
}

export function NavLink({
  href,
  children,
  icon,
  badge,
  className,
  active = false,
  tone = 'brand',
  ...props
}) {
  const badgeContent =
    typeof badge === 'number' ? (
      <Badge variant="solid" size="sm" tone={tone} className="ds-nav__badge">
        {badge}
      </Badge>
    ) : (
      badge
    );

  return (
    <Link
      href={href}
      className={composeClassName('ds-nav__link', `ds-nav__link--${tone}`, active ? 'ds-nav__link--active' : null, className)}
      aria-current={active ? 'page' : undefined}
      {...props}
    >
      {icon ? (
        <span className="ds-nav__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="ds-nav__label">{children}</span>
      {badgeContent}
    </Link>
  );
}

export function NavButton({ children, icon, className, tone = 'brand', ...props }) {
  return (
    <button
      type="button"
      className={composeClassName('ds-nav__link', 'ds-nav__link--button', `ds-nav__link--${tone}`, className)}
      {...props}
    >
      {icon ? (
        <span className="ds-nav__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="ds-nav__label">{children}</span>
    </button>
  );
}
