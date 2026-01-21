# Praxis School Psychology Study App - Architecture Blueprint

## The Core Idea

Build a **smart study app** that:
1. **Knows** the domain (NASP model, question patterns, common traps)
2. **Diagnoses** your weaknesses through a pre-assessment
3. **Adapts** to focus on your deficit areas
4. **Tracks** not just what you answer, but HOW you think
5. **Generates** targeted practice based on your patterns

---

## Project Structure for Cursor

```
praxis-study-app/
├── src/
│   ├── brain/                    # The "thinking" layer
│   │   ├── knowledge-base.ts     # Domain knowledge, laws, concepts
│   │   ├── question-analyzer.ts  # Analyzes questions & user responses
│   │   ├── weakness-detector.ts  # Identifies patterns in wrong answers
│   │   └── question-generator.ts # Creates new questions from templates
│   │
│   ├── data/
│   │   ├── questions.json        # The 125 question bank
│   │   ├── nasp-domains.json     # NASP domain definitions
│   │   ├── key-concepts.json     # Laws, cases, terms per domain
│   │   └── distractor-patterns.json # Common wrong-answer traps
│   │
│   ├── components/
│   │   ├── PreAssessment.tsx     # Initial diagnostic test
│   │   ├── PracticeSession.tsx   # Adaptive practice mode
│   │   ├── QuestionCard.tsx      # Single question display
│   │   ├── ResultsDashboard.tsx  # Weakness visualization
│   │   └── ExplanationPanel.tsx  # Deep-dive rationales
│   │
│   ├── hooks/
│   │   ├── useUserProgress.ts    # Track all user interactions
│   │   └── useAdaptiveLearning.ts # Select next best question
│   │
│   └── App.tsx
│
├── knowledge/                    # Reference docs for the "brain"
│   ├── NASP-MODEL.md
│   ├── KEY-LAWS.md
│   └── QUESTION-PATTERNS.md
│
└── package.json
```

---

## The "Brain" - How It Thinks

### 1. Knowledge Base Structure

```typescript
// brain/knowledge-base.ts

export const KNOWLEDGE_BASE = {
  domains: {
    1: {
      name: "Data-Based Decision Making",
      shortName: "DBDM",
      keyConcepts: [
        "reliability types",
        "validity types", 
        "progress monitoring",
        "universal screening",
        "CBM",
        "RTI data analysis"
      ],
      mustKnowTerms: {
        "interobserver agreement": "Reliability metric for single-subject designs",
        "sensitivity": "True positive rate - correctly identifying those WITH condition",
        "specificity": "True negative rate - correctly identifying those WITHOUT",
        "CBM": "Curriculum-based measurement - frequent, brief assessments",
        "SEM": "Standard error of measurement - variability due to measurement error"
      },
      commonMisconceptions: [
        "Confusing reliability with validity",
        "Thinking all reliability types work for all designs",
        "Mixing up sensitivity vs specificity"
      ]
    },
    // ... domains 2-10
  },
  
  laws: {
    "Tarasoff": {
      domain: 10,
      keyPoint: "Duty to warn and protect",
      commonDistractor: "Confused with FERPA or civil rights cases"
    },
    "IDEA": {
      domain: 10,
      keyPoint: "Free appropriate public education, LRE, IEP requirements",
      commonDistractor: "Confused with 504 or ADA"
    },
    // ... more laws
  },
  
  questionPatterns: {
    "first step": {
      strategy: "Look for data collection/assessment before intervention",
      trap: "Jumping to intervention without assessment"
    },
    "most appropriate": {
      strategy: "Identify the option that matches context AND is evidence-based",
      trap: "Choosing a valid approach for wrong context"
    }
  }
};
```

### 2. Response Analysis - Understanding HOW They Think

