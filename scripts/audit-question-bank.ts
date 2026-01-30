// Question Bank Integrity Audit
// Validates question bank structure and reports statistics

import QUESTIONS_DATA from '../src/data/questions.json';
import { analyzeQuestion } from '../src/brain/question-analyzer';
import { NASP_DOMAINS } from '../knowledge-base';

interface Question {
  id: string;
  question: string;
  choices: Record<string, string>;
  correct_answer: string[];
  rationale: string;
  skillId?: string;
  domainId?: number;
  domains?: number[];
}

interface AuditResult {
  totalQuestions: number;
  uniqueSkills: number;
  questionsPerDomain: Record<number, number>;
  lowestSkillCoverage: number;
  missingFields: {
    missingId: string[];
    missingQuestion: string[];
    missingChoices: string[];
    missingCorrectAnswer: string[];
    missingRationale: string[];
    missingSkillId: string[];
  };
  duplicateIds: string[];
  invalidDomainIds: string[];
  invalidSkillIds: string[];
}

function auditQuestionBank(): AuditResult {
  const questions = QUESTIONS_DATA as Question[];
  const analyzed = questions.map(analyzeQuestion);
  
  const result: AuditResult = {
    totalQuestions: questions.length,
    uniqueSkills: 0,
    questionsPerDomain: {},
    lowestSkillCoverage: Infinity,
    missingFields: {
      missingId: [],
      missingQuestion: [],
      missingChoices: [],
      missingCorrectAnswer: [],
      missingRationale: [],
      missingSkillId: []
    },
    duplicateIds: [],
    invalidDomainIds: [],
    invalidSkillIds: []
  };
  
  // Initialize domain counts
  for (let domain = 1; domain <= 10; domain++) {
    result.questionsPerDomain[domain] = 0;
  }
  
  // Track IDs and skills
  const seenIds = new Set<string>();
  const skillSet = new Set<string>();
  const skillCounts = new Map<string, number>();
  
  // Validate each question
  questions.forEach((q, index) => {
    // Check required fields
    if (!q.id) result.missingFields.missingId.push(`Question ${index + 1}`);
    if (!q.question || q.question.trim() === '') result.missingFields.missingQuestion.push(q.id || `Question ${index + 1}`);
    
    // Check choices (A-D)
    const choices = q.choices || {};
    const hasChoices = ['A', 'B', 'C', 'D'].some(letter => choices[letter] && choices[letter].trim() !== '');
    if (!hasChoices) result.missingFields.missingChoices.push(q.id || `Question ${index + 1}`);
    
    if (!q.correct_answer || q.correct_answer.length === 0) {
      result.missingFields.missingCorrectAnswer.push(q.id || `Question ${index + 1}`);
    }
    
    if (!q.rationale || q.rationale.trim() === '') {
      result.missingFields.missingRationale.push(q.id || `Question ${index + 1}`);
    }
    
    // Check for duplicates
    if (q.id) {
      if (seenIds.has(q.id)) {
        result.duplicateIds.push(q.id);
      } else {
        seenIds.add(q.id);
      }
    }
    
    // Track skills
    const analyzedQ = analyzed[index];
    if (analyzedQ.skillId) {
      skillSet.add(analyzedQ.skillId);
      skillCounts.set(analyzedQ.skillId, (skillCounts.get(analyzedQ.skillId) || 0) + 1);
    } else {
      result.missingFields.missingSkillId.push(q.id || `Question ${index + 1}`);
    }
    
    // Count domains
    if (analyzedQ.domains && analyzedQ.domains.length > 0) {
      analyzedQ.domains.forEach(domain => {
        if (domain >= 1 && domain <= 10) {
          result.questionsPerDomain[domain] = (result.questionsPerDomain[domain] || 0) + 1;
        } else {
          result.invalidDomainIds.push(`${q.id}: domain ${domain}`);
        }
      });
    }
  });
  
  // Calculate unique skills count
  result.uniqueSkills = skillSet.size;
  
  // Find lowest skill coverage
  if (skillCounts.size > 0) {
    result.lowestSkillCoverage = Math.min(...Array.from(skillCounts.values()));
  }
  
  return result;
}

