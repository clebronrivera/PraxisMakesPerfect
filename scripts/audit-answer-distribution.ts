// Answer Distribution Audit
// Checks A/B/C/D distribution to avoid obvious patterns

import QUESTIONS_DATA from '../src/data/questions.json';
import { analyzeQuestion } from '../src/brain/question-analyzer';
import { NASP_DOMAINS } from '../knowledge-base';

interface Question {
  id: string;
  correct_answer: string[];
  domains?: number[];
}

interface DistributionStats {
  total: number;
  byLetter: Record<string, number>;
  percentages: Record<string, number>;
}

function auditAnswerDistribution() {
  const questions = QUESTIONS_DATA as Question[];
  const analyzed = questions.map(analyzeQuestion);
  
  // Overall distribution
  const overall: DistributionStats = {
    total: 0,
    byLetter: { A: 0, B: 0, C: 0, D: 0 },
    percentages: { A: 0, B: 0, C: 0, D: 0 }
  };
  
  // Domain-level distribution
  const domainDistributions: Record<number, DistributionStats> = {};
  for (let domain = 1; domain <= 10; domain++) {
    domainDistributions[domain] = {
      total: 0,
      byLetter: { A: 0, B: 0, C: 0, D: 0 },
      percentages: { A: 0, B: 0, C: 0, D: 0 }
    };
  }
  
  // Count answers
  questions.forEach((q, index) => {
    const analyzedQ = analyzed[index];
    
    // Count first correct answer (for single-answer questions)
    if (q.correct_answer && q.correct_answer.length > 0) {
      const firstAnswer = q.correct_answer[0];
      if (['A', 'B', 'C', 'D'].includes(firstAnswer)) {
        overall.total++;
        overall.byLetter[firstAnswer]++;
        
        // Count by domain
        if (analyzedQ.domains && analyzedQ.domains.length > 0) {
          analyzedQ.domains.forEach(domain => {
            if (domain >= 1 && domain <= 10) {
              domainDistributions[domain].total++;
              domainDistributions[domain].byLetter[firstAnswer]++;
            }
          });
        }
      }
    }
  });
  
  // Calculate percentages
  ['A', 'B', 'C', 'D'].forEach(letter => {
    overall.percentages[letter] = overall.total > 0 
      ? (overall.byLetter[letter] / overall.total) * 100 
      : 0;
    
    for (let domain = 1; domain <= 10; domain++) {
      const dist = domainDistributions[domain];
      dist.percentages[letter] = dist.total > 0
        ? (dist.byLetter[letter] / dist.total) * 100
        : 0;
    }
  });
  
  return { overall, domainDistributions };
}

function printDistributionReport(result: ReturnType<typeof auditAnswerDistribution>) {
  console.log('\n' + '='.repeat(80));
  console.log('ANSWER DISTRIBUTION AUDIT REPORT');
  console.log('='.repeat(80) + '\n');
  
  console.log('📊 OVERALL DISTRIBUTION');
  console.log('-'.repeat(80));
  console.log(`Total Questions: ${result.overall.total}`);
  console.log('');
  ['A', 'B', 'C', 'D'].forEach(letter => {
    const count = result.overall.byLetter[letter];
    const pct = result.overall.percentages[letter];
    const bar = '█'.repeat(Math.round(pct / 2));
    console.log(`  ${letter}: ${count.toString().padStart(4)} (${pct.toFixed(1).padStart(5)}%) ${bar}`);
  });
  console.log('');
  
  // Check for imbalance (more than 35% or less than 15% is concerning)
  const imbalanced = ['A', 'B', 'C', 'D'].filter(letter => {
    const pct = result.overall.percentages[letter];
    return pct > 35 || pct < 15;
  });
  
  if (imbalanced.length > 0) {
    console.log('⚠️  IMBALANCE DETECTED');
    console.log('-'.repeat(80));
    imbalanced.forEach(letter => {
      const pct = result.overall.percentages[letter];
      console.log(`  ${letter}: ${pct.toFixed(1)}% is ${pct > 35 ? 'too high' : 'too low'} (target: 20-30%)`);
    });
    console.log('\n💡 Recommendation: Consider shuffling answer positions to balance distribution.');
    console.log('');
  } else {
    console.log('✅ Distribution is balanced (all answers within 15-35% range)');
    console.log('');
  }
  
  console.log('📈 DOMAIN-LEVEL DISTRIBUTION');
  console.log('-'.repeat(80));
  for (let domain = 1; domain <= 10; domain++) {
    const dist = result.domainDistributions[domain];
    const domainInfo = NASP_DOMAINS[domain as keyof typeof NASP_DOMAINS];
    const name = domainInfo?.shortName || `Domain ${domain}`;
    
    if (dist.total > 0) {
      console.log(`\n${domain}. ${name} (${dist.total} questions):`);
      ['A', 'B', 'C', 'D'].forEach(letter => {
        const count = dist.byLetter[letter];
        const pct = dist.percentages[letter];
        console.log(`   ${letter}: ${count.toString().padStart(3)} (${pct.toFixed(1).padStart(5)}%)`);
      });
    }
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

// Run audit
const result = auditAnswerDistribution();
printDistributionReport(result);

process.exit(0);
