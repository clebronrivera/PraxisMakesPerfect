# Session Rules

Every Claude Code session working on this refactor MUST follow these rules.

## At the start of every session

1. Read in order:
   - `CLAUDE.md` (project root)
   - `docs/plans/multi-test-refactor/STATE.md`
   - `docs/plans/multi-test-refactor/SESSION_RULES.md` (this file)
   - `docs/plans/multi-test-refactor/BLOCKERS.md`
   - `docs/plans/multi-test-refactor/AUDIT_CHECKS.md`
   - The current phase file named in `STATE.md` Active Step section

2. Run `audit os` (per `AUDIT_CHECKS.md` § OS Integrity). If it fails, STOP and report.

3. Run the **pre-flight check** for the current phase from `AUDIT_CHECKS.md`. If it fails, STOP and report.

4. Report up-front, sourcing values from `STATE.md` Active Step:

   ```
   Current phase: <name>             ← from STATE.md "Current phase"
   Current step:  <id>               ← from STATE.md "Active Step → Step ID"
   Goal:          <one sentence>     ← from STATE.md "Active Step → Goal"
   Files expected to change:         ← from STATE.md "Active Step → Allowed files"
     <list>
   Acceptance criteria:              ← from STATE.md "Active Step → Acceptance criteria"
     <bulleted>
   OS integrity: <pass|fail>
   Pre-flight:   <pass|fail>
   ```

5. If `BLOCKERS.md` shows an active hard blocker for the current phase: STOP, report the blocker, do nothing else.

6. If the active step is marked `human_gate: true`: STOP, report what the human needs to verify, wait for `force advance` from the operator.

## During work

- Make the smallest safe change that satisfies the active step's acceptance criteria.
- Do not start the next step automatically.
- Do not perform unrelated cleanup, refactors, or "while I'm here" improvements.
- Do not edit files outside the active step's `Allowed files` list.
- If you discover an issue outside scope, write it to `BLOCKERS.md` Proposals section. Do **not** fix it.
- If a Keystone artifact you need is missing, do **not** fabricate it. Mark a blocker, halt, report.

## After work

1. Run the **post-audit check** for the active step from `AUDIT_CHECKS.md`.
2. Run the verification checks listed for the active step in the phase file.
3. Update `STATE.md`:
   - Move the completed step from "Active" to "Completed"
   - Set the next step as "Active" (or mark phase complete if last step)
   - Update verification status table
4. Append to `HANDOFF_LOG.md`:
   - Date, session ID, phase, step
   - Files changed (list)
   - Checks run + results
   - Audit results (pass/fail per `AUDIT_CHECKS.md`)
   - Blockers introduced or resolved
   - Git SHA at end of session (drift detection requires this)
   - Exact next operator command
5. Report back to the user:

   ```
   Completed: <step id> — <one sentence>
   Files changed: <list>
   Checks run: <list with results>
   Result: <pass | partial | failed>
   Audit: <pass | fail per AUDIT_CHECKS.md>
   STATE.md updated: yes
   Next step: <id> — <one sentence>
   Exact prompt to continue: "begin next step"
   ```

## Hard rules

- Do not skip steps.
- Do not start the next phase unless the current phase's exit criteria are 100% met (verified by re-reading the phase file).
- Do not broaden scope without recording it in `BLOCKERS.md` Proposals.
- Keep changes small and reversible. One logical change per session is the default.
- If behavior changes for users, update `docs/HOW_THE_APP_WORKS.md` (per `CLAUDE.md` mandate).
- If developer workflow changes, update `CLAUDE.md`.
- Never use `--no-verify` or skip pre-commit hooks.
- Never run destructive git commands (push --force, reset --hard, etc.) unless explicitly requested.

## At each phase boundary

When a phase completes (last step's exit criteria met):
1. Re-read all decisions in `DECISIONS.md` and confirm none have been silently violated by the phase's changes.
2. Triage `BLOCKERS.md` Proposals — assign each to a future phase or reject explicitly. Do not let proposals accumulate ungoverned.
3. Append a phase-boundary summary entry to `HANDOFF_LOG.md`.
4. Wait for operator's `begin next phase` command. Do not auto-advance.
