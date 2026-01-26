/**
 * Question Quality Analyzer
 * Identifies problematic questions in the question bank
 * 
 * Issues detected:
 * 1. Skill mismatches (question doesn't match assigned skill)
 * 2. Nonsensical distractors (unrelated answer choices)
 * 3. Truncated text (incomplete text in questions/answers)
 * 4. Duplicate partial answers (same content in multiple choices)
 * 5. Repetitive templates (overly similar questions)
 */

import * as fs from 'fs';
import * as path from 'path';
import { convertArrayToScriptFormat, convertToScriptFormat, type ProjectQuestion, type ScriptQuestion } from './question-format-converter.js';

// ============================================================================
// CONFIGURATION - Update these paths for your project
// ============================================================================
const CONFIG = {
  questionsPath: './src/data/questions.json',
  skillMapPath: './src/brain/skill-map.ts',
  outputDir: './quality-reports',
  generatedQuestionPrefix: 'GEN-'
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
interface Question extends ScriptQuestion {}

interface Choice {
  letter: string;
  text: string;
  isCorrect?: boolean;
}

interface Issue {
  questionId: string;
  skillId: string;
  issueType: IssueType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  details: any;
  suggestedFix?: string;
}

type IssueType = 
  | 'SKILL_MISMATCH'
  | 'NONSENSICAL_DISTRACTOR'
  | 'TRUNCATED_TEXT'
  | 'DUPLICATE_PARTIAL_ANSWER'
  | 'REPETITIVE_TEMPLATE'
  | 'MISSING_RATIONALE'
  | 'INCORRECT_ANSWER_KEY'
  | 'FORMATTING_ERROR';

interface AnalysisReport {
  timestamp: string;
  totalQuestions: number;
  issuesFound: number;
  issuesByType: Record<IssueType, number>;
  issuesBySeverity: Record<string, number>;
  issues: Issue[];
  questionsBySkill: Record<string, number>;
  recommendations: string[];
}

// ============================================================================
// SKILL-TOPIC KEYWORD MAPPINGS
// Used to detect skill mismatches
// ============================================================================
const SKILL_KEYWORDS: Record<string, string[]> = {
  // Data-Based Decision Making Skills
  'DBDM-S01': ['reliability', 'interobserver agreement', 'test-retest', 'single-subject', 'behavioral observation'],
  'DBDM-S02': ['validity', 'content validity', 'criterion validity', 'construct validity'],
  'DBDM-S03': ['score interpretation', 'confidence interval', 'sem', 'standard score', 'percentile'],
  'DBDM-S04': ['sensitivity', 'specificity', 'screening', 'true positive', 'true negative'],
  'DBDM-S05': ['assessment purpose', 'screening', 'diagnosis', 'progress monitoring', 'program evaluation'],
  'DBDM-S06': ['norm-referenced', 'criterion-referenced', 'percentile', 'mastery'],
  'DBDM-S07': ['formative', 'summative', 'single-subject', 'repeated measures'],
  
  // Mental/Behavioral Health Skills
  'MBH-S01': ['fba', 'functional behavioral assessment', 'function of behavior', 'behavior intervention plan', 'bip', 'antecedent', 'consequence', 'abc data'],
  'MBH-S02': ['behavior function', 'attention', 'escape', 'tangible', 'sensory', 'automatic reinforcement', 'maintaining consequence'],
  'MBH-S03': ['replacement behavior', 'functionally equivalent', 'same function', 'alternative behavior', 'teach alternative'],
  'MBH-S04': ['suicide', 'self-harm', 'risk assessment', 'safety plan', 'warning signs', 'protective factors', 'crisis'],
  'MBH-S05': ['therapy', 'counseling', 'cbt', 'cognitive behavioral', 'solution-focused', 'play therapy', 'behavioral intervention'],
  'MBH-S06': ['reinforcement', 'punishment', 'extinction', 'shaping', 'chaining', 'token economy', 'behavioral principles', 'operant'],
  
  // Legal/Ethical Skills
  'NEW-10-EducationLaw': ['idea', 'section 504', 'fape', 'iep', 'due process', 'least restrictive', 'eligibility'],
  'NEW-10-EthicalProblemSolving': ['ethical', 'nasp', 'dual relationship', 'confidentiality', 'informed consent', 'conflict of interest', 'tarasoff', 'duty to warn', 'mandated reporting'],
  'NEW-10-RecordKeeping': ['ferpa', 'records', 'privacy', 'parent access', 'educational records', 'disclosure'],
  'NEW-10-TestSecurity': ['test security', 'copyright', 'protocol', 'implicit bias', 'explicit bias'],
  'NEW-10-Supervision': ['supervision', 'supervisee', 'intern', 'practicum', 'credential'],
  'NEW-10-ProfessionalGrowth': ['professional development', 'continuing education', 'competence', 'lifelong learning'],
  
  // Assessment Skills
  'NEW-1-BackgroundInformation': ['background', 'developmental history', 'medical records', 'student records', 'review records'],
  'NEW-1-DynamicAssessment': ['dynamic assessment', 'learning potential', 'test-teach-retest', 'responsiveness'],
  'NEW-1-IQvsAchievement': ['intelligence', 'achievement', 'cognitive', 'iq', 'aptitude vs achievement'],
  'NEW-1-LowIncidenceExceptionalities': ['deaf', 'blind', 'chronic health', 'physical disability', 'sensory impairment', 'low incidence', 'teacher of the deaf'],
  'NEW-1-PerformanceAssessment': ['performance-based', 'authentic assessment', 'portfolio', 'demonstration'],
  'NEW-1-ProblemSolvingFramework': ['problem-solving', 'mtss', 'rti', 'tiered', 'multi-tiered', 'sld identification', 'inadequate instruction'],
  
  // Consultation Skills
  'NEW-2-ConsultationProcess': ['consultation', 'consultee', 'entry', 'contracting', 'problem identification', 'indirect service'],
  'NEW-2-CommunicationStrategies': ['active listening', 'paraphras', 'resistance', 'rapport', 'communication'],
  'NEW-2-ProblemSolvingSteps': ['problem-solving steps', 'baseline', 'hypothesis', 'intervention selection'],
  'NEW-2-FamilyCollaboration': ['family', 'diverse', 'cultural', 'parent', 'home-school', 'collaboration'],
  'NEW-2-CommunityAgencies': ['community', 'agency', 'interagency', 'referral', 'coordinate services'],
  
  // Academic Skills
  'NEW-3-AccommodationsModifications': ['accommodation', 'modification', 'extended time', 'read aloud', 'assistive technology', 'test accommodations'],
  'NEW-3-AcademicProgressFactors': ['academic progress', 'classroom climate', 'family involvement', 'socioeconomic'],
  'NEW-3-BioCulturalInfluences': ['biological', 'cultural', 'social influences', 'developmental readiness'],
  'NEW-3-InstructionalHierarchy': ['instructional hierarchy', 'acquisition', 'fluency', 'generalization', 'adaptation'],
  'NEW-3-MetacognitiveStrategies': ['metacognitive', 'study skills', 'self-regulation', 'learning strategies'],
  
  // Mental Health in Schools
  'NEW-4-Psychopathology': ['psychopathology', 'depression', 'anxiety', 'adhd', 'mental health', 'dsm', 'symptoms'],
  'NEW-4-DevelopmentalInterventions': ['developmental', 'age-appropriate', 'elementary', 'secondary', 'play-based', 'concrete'],
  'NEW-4-MentalHealthImpact': ['mental health impact', 'academic performance', 'school engagement', 'attendance'],
  'NEW-4-GroupCounseling': ['group counseling', 'group dynamics', 'group composition', 'screening'],
  
  // Systems-Level Skills
  'NEW-5-EducationalPolicies': ['retention', 'tracking', 'ability grouping', 'policy', 'grade retention'],
  'NEW-5-EBPImportance': ['evidence-based', 'ebp', 'empirical', 'research support', 'effective practice'],
  'NEW-5-SchoolClimate': ['school climate', 'climate survey', 'belonging', 'school environment'],
  
  // Prevention/Crisis
  'NEW-6-BullyingPrevention': ['bullying', 'harassment', 'bystander', 'prevention program', 'manifestation'],
  'NEW-6-TraumaInformed': ['trauma', 'trauma-informed', 'adverse childhood', 'aces', 'resilience'],
  'NEW-6-SchoolClimateMeasurement': ['climate measurement', 'survey', 'engagement', 'safety data'],
  
  // Family/Community
  'NEW-7-BarriersToEngagement': ['barriers', 'engagement', 'parent involvement', 'obstacles'],
  'NEW-7-FamilySystems': ['family systems', 'transition', 'self-determination', 'postsecondary'],
  'NEW-7-InteragencyCollaboration': ['interagency', 'postsecondary transition', 'vocational', 'community services'],
  'NEW-7-ParentingInterventions': ['parenting', 'behavior management', 'home intervention', 'parent training'],
  
  // Diversity
  'NEW-8-Acculturation': ['acculturation', 'assimilation', 'cultural adaptation', 'exclusionary factors', 'sld'],
  'NEW-8-LanguageAcquisition': ['bics', 'calp', 'language acquisition', 'ell', 'bilingual', 'second language'],
  'NEW-8-SocialJustice': ['social justice', 'advocacy', 'equity', 'intellectual disability', 'adaptive behavior'],
  
  // Research/Statistics
  'NEW-9-DescriptiveStats': ['mean', 'median', 'standard deviation', 'descriptive', 'social validity'],
  'NEW-9-ValidityThreats': ['validity threat', 'internal validity', 'maturation', 'history', 'ecological validity'],
  'NEW-9-StatisticalTests': ['t-test', 'anova', 'regression', 'correlation', 'statistical test'],
  'NEW-9-Variables': ['variable', 'independent', 'dependent', 'self-instruction', 'self-monitoring'],
  'NEW-9-ProgramEvaluation': ['program evaluation', 'outcome data', 'effectiveness', 'accountability'],
  'NEW-9-ImplementationFidelity': ['fidelity', 'implementation', 'treatment integrity', 'consistent implementation']
};

// Known skill mismatches from manual review
const KNOWN_MISMATCHES: Record<string, { currentSkill: string; suggestedSkill: string; reason: string }> = {
  'SP5403_Q011': {
    currentSkill: 'MBH-S02',
    suggestedSkill: 'NEW-10-EthicalProblemSolving',
    reason: 'Question is about Tarasoff case (duty to warn), not behavior function identification'
  },
  'SP5403_Q005': {
    currentSkill: 'MBH-S04',
    suggestedSkill: 'NEW-1-LowIncidenceExceptionalities',
    reason: 'Question is about Teacher of the Deaf services for hearing impairment, not suicide risk assessment'
  },
  'SP5403_Q096': {
    currentSkill: 'MBH-S04',
    suggestedSkill: 'NEW-10-EthicalProblemSolving',
    reason: 'Question is about mandated reporting of abuse, not suicide risk assessment'
  },
  'SP5403_Q067': {
    currentSkill: 'NEW-8-Acculturation',
    suggestedSkill: 'NEW-1-ProblemSolvingFramework',
    reason: 'Question is about SLD identification and ruling out inadequate instruction'
  },
  'SP5403_Q073': {
    currentSkill: 'MBH-S05',
    suggestedSkill: 'NEW-3-AccommodationsModifications',
    reason: 'Question is about test accommodations and data-based decisions, not therapy models'
  },
  'SP5403_Q054': {
    currentSkill: 'NEW-4-Psychopathology',
    suggestedSkill: 'NEW-3-AccommodationsModifications',
    reason: 'Question asks about the difference between accommodations and modifications'
  }
};

// Common nonsensical distractors found in generated questions
const NONSENSICAL_DISTRACTORS = [
  'Tarasoff',
  'IDEA',
  'Investigate the abuse allegations before reporting',
  'Provide less than the required supervision hours',
  'Decide on placement without examining evaluation results',
  'Data collection all comes before intervention',
  'Data collection every comes before intervention',
  'Data collection only comes before intervention',
  'Data collection never comes before intervention',
  'The program resulted in improvement because scores increased',
  'The intervention caused the improvement because it was followed by better scores',
  'Allow full copying and release of test protocols',
  'Prescribe treatment without proper authorization',
  'Make a medical diagnosis',
  'Diagnose the student with a medical condition',
  'Breach confidentiality for general concerns about student well-being',
  'Use progress monitoring tools for program evaluation',
  'Use curriculum-based measurement for comprehensive evaluation',
  'Use a diagnostic assessment for weekly monitoring',
  'Use an individual assessment for universal screening',
  'Use a screening tool to determine eligibility',
  'Provide direct instruction only',
  'Provide direct instruction in reading',
  'Apply adult diagnostic criteria directly to children',
  'Apply the rule absolutely without considering context',
  'Include students with severe conduct disorders in group counseling',
  'A replacement behavior that serves a different function',
  'Intervention before assessment',
  'Schedule assessment for next week',
  'Schedule a meeting with school administration',
  'Assign homework to the student',
  'Take over teaching the student directly',
  'Make disciplinary decisions about the student',
  'Determine appropriate punishment for the behavior',
  'Provide the best possible education',
  'Recommend services without analyzing progress monitoring data',
  'Make a recommendation based on teacher observations alone',
  'Deny access to records without legal basis',
  'Disclose confidential information to unauthorized personnel',
  'Low scores lead to special education placement because they are related',
  'Cognitive Behavioral Therapy', // When used as distractor for non-therapy questions
  'Attention', // Single word distractors
  'Escape',
  'Abstract',
  'Concrete'
];

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

function loadQuestions(filePath: string): Question[] {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const projectQuestions: ProjectQuestion[] = JSON.parse(data);
    // Convert from project format to script format
    return convertArrayToScriptFormat(projectQuestions);
  } catch (error) {
    console.error(`Error loading questions from ${filePath}:`, error);
    return [];
  }
}

