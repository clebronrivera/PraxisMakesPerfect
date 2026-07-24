import React from 'react';

/**
 * Icon-only button primitive for PASS.
 *
 * For controls whose entire label is an icon — modal close (X), toolbar actions,
 * kebab menus. Text-labelled buttons use `<Button>` instead. An `aria-label` is
 * REQUIRED (the type enforces it) so icon-only controls stay accessible.
 */

export type IconButtonVariant =
  | 'ghost' // transparent; muted slate icon, subtle hover fill (default — modal close, toolbar)
  | 'neutral' // slate outline
  | 'dark'; // near-black fill

export type IconButtonSize = 'sm' | 'md';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — icon-only controls have no visible text label. */
  'aria-label': string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

const BASE =
  'inline-flex items-center justify-center rounded-full transition-colors ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

const SIZE: Record<IconButtonSize, string> = {
  sm: 'p-1.5',
  md: 'p-2',
};

const VARIANT: Record<IconButtonVariant, string> = {
  ghost: 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
  neutral: 'border border-slate-200 text-slate-500 hover:bg-slate-50',
  dark: 'bg-slate-900 text-white hover:bg-slate-800',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', size = 'md', className = '', type, children, ...rest },
  ref,
) {
  const classes = [BASE, SIZE[size], VARIANT[variant], className].filter(Boolean).join(' ');
  return (
    <button ref={ref} type={type ?? 'button'} className={classes} {...rest}>
      {children}
    </button>
  );
});

export default IconButton;
