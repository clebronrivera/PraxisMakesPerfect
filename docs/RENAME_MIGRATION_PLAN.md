# Rename Migration Plan: PraxisMakesPerfect → Adaptive Prep Lab

**Prepared:** April 14, 2026  
**Proposed new name:** Adaptive Prep Lab  
**Short identifier (replaces `pmp-`):** `apl-`

---

## Scope of the Rename

A full audit found **~2,449 name references** across four variants:

| Variant | Count | Where It Appears |
|---|---|---|
| `PraxisMakesPerfect` (camelCase) | ~1,596 | Docs, React components, scripts |
| `Praxis Makes Perfect` (spaces) | ~309 | Mockups, onboarding, tutorial slides, ToS/Privacy |
| `praxismakesperfect` (lowercase) | ~391 | Legacy Firebase archive docs, CHANGELOG |
| `pmp-` (prefix) | ~153 | localStorage keys in 12+ hooks and auth context |

**Key active code files that reference the name:**
- `src/components/TermsOfService.tsx` — 4 references
- `src/components/PrivacyPolicy.tsx` — 6 references
- `src/components/OnboardingFlow.tsx` — 1 reference
- `src/data/tutorial-slides.ts` — 1 reference ("Welcome to Praxis Makes Perfect")
- `src/contexts/AuthContext.tsx` — `pmp-auth-session:${userId}` (localStorage)
- `App.tsx` — `pmp-daily-q-`, `pmp-daily-time-` (localStorage)
- 10+ hooks — `pmp-*` localStorage keys

**NOT affected (no changes needed):**
- `package.json` — already uses `"name": "praxis-study-app"` (internal, not user-facing)
- `index.html` — title is `"Praxis Study - School Psychology 5403"` (will need update)
- `netlify.toml`, `vite.config.ts`, `.env.local` — no project name references
- Supabase migrations — schema only, no project naming

---

## The Critical `pmp-` Problem

The `pmp-` prefix is used as a namespace for **localStorage keys** that store real user session data:

| Key | Hook/File | Impact if renamed |
|---|---|---|
| `pmp-auth-session:{userId}` | `AuthContext.tsx` | Users get logged out on first load |
| `pmp-daily-q-{userId}-{date}` | `App.tsx`, hooks | Daily question counter resets |
| `pmp-daily-time-{userId}-{date}` | `App.tsx`, hooks | Daily study time resets |
| `pmp-spicy-cycle-{userId}` | `PracticeSession.tsx` | Spicy mode cycle position lost |
| `pmp-qretire-{userId}` | `PracticeSession.tsx` | Retired question list lost |
| `pmp-lp-{userId}` | `useLearningPathProgress.ts` | Learning path progress lost |
| `pmp-tutorial-seen` | `useTutorialState.ts` | Tutorial replays for all users |
| `pmp-retry-queue` | `responseRetryQueue.ts` | Pending retries lost |

**A rename of `pmp-` → `apl-` requires a one-time migration script** that reads old keys, writes new keys, and deletes the old ones — or accepts that existing users will lose local state on the transition day. Most of this data is low-stakes (daily counters reset cleanly) except for `pmp-spicy-cycle` and `pmp-qretire`, which represent actual user progress state.

---

## Option 1 — In-Place Rename (Same Repo, Main Branch)

**What it is:** Run a batch find-and-replace across the repo on the current `main` branch, commit, and deploy.

### Pros
- Preserves full git history
- No infrastructure changes (Netlify, Supabase, domain stay the same)
- Single source of truth — no drift between repos
- Simplest to execute

### Cons
- **Leak risk is real.** With ~2,449 occurrences across docs, worktrees, archives, and code, a naive find-and-replace will miss edge cases (worktree copies, build artifacts, binary files). Requires careful scope control.
- Worktrees (5 copies under `.claude/worktrees/`) each have their own duplicate files — they will need to be either cleaned up or renamed too
- The `pmp-` localStorage migration must be deployed simultaneously or users lose session state
- One big messy commit is hard to review

### Risk Level: Medium

**Best for:** If you want the fastest path and are comfortable with a careful scripted rename.

---

## Option 2 — Feature Branch Rename

**What it is:** Create a dedicated `rename/adaptive-prep-lab` branch. Do all rename work there. Review the full diff. Merge when confident.

### Pros
- Full git history preserved
- Isolated — `main` stays stable during the rename work
- Reviewable: you can see every changed line before it goes live
- CI/CD runs against the branch before merge
- Cleanest workflow for a surgical rename