function checkSkillMismatch(question: Question): Issue | null {
  // Check known mismatches first
  if (KNOWN_MISMATCHES[question.id]) {
    const mismatch = KNOWN_MISMATCHES[question.id];
    return {
      questionId: question.id,
      skillId: question.skillId,
      issueType: 'SKILL_MISMATCH',
      severity: 'critical',
      description: `Question assigned to wrong skill: ${mismatch.reason}`,
      details: {
        currentSkill: mismatch.currentSkill,
        suggestedSkill: mismatch.suggestedSkill
      },
      suggestedFix: `Reassign to skill: ${mismatch.suggestedSkill}`
    };
  }

  // Keyword-based detection
  const questionText = `${question.question} ${question.rationale}`.toLowerCase();
  const skillKeywords = SKILL_KEYWORDS[question.skillId] || [];
  
  // Check if question contains keywords for its assigned skill
  const matchCount = skillKeywords.filter(kw => questionText.includes(kw.toLowerCase())).length;
  
  if (skillKeywords.length > 0 && matchCount === 0) {
    // Check if it matches a different skill better
    let bestMatch = { skillId: '', matchCount: 0 };
    
    for (const [skillId, keywords] of Object.entries(SKILL_KEYWORDS)) {
      const matches = keywords.filter(kw => questionText.includes(kw.toLowerCase())).length;
      if (matches > bestMatch.matchCount) {
        bestMatch = { skillId, matchCount: matches };
      }
    }
    
    if (bestMatch.matchCount >= 2 && bestMatch.skillId !== question.skillId) {
      return {
        questionId: question.id,
        skillId: question.skillId,
        issueType: 'SKILL_MISMATCH',
        severity: 'high',
        description: `Question may be misassigned. No keywords match current skill, but matches ${bestMatch.skillId}`,
        details: {
          currentSkill: question.skillId,
          possibleSkill: bestMatch.skillId,
          matchedKeywords: SKILL_KEYWORDS[bestMatch.skillId].filter(kw => questionText.includes(kw.toLowerCase()))
        },
        suggestedFix: `Review and consider reassigning to: ${bestMatch.skillId}`
      };
    }
  }
  
  return null;
}

