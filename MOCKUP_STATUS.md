# Mockup Status Tracker

## Approved Design Direction

**`mockup-user-flow.html`** — amber/cream editorial design system, full user journey from hero to dashboard.

## Active Mockups (in `public/`)

| Mockup | Screens Covered | React Target | Implemented? |
|--------|----------------|--------------|-------------|
| `mockup-user-flow.html` | Hero, Login, Onboarding, Pre-Assessment, Diagnostic, Dashboard, Practice, Progress, Learning Path, Study Guide, AI Tutor, Score Report, Question Session | Multiple components | **Yes** (2026-04-04) |
| `mockup-onboarding.html` | Onboarding form (name, university, program, goals) | `OnboardingFlow.tsx` | **Yes** (2026-04-04) |
| `mockup-spicy-preassess.html` | Pre-assessment gateway, Spicy Mode, tutorials | `PreAssessmentGateway.tsx` | **Yes** (2026-04-04) |
| `mockup-post-assessment.html` | Readiness banner, baseline comparison report | `DashboardHome.tsx` | Not yet |
| `mockup-twotone-bars.html` | Progress bar component (baseline vs growth) | Shared component | Not yet |
| `mockup-admin-charts.html` | Admin engagement funnel, domain heatmaps | `AdminDashboard.tsx` | Not yet |

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