### Cons
- Same leak risk as Option 1 — but you catch it in review before merge
- Worktrees still need to be handled
- `pmp-` localStorage migration still required at merge time
- Branch divergence from main during the rename window (minor, since there's likely no parallel feature work)

### Risk Level: Low–Medium

**Best for:** This is the recommended approach. It gives you the safety of review without the overhead of a new repo.

---

## Option 3 — New GitHub Repository

**What it is:** Create a fresh repo named `adaptive-prep-lab` and copy the source over (src/, api/, supabase/, scripts/, public/, config files). Leave the old repo as an archive.

### Pros
- Truly clean slate — zero legacy naming anywhere
- No worktree contamination
- Natural opportunity to prune dead/archived code
- New repo name appears in GitHub URL, which aligns with the rebrand

### Cons
- **Loses all git history** (commits, blame, PRs, issues) unless you do a mirror push (complex)
- Must re-connect Netlify to the new repo and re-configure build settings
- Must re-set all environment variables in Netlify
- Supabase connection is unchanged (same project), but all deployment triggers need to be rewired
- Domain DNS/Netlify site name likely need updating too
- `pmp-` localStorage migration still required
- Highest setup effort

### Risk Level: Low (for naming) / High (for infrastructure disruption)

**Best for:** If you're planning a broader infrastructure overhaul alongside the rename, or if you want a hard break from the old identity. Not recommended purely for a rename.

---

## Option 4 — Hybrid: New Repo + Automated Migration Script

**What it is:** Mirror the repo to a new `adaptive-prep-lab` GitHub repo (preserving history), then run the rename script on the new repo.

```bash
# Mirror push (preserves all history)
git clone --mirror https://github.com/your-org/PraxisMakesPerfect.git
cd PraxisMakesPerfect.git
git remote set-url --push origin https://github.com/your-org/adaptive-prep-lab.git
git push --mirror
```

Then clone the new repo and do the rename on a branch there.

### Pros
- New repo name in GitHub
- Full git history preserved
- Old repo stays as a read-only archive
- Clean rename on a branch in the new repo

### Cons
- Requires temporary admin access to set up the mirror
- Two repos to manage during transition
- Netlify/CI still needs to be re-pointed
- Moderately complex

### Risk Level: Low–Medium

**Best for:** If a new repo URL matters for branding (e.g., future open-source, client demos) but you want history.

---

## Recommendation

**Option 2 (Feature Branch) is recommended for the rename itself**, combined with a localStorage key migration script deployed at merge time.

Here is the proposed execution sequence:

1. **Create branch:** `git checkout -b rename/adaptive-prep-lab`
2. **Run rename script** (automated, scoped to `src/`, `api/`, `supabase/`, `docs/`, config files — excludes `node_modules/`, `dist/`, `.git/`, `.claude/worktrees/`, `archive/`)
3. **Add localStorage migration** — a one-time startup script in `App.tsx` that reads `pmp-*` keys, writes `apl-*` equivalents, then deletes the originals
4. **Update index.html title**
5. **Review full diff** — scan for any missed references
6. **Merge to main and deploy**

If a new GitHub repo URL is important to you (for client presentations, SEO, or a clean public presence), **Option 4 (mirror + branch rename)** adds minimal overhead on top of Option 2 and gives you that clean URL.

---

## localStorage Migration Script (Draft)

This goes in `App.tsx` as a one-time migration on app startup:

```typescript
// One-time localStorage key migration: pmp- → apl-
function migrateLocalStorageKeys() {
  const migrated = localStorage.getItem('apl-migration-done');
  if (migrated) return;

  const keysToMigrate = Object.keys(localStorage).filter(k => k.startsWith('pmp-'));
  keysToMigrate.forEach(oldKey => {
    const newKey = oldKey.replace(/^pmp-/, 'apl-');
    const value = localStorage.getItem(oldKey);
    if (value !== null) {
      localStorage.setItem(newKey, value);
      localStorage.removeItem(oldKey);
    }
  });

  localStorage.setItem('apl-migration-done', '1');
}
```

Call `migrateLocalStorageKeys()` at the top of your root `App` component, before any hooks that read localStorage.

---

## Next Steps (Awaiting Your Decision)

- [ ] Choose an option (recommendation: Option 2 or Option 4)
- [ ] Confirm whether `pmp-` localStorage keys should be renamed to `apl-` or a different prefix
- [ ] Confirm the domain/Netlify site name change plan (if any)
- [ ] Proceed with rename + ToS/Privacy updates to reflect "Adaptive Prep Lab"
