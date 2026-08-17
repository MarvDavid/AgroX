'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface PageShellProps {
  children: React.ReactNode;
  /** Grey page background, used by the dashboards. */
  muted?: boolean;
  /** Widen the content cap to --max-width-wide, for tables and sidebars. */
  wide?: boolean;
  /**
   * When true (default) <main> gets the container gutter + vertical rhythm.
   * Set false when the page's own sections carry .agrox-container instead.
   */
  contained?: boolean;
  /** Render the site footer. Off for app-like screens such as the chat inbox. */
  footer?: boolean;
  /** Rendered between the header and <main> — e.g. the category strip. */
  subnav?: React.ReactNode;
  /** Extra classes for <main>, e.g. to make it a flex column. */
  mainClassName?: string;
  onSearchChange?: (query: string) => void;
  onOpenChat?: () => void;
}

/**
 * The single page shell: full-height column, header, optional subnav, the
 * contained main region, and the footer.
 *
 * Every page used to hand-roll this, which is how the six <main> elements
 * ended up with an inline `padding` shorthand that cancelled the container's
 * horizontal gutter. Layout belongs in the classes below, not inline.
 */
export default function PageShell({
  children,
  muted = false,
  wide = false,
  contained = true,
  footer = true,
  subnav,
  mainClassName,
  onSearchChange,
  onOpenChat,
}: PageShellProps) {
  const mainClasses = [
    contained ? 'agrox-page' : 'agrox-main',
    contained && wide ? 'agrox-page--wide' : '',
    mainClassName || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`agrox-shell${muted ? ' agrox-shell--muted' : ''}`}>
      <Navbar onSearchChange={onSearchChange} onOpenChat={onOpenChat} />
      {subnav}
      <main className={mainClasses}>{children}</main>
      {footer && <Footer />}
    </div>
  );
}
