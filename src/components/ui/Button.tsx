import React from 'react';

/**
 * Canonical button primitive for PASS.
 *
 * Replaces the ad-hoc `<button className="...">` styling scattered across the app
 * (see docs/DESIGN_TOKENS.md). Variants map to the cool indigo/violet theme; every
 * variant shares the same focus ring, disabled treatment, and layout so the same
 * semantic action looks identical on every screen.
 *
 * Do NOT reintroduce raw button styling — add a variant here instead.
 */

export type ButtonVariant =
  | 'primary' // gradient CTA — the one main action on a view
  | 'secondary' // soft violet — supporting action next to a primary
  | 'neutral' // slate outline — low-emphasis actions (sign out, export, cancel)
  | 'ghost' // text-only indigo — inline/tertiary actions (edit, view link)
  | 'destructive' // rose — irreversible actions (delete account, reset data)
  | 'dark' // near-black — high-contrast CTA on light surfaces
  | 'subtle'; // muted slate text — quiet tertiary links (back, skip, exit)

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to fill the parent's width. */
  fullWidth?: boolean;
}

const BASE =
  'inline-flex items-center justify-center gap-2 font-semibold transition-all ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

const SIZE: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-xs rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-2xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
};

const VARIANT: Record<ButtonVariant, string> = {
  // grad-chrome = accent gradient (violet-500 → indigo-600) defined in index.css
  primary: 'grad-chrome text-white shadow-sm hover:brightness-[1.08]',
  secondary:
    'bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 hover:border-violet-300',
  neutral: 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
  ghost: 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50',
  destructive: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
  dark: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800',
  subtle: 'text-slate-500 hover:text-slate-800 hover:bg-slate-100',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth = false, className = '', type, children, ...rest },
  ref,
) {
  const classes = [
    BASE,
    SIZE[size],
    VARIANT[variant],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button ref={ref} type={type ?? 'button'} className={classes} {...rest}>
      {children}
    </button>
  );
});

export default Button;
