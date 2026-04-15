/**
 * Minimal global toast emitter.
 *
 * Hooks (which cannot render UI) dispatch a CustomEvent here; the <ToastHost />
 * component mounted at the app root listens and renders a small notification.
 *
 * Kept intentionally simple — we only need non-blocking error surfaces for
 * background write failures (e.g. answer-save errors). Not a full toast lib.
 */

export type ToastVariant = 'error' | 'info';

export interface ToastDetail {
  message: string;
  variant: ToastVariant;
}

export const TOAST_EVENT = 'pmp-toast';

export function notifyToast(message: string, variant: ToastVariant = 'info') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { message, variant } })
  );
}

export function notifyError(message: string) {
  notifyToast(message, 'error');
}
