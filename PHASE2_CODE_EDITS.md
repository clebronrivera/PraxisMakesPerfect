# Phase 2: answer-generator.ts Code Edits

Apply these edits in order to `src/brain/answer-generator.ts`

---

## Edit 1: Add Domain Distractor Pools

**Location:** After the `SKILL_TO_DOMAIN_MAP` constant (around line 95)

**Add this new constant:**

```typescript
// Domain-specific distractor pools - ensures distractors match question domain
const DOMAIN_DISTRACTOR_POOLS: Record<string, string[]> = {
  consultation: [
    "Implementing the intervention immediately without baseline data or consultation",
    "Focusing solely on the student without seeking teacher input or collaboration",
    "Making decisions unilaterally without collaboration or family partnership",
    "Skipping the entry and contracting phase to move directly to intervention",
    "Using a one-size-fits-all approach without considering cultural context",
    "Prescribing solutions before understanding the problem or building rapport",
    "Providing recommendations without observing the classroom environment",
    "Ending consultation after providing a single recommendation"
  ],
  therapy: [
    "Focusing only on academic performance without addressing emotional needs",
    "Using punishment-based approaches without understanding underlying causes",
    "Applying adult diagnostic criteria without considering developmental variations",
    "Ignoring cultural factors and family context in treatment planning",
    "Using a single intervention approach without considering individual needs",
    "Implementing interventions without understanding function or maintaining factors",
    "Providing therapy without establishing rapport or treatment goals",
    "Using techniques inappropriate for the student's developmental level"
  ],
  fba: [
    "Implementing intervention without conducting functional assessment first",
    "Selecting replacement behavior that serves a different function",
    "Focusing on topography rather than function of behavior",
    "Using punishment without teaching alternative behaviors",
    "Ignoring setting events and antecedent conditions",
    "Assuming behavior is attention-maintained without data",
    "Collecting frequency data when duration would be more appropriate",
    "Defining target behavior in vague or subjective terms"
  ],
  assessment: [
    "Using curriculum-based measurement for comprehensive evaluation",
    "Using a screening tool to determine eligibility",
    "Using an individual assessment for universal screening",
    "Using progress monitoring tools for program evaluation",
    "Recommend services without analyzing progress monitoring data",
    "Selecting assessment tools based on convenience rather than purpose",
    "Interpreting results without considering the referral question"
  ],
  psychometric: [
    "Interpreting scores without considering standard error of measurement",
    "Comparing scores from different norm groups directly",
    "Using a single score to make high-stakes decisions",
    "Ignoring confidence intervals in score interpretation",
    "Treating subtest scores as more reliable than composite scores",
    "Assuming test scores represent fixed traits",
    "Ignoring practice effects in repeated testing"
  ],
  intervention: [
    "Implementing intervention without baseline data",
    "Selecting intervention based on availability rather than evidence",
    "Moving to more intensive intervention without trying less intensive first",
    "Providing intervention without progress monitoring",
    "Using the same intervention for all students regardless of need",
    "Discontinuing intervention immediately after seeing improvement",
    "Implementing multiple interventions simultaneously without rationale"
  ],
  legal: [
    "Making decisions without considering procedural requirements",
    "Exceeding professional scope of practice",
    "Sharing information without proper consent",
    "Failing to document decision-making process",
    "Ignoring timeline requirements for evaluations",
    "Making placement decisions without team input",
    "Denying services based on disability category alone"
  ]
};
```

---

## Edit 2: Add Helper Functions

**Location:** After the new `DOMAIN_DISTRACTOR_POOLS` constant

**Add these helper functions:**

