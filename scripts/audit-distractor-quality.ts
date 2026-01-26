/**
 * Distractor Quality Audit
 * 
 * Systematically audits ALL questions to identify distractor quality problems:
 * - Irrelevant domain terms (legal terms in consultation questions, etc.)
 * - Length mismatches between distractors and correct answers
 * - Plausibility issues (one-word vs phrase answers)
 * - Pattern mismatches
 * 
 * Purpose: Determine if the CC-T02 distractor issue is isolated or systemic
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  questionsPath: './src/data/questions.json',
  skillMapPath: './src/brain/skill-map.ts',
  outputPath: './DISTRACTOR_AUDIT_REPORT.md',
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Question {
  id: string;
  question: string;
  choices: Record<string, string>;
  correct_answer: string | string[];
  rationale?: string;
  skillId?: string;
  metadata?: {
    templateId?: string;
    source?: string;
  };
}

interface DistractorIssue {
  questionId: string;
  skillId: string | null;
  templateId: string | null;
  issueType: 'irrelevant-domain' | 'length-mismatch' | 'single-word' | 'pattern-mismatch' | 'grammatical-issue';
  severity: 'high' | 'medium' | 'low';
  distractor: string;
  choiceLetter: string;
  details: Record<string, any>;
  recommendation: string;
}

interface AuditReport {
  summary: {
    totalQuestions: number;
    questionsWithIssues: number;
    questionsPassing: number;
    issuesFound: number;
    issuesByType: Record<string, number>;
  };
  flaggedQuestions: DistractorIssue[];
  templateAnalysis: Array<{
    templateId: string;
    issueCount: number;
    commonProblems: string[];
  }>;
  skillAnalysis: Array<{
    skillId: string;
    issueCount: number;
    commonProblems: string[];
  }>;
}

// ============================================================================
// DOMAIN TERM LIBRARIES
// ============================================================================

const DOMAIN_TERM_LIBRARIES = {
  legal: [
    'Tarasoff', 'IDEA', 'FERPA', 'Section 504', 'Mills', 'Larry P.', 'Lau',
    'FAPE', 'due process', 'IEP', 'manifestation determination', 'Rowley',
    'PARC', 'least restrictive environment', 'LRE', 'educationally relevant'
  ],
  psychometric: [
    'reliability', 'validity', 'correlation', 'z-score', 't-test', 'ANOVA',
    'standard deviation', 'mean', 'median', 'coefficient', 'regression',
    'test-retest', 'internal consistency', 'Cronbach', 'alpha', 'interrater',
    'sensitivity', 'specificity', 'true positive', 'false positive'
  ],
  fba: [
    'function', 'antecedent', 'consequence', 'ABC data', 'escape', 'attention',
    'tangible', 'automatic reinforcement', 'functional analysis', 'FBA',
    'behavior intervention plan', 'BIP', 'maintaining consequence'
  ],
  consultation: [
    'rapport', 'contracting', 'consultee', 'entry', 'resistance',
    'collaborative', 'problem-solving stages', 'conjoint', 'organizational'
  ],
  therapy: [
    'CBT', 'cognitive behavioral', 'SFBT', 'solution-focused', 'DBT',
    'dialectical', 'play therapy', 'counseling model', 'therapeutic alliance'
  ],
 assessment: [
    'screening', 'diagnosis', 'eligibility', 'progress monitoring', 'CBM',
    'curriculum-based measurement', 'benchmark', 'diagnostic assessment'
  ],
  intervention: [
    'Tier 1', 'Tier 2', 'Tier 3', 'RTI', 'MTSS', 'scaffolding', 
    'differentiation', 'explicit instruction'
  ]
};

// Map skills to their expected domains
const SKILL_TO_DOMAIN_MAP: Record<string, string[]> = {
  // Domain 1 - Data-Based Decision Making
  'DBDM-S01': ['psychometric'],
  'DBDM-S02': ['psychometric'],
  'DBDM-S03': ['psychometric'],
  'DBDM-S04': ['psychometric'],
  'DBDM-S05': ['assessment', 'psychometric'],
  'DBDM-S06': ['assessment'],
  'DBDM-S07': ['assessment'],
  'DBDM-S08': ['assessment'],
  'DBDM-S09': ['assessment'],
  'DBDM-S10': ['assessment'],
  'NEW-1-BackgroundInformation': ['assessment'],
  'NEW-1-DynamicAssessment': ['assessment'],
  'NEW-1-IQvsAchievement': ['psychometric', 'assessment'],
  'NEW-1-LowIncidenceExceptionalities': ['assessment'],
  'NEW-1-PerformanceAssessment': ['assessment'],
  'NEW-1-ProblemSolvingFramework': ['intervention'],

  // Domain 2 - Consultation & Collaboration
  'CC-S01': ['consultation'],
  'CC-S03': ['consultation'],
  'NEW-2-ConsultationProcess': ['consultation'],
  'NEW-2-ProblemSolvingSteps': ['consultation'],
  'NEW-2-CommunicationStrategies': ['consultation'],
  'NEW-2-FamilyCollaboration': ['consultation'],
  'NEW-2-CommunityAgencies': ['consultation'],

  // Domain 3 - Academic Interventions
  'ACAD-S01': ['intervention'],
  'ACAD-S02': ['intervention'],
  'ACAD-S03': ['intervention'],
  'ACAD-S04': ['intervention'],
  'ACAD-S05': ['assessment', 'intervention'],
  'NEW-3-AccommodationsModifications': ['intervention'],
  'NEW-3-AcademicProgressFactors': ['intervention'],
  'NEW-3-BioCulturalInfluences': ['intervention'],
  'NEW-3-InstructionalHierarchy': ['intervention'],
  'NEW-3-MetacognitiveStrategies': ['intervention'],

  // Domain 4 - Mental & Behavioral Health
  'MBH-S01': ['fba'],
  'MBH-S02': ['fba'],
  'MBH-S03': ['fba'],
  'MBH-S04': ['therapy'],
  'MBH-S05': ['therapy'],
  'MBH-S06': ['intervention', 'fba'],
  'NEW-4-Psychopathology': ['therapy'],
  'NEW-4-DevelopmentalInterventions': ['therapy'],
  'NEW-4-MentalHealthImpact': ['therapy'],
  'NEW-4-GroupCounseling': ['therapy'],

  // Domain 5 - School-Wide Practices
  'SWP-S01': ['intervention'],
  'SWP-S02': ['intervention'],
  'SWP-S03': ['intervention'],
  'SWP-S04': ['intervention'],
  'NEW-5-EducationalPolicies': ['legal', 'assessment'],
  'NEW-5-EBPImportance': ['intervention'],
  'NEW-5-SchoolClimate': ['intervention'],

  // Domain 6-9 - Other domains would map here
  'RES-S01': ['intervention'],
  'RES-S02': ['intervention'],
  'RES-S03': ['intervention'],
  'RES-S04': ['intervention'],
  'RES-S05': ['intervention'],
  'RES-S06': ['intervention'],
  'NEW-6-BullyingPrevention': ['intervention'],
  'NEW-6-TraumaInformed': ['intervention'],
  'NEW-6-SchoolClimateMeasurement': ['assessment', 'intervention'],

  // Family/Community
  'FSC-S01': ['consultation'],
  'FSC-S02': ['consultation'],
  'FSC-S03': ['therapy'],
  'FSC-S04': ['consultation'],
  'NEW-7-BarriersToEngagement': ['consultation'],
  'NEW-7-FamilySystems': ['consultation'],
  'NEW-7-InteragencyCollaboration': ['consultation'],
  'NEW-7-ParentingInterventions': ['consultation', 'intervention'],

  // Diversity
  'DIV-S01': ['assessment'],
  'DIV-S02': ['assessment'],
  'DIV-S03': ['psychometric'],
  'DIV-S04': ['assessment'],
  'DIV-S05': ['assessment'],
  'DIV-S06': ['assessment'],
  'DIV-S07': ['intervention'],
  'NEW-8-Acculturation': ['assessment'],
  'NEW-8-LanguageAcquisition': ['assessment'],
  'NEW-8-SocialJustice': ['legal'],

  // Research/Statistics
  'NEW-9-DescriptiveStats': ['psychometric'],
  'NEW-9-ValidityThreats': ['psychometric'],
  'NEW-9-StatisticalTests': ['psychometric'],
  'NEW-9-Variables': ['psychometric'],
  'NEW-9-ProgramEvaluation': ['assessment'],
  'NEW-9-ImplementationFidelity': ['intervention'],

  // Legal/Ethical
  'LEG-S01': ['legal'],
  'LEG-S02': ['legal'],
  'LEG-S03': ['legal'],
  'LEG-S04': ['legal'],
  'LEG-S05': ['legal'],
  'LEG-S06': ['legal'],
  'LEG-S07': ['legal'],
  'PC-S01': ['assessment'],
  'PC-S02': ['assessment'],
  'PC-S03': ['legal'],
  'PC-S04': ['intervention'],
  'PC-S05': ['legal'],
  'NEW-10-EducationLaw': ['legal'],
  'NEW-10-EthicalProblemSolving': ['legal'],
  'NEW-10-RecordKeeping': ['legal'],
  'NEW-10-TestSecurity': ['legal'],
  'NEW-10-Supervision': ['legal'],
  'NEW-10-ProfessionalGrowth': ['legal'],
};

// ============================================================================
// AUDIT FUNCTIONS
// ============================================================================

function loadQuestions(filePath: string): Question[] {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading questions from ${filePath}:`, error);
    return [];
  }
}

/**
 * Extract templateId from question metadata or question ID
 * Handles cases where metadata.templateId is missing but ID contains template info
 */
