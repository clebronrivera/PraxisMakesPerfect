# Session Rules

Every Claude Code session working on this refactor MUST follow these rules.

## At the start of every session

1. Read in order:
   - `CLAUDE.md` (project root)
   - `docs/plans/multi-test-refactor/STATE.md`
   - `docs/plans/multi-test-refactor/SESSION_RULES.md` (this file)
   - `docs/plans/multi-test-refactor/COMMANDS.md`
   - `docs/plans/multi-test-refactor/BLOCKERS.md`
   - The current phase file named in `STATE.md`
2. Report up-front:
   ```
   Current phase: <name>
   Current step: <id>
   Goal: <one sentence>
   Files expected to change: <list>
   Acceptance criteria: <bulleted from phase file>
   ```
3. If `BLOCKERS.md` shows an active hard blocker for the current phase: stop, report the blocker, do nothing else.

## Read vs. modify (Forbidden files clarification)

In phase files, "Forbidden files" means **no modification**. Reads are always allowed — sessions need to read `CLAUDE.md`, `package.json`, the file being analyzed, etc., as context. Forbidden = no `Edit`, no `Write`, no rename, no delete. `Read` is unrestricted.

## During work

- Make the smallest safe change that satisfies the active step's acceptance criteria.
- Do not start the next step automatically.
- Do not perform unrelated cleanup, refactors, or "while I'm here" improvements.
- Do not modify files outside the active step's `Allowed files` list.
- If you discover an issue outside scope, write it as a blocker or proposal in `BLOCKERS.md` (do NOT fix it).
- If a Keystone artifact you need is missing, do NOT fabricate it. Stop, mark a blocker, report.

## After work

1. Run the verification checks listed for the active step.
2. Update `STATE.md`:
   - Move the completed step from "Active" to "Completed"
   - Set the next step as "Active" (or mark phase complete if last step)
   - Update verification status table
3. Append to `HANDOFF_LOG.md`:
   - Date / phase / step
   - Files changed (list)
   - Checks run + results
   - Blockers introduced or resolved
   - Rollback note (commit SHA, revert command if applicable)
   - Exact next operator command
4. Report back to the user:
   ```
   Completed: <step id> — <one sentence>
   Files changed: <list>
   Checks run: <list with results>
   Result: <pass | partial | failed>
   STATE.md updated: yes
   Next step: <id> — <one sentence>
   Exact prompt to continue: "begin next step"
   ```

## Rollback contract

Every code phase must record, in `HANDOFF_LOG.md`, how to undo the step. The default is a single commit per step on a feature branch (see `DECISIONS.md` item 10). Rollback is `git revert <SHA>` unless the step states otherwise. Phases that touch the database (Phase 3) must additionally record the migration number to `down`-migrate to.

If rollback would require multiple steps (e.g., reverting a migration after data has been written), the phase file will document the procedure under a `Rollback procedure` subsection. Otherwise the default `git revert` is sufficient.

## Hard rules

- Do not skip steps.
- Do not start the next phase unless the current phase's exit criteria are 100% met (verified by re-reading the phase file).
- Do not broaden scope without recording it as a blocker or proposal in `BLOCKERS.md`.
- Keep changes small and reversible. One logical change per session is the default.
- If behavior changes for users, update `docs/HOW_THE_APP_WORKS.md` (per `CLAUDE.md` mandate).
- If developer workflow changes, update `CLAUDE.md`.
- Never use `--no-verify` or skip pre-commit hooks.
- Never run destructive git commands (push --force, reset --hard, etc.) unless explicitly requested.
- Never auto-run database migrations against production. Phase 3 has explicit preview-branch + backup preconditions.