function checkNonsensicalDistractors(question: Question): Issue[] {
  const issues: Issue[] = [];
  
  for (const choice of question.choices) {
    const choiceText = choice.text.trim();
    
    // Skip correct answers - check if this choice is correct
    const isCorrect = choice.isCorrect || choice.letter === question.correctAnswer || 
                     (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(choice.letter));
    if (isCorrect) continue;
    
    // Check against known nonsensical distractors
    for (const nonsensical of NONSENSICAL_DISTRACTORS) {
      if (choiceText === nonsensical || choiceText.startsWith(nonsensical)) {
        issues.push({
          questionId: question.id,
          skillId: question.skillId,
          issueType: 'NONSENSICAL_DISTRACTOR',
          severity: 'critical',
          description: `Distractor "${choice.letter}" is unrelated to question topic`,
          details: {
            choiceLetter: choice.letter,
            choiceText: choiceText,
            matchedPattern: nonsensical
          },
          suggestedFix: `Replace with a contextually relevant distractor related to ${question.skillId}`
        });
        break;
      }
    }
    
    // Check for single-word distractors (often too vague)
    if (choiceText.split(' ').length === 1 && choiceText.length < 20) {
      issues.push({
        questionId: question.id,
        skillId: question.skillId,
        issueType: 'NONSENSICAL_DISTRACTOR',
        severity: 'medium',
        description: `Distractor "${choice.letter}" is a single word: "${choiceText}"`,
        details: {
          choiceLetter: choice.letter,
          choiceText: choiceText
        },
        suggestedFix: 'Expand distractor to be a complete, plausible answer option'
      });
    }
  }
  
  return issues;
}

