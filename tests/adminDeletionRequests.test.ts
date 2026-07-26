// Pins the ordering contract for account-deletion requests in the admin Users list.
//
// Context: AccountPage writes `deletion_requested_at` and signs the user out.
// The purge is manual — nothing in the app acts on that flag — so if an admin
// never sees the row, a data-subject request silently becomes a no-op. Before
// this, the column was fetched by `admin-list-users` (select *) and then dropped
// at the UserRow type, so it was invisible in the UI entirely.
//
// The comparator below mirrors the one in AdminDashboard's fetch: deletion
// requests outrank recency. It is reproduced here rather than imported because
// it lives inside the component's async fetch closure.
import { describe, it, expect } from 'vitest';

interface Row {
  id: string;
  deletionRequestedAt?: string | null;
  activity: number;
}

const hasDeletionRequest = (u: Row) => Boolean(u.deletionRequestedAt);

const sortUsers = (rows: Row[]) =>
  [...rows].sort((a, b) => {
    const pending = Number(hasDeletionRequest(b)) - Number(hasDeletionRequest(a));
    if (pending !== 0) return pending;
    return b.activity - a.activity;
  });

describe('hasDeletionRequest', () => {
  it('is true only when a timestamp is present', () => {
    expect(hasDeletionRequest({ id: 'a', deletionRequestedAt: '2026-07-20T10:00:00Z', activity: 0 })).toBe(true);
    expect(hasDeletionRequest({ id: 'b', deletionRequestedAt: null, activity: 0 })).toBe(false);
    expect(hasDeletionRequest({ id: 'c', activity: 0 })).toBe(false);
  });

  it('does not treat the empty string as a request', () => {
    // A blank column must not raise a false compliance alarm.
    expect(hasDeletionRequest({ id: 'd', deletionRequestedAt: '', activity: 0 })).toBe(false);
  });
});

describe('admin user ordering', () => {
  it('puts a deletion request above far more active users', () => {
    const sorted = sortUsers([
      { id: 'busy', activity: 9_999 },
      { id: 'idle-but-leaving', deletionRequestedAt: '2026-07-20T10:00:00Z', activity: 1 },
      { id: 'medium', activity: 500 },
    ]);
    expect(sorted.map((u) => u.id)).toEqual(['idle-but-leaving', 'busy', 'medium']);
  });

  it('still orders by recency among users with no request', () => {
    const sorted = sortUsers([
      { id: 'old', activity: 1 },
      { id: 'new', activity: 100 },
      { id: 'mid', activity: 50 },
    ]);
    expect(sorted.map((u) => u.id)).toEqual(['new', 'mid', 'old']);
  });

  it('orders multiple requests among themselves by recency', () => {
    const sorted = sortUsers([
      { id: 'req-old', deletionRequestedAt: '2026-07-01T00:00:00Z', activity: 10 },
      { id: 'active', activity: 5_000 },
      { id: 'req-new', deletionRequestedAt: '2026-07-20T00:00:00Z', activity: 20 },
    ]);
    expect(sorted.map((u) => u.id)).toEqual(['req-new', 'req-old', 'active']);
  });
});
