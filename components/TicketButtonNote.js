import { Children, cloneElement, isValidElement } from 'react';

export default function TicketButtonNote({
  affiliate = false,
  showIcon = true,
  children,
  id,
}) {
  const shouldShowIcon = affiliate || showIcon;
  const noteClassName = `ticket-button__note${affiliate ? ' ticket-button__note--partner' : ''}`;

  const childArray = Children.toArray(children).filter(
    (child) => child !== null && child !== undefined && child !== false
  );

  if (childArray.length === 0) {
    return null;
  }

  const noteLines = childArray.map((child, index) => {
    if (isValidElement(child)) {
      return cloneElement(child, {
        key: child.key ?? `ticket-note-line-${index}`,
      });
    }

    return (
      <span key={`ticket-note-line-${index}`} className="ticket-button__note-line">
        {child}
      </span>
    );
  });

  return (
    <span className={noteClassName} id={id}>
      {shouldShowIcon ? (
        <svg
          className="ticket-button__note-icon"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11.25 2.75h6v6" />
          <path d="M17.25 2.75 9.5 10.5" />
          <path d="M6.5 5.5H2.75v11.75h11.75V13" />
        </svg>
      ) : null}
      <span className="ticket-button__note-text">{noteLines}</span>
    </span>
  );
}
