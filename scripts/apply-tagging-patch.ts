/**
 * Apply Tagging Patch
 * 
 * Merges corrections from the provided JSON patch into tagging-suggestions.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TaggingSuggestion {
  questionId: string;
  suggestedDok: 1 | 2 | 3;
  suggestedFramework: string;
  suggestedFrameworkStep: string | null;
  confidence?: 'high' | 'medium' | 'low';
  reasoning: string;
  needsReview: boolean;
}

// The corrections patch
const corrections: TaggingSuggestion[] = [
  {
    "questionId": "SP5403_Q013",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "problem-identification",
    "reasoning": "Corrected Rule 1 Violation: Determining the 'first step' of intervention selection is a strategic decision (DOK 3), requiring the user to locate themselves at the start of the Problem Solving cycle.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q017",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "intervention-design",
    "reasoning": "Corrected Rule 4 Violation: Suicide risk assessment requires applying the Crisis Intervention framework (a subset of Problem Solving). The user must prioritize safety over other steps.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q020",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "problem-analysis",
    "reasoning": "Corrected Rule 4 Violation: Analyzing the discrepancy between a student's effort and their grades is the 'Problem Analysis' phase (Hypothesis Generation).",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q027",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "intervention-design",
    "reasoning": "Corrected Rule 4 Violation: Choosing an intervention for 'calling out' requires matching the strategy to the function (Strategic Thinking).",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q030",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "problem-analysis",
    "reasoning": "Corrected Rule 4 Violation: Distinguishing between a 'skill deficit' and a 'performance deficit' is the core task of Problem Analysis.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q032",
    "suggestedDok": 3,
    "suggestedFramework": "eligibility",
    "suggestedFrameworkStep": "eligibility-analysis",
    "reasoning": "Corrected Rule 4 Violation: Evaluating an ELL student requires applying the 'Exclusionary Factors' clause of IDEA (Legal/Eligibility Framework).",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q035",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "intervention-design",
    "reasoning": "Corrected Rule 4 Violation: Selecting a social intervention requires mapping the student's 'loneliness' to an appropriate evidence-based practice.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q036",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "problem-identification",
    "reasoning": "Corrected Rule 4 Violation: Selecting a screening tool is a strategic decision in the 'Problem Identification' phase of MTSS.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q037",
    "suggestedDok": 3,
    "suggestedFramework": "consultation",
    "suggestedFrameworkStep": "problem-analysis",
    "reasoning": "Corrected Rule 4 Violation: When a teacher has 'tried several strategies' without success, the consultant must move to Problem Analysis to determine *why* they failed.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q039",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "evaluation",
    "reasoning": "Corrected Rule 4 Violation: Interpreting reliability coefficients is a technical skill used during the Evaluation phase to determine if data is trustworthy.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q041",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "intervention-design",
    "reasoning": "Corrected Rule 4 Violation: Threat assessment is a high-stakes 'Intervention Design' task where safety protocols must be activated immediately.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q043",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "intervention-design",
    "reasoning": "Corrected Rule 4 Violation: Matching accommodations to ADHD symptoms is a strategic intervention design task.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q045",
    "suggestedDok": 3,
    "suggestedFramework": "eligibility",
    "suggestedFrameworkStep": "assessment-selection",
    "reasoning": "Corrected Rule 4 Violation: Selecting the 'most appropriate' tool for ASD evaluation requires weighing validity, age, and presentation (Strategic).",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q053",
    "suggestedDok": 3,
    "suggestedFramework": "eligibility",
    "suggestedFrameworkStep": "eligibility-analysis",
    "reasoning": "Corrected Rule 1 Violation: Addressing disproportionality is a complex strategic process (Significant Disproportionality), not simple recall.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q059",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "intervention-design",
    "reasoning": "Corrected Rule 4 Violation: Applying CBT principles to a specific student scenario is Intervention Design.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q064",
    "suggestedDok": 3,
    "suggestedFramework": "eligibility",
    "suggestedFrameworkStep": "assessment-selection",
    "reasoning": "Corrected Rule 4 Violation: Selecting a tool for Executive Functioning requires distinguishing between broad attention and specific EF domains.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q065",
    "suggestedDok": 3,
    "suggestedFramework": "eligibility",
    "suggestedFrameworkStep": "eligibility-analysis",
    "reasoning": "Corrected Rule 4 Violation: Interpreting index score discrepancies (VCI vs PRI) is a core Analysis task in determining a learning profile.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q067",
    "suggestedDok": 3,
    "suggestedFramework": "eligibility",
    "suggestedFrameworkStep": "eligibility-analysis",
    "reasoning": "Corrected Rule 4 Violation: 'Ruling out' factors (vision, hearing, LEP) is a mandatory strategic step in the SLD identification framework.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q069",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "intervention-design",
    "reasoning": "Corrected Rule 4 Violation: Recommending strategies for a gifted student (differentiation/enrichment) is Intervention Design.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q071",
    "suggestedDok": 3,
    "suggestedFramework": "consultation",
    "suggestedFrameworkStep": "communication",
    "reasoning": "Corrected Rule 4 Violation: Explaining psychometrics (percentiles) to a parent requires 'translation' skills, a key part of the Consultation framework.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q073",
    "suggestedDok": 3,
    "suggestedFramework": "eligibility",
    "suggestedFrameworkStep": "assessment-selection",
    "reasoning": "Corrected Rule 4 Violation: Determining if 'extended time' is appropriate requires analyzing the nexus between the disability and the demand.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q087",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "intervention-design",
    "reasoning": "Corrected Rule 4 Violation: Selective Mutism requires very specific behavioral interventions (stimulus fading), making this a Strategic Design task.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q093",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "intervention-design",
    "reasoning": "Corrected Rule 4 Violation: Distinguishing 'fluency' from 'concept' deficits dictates the intervention (drill vs reteaching). This is Strategic Design.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q095",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "evaluation",
    "reasoning": "Corrected Rule 4 Violation: Evaluating PBIS effectiveness using specific metrics (ODRs) is the System Evaluation phase.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q097",
    "suggestedDok": 3,
    "suggestedFramework": "fba",
    "suggestedFrameworkStep": "intervention-design",
    "reasoning": "Corrected Rule 4 Violation: Selecting an intervention for attention-seeking behavior (Function-Based) implies using FBA logic.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q098",
    "suggestedDok": 3,
    "suggestedFramework": "eligibility",
    "suggestedFrameworkStep": "assessment-selection",
    "reasoning": "Corrected Rule 4 Violation: Preschool assessment requires selecting play-based or ecological tools, a strategic Assessment Selection task.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q099",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "intervention-design",
    "reasoning": "Corrected Rule 4 Violation: Trauma responses (flashbacks) require specific trauma-informed interventions, not generic counseling.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q111",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "intervention-design",
    "reasoning": "Corrected Rule 4 Violation: Teaching coping skills for Test Anxiety is an Intervention Design task.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q115",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "intervention-design",
    "reasoning": "Corrected Rule 4 Violation: Choosing a 'school-based' intervention for depression requires filtering for feasibility and educational impact.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q125",
    "suggestedDok": 3,
    "suggestedFramework": "eligibility",
    "suggestedFrameworkStep": "assessment-selection",
    "reasoning": "Corrected Rule 4 Violation: Involving a student in their own evaluation planning is a strategic Engagement/Assessment decision.",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q141",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "problem-identification",
    "reasoning": "Corrected Rule 1 Violation: Ethical dilemmas use a specific problem-solving model; identifying the first step is Strategic (DOK 3).",
    "needsReview": false
  },
  {
    "questionId": "SP5403_Q158",
    "suggestedDok": 3,
    "suggestedFramework": "eligibility",
    "suggestedFrameworkStep": "assessment-selection",
    "reasoning": "Corrected Rule 1 Violation: Informed consent processes are procedural and legal safeguards, requiring DOK 3 application logic.",
    "needsReview": false
  },
  {
    "questionId": "ETS_Q003",
    "suggestedDok": 2,
    "suggestedFramework": "fba",
    "suggestedFrameworkStep": "problem-identification",
    "reasoning": "Corrected Rule 5 Violation: Measuring interfering behaviors is explicitly part of the FBA framework (Data Collection/Problem ID).",
    "needsReview": false
  },
  {
    "questionId": "ETS_Q004",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "problem-identification",
    "reasoning": "Corrected Rule 4 Violation: Deciding when to request medical records is part of gathering background data (Problem ID) to rule out physical causes.",
    "needsReview": false
  },
  {
    "questionId": "ETS_Q005",
    "suggestedDok": 3,
    "suggestedFramework": "fba",
    "suggestedFrameworkStep": "intervention-design",
    "reasoning": "Corrected Rule 5 Violation: Addressing aggression and frustration tolerance requires behavioral intervention planning (FBA/BIP logic).",
    "needsReview": false
  },
  {
    "questionId": "ETS_Q007",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "problem-analysis",
    "reasoning": "Corrected Rule 4 Violation: Evaluating a student's math performance issues to determine the cause is Problem Analysis.",
    "needsReview": false
  },
  {
    "questionId": "ETS_Q012",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "problem-identification",
    "reasoning": "Corrected Rule 4 Violation: Recognizing signs of depression/withdrawal is Identifying the Problem in a mental health context.",
    "needsReview": false
  },
  {
    "questionId": "ETS_Q013",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "evaluation",
    "reasoning": "Corrected Rule 4 Violation: Monitoring program outcomes over 3 years is the definition of Program Evaluation.",
    "needsReview": false
  },
  {
    "questionId": "ETS_Q014",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "problem-analysis",
    "reasoning": "Corrected Rule 5 Violation: Recognizing lack of competence and seeking training is an Ethical Problem Solving step.",
    "needsReview": false
  },
  {
    "questionId": "ETS_Q018",
    "suggestedDok": 3,
    "suggestedFramework": "consultation",
    "suggestedFrameworkStep": "problem-analysis",
    "reasoning": "Corrected Rule 4 Violation: Dealing with a frustrated teacher regarding a student with severe disabilities requires Consultation logic.",
    "needsReview": false
  },
  {
    "questionId": "ETS_Q021",
    "suggestedDok": 3,
    "suggestedFramework": "problem-solving",
    "suggestedFrameworkStep": "intervention-design",
    "reasoning": "Corrected Rule 4 Violation: Evaluating if a 'summer camp' study applies to a school setting is Evidence-Based Intervention Selection.",
    "needsReview": false
  }
];

function main() {
  console.log('Applying Tagging Corrections Patch...\n');

  const suggestionsPath = path.join(__dirname, '../src/data/tagging-suggestions.json');
  const suggestions: TaggingSuggestion[] = JSON.parse(
    fs.readFileSync(suggestionsPath, 'utf-8')
  );

  // Create a map of corrections by questionId
  const correctionsMap = new Map<string, TaggingSuggestion>();
  for (const correction of corrections) {
    correctionsMap.set(correction.questionId, correction);
  }

  // Update suggestions with corrections
  let updatedCount = 0;
  let notFoundCount = 0;

  for (let i = 0; i < suggestions.length; i++) {
    const correction = correctionsMap.get(suggestions[i].questionId);
    if (correction) {
      // Merge correction, preserving confidence if not provided
      suggestions[i] = {
        ...suggestions[i],
        ...correction,
        confidence: correction.confidence || suggestions[i].confidence || 'high'
      };
      updatedCount++;
      correctionsMap.delete(suggestions[i].questionId); // Track which ones we found
    }
  }

  // Check for any corrections that weren't found
  for (const [questionId] of correctionsMap) {
    console.warn(`Warning: Question ${questionId} from corrections not found in suggestions`);
    notFoundCount++;
  }

  // Save updated suggestions
  fs.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2), 'utf-8');

  console.log(`✓ Applied ${updatedCount} corrections`);
  if (notFoundCount > 0) {
    console.log(`⚠️  ${notFoundCount} corrections not found in suggestions file`);
  }
  console.log(`✓ Updated tagging-suggestions.json`);
  console.log(`\nAll corrected items have needsReview: false and are ready for Phase D.`);
}

main();
