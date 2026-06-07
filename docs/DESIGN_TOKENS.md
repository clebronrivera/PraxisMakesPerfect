# Design Tokens — Indigo/Violet Light Theme (single source of truth)

**Status:** canonical as of 2026-06-06. This is the authoritative color reference. When building any mockup or component, use ONLY these values. Run `npm run scan:colors` to catch regressions.

> **Why this file exists.** The April–June 2026 indigo/violet re-theme cooled the *tokens* (page, accents, domain gradients) but left many **surface fills/borders warm** — `#fbfaf7` / `#e6dfd4` are still hardcoded in `src/index.css` and ~13 components. Copying those verbatim re-introduces the old warm ("off-yellow") look on a cool page. That is the "echo of old code" regression. **Do not copy warm surface hexes.**

---

## ✅ Canonical palette (use these)

### Page & surfaces — COOL
| Role | Value | Notes |
|---|---|---|
| Page background | `#f7f6f8` | `--page-bg`. Cool light. NOT a warm cream. |
| Card surface | `#ffffff` bg · `#e2e8f0` border (slate-200) | radius `2rem`, shadow `0 18px 50px rgba(15,23,42,.08)` |
| Soft/inset surface | `#f8fafc` bg (slate-50) · `#eef2f6` border | radius `1.75rem` |
| Progress track (empty) | `#f1f5f9` (slate-100) | cool |
| Hairline / divider | `#f1f5f9` / `slate-100` | |

### Accent & text
| Role | Value |
|---|---|
| Accent gradient | `#8b5cf6` (violet-500) → `#4f46e5` (indigo-600), `135deg` |
| Accent solid / links | `#6d28d9` (violet-700) on `#f5f3ff` bg, `#ddd6fe` border (secondary button) |
| Heading text | `#0f172a` (slate-900), Inter `font-extrabold`/`font-bold` |
| Body / muted | `#64748b` / `#94a3b8` (slate-500 / slate-400) |
| Font | **Inter** only (400–900). NOT Fraunces in dashboard/app screens. |

### Domain gradients (semantic — each domain has its own)
| Domain | From → To |
|---|---|
| D1 · Professional Practices | `#06b6d4` → `#2563eb` (cyan→blue) |
| D2 · Student-Level Services | `#10b981` → `#0d9488` (emerald→teal) |
| D3 · Systems-Level Services | `#f43f5e` → `#db2777` (rose→pink) |
| D4 · Foundations | `#f59e0b` → `#ea580c` (amber→orange) |

### Semantic badges (Tailwind `badge-*`)
mint `emerald-50/700/200` · amber `amber-50/700/200` · violet `violet-50/700/200` · slate `slate-100/600/200` · coral `rose-50/700/200`.

---

## ⛔ Forbidden — warm "old palette" echoes (never use in new work)

These read as off-yellow/cream on the cool page. They are legacy and slated for removal:

| Hex | Was used for | Cool replacement |
|---|---|---|
| `#e6dfd4` | warm card border | `#e2e8f0` (slate-200) |
| `#fbfaf7` | warm soft-surface fill | `#f8fafc` (slate-50) |
| `#ece4d7` | warm soft-surface border | `#eef2f6` |
| `#ece8df` | warm progress track | `#f1f5f9` (slate-100) |
| `#f4f1ea`, `#faf8f3` | warm page background | `#f7f6f8` |

`npm run scan:colors` fails the build if any forbidden hex appears in guarded files.

---

## Known debt (not yet migrated)

The forbidden warm hexes are still hardcoded in **`src/index.css`** (`editorial-surface`, `-soft`, `editorial-progress-track`) and in ~13 components (`AdminDashboard`, `ResultsDashboard`, `QuestionCard`, `LearningPathModulePage`, `StudentDetailDrawer`, `ScreenerResults`, `ScreenerAssessment`, `FullAssessment`, `AdaptiveDiagnostic`, `StudyCenterSidebar`, `TutorEmptyState`, `TutorMessageBubble`). De-warming those to the cool surface tokens above is a **separate, approval-gated migration** (high blast radius across live screens). Until then, the color guard is scoped to new work so legacy files don't fail the build.
