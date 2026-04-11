/**
 * localStorage-backed retry queue for failed practice response submissions.
 * Max 50 entries, 24-hour TTL. Auto-flushes on next successful submission.
 */

const STORAGE_KEY = 'pmp-retry-queue';
const MAX_ENTRIES = 50;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface QueuedResponse {
  payload: Record<string, unknown>;
  queuedAt: number;
}

function readQueue(): QueuedResponse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: QueuedResponse[] = JSON.parse(raw);
    const now = Date.now();
    // Purge expired entries
    return items.filter((item) => now - item.queuedAt < TTL_MS);
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedResponse[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-MAX_ENTRIES)));
  } catch {
    // Storage full or unavailable — silently drop oldest entries
  }
}

/** Add a failed response to the retry queue. */
export function enqueueResponse(payload: Record<string, unknown>) {
  const queue = readQueue();
  queue.push({ payload, queuedAt: Date.now() });
  writeQueue(queue);
}

/** Get all queued responses (non-destructive). */
export function getQueuedResponses(): QueuedResponse[] {
  return readQueue();
}

/** Remove all entries from the queue (call after successful flush). */
export function clearQueue() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Number of responses waiting to be retried. */
export function queueSize(): number {
  return readQueue().length;
}
