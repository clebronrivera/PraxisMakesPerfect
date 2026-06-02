import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { TOAST_EVENT, type ToastDetail } from '../utils/toast';

interface ActiveToast extends ToastDetail {
  id: number;
}

/**
 * App-root listener that renders toasts dispatched via notifyToast / notifyError.
 * Auto-dismisses after a length-scaled timeout (base 5s + 10ms/char, capped at
 * 12s) so long messages stay readable; manual dismiss is always available.
 * Non-blocking, stacks up to 3.
 */
const TOAST_BASE_MS = 5000;
const TOAST_PER_CHAR_MS = 10;
const TOAST_MAX_MS = 12000;

function getToastDuration(message: string): number {
  return Math.min(TOAST_BASE_MS + message.length * TOAST_PER_CHAR_MS, TOAST_MAX_MS);
}

export default function ToastHost() {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      if (!detail?.message) return;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...detail, id }].slice(-3));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, getToastDuration(detail.message));
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const isError = t.variant === 'error';
        const styles = isError
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'border-slate-200 bg-white text-slate-700';
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${styles}`}
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
          >
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="shrink-0 rounded opacity-60 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