```typescript
// brain/question-analyzer.ts

interface UserResponse {
  questionId: string;
  selectedAnswer: string[];
  correctAnswer: string[];
  timeSpent: number;
  confidence: 'low' | 'medium' | 'high';
}

interface ResponseAnalysis {
  isCorrect: boolean;
  domains: number[];
  
  // The key insight - WHY did they choose what they chose?
  errorType?: 
    | 'factual_gap'        // Doesn't know a term/law/concept
    | 'premature_action'   // Skipped assessment step
    | 'role_confusion'     // Chose action for wrong professional
    | 'context_mismatch'   // Right concept, wrong situation
    | 'similar_concept'    // Confused two related ideas
    | 'extreme_choice';    // Fell for absolute language
    
  knowledgeGap?: string;   // Specific concept they need to learn
  relatedConcepts: string[]; // What to study
}

export function analyzeResponse(
  question: Question,
  response: UserResponse
): ResponseAnalysis {
  // Compare selected vs correct
  // Look up why distractors are wrong
  // Identify the type of error
  // Flag specific knowledge gaps
}
```

### 3. Weakness Detection - Pattern Recognition

```typescript
// brain/weakness-detector.ts

interface UserProfile {
  // Domain-level weaknesses
  domainScores: Record<number, {
    attempted: number;
    correct: number;
    avgTime: number;
    recentTrend: 'improving' | 'stable' | 'declining';
  }>;
  
  // Specific knowledge gaps
  factualGaps: string[];  // "Tarasoff case", "CBM definition"
  
  // Thinking pattern weaknesses
  errorPatterns: {
    prematureAction: number;  // How often they skip assessment
    roleConfusion: number;    // How often they pick wrong professional's action
    extremeLanguage: number;  // How often they fall for "always/never"
  };
  
  // Question type weaknesses
  questionTypeScores: {
    scenarioBased: number;
    directKnowledge: number;
    selectTwo: number;
    selectThree: number;
  };
}

export function detectWeaknesses(history: UserResponse[]): UserProfile {
  // Aggregate all responses
  // Calculate domain scores
  // Identify recurring error patterns
  // Find specific factual gaps
}
```

---

## The Flow - User Journey

### Phase 1: Pre-Assessment (20 questions, ~15 min)

```
┌─────────────────────────────────────────────────────────┐
│  PRE-ASSESSMENT                                         │
│  "Let's see where you stand"                            │
│                                                         │
│  • 2 questions per NASP domain (20 total)               │
│  • Mix of scenario + direct knowledge                   │
│  • Track time + confidence per question                 │
│  • No feedback during - just collect data               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  RESULTS DASHBOARD                                      │
│                                                         │
│  Domain Strengths:                                      │
│  ████████████░░░  Domain 1: DBDM (80%)                  │
│  ██████░░░░░░░░░  Domain 8: Diversity (40%) ⚠️          │
│  ████░░░░░░░░░░░  Domain 10: Legal/Ethics (30%) 🔴      │
│                                                         │
│  Identified Gaps:                                       │
│  • Tarasoff case - duty to warn                         │
│  • Manifestation determination process                  │
│  • IDEA eligibility criteria                            │
│                                                         │
│  Error Patterns:                                        │
│  • Tendency to skip "first step" (data collection)      │
│  • Confusion between reliability types                  │
└─────────────────────────────────────────────────────────┘
```

### Phase 2: Adaptive Practice

```typescript
// hooks/useAdaptiveLearning.ts

export function selectNextQuestion(
  profile: UserProfile,
  questionBank: Question[],
  sessionHistory: string[]  // Questions already asked this session
): Question {
  
  // Priority 1: Target weakest domain
  const weakestDomain = findWeakestDomain(profile);
  
  // Priority 2: Address specific knowledge gaps
  const gapQuestion = findQuestionTestingGap(profile.factualGaps);
  
  // Priority 3: Mix in some strengths (confidence building)
  // Every 5th question, pick from strong area
  
  // Priority 4: Vary question types
  // Don't give 5 scenario questions in a row
  
  // Priority 5: Spaced repetition
  // Revisit previously missed questions
  
  return selectedQuestion;
}
```

### Phase 3: Deep Feedback Loop

When user answers wrong:

