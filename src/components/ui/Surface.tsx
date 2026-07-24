import React from 'react';

/**
 * Canonical card / panel container for PASS.
 *
 * Wraps the shared `.editorial-surface` class (white fill, soft shadow, 2rem radius)
 * and turns the padding that used to be sprinkled ad-hoc (p-5 / p-6 / p-10) into an
 * explicit, intentional prop. Because it uses the class rather than re-hardcoding
 * colors, it inherits the eventual warm→cool border migration for free.
 */

export type SurfacePadding = 'none' | 'sm' | 'md' | 'lg';

type SurfaceElement = 'div' | 'section' | 'article' | 'aside';

export interface SurfaceProps extends React.HTMLAttributes<HTMLElement> {
  /** Inner padding. Defaults to `md` (p-6) — the app's standard panel padding. */
  padding?: SurfacePadding;
  /** Render as a different semantic element (default `div`). */
  as?: SurfaceElement;
}

const PADDING: Record<SurfacePadding, string> = {
  none: '',
  sm: 'p-5',
  md: 'p-6',
  lg: 'p-10',
};

export const Surface = React.forwardRef<HTMLElement, SurfaceProps>(function Surface(
  { padding = 'md', as = 'div', className = '', children, ...rest },
  ref,
) {
  const Tag = as as React.ElementType;
  const classes = ['editorial-surface', PADDING[padding], className].filter(Boolean).join(' ');
  return (
    <Tag ref={ref} className={classes} {...rest}>
      {children}
    </Tag>
  );
});

export default Surface;