function checkTruncatedText(question: Question): Issue[] {
  const issues: Issue[] = [];
  
  // Check question text
  if (question.question.endsWith('...') || question.question.endsWith('ab...')) {
    issues.push({
      questionId: question.id,
      skillId: question.skillId,
      issueType: 'TRUNCATED_TEXT',
      severity: 'high',
      description: 'Question text appears truncated',
      details: { field: 'question', text: question.question },
      suggestedFix: 'Complete the question text'
    });
  }
  
  // Check choices
  for (const choice of question.choices) {
    if (choice.text.endsWith('...') || 
        choice.text.endsWith('ab...') || 
        choice.text.match(/\.\.\.$/) ||
        (choice.text.length < 5 && choice.text.trim() !== '')) {
      issues.push({
        questionId: question.id,
        skillId: question.skillId,
        issueType: 'TRUNCATED_TEXT',
        severity: 'high',
        description: `Choice "${choice.letter}" appears truncated: "${choice.text}"`,
        details: {
          choiceLetter: choice.letter,
          choiceText: choice.text
        },
        suggestedFix: 'Complete the answer choice text'
      });
    }
  }
  
  return issues;
}

function checkDuplicatePartialAnswers(question: Question): Issue | null {
  const choiceTexts = question.choices.map(c => c.text.toLowerCase().trim()).filter(t => t.length > 0);
  
  for (let i = 0; i < choiceTexts.length; i++) {
    for (let j = i + 1; j < choiceTexts.length; j++) {
      // Check if one choice is a subset of another
      if (choiceTexts[j].includes(choiceTexts[i]) && choiceTexts[i].length > 10) {
        return {
          questionId: question.id,
          skillId: question.skillId,
          issueType: 'DUPLICATE_PARTIAL_ANSWER',
          severity: 'medium',
          description: `Choice "${question.choices[i].letter}" is contained within choice "${question.choices[j].letter}"`,
          details: {
            partialChoice: { letter: question.choices[i].letter, text: question.choices[i].text },
            fullChoice: { letter: question.choices[j].letter, text: question.choices[j].text }
          },
          suggestedFix: 'Revise partial answer to be distinctly different'
        };
      }
    }
  }
  
  return null;
}