function extractTemplateId(question: Question): string | null {
  // First try metadata
  if (question.metadata?.templateId) {
    return question.metadata.templateId;
  }
  
  // Extract from ID if it's a generated question (GEN-{templateId}-{hash})
  // Examples: GEN-CC-T09-aivvcx -> CC-T09, GEN-ACAD-T10-5i35q1 -> ACAD-T10
  if (question.id.startsWith('GEN-')) {
    const parts = question.id.split('-');
    if (parts.length >= 3) {
      // GEN-CC-T09-aivvcx -> CC-T09
      return parts.slice(1, 3).join('-');
    }
  }
  
  return null;
}

function checkRelevance(question: Question): DistractorIssue[] {
  const issues: DistractorIssue[] = [];
  
  if (!question.skillId) {
    return issues; // Skip questions without skill mapping
  }

  const expectedDomains = SKILL_TO_DOMAIN_MAP[question.skillId] || [];
  const correctAnswers = Array.isArray(question.correct_answer) 
    ? question.correct_answer 
    : [question.correct_answer];

  for (const [letter, text] of Object.entries(question.choices)) {
    if (!text || text.trim() === '') continue;
    if (correctAnswers.includes(letter)) continue; // Skip correct answers

    // Check if this distractor contains terms from unexpected domains
    for (const [domainName, terms] of Object.entries(DOMAIN_TERM_LIBRARIES)) {
      // Skip checking if this domain is expected for this skill
      if (expectedDomains.includes(domainName)) continue;

      for (const term of terms) {
        if (text.toLowerCase().includes(term.toLowerCase())) {
          issues.push({
            questionId: question.id,
            skillId: question.skillId,
            templateId: extractTemplateId(question),
            issueType: 'irrelevant-domain',
            severity: 'high',
            distractor: text,
            choiceLetter: letter,
            details: {
              term,
              unexpectedDomain: domainName,
              expectedDomains,
              skillId: question.skillId
            },
            recommendation: `Replace distractor with term from ${expectedDomains.join(' or ')} domain(s)`
          });
          break; // Only report first irrelevant term per distractor
        }
      }
    }
  }

  return issues;
}

