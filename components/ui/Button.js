import Link from 'next/link';
import { forwardRef } from 'react';

function composeClassName(...tokens) {
  return tokens.filter(Boolean).join(' ');
}

const Button = forwardRef(function Button(
  {
    href,
    children,
    variant = 'primary',
    tone = 'brand',
    size = 'md',
    icon,
    iconPosition = 'left',
    className,
    as = 'button',
    disabled = false,
    ...props
  },
  ref
) {
  const baseClassName = composeClassName(
    'ds-button',
    `ds-button--${variant}`,
    `ds-button--${tone}`,
    `ds-button--${size}`,
    icon ? 'ds-button--with-icon' : null,
    className
  );

  const content = (
    <>
      {icon && iconPosition === 'left' ? (
        <span className="ds-button__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="ds-button__label">{children}</span>
      {icon && iconPosition === 'right' ? (
        <span className="ds-button__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
    </>
  );

  if (href) {
    const ariaDisabled = disabled ? 'true' : undefined;
    const tabIndex = disabled ? -1 : undefined;

    return (
      <Link
        href={href}
        className={baseClassName}
        aria-disabled={ariaDisabled}
        tabIndex={tabIndex}
        ref={ref}
        {...props}
      >
        {content}
      </Link>
    );
  }

  if (as && as !== 'button') {
    const Component = as;
    return (
      <Component ref={ref} className={baseClassName} disabled={disabled} {...props}>
        {content}
      </Component>
    );
  }

  return (
    <button ref={ref} type="button" className={baseClassName} disabled={disabled} {...props}>
      {content}
    </button>
  );
});

export default Button;
