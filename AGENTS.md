# Repo Grounding

Use this file as the first-stop orientation for repo-local workflow rules.

## Purpose

This repo keeps two separate kinds of guidance:

1. Durable implementation rules and reporting rules
   See [docs/WORKFLOW_GROUNDING.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/WORKFLOW_GROUNDING.md)
2. Active discovered issues, bugs, and reporting mismatches
   See [docs/ISSUE_LEDGER.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/ISSUE_LEDGER.md)

For the maintained map of what each active doc is and when to update it, see
[docs/DOCS_SYSTEM.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/DOCS_SYSTEM.md)

## Source Of Truth Order

1. Current code
2. [REWRITE_DEVELOPMENT_GUIDE.md](/Users/lebron/Documents/PraxisMakesPerfect/REWRITE_DEVELOPMENT_GUIDE.md)
3. [docs/WORKFLOW_GROUNDING.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/WORKFLOW_GROUNDING.md)
4. [CHANGELOG.md](/Users/lebron/Documents/PraxisMakesPerfect/CHANGELOG.md)
5. Historical docs under `archive/`

If a rule changes in a meaningful way, update the code and the grounding doc in the same change.

## Working Rules

- Do not create parallel rule systems in random files or chat notes.
- Put durable product and implementation rules in `docs/WORKFLOW_GROUNDING.md`.
- Put newly discovered errors, reporting mismatches, and investigation notes in `docs/ISSUE_LEDGER.md`.
- If an issue is fixed, keep the ledger entry and change its status rather than deleting history.
- Keep logic centralized where possible. Example: thresholds and report interpretation rules should live in one utility, not repeated across components.
- Prefer derived views over hand-maintained UI summaries when response/event data already exists.
- Avoid overcoding. If data is not truly available, document the limitation instead of fabricating precision.

## When Touching Assessment Or Reporting

- Check the response-event source of truth first.
- Verify denominator logic before changing percentages or readiness labels.
- Update code references in `docs/WORKFLOW_GROUNDING.md` if the wiring changes.
- Add or update a ledger entry in `docs/ISSUE_LEDGER.md` if you found a bug, mismatch, or unresolved edge case.