function checkLength(question: Question): DistractorIssue[] {
  const issues: DistractorIssue[] = [];
  
  const correctAnswers = Array.isArray(question.correct_answer) 
    ? question.correct_answer
    : [question.correct_answer];

  // Get correct answer text(s)
  const correctTexts = correctAnswers
    .map(ans => question.choices[ans])
    .filter(text => text && text.trim() !== '');

  if (correctTexts.length === 0) return issues;

  // Calculate average correct answer length
  const avgCorrectLength = correctTexts.reduce((sum, text) => sum + text.length, 0) / correctTexts.length;

  // Check each distractor
  for (const [letter, text] of Object.entries(question.choices)) {
    if (!text || text.trim() === '') continue;
    if (correctAnswers.includes(letter)) continue;

    const distractorLength = text.length;
    const ratio = distractorLength / avgCorrectLength;

    // Flag if distractor is <40% or >175% of correct answer length
    if (ratio < 0.4 || ratio > 1.75) {
      const severity = ratio < 0.3 || ratio > 3.0 ? 'high' : 'medium';
      
      issues.push({
        questionId: question.id,
        skillId: question.skillId || null,
        templateId: extractTemplateId(question),
        issueType: 'length-mismatch',
        severity,
        distractor: text,
        choiceLetter: letter,
        details: {
          distractorLength,
          avgCorrectLength: Math.round(avgCorrectLength),
          ratio: ratio.toFixed(2),
          tooShort: ratio < 0.4,
          tooLong: ratio > 1.75
        },
        recommendation: `Adjust distractor length to be closer to correct answer length (${Math.round(avgCorrectLength)} chars)`
      });
    }
  }

  return issues;
}

