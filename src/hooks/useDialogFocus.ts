import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), ' +
  'select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared modal/drawer accessibility behavior: Escape-to-close, body scroll-lock,
 * focus moved into the dialog on open, Tab trapped inside it, and focus restored
 * to whatever triggered it on close. Attach `ref` to the dialog's outermost
 * element (the one carrying `role="dialog"` / `aria-modal="true"`).
 */
export function useDialogFocus(
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void,
) {
  // Callers typically pass a fresh `() => setOpen(false)` closure every render.
  // Read the latest one via ref so the effect only re-runs on genuine open/close
  // transitions, not on every parent re-render while the dialog stays open
  // (which would otherwise tear down and rebuild the trap, stealing focus back
  // from wherever the user had just tabbed to).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const triggerElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFirst = () => {
      const node = ref.current;
      if (!node) return;
      const focusable = node.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (focusable ?? node).focus();
    };
    // Defer one tick so the dialog's content has mounted.
    const raf = requestAnimationFrame(focusFirst);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const node = ref.current;
      if (!node) return;
      const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerElement?.focus?.();
    };
  }, [isOpen, ref]);
}
