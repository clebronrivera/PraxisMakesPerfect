# Documentation System

Status: Active working guide.

This file explains what the active documentation files are, when to use them, and when they must be updated.

Use this as the maintained map of the repo's live documentation system.

## 1. Start Here

If you are not sure where something belongs:

1. Read [README.md](/Users/lebron/Documents/PraxisMakesPerfect/README.md) for the current canonical doc set.
2. Read [AGENTS.md](/Users/lebron/Documents/PraxisMakesPerfect/AGENTS.md) for the repo-local workflow and source-of-truth order.
3. Use the file map below to decide where a decision, issue, rule, or history entry should live.

## 2. What Each File Is For

### [README.md](/Users/lebron/Documents/PraxisMakesPerfect/README.md)

- Purpose: root entrypoint to the current active documentation set
- Use it for: orientation, setup, canonical doc links, high-level repo layout
- Update when: the active doc set changes or setup/runtime guidance changes

### [AGENTS.md](/Users/lebron/Documents/PraxisMakesPerfect/AGENTS.md)

- Purpose: short repo-local grounding entrypoint for IDE and agent workflow
- Use it for: where rules go, source-of-truth order, working conventions
- Update when: the documentation workflow or repo-grounding process changes

### [docs/WORKFLOW_GROUNDING.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/WORKFLOW_GROUNDING.md)

- Purpose: durable product, reporting, and implementation rules
- Use it for: rules that should survive chat history
- Update when: a lasting behavior rule, reporting rule, or code-wiring rule changes

### [docs/ISSUE_LEDGER.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/ISSUE_LEDGER.md)

- Purpose: active issue and mismatch tracking
- Use it for: bugs, unresolved findings, reporting mismatches, watch items
- Update when: a new issue is found, an issue status changes, or a resolution is completed

### [CHANGELOG.md](/Users/lebron/Documents/PraxisMakesPerfect/CHANGELOG.md)

- Purpose: historical record of meaningful repo changes
- Use it for: implementation history
- Update when: a meaningful code or documentation change lands

### [REWRITE_DEVELOPMENT_GUIDE.md](/Users/lebron/Documents/PraxisMakesPerfect/REWRITE_DEVELOPMENT_GUIDE.md)

- Purpose: architecture-level authority
- Use it for: enduring product and system constraints
- Update when: architectural direction changes in a durable way

### [CODEBASE_OVERVIEW.md](/Users/lebron/Documents/PraxisMakesPerfect/CODEBASE_OVERVIEW.md)

- Purpose: high-level codebase map
- Use it for: understanding major systems and current implementation structure
- Update when: major structure or subsystem ownership changes

### [ASSESSMENT_DATA_FLOW_ANALYSIS.md](/Users/lebron/Documents/PraxisMakesPerfect/ASSESSMENT_DATA_FLOW_ANALYSIS.md)

- Purpose: deeper reference for assessment/reporting data flow
- Use it for: tracing how assessment state and results move through the app
- Update when: data flow materially changes and the analysis would otherwise become misleading

## 3. Quick Placement Rules

Put information in these places:

- Durable rule or interpretation logic: [docs/WORKFLOW_GROUNDING.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/WORKFLOW_GROUNDING.md)
- New bug, mismatch, or unresolved risk: [docs/ISSUE_LEDGER.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/ISSUE_LEDGER.md)
- Meaningful implementation history: [CHANGELOG.md](/Users/lebron/Documents/PraxisMakesPerfect/CHANGELOG.md)
- Repo or setup orientation: [README.md](/Users/lebron/Documents/PraxisMakesPerfect/README.md)
- Architecture-level direction: [REWRITE_DEVELOPMENT_GUIDE.md](/Users/lebron/Documents/PraxisMakesPerfect/REWRITE_DEVELOPMENT_GUIDE.md)

Do not put durable rules only in chat, temporary notes, or scattered one-off markdown files.

## 4. Maintenance Rules

- If a new active documentation file is added, update this file in the same change.
- If the purpose of an active documentation file changes, update this file in the same change.
- If a new durable workflow/reporting rule is introduced, update [docs/WORKFLOW_GROUNDING.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/WORKFLOW_GROUNDING.md).
- If an issue is discovered during implementation or review, add or update an entry in [docs/ISSUE_LEDGER.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/ISSUE_LEDGER.md).
- If the change matters historically, add a short note to [CHANGELOG.md](/Users/lebron/Documents/PraxisMakesPerfect/CHANGELOG.md).

## 5. Definition Of "Constantly Maintained"

This file is considered maintained if:

- every active working doc listed here still exists
- each listed file still matches the purpose described here
- new active docs are added here when they are introduced
- outdated docs are removed from active references when they stop being authoritative

## 6. Simple Workflow

When making a meaningful product or reporting change:

1. Change the code.
2. Log the issue if one was discovered.
3. Update the durable rule if the behavior changed.
4. Update this file if the docs system or file roles changed.
5. Add a changelog line if the change is meaningful history.