function checkSingleWord(question: Question): DistractorIssue[] {
  const issues: DistractorIssue[] = [];
  
  const correctAnswers = Array.isArray(question.correct_answer) 
    ? question.correct_answer 
    : [question.correct_answer];

  // Get all choice texts
  const allChoices = Object.entries(question.choices)
    .filter(([_, text]) => text && text.trim() !== '')
    .map(([letter, text]) => ({
      letter,
      text,
      wordCount: text.trim().split(/\s+/).length,
      isCorrect: correctAnswers.includes(letter)
    }));

  // Check if there's a mix of single-word and multi-word answers
  const singleWordChoices = allChoices.filter(c => c.wordCount === 1);
  const multiWordChoices = allChoices.filter(c => c.wordCount > 3);

  if (singleWordChoices.length > 0 && multiWordChoices.length > 0) {
    // Flag single-word distractors
    for (const choice of singleWordChoices) {
      if (!choice.isCorrect) {
        issues.push({
          questionId: question.id,
          skillId: question.skillId || null,
          templateId: extractTemplateId(question),
          issueType: 'single-word',
          severity: 'medium',
          distractor: choice.text,
          choiceLetter: choice.letter,
          details: {
            wordCount: choice.wordCount,
            otherChoicesHave: multiWordChoices.length > 0 ? 'full sentences' : 'multiple words'
          },
          recommendation: 'Expand distractor to be a complete phrase or sentence'
        });
      }
    }
  }

  return issues;
}

