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
import QUESTIONS_DATA from '../src/data/questions.json';
import { analyzeQuestion, Question as RawQuestion } from '../src/brain/question-analyzer';

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
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

// Map skills to their expected domains.
//
// Keyed by `current_skill_id` (the runtime skill ID stored on every question
// in src/data/questions.json), NOT the retired `DBDM-S01`/`CC-S01`-style
// content IDs used in src/brain/skill-map.ts. Domain assignments were derived
// by resolving each current ID to its content/metadata ID via
// src/data/skillIdMap.ts, then reading that ID's `vocabulary` array in
// src/data/skill-metadata-v1.ts and matching it against the
// DOMAIN_TERM_LIBRARIES categories above.
//
// A handful of skills (crisis/safety, implicit bias, bio-cultural influences,
// single-subject design) have no genuine overlap with any of the 7 term
// libraries — they're intentionally left as `[]` rather than forced into an
// ill-fitting bucket, since a wrong domain assignment would suppress real
// irrelevant-domain flags instead of just adding a bit of expected noise.
const SKILL_TO_DOMAIN_MAP: Record<string, string[]> = {
  // Professional Practices (assessment, psychometrics, consultation)
  'CON-01': ['consultation'],                 // Consultation Models
  'DBD-01': ['assessment'],                   // RIOT Framework / Multi-Method Data Review
  'DBD-03': ['assessment', 'psychometric'],   // Cognitive Assessment (IQ vs. Achievement)
  'DBD-05': ['psychometric'],                 // Diagnostic/Processing Measures (sensitivity/specificity)
  'DBD-06': ['fba'],                          // Emotional/Behavioral Assessment (ABC)
  'DBD-07': ['fba'],                          // Functional Behavioral Assessment
  'DBD-08': ['assessment'],                   // Progress Monitoring (CBM, benchmark)
  'DBD-09': ['assessment', 'psychometric'],   // Ecological Assessment / Universal Screening
  'DBD-10': ['assessment'],                   // Records Review
  'PSY-01': ['psychometric'],                 // Score Interpretation
  'PSY-02': ['psychometric'],                 // Reliability & Validity
  'PSY-03': ['intervention'],                 // MTSS in Assessment
  'PSY-04': ['assessment'],                   // CLD Assessment (nonverbal, ELL)

  // Student-Level Services (academic intervention, counseling/therapy)
  'ACA-02': ['intervention'],                 // Accommodations & Modifications
  'ACA-03': ['intervention'],                 // Study Skills / Metacognitive Strategies
  'ACA-04': ['intervention'],                 // Instructional Strategies / Hierarchy
  'ACA-06': ['intervention'],                 // Learning Theories (scaffolding, ZPD)
  'ACA-07': ['intervention'],                 // Language & Literacy (reading interventions)
  'ACA-08': ['intervention'],                 // Executive Function / Error Analysis
  'ACA-09': ['intervention'],                 // Health Impact / Academic Progress Factors
  'DEV-01': ['therapy'],                      // Development (Erikson, Piaget) → developmental interventions
  'MBH-02': ['therapy'],                      // Individual and Group Counseling
  'MBH-03': ['therapy'],                      // Intervention Models (CBT, SFBT, DBT)
  'MBH-04': ['therapy'],                      // Psychopathology
  'MBH-05': ['therapy'],                      // Biological Bases / Mental Health Impact

  // Systems-Level Services (family/community, safety, schoolwide practices)
  'FAM-02': ['consultation'],                 // Family Involvement / Collaboration
  'FAM-03': ['consultation'],                 // Interagency Collaboration
  'SAF-01': ['intervention'],                 // Schoolwide Prevention (PBIS)
  'SAF-03': [],                               // Threat Assessment — crisis/safety, no matching library
  'SAF-04': [],                               // Crisis Response Role — crisis/safety, no matching library
  'SWP-02': ['intervention'],                 // Policy and Practice (retention, tracking, EBP)
  'SWP-03': ['intervention'],                 // Evidence-Based Schoolwide Practices
  'SWP-04': ['intervention'],                 // Systems MTSS

  // Foundations (diversity, legal/ethics, research)
  'DIV-01': [],                               // Cultural Factors / Bio-cultural influences — no matching library
  'DIV-03': [],                               // Implicit Bias — no matching library
  'DIV-05': ['legal', 'assessment'],          // Special Ed Services & Diverse Needs (LRE, eligibility)
  'ETH-01': ['legal'],                        // NASP Ethics / Ethical Problem-Solving
  'ETH-02': ['legal'],                        // Professional Liability / Ethical Dilemmas
  'ETH-03': ['legal'],                        // Advocacy, Lifelong Learning
  'LEG-01': ['legal'],                        // FERPA
  'LEG-02': ['legal'],                        // IDEA
  'LEG-03': ['legal'],                        // Section 504 / ADA
  'LEG-04': ['legal'],                        // Case Law (Tarasoff, Larry P., Rowley)
  'RES-02': ['assessment'],                   // Applying Research to Practice (program evaluation)
  'RES-03': [],                               // Research Design & Statistics (single-subject design) — no matching library
};

// ============================================================================
// AUDIT FUNCTIONS
// ============================================================================

function loadQuestions(): Question[] {
  return (QUESTIONS_DATA as RawQuestion[]).map((raw) => {
    const analyzed = analyzeQuestion(raw);
    return {
      id: analyzed.id,
      question: analyzed.question || '',
      choices: analyzed.choices || {},
      correct_answer: analyzed.correct_answer || [],
      rationale: analyzed.rationale,
      skillId: analyzed.skillId,
    };
  });
}

/**
 * Extract templateId from the question ID, for generated questions only.
 * The current bank (UNIQUEID like "PQ_CON-01_1") has no templates; this only
 * matches the older GEN-{templateId}-{hash} generated-question ID format.
 */
function extractTemplateId(question: Question): string | null {
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
  const questions = loadQuestions();
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