```
┌─────────────────────────────────────────────────────────┐
│  ❌ Incorrect                                           │
│                                                         │
│  You selected: (A) Immediately contact parents          │
│  Correct: (B) Ask if student has a plan                 │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  WHY THIS MATTERS:                                      │
│  This tests: Suicide risk assessment protocol           │
│  Domain: Mental & Behavioral Health (Domain 4)          │
│                                                         │
│  THE KEY CONCEPT:                                       │
│  When a student mentions suicidal ideation, the FIRST   │
│  step is always to assess lethality - do they have a    │
│  plan? This determines the level of immediate risk.     │
│                                                         │
│  YOUR ERROR PATTERN:                                    │
│  You chose "premature action" - contacting parents is   │
│  important but comes AFTER risk assessment.             │
│                                                         │
│  RELATED CONCEPTS TO REVIEW:                            │
│  • Suicide risk assessment steps                        │
│  • Crisis intervention protocol                         │
│  • Duty to warn vs immediate safety                     │
│                                                         │
│  [📚 Study This Concept] [➡️ Next Question]             │
└─────────────────────────────────────────────────────────┘
```

---

## Simple Question Generation (For Today)

Don't build AI generation - use **template variation**:

```typescript
// brain/question-generator.ts

interface QuestionTemplate {
  stem: string;
  concept: string;
  domain: number;
  variables: {
    scenario: string[];
    gradeLevel: string[];
    professionalContext: string[];
  };
}

const TEMPLATES: QuestionTemplate[] = [
  {
    stem: "A school psychologist is working with {scenario}. Which of the following is the FIRST step?",
    concept: "data-collection-first",
    domain: 1,
    variables: {
      scenario: [
        "a student who has been having difficulty completing assignments",
        "a teacher who reports a student is frequently off-task",
        "a parent concerned about their child's reading progress"
      ],
      // Always tests: collect data before intervening
    }
  }
];

export function generateVariation(template: QuestionTemplate): Question {
  // Pick random variables
  // Construct question
  // Use same correct answer pattern
  // Generate appropriate distractors
}
```

---

## Database / State (Keep It Simple)

For today, use **localStorage** + React state:

```typescript
// hooks/useUserProgress.ts

interface StoredProgress {
  preAssessmentComplete: boolean;
  preAssessmentResults: UserProfile;
  practiceHistory: UserResponse[];
  lastStudyDate: string;
  totalTimeSpent: number;
}

export function useUserProgress() {
  // Load from localStorage on mount
  // Save after each question
  // Provide methods to update
}
```

For later: migrate to Supabase or similar.

---

## Build Order (TODAY)

### Hour 1-2: Setup + Data
1. Create React app with Vite
2. Copy in the 125 questions as JSON
3. Create knowledge-base.ts with domain definitions
4. Build basic QuestionCard component

### Hour 3-4: Pre-Assessment
1. Build PreAssessment component
2. Select 2 questions per domain (20 total)
3. Track responses in state
4. Build simple ResultsDashboard

### Hour 5-6: Practice Mode
1. Build PracticeSession component
2. Implement basic question selection (prioritize weak domains)
3. Add explanation panel after each question
4. Save progress to localStorage

### Hour 7-8: Polish
1. Add progress tracking visualization
2. Implement "study concept" quick references
3. Mobile-friendly styling
4. Test the flow end-to-end

---

## Key Files to Create First

1. **`src/data/questions.json`** - The 125 questions
2. **`src/brain/knowledge-base.ts`** - Domain knowledge
3. **`src/components/QuestionCard.tsx`** - Core UI
4. **`src/hooks/useUserProgress.ts`** - State management
5. **`src/App.tsx`** - Main flow

---

## The "Secret Sauce" - What Makes This Smart

The intelligence isn't AI-generated questions. It's:

1. **Tagging every question** with domains, concepts, and distractor types
2. **Analyzing wrong answers** to understand WHY (not just that) you missed it
3. **Building a user profile** of specific gaps and error patterns
4. **Prioritizing practice** based on actual weaknesses
5. **Providing context** - connecting each question to the bigger picture

This turns 125 questions into a diagnostic tool + targeted study system.
