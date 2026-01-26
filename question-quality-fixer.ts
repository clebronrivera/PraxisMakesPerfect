/**
 * Question Quality Fixer
 * Applies fixes to identified question quality issues
 * 
 * This script:
 * 1. Reassigns mismatched questions to correct skills
 * 2. Provides templates for better distractors
 * 3. Flags items requiring manual review
 */

import * as fs from 'fs';
import * as path from 'path';
import { convertArrayToScriptFormat, convertArrayToProjectFormat, type ProjectQuestion, type ScriptQuestion } from './question-format-converter.js';

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  questionsPath: './src/data/questions.json',
  outputPath: './quality-reports/questions-fixed.json',
  backupPath: './quality-reports/questions.backup.json',
  reportPath: './quality-reports/fix-report.md'
};

// ============================================================================
// SKILL REASSIGNMENTS
// Based on manual review of mismatched questions
// ============================================================================
const SKILL_REASSIGNMENTS: Record<string, { newSkillId: string; newSkillName: string; reason: string }> = {
  'SP5403_Q011': {
    newSkillId: 'NEW-10-EthicalProblemSolving',
    newSkillName: 'Ethical Problem-Solving Model',
    reason: 'Question about Tarasoff case (duty to warn) - legal/ethical topic'
  },
  'SP5403_Q005': {
    newSkillId: 'NEW-1-LowIncidenceExceptionalities',
    newSkillName: 'Low-Incidence Exceptionalities Assessment',
    reason: 'Question about Teacher of the Deaf services for hearing impairment'
  },
  'SP5403_Q096': {
    newSkillId: 'NEW-10-EthicalProblemSolving',
    newSkillName: 'Ethical Problem-Solving Model',
    reason: 'Question about mandated reporting of abuse - legal/ethical topic'
  },
  'SP5403_Q067': {
    newSkillId: 'NEW-1-ProblemSolvingFramework',
    newSkillName: 'Problem-Solving Framework',
    reason: 'Question about SLD identification and ruling out inadequate instruction'
  },
  'SP5403_Q073': {
    newSkillId: 'NEW-3-AccommodationsModifications',
    newSkillName: 'Accommodations & Modifications',
    reason: 'Question about test accommodations and data-based decisions'
  },
  'SP5403_Q054': {
    newSkillId: 'NEW-3-AccommodationsModifications',
    newSkillName: 'Accommodations & Modifications',
    reason: 'Question explicitly asks about accommodations vs modifications distinction'
  }
};

