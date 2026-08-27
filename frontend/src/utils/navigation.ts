import React from 'react';

/**
 * Handles navigation to a ticket.
 * Opens in a new tab if Ctrl, Cmd, or Middle-click is pressed.
 * Navigates in the current tab otherwise.
 */
export const navigateToTicket = (
  e: React.MouseEvent | MouseEvent | any,
  ticketIdOrNumber: string | number,
  navigate: (path: string) => void
) => {
  if (!ticketIdOrNumber) return;

  const mouseEvent = e?.event || e;
  const isNewTab = mouseEvent && (mouseEvent.ctrlKey || mouseEvent.metaKey || mouseEvent.button === 1);
  const targetUrl = `/tickets/${ticketIdOrNumber}`;

  if (isNewTab) {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  } else {
    navigate(targetUrl);
  }
};