function checkGrammatical(question: Question): DistractorIssue[] {
  const issues: DistractorIssue[] = [];
  
  const stem = question.question.toLowerCase();
  const endsWithArticle = /\b(a|an|the)\s*$/i.test(stem.trim());
  
  if (!endsWithArticle) return issues; // Only check if stem ends with article

  const correctAnswers = Array.isArray(question.correct_answer) 
    ? question.correct_answer 
    : [question.correct_answer];

  for (const [letter, text] of Object.entries(question.choices)) {
    if (!text || text.trim() === '') continue;
    if (correctAnswers.includes(letter)) continue;

    // Check article agreement
    const firstWord = text.trim().split(/\s+/)[0].toLowerCase();
    const startsWithVowelSound = /^[aeiou]/i.test(firstWord);

    if (stem.trim().endsWith(' an') && !startsWithVowelSound) {
      issues.push({
        questionId: question.id,
        skillId: question.skillId || null,
        templateId: extractTemplateId(question),
        issueType: 'grammatical-issue',
        severity: 'low',
        distractor: text,
        choiceLetter: letter,
        details: {
          issue: 'Stem ends with "an" but choice starts with consonant',
          firstWord
        },
        recommendation: 'Ensure grammatical agreement between stem and choices'
      });
    }
  }

  return issues;
}