// ============================================================================
// BETTER DISTRACTOR TEMPLATES BY SKILL
// Use these to regenerate contextually appropriate distractors
// ============================================================================
const DISTRACTOR_TEMPLATES: Record<string, string[]> = {
  // Replacement Behavior Selection (MBH-S03)
  'MBH-S03': [
    'Teaching the student a behavior that serves a different function than the problem behavior',
    'Implementing punishment procedures without identifying the function',
    'Removing the student from the environment when the behavior occurs',
    'Ignoring all instances of the problem behavior without teaching alternatives',
    'Using a time-out procedure as the primary intervention',
    'Increasing supervision without teaching replacement skills',
    'Providing reinforcement on a fixed schedule regardless of behavior'
  ],
  
  // Accommodations & Modifications (NEW-3-AccommodationsModifications)
  'NEW-3-AccommodationsModifications': [
    'A modification (changes what the student learns)',
    'An accommodation (changes how the student accesses the curriculum)',
    'Specially designed instruction',
    'A related service under IDEA',
    'A supplementary aid or service',
    'An assistive technology device',
    'A curriculum adaptation'
  ],
  
  // Developmental-Level Interventions (NEW-4-DevelopmentalInterventions)
  'NEW-4-DevelopmentalInterventions': [
    'Concrete, play-based, visual strategies with shorter sessions',
    'Abstract, discussion-based approaches with longer sessions and peer-focused activities',
    'Direct instruction with immediate feedback',
    'Self-directed learning with minimal adult involvement',
    'Lecture-based psychoeducation',
    'Written journaling and reflection activities',
    'Parent-mediated intervention without student involvement'
  ],
  
  // Mental Health Impact (NEW-4-MentalHealthImpact)
  'NEW-4-MentalHealthImpact': [
    'Decreased motivation and difficulty concentrating',
    'Withdrawal from peers and reduced participation',
    'Physical symptoms such as headaches or stomachaches',
    'Difficulty with working memory and attention',
    'Increased irritability and emotional dysregulation',
    'Avoidance of school and increased absences',
    'Reduced self-efficacy and negative self-talk'
  ],
  
  // Family Collaboration (NEW-2-FamilyCollaboration)
  'NEW-2-FamilyCollaboration': [
    'Build trust by understanding family values and adapting communication styles',
    'Involve the family as partners and recognize their strengths',
    'Identify and address barriers to engagement',
    'Provide information in the family\'s preferred language',
    'Schedule meetings at times convenient for the family',
    'Focus solely on the student without involving family input',
    'Assume all families have the same needs and preferences'
  ],
  
  // Educational Policies (NEW-5-EducationalPolicies)
  'NEW-5-EducationalPolicies': [
    'Question the effectiveness of retention and consider evidence-based alternatives',
    'Consider the limitations of tracking and ensure equal access to opportunities',
    'Implement the policy as directed without questioning effectiveness',
    'Recommend the policy based on teacher preference alone',
    'Focus on administrative convenience rather than student outcomes',
    'Apply the policy uniformly without considering individual student needs'
  ],
  
  // Program Evaluation (NEW-9-ProgramEvaluation)
  'NEW-9-ProgramEvaluation': [
    'Collect outcome data, process data, stakeholder feedback, and compare to baseline',
    'Collect only outcome data without process measures',
    'Rely on stakeholder satisfaction surveys alone',
    'Compare to national norms without local baseline data',
    'Evaluate only at the end of the program without ongoing monitoring',
    'Focus on implementation fidelity without measuring outcomes'
  ],
  
  // Low-Incidence Exceptionalities (NEW-1-LowIncidenceExceptionalities)
  'NEW-1-LowIncidenceExceptionalities': [
    'Adapt assessment procedures and consider medical factors',
    'Involve specialists with expertise in the specific disability',
    'Use appropriate accommodations during testing',
    'Use standard procedures without modifications',
    'Rely solely on standardized norm-referenced tests',
    'Defer all assessment decisions to medical professionals',
    'Focus only on cognitive assessment without adaptive behavior measures'
  ],
  
  // Community Agencies (NEW-2-CommunityAgencies)
  'NEW-2-CommunityAgencies': [
    'Coordinate services by understanding agency roles and facilitating communication',
    'Facilitate interagency collaboration for transition planning',
    'Make referrals without following up on service delivery',
    'Work independently without coordinating with other providers',
    'Assume community agencies will coordinate without school involvement',
    'Limit communication to written reports only'
  ],
  
  // Parenting Interventions (NEW-7-ParentingInterventions)
  'NEW-7-ParentingInterventions': [
    'Teach parents behavior management strategies including positive reinforcement',
    'Establish clear rules and consistent consequences at home',
    'Create a home-school communication system',
    'Tell parents what to do without teaching specific strategies',
    'Focus only on school-based interventions without home involvement',
    'Recommend punitive approaches as the primary strategy'
  ]
};

// ============================================================================
// FIX FUNCTIONS
// ============================================================================

interface Question extends ScriptQuestion {}

interface FixResult {
  questionId: string;
  fixType: string;
  before: any;
  after: any;
  status: 'applied' | 'manual_review_needed';
}

function loadQuestions(filePath: string): Question[] {
  const data = fs.readFileSync(filePath, 'utf-8');
  const projectQuestions: ProjectQuestion[] = JSON.parse(data);
  // Convert from project format to script format
  return convertArrayToScriptFormat(projectQuestions);
}

function saveQuestions(questions: Question[], filePath: string): void {
  // Convert back to project format before saving
  const projectQuestions = convertArrayToProjectFormat(questions);
  fs.writeFileSync(filePath, JSON.stringify(projectQuestions, null, 2));
}

function applySkillReassignments(questions: Question[]): FixResult[] {
  const results: FixResult[] = [];
  
  for (const question of questions) {
    if (SKILL_REASSIGNMENTS[question.id]) {
      const reassignment = SKILL_REASSIGNMENTS[question.id];
      
      results.push({
        questionId: question.id,
        fixType: 'SKILL_REASSIGNMENT',
        before: { skillId: question.skillId, skillName: question.skillName },
        after: { skillId: reassignment.newSkillId, skillName: reassignment.newSkillName },
        status: 'applied'
      });
      
      question.skillId = reassignment.newSkillId;
      question.skillName = reassignment.newSkillName;
    }
  }
  
  return results;
}

