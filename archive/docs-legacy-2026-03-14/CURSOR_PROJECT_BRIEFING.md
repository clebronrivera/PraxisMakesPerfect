# CURSOR PROJECT BRIEFING: Praxis Makes Perfect

## Overview

Praxis Makes Perfect is an adaptive coaching platform designed to help users prepare for the Praxis School Psychology (5403) exam. It utilizes an assessment-driven approach to identify user weaknesses and provide targeted practice.


## Core Architecture
- **Frontend**: Vite + React + Tailwind CSS.
- **Backend/Persistence**: Firebase (Auth, Firestore).
- **Thinking Layer (`src/brain/`)**:
  - `knowledge-base.ts`: Canonical domain knowledge (NASP domains, laws, concepts).
  - `question-analyzer.ts`: Logic to analyze user responses and identify error patterns.
  - `weakness-detector.ts`: Pattern recognition to profile user performance.
  - `question-generator.ts`: Template-based adaptive question generation.
- **Data Model**:
  - `questions.json`: Primary question bank.
  - `nasp-domains.json`: Definitions of the 10 NASP Domains.
  - `skill-map.ts`: Mapping of domains to specific skills and decision rules.


## Key Workflows
1. **Diagnostic Phase**: 40-question pre-assessment to build the initial user profile.
2. **Adaptive Practice**: Session-based practice that prioritizes weak domains and specific knowledge gaps.
3. **Deep Feedback**: Post-question rationales that explain not just the correct answer, but the underlying concepts and error patterns (e.g., "premature action").

## Repository Constraints
- No inline tests in production code.
- Always use `src/brain/` for domain-specific logic.
- Avoid duplicating constants already defined in `knowledge-base.ts`.