function analyzeQuestions(questions: Question[]): AuditReport {
  const allIssues: DistractorIssue[] = [];
  const questionsWithIssues = new Set<string>();
  
  // Check for missing skill mappings
  const uniqueSkillIds = new Set<string>();
  questions.forEach(q => {
    if (q.skillId) {
      uniqueSkillIds.add(q.skillId);
    }
  });
  
  const missingMappings: string[] = [];
  uniqueSkillIds.forEach(skillId => {
    if (!SKILL_TO_DOMAIN_MAP[skillId]) {
      missingMappings.push(skillId);
    }
  });
  
  if (missingMappings.length > 0) {
    console.warn(`\n⚠️  Warning: ${missingMappings.length} skillIds missing from SKILL_TO_DOMAIN_MAP:`);
    missingMappings.forEach(id => console.warn(`   - ${id}`));
    console.warn('   Questions with these skills will be skipped for relevance checks.\n');
  }

  console.log(`Analyzing ${questions.length} questions...`);

  for (const question of questions) {
    const relevanceIssues = checkRelevance(question);
    const lengthIssues = checkLength(question);
    const singleWordIssues = checkSingleWord(question);
    const grammaticalIssues = checkGrammatical(question);

    const questionIssues = [
      ...relevanceIssues,
      ...lengthIssues,
      ...singleWordIssues,
      ...grammaticalIssues
    ];

    if (questionIssues.length > 0) {
      questionsWithIssues.add(question.id);
    }

    allIssues.push(...questionIssues);
  }

  // Calculate summary statistics
  const issuesByType: Record<string, number> = {
    'irrelevant-domain': 0,
    'length-mismatch': 0,
    'single-word': 0,
    'pattern-mismatch': 0,
    'grammatical-issue': 0
  };

  for (const issue of allIssues) {
    issuesByType[issue.issueType]++;
  }

  // Analyze by template
  const templateIssues = new Map<string, DistractorIssue[]>();
  for (const issue of allIssues) {
    if (issue.templateId) {
      if (!templateIssues.has(issue.templateId)) {
        templateIssues.set(issue.templateId, []);
      }
      templateIssues.get(issue.templateId)!.push(issue);
    }
  }

  const templateAnalysis = Array.from(templateIssues.entries()).map(([templateId, issues]) => {
    const problemTypes = new Map<string, number>();
    for (const issue of issues) {
      const type = issue.issueType;
      problemTypes.set(type, (problemTypes.get(type) || 0) + 1);
    }

    return {
      templateId,
      issueCount: issues.length,
      commonProblems: Array.from(problemTypes.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => `${type} (${count})`)
    };
  }).sort((a, b) => b.issueCount - a.issueCount);

  // Analyze by skill
  const skillIssues = new Map<string, DistractorIssue[]>();
  for (const issue of allIssues) {
    if (issue.skillId) {
      if (!skillIssues.has(issue.skillId)) {
        skillIssues.set(issue.skillId, []);
      }
      skillIssues.get(issue.skillId)!.push(issue);
    }
  }

  const skillAnalysis = Array.from(skillIssues.entries()).map(([skillId, issues]) => {
    const problemTypes = new Map<string, number>();
    for (const issue of issues) {
      const type = issue.issueType;
      problemTypes.set(type, (problemTypes.get(type) || 0) + 1);
    }

    return {
      skillId,
      issueCount: issues.length,
      commonProblems: Array.from(problemTypes.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => `${type} (${count})`)
    };
  }).sort((a, b) => b.issueCount - a.issueCount);

  return {
    summary: {
      totalQuestions: questions.length,
      questionsWithIssues: questionsWithIssues.size,
      questionsPassing: questions.length - questionsWithIssues.size,
      issuesFound: allIssues.length,
      issuesByType
    },
    flaggedQuestions: allIssues,
    templateAnalysis,
    skillAnalysis
  };
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport(report: AuditReport, questions: Question[]): string {
  let md = '';
  
  md += '# Distractor Quality Audit\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;

  // Summary
  md += '## Summary\n\n';
  const { summary } = report;
  const passPercent = ((summary.questionsPassing / summary.totalQuestions) * 100).toFixed(1);
  const issuePercent = ((summary.questionsWithIssues / summary.totalQuestions) * 100).toFixed(1);
  
  md += `- Total questions: **${summary.totalQuestions}**\n`;
  md += `- Questions with issues: **${summary.questionsWithIssues}** (${issuePercent}%)\n`;
  md += `- Questions passing all checks: **${summary.questionsPassing}** (${passPercent}%)\n`;
  md += `- Total issues found: **${summary.issuesFound}**\n\n`;

  // Issues by Type
  md += '## Issues by Type\n\n';
  md += '| Issue Type | Count | % |\n';
  md += '|------------|-------|---|\n';
  
  for (const [type, count] of Object.entries(summary.issuesByType)) {
    if (count > 0) {
      const percent = ((count / summary.issuesFound) * 100).toFixed(1);
      md += `| ${type} | ${count} | ${percent}% |\n`;
    }
  }
  md += '\n';

  // Skills with Most Issues
  if (report.skillAnalysis.length > 0) {
    md += '## Skills with Most Issues\n\n';
    md += '| Skill ID | Issue Count | Common Problems |\n';
    md += '|----------|-------------|----------------|\n';
    
    for (const skill of report.skillAnalysis.slice(0, 15)) {
      md += `| ${skill.skillId} | ${skill.issueCount} | ${skill.commonProblems.join(', ')} |\n`;
    }
    md += '\n';
  }

  // Templates with Most Issues
  if (report.templateAnalysis.length > 0) {
    md += '## Templates with Most Issues\n\n';
    md += '| Template ID | Issue Count | Common Problems |\n';
    md += '|-------------|-------------|----------------|\n';
    
    for (const template of report.templateAnalysis.slice(0, 10)) {
      md += `| ${template.templateId} | ${template.issueCount} | ${template.commonProblems.join(', ')} |\n`;
    }
    md += '\n';
  }

  // Detailed Flagged Questions
  md += '## Flagged Questions\n\n';
  md += '| Question ID | Skill | Template | Issue | Distractor (truncated) | Recommendation |\n';
  md += '|-------------|-------|----------|-------|------------------------|----------------|\n';
  
  for (const issue of report.flaggedQuestions.slice(0, 50)) {
    const truncatedDistractor = issue.distractor.length > 40 
      ? issue.distractor.substring(0, 37) + '...'
      : issue.distractor;
    
    md += `| ${issue.questionId} | ${issue.skillId || 'N/A'} | ${issue.templateId || 'N/A'} | ${issue.issueType} | ${truncatedDistractor} | ${issue.recommendation} |\n`;
  }
  
  if (report.flaggedQuestions.length > 50) {
    md += `\n_... and ${report.flaggedQuestions.length - 50} more issues_\n`;
  }
  md += '\n';

  // Analysis & Recommendations
  md += '---\n\n';
  md += '## Analysis & Recommendations\n\n';

  const irrelevantCount = summary.issuesByType['irrelevant-domain'] || 0;
  const lengthCount = summary.issuesByType['length-mismatch'] || 0;
  
  md += '### Scope Assessment\n\n';

  if (irrelevantCount === 0 && lengthCount === 0) {
    md += '**✅ EXCELLENT**: No major distractor quality issues found.\n\n';
  } else if (report.templateAnalysis.length === 0 || report.templateAnalysis.length === 1) {
    md += '**✅ ISOLATED ISSUE**: Problems are limited to a small number of templates/skills.\n\n';
    md += '**Recommendation**: Fix the specific identified templates.\n\n';
  } else if (report.templateAnalysis.length <= 5) {
    md += '**⚠️ DOMAIN-LEVEL ISSUE**: Problems affect multiple templates but are concentrated\n in certain skills/domains.\n\n';
    md += '**Recommendation**: Update slot libraries for affected domains with domain-specific distractors.\n\n';
  } else {
    md += '**🚨 SYSTEMIC ISSUE**: Problems are widespread across many templates and domains.\n\n';
    md += '**Recommendation**: Refactor the distractor generation logic globally.\n\n';
  }

  md += '### Specific Actions\n\n';
  
  if (irrelevantCount > 0) {
    md += `1. **Fix Irrelevant Domain Terms** (${irrelevantCount} issues)\n`;
    const topDomainMismatches = report.flaggedQuestions
      .filter(i => i.issueType === 'irrelevant-domain')
      .slice(0, 5);
    
    for (const issue of topDomainMismatches) {
      md += `   - ${issue.questionId}: ${issue.details.term} (${issue.details.unexpectedDomain}) in ${issue.skillId}\n`;
    }
    md += '\n';
  }

  if (lengthCount > 0) {
    md += `2. **Add Length Validation** (${lengthCount} issues)\n`;
    md += '   - Implement length check in distractor generator\n';
    md += '   - Target: distractors should be 50-200% of correct answer length\n\n';
  }

  const singleWordCount = summary.issuesByType['single-word'] || 0;
  if (singleWordCount > 0) {
    md += `3. **Expand Single-Word Distractors** (${singleWordCount} issues)\n`;
    md += '   - Convert single-word distractors to complete phrases\n';
    md += '   - Ensure uniformity across all choices\n\n';
  }

  return md;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('Distractor Quality Audit');
  console.log('========================\n');

  // Load questions
  const questions = loadQuestions(CONFIG.questionsPath);
  console.log(`Loaded ${questions.length} questions\n`);

  // Run audit
  const report = analyzeQuestions(questions);

  // Generate report
  const markdown = generateReport(report, questions);

  // Write report
  fs.writeFileSync(CONFIG.outputPath, markdown);
  
  console.log('\n' + '='.repeat(60));
  console.log('AUDIT COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nReport saved to: ${CONFIG.outputPath}`);
  console.log(`\nSummary:`);
  console.log(`  Total Questions: ${report.summary.totalQuestions}`);
  console.log(`  Questions with Issues: ${report.summary.questionsWithIssues} (${((report.summary.questionsWithIssues / report.summary.totalQuestions) * 100).toFixed(1)}%)`);
  console.log(`  Total Issues: ${report.summary.issuesFound}`);
  console.log(`\nTop Issue Types:`);
  
  const sortedIssues = Object.entries(report.summary.issuesByType)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  
  for (const [type, count] of sortedIssues) {
    console.log(`    ${type}: ${count}`);
  }
  
  if (report.templateAnalysis.length > 0) {
    console.log(`\nTemplates with Issues: ${report.templateAnalysis.length}`);
    console.log(`  Top 3:`);
    for (const template of report.templateAnalysis.slice(0, 3)) {
      console.log(`    - ${template.templateId}: ${template.issueCount} issues`);
    }
  }
  
  console.log('\n');
}

main().catch(console.error);