function checkRepetitiveTemplates(questions: Question[]): Issue[] {
  const issues: Issue[] = [];
  const templateGroups: Record<string, Question[]> = {};
  
  // Group questions by template pattern
  for (const q of questions) {
    // Extract template by removing specific terms
    const template = q.question
      .toLowerCase()
      .replace(/elementary|middle|high school|kindergarten/gi, '[LEVEL]')
      .replace(/anxiety|depression|adhd|trauma|behavioral challenges|social skills|managing emotions/gi, '[CONDITION]')
      .replace(/test-taking|school engagement|academic performance|learning/gi, '[OUTCOME]')
      .replace(/learning disability|physical disability|sensory impairment|adhd/gi, '[DISABILITY]')
      .replace(/extended time|tests read aloud|assistive technology|reduced assignment load/gi, '[ACCOMMODATION]');
    
    if (!templateGroups[template]) {
      templateGroups[template] = [];
    }
    templateGroups[template].push(q);
  }
  
  // Flag groups with too many similar questions
  for (const [template, group] of Object.entries(templateGroups)) {
    if (group.length >= 5) {
      for (const q of group) {
        issues.push({
          questionId: q.id,
          skillId: q.skillId,
          issueType: 'REPETITIVE_TEMPLATE',
          severity: 'medium',
          description: `Part of a group of ${group.length} nearly identical questions`,
          details: {
            templatePattern: template.substring(0, 100),
            groupSize: group.length,
            otherQuestionIds: group.filter(gq => gq.id !== q.id).map(gq => gq.id).slice(0, 5)
          },
          suggestedFix: 'Consider varying question structure or reducing similar questions'
        });
      }
    }
  }
  
  return issues;
}

