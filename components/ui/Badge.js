function composeClassName(...tokens) {
  return tokens.filter(Boolean).join(' ');
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className,
  tone = 'brand',
  ...props
}) {
  const baseClassName = composeClassName(
    'ds-badge',
    `ds-badge--${variant}`,
    `ds-badge--${size}`,
    `ds-badge--${tone}`,
    className
  );

  return (
    <span className={baseClassName} {...props}>
      {children}
    </span>
  );
}