function identifyDistractorsToFix(questions: Question[]): FixResult[] {
  const results: FixResult[] = [];
  
  const nonsensicalPatterns = [
    'Tarasoff',
    'IDEA',
    'Investigate the abuse allegations',
    'Provide less than the required supervision',
    'Decide on placement without examining',
    'Data collection all comes before',
    'Data collection every comes before',
    'The program resulted in improvement because scores',
    'The intervention caused the improvement because',
    'Allow full copying and release of test protocols',
    'Prescribe treatment without proper authorization',
    'Make a medical diagnosis',
    'Diagnose the student with a medical condition',
    'Breach confidentiality for general concerns',
    'Use progress monitoring tools for program evaluation',
    'Use curriculum-based measurement for comprehensive',
    'Use a diagnostic assessment for weekly monitoring',
    'Use an individual assessment for universal screening',
    'Use a screening tool to determine eligibility',
    'Provide direct instruction only',
    'Apply adult diagnostic criteria directly',
    'Apply the rule absolutely without considering',
    'Include students with severe conduct disorders',
    'A replacement behavior that serves a different function',
    'Intervention before assessment',
    'Schedule assessment for next week',
    'Assign homework to the student',
    'Make disciplinary decisions about the student',
    'Determine appropriate punishment',
    'Provide the best possible education',
    'Recommend services without analyzing',
    'Make a recommendation based on teacher observations alone',
    'Deny access to records without legal basis',
    'Disclose confidential information',
    'Low scores lead to special education placement',
    'Cognitive Behavioral Therapy'
  ];
  
  for (const question of questions) {
    // Only check generated questions (GEN-* prefix)
    if (!question.id.startsWith('GEN-')) continue;
    
    const problematicChoices: { letter: string; text: string; suggestedReplacements: string[] }[] = [];
    
    for (const choice of question.choices) {
      // Skip correct answer
      const isCorrect = choice.isCorrect || choice.letter === question.correctAnswer;
      if (isCorrect) continue;
      
      // Check if distractor matches nonsensical pattern
      const isNonsensical = nonsensicalPatterns.some(pattern => 
        choice.text.includes(pattern) || choice.text === pattern
      );
      
      // Check for single-word distractors
      const isSingleWord = choice.text.split(' ').length <= 2 && choice.text.length < 30;
      
      if (isNonsensical || isSingleWord) {
        const suggestedReplacements = DISTRACTOR_TEMPLATES[question.skillId] || [];
        const correctAnswerText = question.choices.find(c => 
          c.letter === question.correctAnswer || c.isCorrect
        )?.text || '';
        
        problematicChoices.push({
          letter: choice.letter,
          text: choice.text,
          suggestedReplacements: suggestedReplacements.filter(s => 
            // Don't suggest the correct answer as a replacement
            !s.toLowerCase().includes(correctAnswerText.toLowerCase().substring(0, 20))
          ).slice(0, 3)
        });
      }
    }
    
    if (problematicChoices.length > 0) {
      results.push({
        questionId: question.id,
        fixType: 'DISTRACTOR_REPLACEMENT',
        before: { problematicChoices },
        after: { suggestedAction: 'Replace with contextually appropriate distractors' },
        status: 'manual_review_needed'
      });
    }
  }
  
  return results;
}

function identifyTruncatedText(questions: Question[]): FixResult[] {
  const results: FixResult[] = [];
  
  for (const question of questions) {
    const truncatedItems: { field: string; text: string }[] = [];
    
    // Check question text
    if (question.question.endsWith('...') || question.question.includes('ab...')) {
      truncatedItems.push({ field: 'question', text: question.question });
    }
    
    // Check choices
    for (const choice of question.choices) {
      if (choice.text.endsWith('...') || 
          (choice.text.length < 5 && choice.text.trim() !== '') ||
          choice.text.includes('ab...')) {
        truncatedItems.push({ field: `choice_${choice.letter}`, text: choice.text });
      }
    }
    
    if (truncatedItems.length > 0) {
      results.push({
        questionId: question.id,
        fixType: 'TRUNCATED_TEXT',
        before: { truncatedItems },
        after: { suggestedAction: 'Complete the truncated text' },
        status: 'manual_review_needed'
      });
    }
  }
  
  return results;
}

