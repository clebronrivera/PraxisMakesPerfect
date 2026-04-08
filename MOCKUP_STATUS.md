# Mockup Status Tracker

## Approved Design Direction

**`mockup-user-flow.html`** — amber/cream editorial design system, full user journey from hero to dashboard.

## Active Mockups (in `public/`)

| Mockup | Screens Covered | React Target | Implemented? |
|--------|----------------|--------------|-------------|
| `mockup-user-flow.html` | Hero, Login, Onboarding, Pre-Assessment, Diagnostic, Dashboard, Practice, Progress, Learning Path, Study Guide, AI Tutor, Score Report, Question Session | Multiple components | **Yes** (2026-04-04) |
| `mockup-onboarding.html` | Onboarding form (name, university, program, goals) | `OnboardingFlow.tsx` | **Yes** (2026-04-04) |
| `mockup-spicy-preassess.html` | Pre-assessment gateway, Spicy Mode, tutorials | `PreAssessmentGateway.tsx` | **Yes** (2026-04-04) |
| `mockup-post-assessment.html` | Readiness banner, baseline comparison report | `DashboardHome.tsx` (banner) + `PostAssessmentReport.tsx` (report, new) | **Yes** (2026-04-08) |
| `mockup-onboarding.html` (simplified, 6-field) | Single-page 6-field onboarding (no Skip) | `SimplifiedOnboardingFlow.tsx` (new) — replaces legacy `OnboardingFlow.tsx` for new users | **Yes** (2026-04-08) |
| `mockup-twotone-bars.html` | Progress bar component (baseline vs growth) | `SkillProgressBar.tsx` (used in `ResultsDashboard.tsx` Growth Since Diagnostic + `StudentDetailDrawer.tsx` Growth panel) | **Yes** (2026-04-08) |
| `mockup-admin-charts.html` | Admin engagement funnel, cohort tier distribution, scatter plot, per-skill bars | `AdminDashboard.tsx` (Overview funnel + cohort), `ItemAnalysisTab.tsx` (scatter), `StudentDetailDrawer.tsx` (per-skill bars) | **Yes** (2026-04-08) |

## Archived Mockups (in `archive/mockups-apr-2026/`)

Rejected design explorations — kept for reference, not for implementation.

| Mockup | Design Direction | Why Archived |
|--------|-----------------|-------------|
| `mockup-option-a-atlas.html` | Dark data dashboard (indigo/slate) | Rejected in favor of user-flow |
| `mockup-option-b-journey.html` | Light progressive unlock | Rejected in favor of user-flow |
| `mockup-option-c-pulse.html` | AI-forward dark (purple/glassmorphism) | Rejected in favor of user-flow |
| `mockup-option-d-refined.html` | Polished dark production | Rejected in favor of user-flow |

## Workflow

1. Open a mockup at `http://localhost:5173/mockup-*.html`
2. Walk through each screen, get explicit approval
3. Only then modify the React target component
4. Update this table when implementation is complete