```typescript
// Get domain-appropriate distractors for a skill
function getDomainDistractors(skillId: string): string[] {
  const domains = SKILL_TO_DOMAIN_MAP[skillId] || [];
  const distractors: string[] = [];
  
  for (const domain of domains) {
    const pool = DOMAIN_DISTRACTOR_POOLS[domain];
    if (pool) {
      distractors.push(...pool);
    }
  }
  
  // Fallback to generic intervention distractors if no domain match
  if (distractors.length === 0) {
    return DOMAIN_DISTRACTOR_POOLS['intervention'] || [];
  }
  
  return distractors;
}

// Check if skill is in legal domain
function isLegalDomain(skillId: string): boolean {
  if (!skillId) return false;
  return skillId.startsWith('LEG-') || 
         skillId.startsWith('NEW-10-') || 
         skillId === 'PC-S03' || 
         skillId === 'PC-S05' ||
         skillId === 'NEW-8-SocialJustice';
}

// Check if skill is in behavioral/FBA domain
function isBehavioralDomain(skillId: string): boolean {
  if (!skillId) return false;
  return skillId.startsWith('MBH-') || 
         skillId === 'NEW-4-GroupCounseling' ||
         skillId === 'NEW-4-DevelopmentalInterventions';
}

// Check if skill is in consultation domain
function isConsultationDomain(skillId: string): boolean {
  if (!skillId) return false;
  return skillId.startsWith('CC-') || 
         skillId.startsWith('FSC-') ||
         skillId.startsWith('NEW-2-') ||
         skillId.startsWith('NEW-7-');
}
```

---

## Edit 3: Update balanceDistractorLength Function

**Location:** Find the existing `balanceDistractorLength` function (around line 45)

**Replace the entire function with:**

```typescript
/**
 * Balances distractor length relative to correct answer
 * Returns null if distractor should be rejected (too short to fix)
 * Target: distractors within 50-150% of correct answer length
 */
function balanceDistractorLength(text: string, correctAnswer: string): string | null {
  const targetLength = correctAnswer.length;
  const minLength = Math.max(20, Math.floor(targetLength * 0.5));
  const maxLength = Math.min(150, Math.floor(targetLength * 1.5));
  const currentLength = text.length;

  // Reject single words or very short distractors that can't be expanded
  if (currentLength < 15 || text.split(' ').length <= 2) {
    // Exception for known short valid answers (acronyms, terms)
    const validShortTerms = ['FERPA', 'IDEA', 'ADA', 'FAPE', 'IEP', 'BIP', 'FBA', 'RTI', 'MTSS'];
    if (!validShortTerms.some(term => text.toUpperCase().includes(term))) {
      return null; // Signal to try another distractor
    }
  }

  // If within acceptable range, return as-is
  if (currentLength >= minLength && currentLength <= maxLength) {
    return text;
  }

  // If too long, truncate intelligently
  if (currentLength > maxLength) {
    return truncateDistractor(text, maxLength);
  }

  // If too short but not rejectable, return as-is
  return text;
}
```

---

## Edit 4: Update generateDistractors Function

**Location:** Find the `generateDistractors` function (around line 130)

**Find this block inside the function (in the first pass loop):**

```typescript
const distractor = generateDistractor(correctAnswer, pattern, context);
if (distractor && !distractors.some(d => d.text.toLowerCase().trim() === distractor.text.toLowerCase().trim())) {
  // Filter out banned terms
  if (containsBannedTerms(distractor.text, template.skillId)) {
    continue;
  }
  
  // Balance length relative to correct answer
  distractor.text = balanceDistractorLength(distractor.text, correctAnswer);
```

**Replace with:**

```typescript
const distractor = generateDistractor(correctAnswer, pattern, context);
if (distractor && !distractors.some(d => d.text.toLowerCase().trim() === distractor.text.toLowerCase().trim())) {
  // Filter out banned terms
  if (containsBannedTerms(distractor.text, template.skillId)) {
    continue;
  }
  
  // Balance length relative to correct answer - null means reject
  const balancedText = balanceDistractorLength(distractor.text, correctAnswer);
  if (balancedText === null) {
    continue; // Skip this distractor, try another
  }
  distractor.text = balancedText;
```

**Apply the same change to the second pass loop** (around line 160) where distractors are generated from `shuffledAllPatterns`.

---