function generateFixReport(results: FixResult[]): string {
  let report = '# Question Fix Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  const applied = results.filter(r => r.status === 'applied');
  const manual = results.filter(r => r.status === 'manual_review_needed');
  
  report += '## Summary\n\n';
  report += `| Status | Count |\n`;
  report += `|--------|-------|\n`;
  report += `| Fixes Applied | ${applied.length} |\n`;
  report += `| Manual Review Needed | ${manual.length} |\n`;
  report += `| **Total** | **${results.length}** |\n\n`;
  
  // Applied fixes
  if (applied.length > 0) {
    report += '## Fixes Applied\n\n';
    for (const result of applied) {
      report += `### ${result.questionId}\n`;
      report += `- **Type:** ${result.fixType}\n`;
      report += `- **Before:** ${JSON.stringify(result.before)}\n`;
      report += `- **After:** ${JSON.stringify(result.after)}\n\n`;
    }
  }
  
  // Manual review items
  if (manual.length > 0) {
    report += '## Items Requiring Manual Review\n\n';
    
    // Group by fix type
    const byType: Record<string, FixResult[]> = {};
    for (const result of manual) {
      if (!byType[result.fixType]) byType[result.fixType] = [];
      byType[result.fixType].push(result);
    }
    
    for (const [fixType, items] of Object.entries(byType)) {
      report += `### ${fixType} (${items.length} items)\n\n`;
      
      for (const result of items) {
        report += `#### ${result.questionId}\n`;
        report += '```json\n';
        report += JSON.stringify(result.before, null, 2);
        report += '\n```\n';
        
        if (result.before.problematicChoices) {
          for (const choice of result.before.problematicChoices) {
            report += `\n**Choice ${choice.letter}:** "${choice.text}"\n`;
            if (choice.suggestedReplacements?.length > 0) {
              report += `**Suggested replacements:**\n`;
              for (const suggestion of choice.suggestedReplacements) {
                report += `- ${suggestion}\n`;
              }
            }
          }
        }
        report += '\n---\n\n';
      }
    }
  }
  
  return report;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('Question Quality Fixer');
  console.log('======================\n');
  
  // Check if questions file exists
  if (!fs.existsSync(CONFIG.questionsPath)) {
    console.log(`Questions file not found at ${CONFIG.questionsPath}`);
    console.log('Please update CONFIG.questionsPath in the script');
    return;
  }
  
  // Load questions
  const questions = loadQuestions(CONFIG.questionsPath);
  console.log(`Loaded ${questions.length} questions\n`);
  
  // Create backup
  saveQuestions(questions, CONFIG.backupPath);
  console.log(`Backup created: ${CONFIG.backupPath}\n`);
  
  const allResults: FixResult[] = [];
  
  // 1. Apply skill reassignments
  console.log('Applying skill reassignments...');
  const reassignmentResults = applySkillReassignments(questions);
  allResults.push(...reassignmentResults);
  console.log(`  Applied ${reassignmentResults.length} reassignments\n`);
  
  // 2. Identify distractors to fix
  console.log('Identifying problematic distractors...');
  const distractorResults = identifyDistractorsToFix(questions);
  allResults.push(...distractorResults);
  console.log(`  Found ${distractorResults.length} questions with problematic distractors\n`);
  
  // 3. Identify truncated text
  console.log('Identifying truncated text...');
  const truncatedResults = identifyTruncatedText(questions);
  allResults.push(...truncatedResults);
  console.log(`  Found ${truncatedResults.length} questions with truncated text\n`);
  
  // Save fixed questions
  saveQuestions(questions, CONFIG.outputPath);
  console.log(`Fixed questions saved to: ${CONFIG.outputPath}\n`);
  
  // Generate and save report
  const report = generateFixReport(allResults);
  
  const reportDir = path.dirname(CONFIG.reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(CONFIG.reportPath, report);
  console.log(`Fix report saved to: ${CONFIG.reportPath}\n`);
  
  // Print summary
  console.log('='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  
  const applied = allResults.filter(r => r.status === 'applied').length;
  const manual = allResults.filter(r => r.status === 'manual_review_needed').length;
  
  console.log(`\n✅ Fixes Applied: ${applied}`);
  console.log(`📝 Manual Review Needed: ${manual}`);
  console.log(`\nTotal Issues Addressed: ${allResults.length}`);
  
  if (manual > 0) {
    console.log(`\n⚠️  Please review ${CONFIG.reportPath} for items requiring manual attention`);
  }
}

main().catch(console.error);