function printAuditReport(result: AuditResult) {
  console.log('\n' + '='.repeat(80));
  console.log('QUESTION BANK INTEGRITY AUDIT REPORT');
  console.log('='.repeat(80) + '\n');
  
  console.log('📊 SUMMARY STATISTICS');
  console.log('-'.repeat(80));
  console.log(`Total Questions: ${result.totalQuestions}`);
  console.log(`Unique Skills: ${result.uniqueSkills}`);
  console.log(`Lowest Skill Coverage: ${result.lowestSkillCoverage === Infinity ? 'N/A' : result.lowestSkillCoverage} questions`);
  console.log('');
  
  console.log('📈 QUESTIONS PER DOMAIN');
  console.log('-'.repeat(80));
  Object.entries(result.questionsPerDomain)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([domain, count]) => {
      const domainInfo = NASP_DOMAINS[parseInt(domain) as keyof typeof NASP_DOMAINS];
      const name = domainInfo?.shortName || `Domain ${domain}`;
      console.log(`  ${domain.padStart(2)}. ${name.padEnd(20)} ${count.toString().padStart(4)} questions`);
    });
  console.log('');
  
  // Validation results
  const hasIssues = 
    result.duplicateIds.length > 0 ||
    result.invalidDomainIds.length > 0 ||
    result.invalidSkillIds.length > 0 ||
    Object.values(result.missingFields).some(arr => arr.length > 0);
  
  if (hasIssues) {
    console.log('⚠️  VALIDATION ISSUES');
    console.log('-'.repeat(80));
    
    if (result.duplicateIds.length > 0) {
      console.log(`\n❌ Duplicate Question IDs (${result.duplicateIds.length}):`);
      result.duplicateIds.slice(0, 10).forEach(id => console.log(`   - ${id}`));
      if (result.duplicateIds.length > 10) {
        console.log(`   ... and ${result.duplicateIds.length - 10} more`);
      }
    }
    
    if (result.missingFields.missingId.length > 0) {
      console.log(`\n❌ Missing IDs (${result.missingFields.missingId.length}):`);
      result.missingFields.missingId.slice(0, 10).forEach(ref => console.log(`   - ${ref}`));
    }
    
    if (result.missingFields.missingQuestion.length > 0) {
      console.log(`\n❌ Missing Question Text (${result.missingFields.missingQuestion.length}):`);
      result.missingFields.missingQuestion.slice(0, 10).forEach(id => console.log(`   - ${id}`));
    }
    
    if (result.missingFields.missingChoices.length > 0) {
      console.log(`\n❌ Missing Choices (${result.missingFields.missingChoices.length}):`);
      result.missingFields.missingChoices.slice(0, 10).forEach(id => console.log(`   - ${id}`));
    }
    
    if (result.missingFields.missingCorrectAnswer.length > 0) {
      console.log(`\n❌ Missing Correct Answer (${result.missingFields.missingCorrectAnswer.length}):`);
      result.missingFields.missingCorrectAnswer.slice(0, 10).forEach(id => console.log(`   - ${id}`));
    }
    
    if (result.missingFields.missingRationale.length > 0) {
      console.log(`\n❌ Missing Rationale (${result.missingFields.missingRationale.length}):`);
      result.missingFields.missingRationale.slice(0, 10).forEach(id => console.log(`   - ${id}`));
    }
    
    if (result.missingFields.missingSkillId.length > 0) {
      console.log(`\n⚠️  Missing Skill ID (${result.missingFields.missingSkillId.length}):`);
      result.missingFields.missingSkillId.slice(0, 10).forEach(id => console.log(`   - ${id}`));
    }
    
    if (result.invalidDomainIds.length > 0) {
      console.log(`\n❌ Invalid Domain IDs (${result.invalidDomainIds.length}):`);
      result.invalidDomainIds.slice(0, 10).forEach(msg => console.log(`   - ${msg}`));
    }
    
    console.log('');
  } else {
    console.log('✅ VALIDATION PASSED');
    console.log('-'.repeat(80));
    console.log('All questions have required fields and valid IDs.');
    console.log('');
  }
  
  console.log('='.repeat(80) + '\n');
}

// Run audit
const result = auditQuestionBank();
printAuditReport(result);

// Exit with error code if issues found
const hasErrors = 
  result.duplicateIds.length > 0 ||
  result.missingFields.missingId.length > 0 ||
  result.missingFields.missingQuestion.length > 0 ||
  result.missingFields.missingChoices.length > 0 ||
  result.missingFields.missingCorrectAnswer.length > 0 ||
  result.missingFields.missingRationale.length > 0 ||
  result.invalidDomainIds.length > 0;

process.exit(hasErrors ? 1 : 0);
