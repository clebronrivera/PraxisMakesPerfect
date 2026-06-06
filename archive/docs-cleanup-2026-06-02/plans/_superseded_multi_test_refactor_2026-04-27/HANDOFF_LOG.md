# Handoff Log

Append-only. Newest at the top. One entry per session.

---

## 2026-04-27 — Pre-Phase -1: scaffold authored in workspace

**Author:** Cowork (planning session, not Claude Code)
**Phase / step:** N/A — scaffold creation
**Files changed:** all 20 files in this directory (created from scratch in workspace folder, not yet committed to PMP repo)

### Plan critique applied before file creation

The original master plan (passed in by the operator) had several issues fixed during scaffold:

1. **Mangled markdown links stripped.** The original used patterns like `[STATE.md](http://STATE.md)` everywhere; these were broken hyperlinks. Now all filenames are plain backticked references.
2. **Self-reference loop removed.** PHASE_-1_BOOTSTRAP no longer points at an external master plan. Each phase file is fully self-contained.
3. **Phase -1.2 added** for capturing baseline screenshots before any code changes. Phase 0+ acceptance criteria reference these baselines.
4. **Phase -1.3 added** to verify the existence of `public/mockup-dashboard-atelier.html` and `public/mockup-results-atelier.html`. Logged as `B4` in `BLOCKERS.md` until checked.
5. **Forbidden files clarified** in `SESSION_RULES.md`: no-modify, reads always allowed.
6. **Rollback contract added** to `SESSION_RULES.md`. Default is `git revert <SHA>`. Phase 3 (DB) and Phase 4B (flag) override.
7. **Branching strategy added** to `DECISIONS.md` (item 10): one feature branch per phase, squash-merge to main, sibling branches for parallelizable phases.
8. **Phase 3 precondition added**: must run on a Supabase preview branch + take a backup before applying migrations to any non-local environment. Documented in PHASE_3 file.
9. **Phase 1A.7 flagged** as the step that converts the inline TestPackage literal (created in Phase 0.2) to a dynamic-import thunk. No surprise to operator.
10. **Phase 2B dependency clarified**: depends on Phase 1E only, not on 2A. Mockups can use placeholder FTCE content while B1/B2 are unresolved.
11. **Phase 4B precondition reframed**: 7-day soak is an *operator-confirmed* gate, not a code-level wait. Claude Code does not "monitor" — the operator says "begin next phase" only when soak elapsed.
12. **All 20 file names normalized** to use only ASCII underscores and dashes (e.g., `PHASE_2A_ADD_FTCE036_PACKAGE_INTERNAL.md`, `PHASE_-1_BOOTSTRAP.md`).

### What this entry does NOT establish

- This entry does NOT count as Phase -1 step -1.1 completion. Phase -1.1 is the *move* from this workspace into the PMP repo, which the operator hasn't done yet.
- No code has been written; no git branches created; no migrations applied.

### Next operator action

1. Review this directory in the workspace.
2. Move `multi-test-refactor/` into the PMP repo at `docs/plans/multi-test-refactor/`. Suggested commands in `CLAUDE_CODE_KICKOFF.md` (sibling file at workspace root, not part of the operating system).
3. Open Claude Code in the PMP repo and paste the bootstrap prompt from `CLAUDE_CODE_KICKOFF.md`.
4. Claude Code will pick up Phase -1 step -1.1 from `STATE.md`.

---

(no Claude Code sessions yet)