## Edit 5: Add Domain Guards to generateDistractor Switch

**Location:** Find the `generateDistractor` function's switch statement (around line 50)

**Find these cases and add guards:**

```typescript
// BEFORE:
case "case-confusion":
  return generateCaseConfusionDistractor(correctAnswer, context);

// AFTER:
case "case-confusion":
  if (!isLegalDomain(context.template.skillId)) return null;
  return generateCaseConfusionDistractor(correctAnswer, context);
```

```typescript
// BEFORE:
case "law-confusion":
  return generateLawConfusionDistractor(correctAnswer, context);

// AFTER:
case "law-confusion":
  if (!isLegalDomain(context.template.skillId)) return null;
  return generateLawConfusionDistractor(correctAnswer, context);
```

```typescript
// BEFORE:
case "function-confusion":
  return generateFunctionConfusionDistractor(correctAnswer, context);

// AFTER:
case "function-confusion":
  if (!isBehavioralDomain(context.template.skillId)) return null;
  return generateFunctionConfusionDistractor(correctAnswer, context);
```

```typescript
// BEFORE:
case "function-mismatch":
  return generateFunctionMismatchDistractor(correctAnswer, context);

// AFTER:
case "function-mismatch":
  if (!isBehavioralDomain(context.template.skillId)) return null;
  return generateFunctionMismatchDistractor(correctAnswer, context);
```

---

## Edit 6: Update generateContextMismatchDistractor

**Location:** Find `generateContextMismatchDistractor` function (around line 300)

**Replace the entire function with:**

```typescript
function generateContextMismatchDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  const { template } = context;
  const skillId = template.skillId;
  
  // Get domain-appropriate distractors
  const domainDistractors = getDomainDistractors(skillId);
  
  // Filter out anything too similar to correct answer
  const filtered = domainDistractors.filter(d => {
    const dLower = d.toLowerCase();
    const correctLower = correctAnswer.toLowerCase();
    return dLower !== correctLower &&
           !dLower.includes(correctLower.substring(0, 20)) &&
           !correctLower.includes(dLower.substring(0, 20));
  });
  
  if (filtered.length === 0) return null;
  
  return {
    text: filtered[Math.floor(Math.random() * filtered.length)],
    explanation: "While this approach is valid in general, it doesn't match the specific context or purpose described in this question.",
    patternId: "context-mismatch"
  };
}
```

---

## Edit 7: Update generateDataIgnoranceDistractor

**Location:** Find `generateDataIgnoranceDistractor` function (around line 240)

**Replace the entire function with:**

```typescript
function generateDataIgnoranceDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  const { template } = context;
  const skillId = template.skillId;
  
  // Domain-specific data ignorance examples
  const domainSpecificIgnorance: Record<string, string[]> = {
    consultation: [
      "Make a recommendation based on teacher report alone without observation",
      "Implement an intervention without gathering baseline data first",
      "Conclude consultation after a single meeting without follow-up data"
    ],
    therapy: [
      "Select treatment approach without conducting intake assessment",
      "Determine diagnosis based on presenting complaint alone",
      "Discharge from services without measuring treatment outcomes"
    ],
    fba: [
      "Identify behavior function based on assumption rather than data",
      "Select replacement behavior without analyzing antecedent patterns",
      "Develop BIP without sufficient baseline observation data"
    ],
    assessment: [
      "Make a recommendation based on teacher observations alone",
      "Decide on placement without examining evaluation results",
      "Recommend services without analyzing progress monitoring data"
    ],
    intervention: [
      "Implement an intervention without reviewing assessment data",
      "Select intervention tier without screening data",
      "Discontinue services without progress monitoring results"
    ]
  };
  
  // Get domain(s) for this skill
  const domains = SKILL_TO_DOMAIN_MAP[skillId] || ['assessment'];
  
  // Collect applicable distractors
  let applicable: string[] = [];
  for (const domain of domains) {
    if (domainSpecificIgnorance[domain]) {
      applicable.push(...domainSpecificIgnorance[domain]);
    }
  }
  
  // Fallback if no domain match
  if (applicable.length === 0) {
    applicable = domainSpecificIgnorance['assessment'];
  }
  
  // Filter out similar to correct answer
  const filtered = applicable.filter(d => 
    d.toLowerCase() !== correctAnswer.toLowerCase()
  );
  
  if (filtered.length === 0) return null;

  return {
    text: filtered[Math.floor(Math.random() * filtered.length)],
    explanation: "School psychologists practice data-based decision making. Decisions should be informed by reviewing and analyzing relevant data first.",
    patternId: "data-ignorance"
  };
}
```

