/**
 * Phase A: Generate Tagging Suggestions
 * 
 * Analyzes all 155 questions (125 SP5403 + 30 ETS) and generates
 * suggested DOK levels and Framework tags without modifying production data.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FRAMEWORK_STEPS, FrameworkType, getStepById } from '../src/brain/framework-definitions.js';
import { getSkillById, SkillId } from '../src/brain/skill-map.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Domain mapping for Rule 5 (ETS Cross-Check)
const DOMAIN_MAP: Record<string, number> = {
  'DBDM': 1, 'CC': 2, 'ACAD': 3, 'MBH': 4, 'SWP': 5,
  'PC': 6, 'FSC': 7, 'DIV': 8, 'RES': 9, 'LEG': 10
};

// Expected framework by domain (for Rule 5)
const DOMAIN_TO_FRAMEWORK: Record<number, FrameworkType | null> = {
  1: null, // DBDM - mostly psychometric, no framework
  2: 'consultation', // CC - Consultation & Collaboration
  3: 'problem-solving', // ACAD - Academic Interventions (MTSS/RTI)
  4: 'fba', // MBH - Mental Health & Behavior (FBA/BIP)
  5: 'problem-solving', // SWP - School-Wide Practices (MTSS)
  6: null, // PC - Prevention & Crisis Response (no single framework)
  7: null, // FSC - Family-School Collaboration (no single framework)
  8: null, // DIV - Diversity in Development & Learning (no single framework)
  9: null, // RES - Research & Program Evaluation (no single framework)
  10: 'eligibility' // LEG - Legal, Ethical & Professional Practice (eligibility)
};

interface Question {
  id: string;
  question: string;
  rationale: string;
  skillId?: string;
  dok?: number;
  frameworkType?: string | null;
  frameworkStep?: string | null;
}

interface SkillMapping {
  questionId: string;
  skillId: string;
  confidence: string;
  reasoning: string;
}

interface TaggingSuggestion {
  questionId: string;
  suggestedDok: 1 | 2 | 3;
  suggestedFramework: FrameworkType | 'none';
  suggestedFrameworkStep: string | null;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  needsReview: boolean;
}

function determineDOK(question: Question): { dok: 1 | 2 | 3; confidence: 'high' | 'medium' | 'low'; reasoning: string } {
  const text = question.question.toLowerCase();
  const rationale = question.rationale.toLowerCase();
  const combined = `${text} ${rationale}`.toLowerCase();

  // DOK 1: Recall/Definition questions
  const dok1Indicators = [
    'definition', 'defined as', 'refers to', 'which court case',
    'what is', 'which of the following is', 'identify the term',
    'recognize the', 'name the'
  ];
  
  const isDOK1 = dok1Indicators.some(indicator => 
    text.includes(indicator) || (text.length < 100 && text.includes('which'))
  );

  if (isDOK1) {
    return {
      dok: 1,
      confidence: 'high',
      reasoning: 'Question asks for definition or recall of specific term/case.'
    };
  }

  // DOK 3: Strategic thinking, multi-step process
  const dok3Indicators = [
    'first step', 'next step', 'should first', 'initial action',
    'what should the school psychologist do first', 'most appropriate',
    'best course of action', 'best first step'
  ];

  const isScenario = (
    combined.includes('school psychologist') ||
    combined.includes('teacher') ||
    combined.includes('student') ||
    combined.includes('parent')
  ) && question.question.length > 200;

  const isDOK3 = dok3Indicators.some(indicator => text.includes(indicator)) || 
                 (isScenario && text.includes('which of the following'));

  if (isDOK3) {
    return {
      dok: 3,
      confidence: 'high',
      reasoning: isScenario 
        ? 'Scenario-based question requiring strategic decision-making.'
        : 'Uses "first step" or "most appropriate" phrasing indicative of strategic thinking.'
    };
  }

  // DOK 2: Default for concept application/recognition
  return {
    dok: 2,
    confidence: 'medium',
    reasoning: 'Question requires applying concepts or recognizing examples in context.'
  };
}

function detectFramework(question: Question): { framework: FrameworkType | 'none'; step: string | null; confidence: 'high' | 'medium' | 'low'; reasoning: string } {
  const text = question.question.toLowerCase();
  const rationale = question.rationale.toLowerCase();
  const combined = `${text} ${rationale}`.toLowerCase();

  // FBA Framework Detection
  const fbaKeywords = [
    'fba', 'functional behavior assessment', 'behavior function',
    'abc', 'antecedent', 'consequence', 'bip', 'behavior intervention plan',
    'reinforcement', 'attention seeking', 'escape', 'tangible', 'sensory',
    'function of behavior', 'maintains the behavior'
  ];
  
  if (fbaKeywords.some(kw => combined.includes(kw))) {
    // Determine FBA step
    let step: string | null = null;
    let stepConfidence: 'high' | 'medium' | 'low' = 'medium';
    
    if (combined.includes('best example of a functional behavior assessment') || 
        combined.includes('what is an fba') ||
        combined.includes('purpose of fba')) {
      step = 'fba-recognition';
      stepConfidence = 'high';
    } else if (combined.includes('identify the function') || 
               combined.includes('function of the behavior') ||
               combined.includes('most likely function')) {
      step = 'function-hypothesis';
      stepConfidence = 'high';
    } else if (combined.includes('bip') || 
               combined.includes('behavior intervention plan') ||
               combined.includes('replacement behavior')) {
      step = 'intervention-design';
      stepConfidence = 'high';
    } else if (combined.includes('abc') || 
               combined.includes('antecedent') && combined.includes('consequence')) {
      step = 'abc-analysis';
      stepConfidence = 'medium';
    } else if (combined.includes('observe') || 
               combined.includes('data collection') ||
               combined.includes('document')) {
      step = 'fba-data-collection';
      stepConfidence = 'medium';
    } else {
      step = 'fba-recognition'; // Default fallback
      stepConfidence = 'low';
    }

    return {
      framework: 'fba',
      step,
      confidence: stepConfidence,
      reasoning: `FBA framework detected based on behavior function/ABC/BIP keywords. Step: ${step}.`
    };
  }

  // Consultation Framework Detection
  const consultationKeywords = [
    'consultation', 'consultee', 'collaborate', 'indirect services',
    'cultural broker', 'behavioral consultation', 'mental health consultation',
    'organizational consultation', 'multicultural consultation', 'conjoint'
  ];

  if (consultationKeywords.some(kw => combined.includes(kw))) {
    let step: string | null = null;
    let stepConfidence: 'high' | 'medium' | 'low' = 'medium';

    if (combined.includes('type of consultation') || 
        combined.includes('which consultation') ||
        combined.includes('best describes the type')) {
      step = 'consultation-type-recognition';
      stepConfidence = 'high';
    } else if (combined.includes('consultee') && 
               (combined.includes('identify') || combined.includes('who'))) {
      step = 'consultee-identification';
      stepConfidence = 'medium';
    } else if (combined.includes('clarify') || 
               combined.includes('problem clarification')) {
      step = 'problem-clarification';
      stepConfidence = 'medium';
    } else if (combined.includes('goal') || combined.includes('objective')) {
      step = 'goal-setting';
      stepConfidence = 'medium';
    } else if (combined.includes('plan') || combined.includes('intervention planning')) {
      step = 'consultation-planning';
      stepConfidence = 'medium';
    } else {
      step = 'consultation-type-recognition'; // Default
      stepConfidence = 'low';
    }

    return {
      framework: 'consultation',
      step,
      confidence: stepConfidence,
      reasoning: `Consultation framework detected. Step: ${step}.`
    };
  }

  // Eligibility Framework Detection
  const eligibilityKeywords = [
    'eligibility', 'qualify', 'qualifies for', 'special education',
    'evaluation for', 'determine eligibility', 'meets criteria',
    'discrepancy', 'idea', 'evaluation data', 'eligibility determination'
  ];

  if (eligibilityKeywords.some(kw => combined.includes(kw))) {
    let step: string | null = null;
    let stepConfidence: 'high' | 'medium' | 'low' = 'medium';

    if (combined.includes('assessments') && combined.includes('gather') ||
        combined.includes('sources of data') ||
        combined.includes('which assessments')) {
      step = 'assessment-selection';
      stepConfidence = 'high';
    } else if (combined.includes('determine') || 
               combined.includes('qualifies') ||
               combined.includes('meets criteria')) {
      step = 'determination';
      stepConfidence = 'high';
    } else if (combined.includes('analyze') || 
               combined.includes('interpret') ||
               combined.includes('discrepancy')) {
      step = 'eligibility-analysis';
      stepConfidence = 'medium';
    } else if (combined.includes('review') || combined.includes('referral')) {
      step = 'referral-review';
      stepConfidence = 'medium';
    } else {
      step = 'assessment-selection'; // Default
      stepConfidence = 'low';
    }

    return {
      framework: 'eligibility',
      step,
      confidence: stepConfidence,
      reasoning: `Eligibility framework detected. Step: ${step}.`
    };
  }

  // Problem-Solving Framework Detection (MTSS/RTI)
  const problemSolvingKeywords = [
    'mtss', 'rti', 'response to intervention', 'multi-tiered',
    'tier 2', 'tier 3', 'progress monitoring', 'intervention selection',
    'problem-solving', 'data-based decision', 'review data',
    'identify skill deficit', 'baseline', 'intervention effectiveness'
  ];

  if (problemSolvingKeywords.some(kw => combined.includes(kw))) {
    let step: string | null = null;
    let stepConfidence: 'high' | 'medium' | 'low' = 'medium';

    if (combined.includes('first step') && 
        (combined.includes('intervention') || combined.includes('problem'))) {
      step = 'problem-identification';
      stepConfidence = 'high';
    } else if (combined.includes('review data') || 
               combined.includes('collect data') ||
               combined.includes('gather information')) {
      step = 'data-collection';
      stepConfidence = 'high';
    } else if (combined.includes('progress monitoring') || 
               combined.includes('monitor progress') ||
               combined.includes('track growth')) {
      step = 'progress-monitoring';
      stepConfidence = 'high';
    } else if (combined.includes('intervention') && 
               (combined.includes('select') || combined.includes('choose'))) {
      step = 'intervention-selection';
      stepConfidence = 'medium';
    } else if (combined.includes('analyze') || 
               combined.includes('identify skill deficit')) {
      step = 'analysis';
      stepConfidence = 'medium';
    } else {
      step = 'problem-identification'; // Default
      stepConfidence = 'low';
    }

    return {
      framework: 'problem-solving',
      step,
      confidence: stepConfidence,
      reasoning: `Problem-solving framework (MTSS/RTI) detected. Step: ${step}.`
    };
  }

  // No framework - psychometric, research, or definition questions
  return {
    framework: 'none',
    step: null,
    confidence: 'high',
    reasoning: 'Question focuses on psychometric concepts, research methods, or definitions without a practice framework.'
  };
}

function applyRule5(question: Question, skillMapping: SkillMapping | undefined, suggestedFramework: FrameworkType | 'none'): { confidence: 'high' | 'medium' | 'low'; reasoning: string } {
  // Rule 5: ETS Cross-Check
  if (!question.id.startsWith('ETS_Q') || !skillMapping) {
    return { confidence: 'high', reasoning: 'Not an ETS question or no skill mapping available.' };
  }

  const skillId = skillMapping.skillId as SkillId;
  const skill = getSkillById(skillId);
  
  if (!skill) {
    return { confidence: 'medium', reasoning: 'Skill ID found but skill not located in skill map.' };
  }

  const prefix = skillId.split('-')[0];
  const domain = DOMAIN_MAP[prefix] || 1;
  const expectedFramework = DOMAIN_TO_FRAMEWORK[domain];

  // Check consistency
  if (expectedFramework === null && suggestedFramework === 'none') {
    return { confidence: 'high', reasoning: 'Domain expects no framework, suggestion matches.' };
  }

  if (expectedFramework && suggestedFramework === expectedFramework) {
    return { confidence: 'high', reasoning: `Domain ${domain} (${prefix}) expects ${expectedFramework}, suggestion matches.` };
  }

  if (expectedFramework && suggestedFramework !== expectedFramework && suggestedFramework !== 'none') {
    return { 
      confidence: 'low', 
      reasoning: `WARNING: Domain ${domain} (${prefix}) typically uses ${expectedFramework}, but suggestion is ${suggestedFramework}. May need review.` 
    };
  }

  return { confidence: 'medium', reasoning: 'Framework suggestion does not align with domain expectations, but may be valid.' };
}

function generateSuggestion(question: Question, skillMapping: SkillMapping | undefined): TaggingSuggestion {
  // Determine DOK
  const dokResult = determineDOK(question);
  
  // Detect Framework
  const frameworkResult = detectFramework(question);
  
  // Apply Rule 5 (ETS Cross-Check)
  const rule5Result = applyRule5(question, skillMapping, frameworkResult.framework);
  
  // Combine confidence levels (take the lowest)
  const confidences: ('high' | 'medium' | 'low')[] = [
    dokResult.confidence,
    frameworkResult.confidence,
    rule5Result.confidence
  ];
  
  const finalConfidence = confidences.includes('low') ? 'low' :
                          confidences.includes('medium') ? 'medium' : 'high';
  
  // Combine reasoning
  const reasoning = [
    `DOK ${dokResult.dok}: ${dokResult.reasoning}`,
    `Framework: ${frameworkResult.reasoning}`,
    rule5Result.reasoning !== 'Not an ETS question or no skill mapping available.' ? rule5Result.reasoning : ''
  ].filter(Boolean).join(' ');

  return {
    questionId: question.id,
    suggestedDok: dokResult.dok,
    suggestedFramework: frameworkResult.framework,
    suggestedFrameworkStep: frameworkResult.step,
    confidence: finalConfidence,
    reasoning,
    needsReview: finalConfidence === 'low'
  };
}

// Main execution
function main() {
  console.log('Phase A: Generating Tagging Suggestions...\n');

  // Load data files
  const questionsPath = path.join(__dirname, '../src/data/questions.json');
  const skillMapPath = path.join(__dirname, '../src/data/question-skill-map.json');
  const outputPath = path.join(__dirname, '../src/data/tagging-suggestions.json');

  const questions: Question[] = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
  const skillMapData: { mappedQuestions: SkillMapping[] } = JSON.parse(fs.readFileSync(skillMapPath, 'utf-8'));

  // Create lookup map for skill mappings
  const skillMappingLookup = new Map<string, SkillMapping>();
  for (const mapping of skillMapData.mappedQuestions) {
    skillMappingLookup.set(mapping.questionId, mapping);
  }

  // Filter to only SP5403 and ETS questions (155 total)
  const targetQuestions = questions.filter(q => 
    q.id.startsWith('SP5403_Q') || q.id.startsWith('ETS_Q')
  );

  console.log(`Found ${targetQuestions.length} questions to tag (${questions.filter(q => q.id.startsWith('SP5403_Q')).length} SP5403 + ${questions.filter(q => q.id.startsWith('ETS_Q')).length} ETS)\n`);

  // Generate suggestions
  const suggestions: TaggingSuggestion[] = [];
  
  for (const question of targetQuestions) {
    const skillMapping = skillMappingLookup.get(question.id);
    const suggestion = generateSuggestion(question, skillMapping);
    suggestions.push(suggestion);
  }

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(suggestions, null, 2), 'utf-8');
  console.log(`✓ Generated ${suggestions.length} tagging suggestions`);
  console.log(`✓ Saved to: ${outputPath}\n`);

  // Generate summary statistics
  const dokDistribution = { 1: 0, 2: 0, 3: 0 };
  const frameworkDistribution: Record<string, number> = {};
  const confidenceDistribution = { high: 0, medium: 0, low: 0 };
  const lowConfidenceItems: TaggingSuggestion[] = [];

  for (const suggestion of suggestions) {
    dokDistribution[suggestion.suggestedDok]++;
    frameworkDistribution[suggestion.suggestedFramework] = 
      (frameworkDistribution[suggestion.suggestedFramework] || 0) + 1;
    confidenceDistribution[suggestion.confidence]++;
    
    if (suggestion.confidence === 'low') {
      lowConfidenceItems.push(suggestion);
    }
  }

  console.log('=== SUMMARY STATISTICS ===\n');
  console.log('DOK Distribution:');
  console.log(`  DOK 1: ${dokDistribution[1]} (${Math.round(dokDistribution[1] / suggestions.length * 100)}%)`);
  console.log(`  DOK 2: ${dokDistribution[2]} (${Math.round(dokDistribution[2] / suggestions.length * 100)}%)`);
  console.log(`  DOK 3: ${dokDistribution[3]} (${Math.round(dokDistribution[3] / suggestions.length * 100)}%)\n`);

  console.log('Framework Distribution:');
  for (const [framework, count] of Object.entries(frameworkDistribution).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${framework}: ${count} (${Math.round(count / suggestions.length * 100)}%)`);
  }
  console.log();

  console.log('Confidence Distribution:');
  console.log(`  High: ${confidenceDistribution.high} (${Math.round(confidenceDistribution.high / suggestions.length * 100)}%)`);
  console.log(`  Medium: ${confidenceDistribution.medium} (${Math.round(confidenceDistribution.medium / suggestions.length * 100)}%)`);
  console.log(`  Low: ${confidenceDistribution.low} (${Math.round(confidenceDistribution.low / suggestions.length * 100)}%)\n`);

  if (lowConfidenceItems.length > 0) {
    console.log(`⚠️  ${lowConfidenceItems.length} items flagged for review (low confidence):`);
    for (const item of lowConfidenceItems.slice(0, 10)) {
      console.log(`  - ${item.questionId}: ${item.reasoning.substring(0, 80)}...`);
    }
    if (lowConfidenceItems.length > 10) {
      console.log(`  ... and ${lowConfidenceItems.length - 10} more`);
    }
  }

  console.log('\n✓ Phase A Complete! Review tagging-suggestions.json before proceeding to Phase B.');
}

main();