function analyzeQuestions(questions: Question[]): AnalysisReport {
  const issues: Issue[] = [];
  const questionsBySkill: Record<string, number> = {};
  
  console.log(`Analyzing ${questions.length} questions...`);
  
  for (const question of questions) {
    // Track questions by skill
    questionsBySkill[question.skillId] = (questionsBySkill[question.skillId] || 0) + 1;
    
    // Check for skill mismatch
    const mismatchIssue = checkSkillMismatch(question);
    if (mismatchIssue) issues.push(mismatchIssue);
    
    // Check for nonsensical distractors (primarily in generated questions)
    const distractorIssues = checkNonsensicalDistractors(question);
    issues.push(...distractorIssues);
    
    // Check for truncated text
    const truncatedIssues = checkTruncatedText(question);
    issues.push(...truncatedIssues);
    
    // Check for duplicate partial answers
    const duplicateIssue = checkDuplicatePartialAnswers(question);
    if (duplicateIssue) issues.push(duplicateIssue);
  }
  
  // Check for repetitive templates
  const repetitiveIssues = checkRepetitiveTemplates(questions);
  issues.push(...repetitiveIssues);
  
  // Calculate statistics
  const issuesByType: Record<IssueType, number> = {
    SKILL_MISMATCH: 0,
    NONSENSICAL_DISTRACTOR: 0,
    TRUNCATED_TEXT: 0,
    DUPLICATE_PARTIAL_ANSWER: 0,
    REPETITIVE_TEMPLATE: 0,
    MISSING_RATIONALE: 0,
    INCORRECT_ANSWER_KEY: 0,
    FORMATTING_ERROR: 0
  };
  
  const issuesBySeverity: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  for (const issue of issues) {
    issuesByType[issue.issueType]++;
    issuesBySeverity[issue.severity]++;
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (issuesByType.SKILL_MISMATCH > 0) {
    recommendations.push(`Review and reassign ${issuesByType.SKILL_MISMATCH} questions with potential skill mismatches`);
  }
  
  if (issuesByType.NONSENSICAL_DISTRACTOR > 0) {
    recommendations.push(`Regenerate distractors for ${issuesByType.NONSENSICAL_DISTRACTOR} questions with unrelated answer choices`);
  }
  
  if (issuesByType.TRUNCATED_TEXT > 0) {
    recommendations.push(`Complete truncated text in ${issuesByType.TRUNCATED_TEXT} questions/answers`);
  }
  
  if (issuesByType.REPETITIVE_TEMPLATE > 0) {
    recommendations.push(`Reduce template repetition - ${issuesByType.REPETITIVE_TEMPLATE} questions follow nearly identical patterns`);
  }
  
  return {
    timestamp: new Date().toISOString(),
    totalQuestions: questions.length,
    issuesFound: issues.length,
    issuesByType,
    issuesBySeverity,
    issues,
    questionsBySkill,
    recommendations
  };
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateDetailedReport(report: AnalysisReport): string {
  let output = '';
  
  output += '# Question Quality Analysis Report\n';
  output += `Generated: ${report.timestamp}\n\n`;
  
  output += '## Summary\n\n';
  output += `| Metric | Count |\n`;
  output += `|--------|-------|\n`;
  output += `| Total Questions | ${report.totalQuestions} |\n`;
  output += `| Total Issues | ${report.issuesFound} |\n`;
  output += `| Critical Issues | ${report.issuesBySeverity.critical} |\n`;
  output += `| High Issues | ${report.issuesBySeverity.high} |\n`;
  output += `| Medium Issues | ${report.issuesBySeverity.medium} |\n`;
  output += `| Low Issues | ${report.issuesBySeverity.low} |\n\n`;
  
  output += '## Issues by Type\n\n';
  output += `| Issue Type | Count |\n`;
  output += `|------------|-------|\n`;
  for (const [type, count] of Object.entries(report.issuesByType)) {
    if (count > 0) {
      output += `| ${type} | ${count} |\n`;
    }
  }
  output += '\n';
  
  output += '## Recommendations\n\n';
  for (const rec of report.recommendations) {
    output += `- ${rec}\n`;
  }
  output += '\n';
  
  // Group issues by type for detailed listing
  output += '---\n\n';
  output += '# Detailed Issue List\n\n';
  
  const issuesByType: Record<string, Issue[]> = {};
  for (const issue of report.issues) {
    if (!issuesByType[issue.issueType]) {
      issuesByType[issue.issueType] = [];
    }
    issuesByType[issue.issueType].push(issue);
  }
  
  for (const [type, issues] of Object.entries(issuesByType)) {
    output += `## ${type} (${issues.length} issues)\n\n`;
    
    for (const issue of issues) {
      output += `### ${issue.questionId}\n`;
      output += `- **Skill:** ${issue.skillId}\n`;
      output += `- **Severity:** ${issue.severity.toUpperCase()}\n`;
      output += `- **Description:** ${issue.description}\n`;
      
      if (issue.details) {
        output += `- **Details:**\n`;
        output += '```json\n';
        output += JSON.stringify(issue.details, null, 2);
        output += '\n```\n';
      }
      
      if (issue.suggestedFix) {
        output += `- **Suggested Fix:** ${issue.suggestedFix}\n`;
      }
      
      output += '\n';
    }
  }
  
  return output;
}

function generateCSVReport(report: AnalysisReport): string {
  let csv = 'Question ID,Skill ID,Issue Type,Severity,Description,Suggested Fix\n';
  
  for (const issue of report.issues) {
    const description = issue.description.replace(/"/g, '""');
    const fix = (issue.suggestedFix || '').replace(/"/g, '""');
    csv += `"${issue.questionId}","${issue.skillId}","${issue.issueType}","${issue.severity}","${description}","${fix}"\n`;
  }
  
  return csv;
}

function generateFixScript(report: AnalysisReport): string {
  let script = `/**
 * Auto-generated fix script for question quality issues
 * Generated: ${report.timestamp}
 * 
 * Review each fix before applying!
 */

interface QuestionFix {
  questionId: string;
  action: 'reassign_skill' | 'replace_distractor' | 'complete_text' | 'review_manual';
  details: any;
}

const fixes: QuestionFix[] = [
`;

  // Generate fixes for skill mismatches
  const mismatches = report.issues.filter(i => i.issueType === 'SKILL_MISMATCH');
  for (const issue of mismatches) {
    script += `  {
    questionId: '${issue.questionId}',
    action: 'reassign_skill',
    details: ${JSON.stringify(issue.details)}
  },
`;
  }

  // Generate fixes for nonsensical distractors
  const distractors = report.issues.filter(i => i.issueType === 'NONSENSICAL_DISTRACTOR');
  for (const issue of distractors) {
    script += `  {
    questionId: '${issue.questionId}',
    action: 'replace_distractor',
    details: ${JSON.stringify(issue.details)}
  },
`;
  }

  script += `];

export { fixes };

// Apply fixes function
export function applyFixes(questions: any[], fixes: QuestionFix[]): any[] {
  const questionMap = new Map(questions.map(q => [q.id, q]));
  
  for (const fix of fixes) {
    const question = questionMap.get(fix.questionId);
    if (!question) continue;
    
    switch (fix.action) {
      case 'reassign_skill':
        if (fix.details.suggestedSkill) {
          console.log(\`Reassigning \${fix.questionId} from \${question.skillId} to \${fix.details.suggestedSkill}\`);
          question.skillId = fix.details.suggestedSkill;
        }
        break;
        
      case 'replace_distractor':
        console.log(\`[MANUAL] Replace distractor \${fix.details.choiceLetter} in \${fix.questionId}\`);
        break;
        
      case 'complete_text':
        console.log(\`[MANUAL] Complete truncated text in \${fix.questionId}\`);
        break;
    }
  }
  
  return Array.from(questionMap.values());
}
`;

  return script;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('Question Quality Analyzer');
  console.log('=========================\n');
  
  // Create output directory
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  // Load questions
  let questions: Question[] = [];
  
  if (fs.existsSync(CONFIG.questionsPath)) {
    questions = loadQuestions(CONFIG.questionsPath);
    console.log(`Loaded ${questions.length} questions from ${CONFIG.questionsPath}`);
  } else {
    console.log(`Questions file not found at ${CONFIG.questionsPath}`);
    console.log('Please update CONFIG.questionsPath in the script');
    console.log('\nTo use this script:');
    console.log('1. Update the CONFIG paths at the top of this file');
    console.log('2. Run: npx tsx question-quality-analyzer.ts');
    return;
  }
  
  // Analyze questions
  const report = analyzeQuestions(questions);
  
  // Generate reports
  const detailedReport = generateDetailedReport(report);
  const csvReport = generateCSVReport(report);
  const fixScript = generateFixScript(report);
  
  // Save reports
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  fs.writeFileSync(
    path.join(CONFIG.outputDir, `quality-report-${timestamp}.md`),
    detailedReport
  );
  
  fs.writeFileSync(
    path.join(CONFIG.outputDir, `quality-report-${timestamp}.csv`),
    csvReport
  );
  
  fs.writeFileSync(
    path.join(CONFIG.outputDir, `suggested-fixes-${timestamp}.ts`),
    fixScript
  );
  
  fs.writeFileSync(
    path.join(CONFIG.outputDir, `quality-report-${timestamp}.json`),
    JSON.stringify(report, null, 2)
  );
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nTotal Questions: ${report.totalQuestions}`);
  console.log(`Total Issues: ${report.issuesFound}`);
  console.log(`\nIssues by Severity:`);
  console.log(`  🚨 Critical: ${report.issuesBySeverity.critical}`);
  console.log(`  ⚠️  High: ${report.issuesBySeverity.high}`);
  console.log(`  📝 Medium: ${report.issuesBySeverity.medium}`);
  console.log(`  ℹ️  Low: ${report.issuesBySeverity.low}`);
  
  console.log(`\nIssues by Type:`);
  for (const [type, count] of Object.entries(report.issuesByType)) {
    if (count > 0) {
      console.log(`  ${type}: ${count}`);
    }
  }
  
  console.log(`\nRecommendations:`);
  for (const rec of report.recommendations) {
    console.log(`  • ${rec}`);
  }
  
  console.log(`\nReports saved to: ${CONFIG.outputDir}/`);
  console.log(`  - quality-report-${timestamp}.md (detailed report)`);
  console.log(`  - quality-report-${timestamp}.csv (spreadsheet format)`);
  console.log(`  - quality-report-${timestamp}.json (raw data)`);
  console.log(`  - suggested-fixes-${timestamp}.ts (fix script)`);
}

main().catch(console.error);