---

## Edit 8: Update generatePrematureActionDistractor

**Location:** Find `generatePrematureActionDistractor` function (around line 190)

**Replace the entire function with:**

```typescript
function generatePrematureActionDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  const { template } = context;
  const skillId = template.skillId;
  
  // Only generate if correct answer involves assessment/data review
  const assessmentKeywords = ['review', 'analyze', 'assess', 'collect', 'gather', 'examine', 'evaluate', 'observe'];
  const hasAssessmentKeyword = assessmentKeywords.some(kw => 
    correctAnswer.toLowerCase().includes(kw)
  );
  
  if (!hasAssessmentKeyword) return null;
  
  // Domain-specific premature actions
  const domainSpecificActions: Record<string, string[]> = {
    consultation: [
      "Immediately provide intervention recommendations to the teacher",
      "Begin implementing changes before completing problem identification",
      "Schedule a follow-up meeting before gathering baseline data"
    ],
    therapy: [
      "Begin counseling sessions before completing intake assessment",
      "Implement treatment protocol before establishing treatment goals",
      "Start group therapy before conducting individual screening"
    ],
    fba: [
      "Implement behavior intervention before identifying function",
      "Begin extinction procedure before collecting baseline data",
      "Select replacement behavior before completing functional assessment"
    ],
    assessment: [
      "Contact the student's parents immediately with recommendations",
      "Refer the student for special education evaluation",
      "Begin intervention program before completing assessment"
    ],
    intervention: [
      "Implement Tier 3 intervention before trying Tier 2",
      "Begin intensive support before universal screening",
      "Start specialized services before documenting Tier 1 response"
    ]
  };
  
  // Get domain(s) for this skill
  const domains = SKILL_TO_DOMAIN_MAP[skillId] || ['assessment'];
  
  // Collect applicable actions
  let applicable: string[] = [];
  for (const domain of domains) {
    if (domainSpecificActions[domain]) {
      applicable.push(...domainSpecificActions[domain]);
    }
  }
  
  // Fallback
  if (applicable.length === 0) {
    applicable = domainSpecificActions['assessment'];
  }
  
  return {
    text: applicable[Math.floor(Math.random() * applicable.length)],
    explanation: "This answer skips the crucial first step of assessment or data collection. School psychologists must understand the problem before taking action.",
    patternId: "premature-action"
  };
}
```

---

## Verification

After applying all edits, run:

```bash
# Check for syntax errors
npx tsc --noEmit

# Run the distractor audit
npx tsx scripts/audit-distractor-quality.ts

# Check overall health
npx tsx health-check.ts
```

**Expected results:**
- TypeScript compiles without errors
- Irrelevant-domain issues should drop significantly
- Length-mismatch issues should decrease
- Single-word distractors should be rejected

---

## Summary of Changes

| Edit | What It Does |
|------|--------------|
| 1 | Adds domain-specific distractor pools |
| 2 | Adds helper functions for domain checking |
| 3 | Makes length validation reject bad distractors |
| 4 | Updates main function to handle rejections |
| 5 | Blocks cross-domain patterns (legal/behavioral) |
| 6 | Makes context-mismatch use domain pools |
| 7 | Makes data-ignorance use domain pools |
| 8 | Makes premature-action use domain pools |

Total: ~250 lines of code changes across 8 targeted edits.
