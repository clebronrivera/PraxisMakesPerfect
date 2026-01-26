/**
 * scripts/analyze-distribution.cjs
 * Analyzes question distribution across NASP domains and skills
 * Generates a comprehensive coverage report
 */

const fs = require('fs');
const path = require('path');

const QUESTIONS_PATH = path.join(__dirname, '../src/data/questions.json');
const OUTPUT_DIR = path.join(__dirname, '../quality-reports');

// NASP Domain definitions
const DOMAINS = {
  1: { name: "Data-Based Decision Making", shortName: "DBDM", prefixes: ["DBDM-", "NEW-1-"] },
  2: { name: "Consultation & Collaboration", shortName: "C&C", prefixes: ["CC-", "NEW-2-"] },
  3: { name: "Academic Interventions", shortName: "Academic", prefixes: ["ACAD-", "NEW-3-"] },
  4: { name: "Mental & Behavioral Health", shortName: "MBH", prefixes: ["MBH-", "NEW-4-"] },
  5: { name: "School-Wide Practices", shortName: "SWP", prefixes: ["SWP-", "NEW-5-"] },
  6: { name: "Prevention & Crisis", shortName: "Prevention", prefixes: ["RES-", "NEW-6-"] },
  7: { name: "Family-School Collaboration", shortName: "Family", prefixes: ["FSC-", "NEW-7-"] },
  8: { name: "Diversity in Development", shortName: "Diversity", prefixes: ["DIV-", "NEW-8-"] },
  9: { name: "Research & Program Evaluation", shortName: "Research", prefixes: ["NEW-9-"] },
  10: { name: "Legal, Ethical & Professional", shortName: "Legal/Ethics", prefixes: ["LEG-", "PC-", "NEW-10-"] }
};

function getDomainForSkill(skillId) {
  for (const [domainId, domain] of Object.entries(DOMAINS)) {
    if (domain.prefixes.some(prefix => skillId.startsWith(prefix))) {
      return parseInt(domainId);
    }
  }
  return null;
}

function analyzeDistribution() {
  console.log('📊 Question Distribution Analysis\n');
  console.log('='.repeat(60) + '\n');

  const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
  console.log(`Total Questions: ${questions.length}\n`);

  // Initialize counters
  const byDomain = {};
  const bySkill = {};
  const bySource = { ETS: [], Generated: [] };
  
  for (let i = 1; i <= 10; i++) {
    byDomain[i] = { questions: [], skills: new Set() };
  }

  // Categorize each question
  for (const q of questions) {
    const skillId = q.skillId;
    const domainId = getDomainForSkill(skillId);
    const source = q.id.startsWith('GEN-') ? 'Generated' : 'ETS';

    // By source
    bySource[source].push(q.id);

    // By skill
    if (!bySkill[skillId]) {
      bySkill[skillId] = { questions: [], domain: domainId };
    }
    bySkill[skillId].questions.push(q.id);

    // By domain
    if (domainId && byDomain[domainId]) {
      byDomain[domainId].questions.push(q.id);
      byDomain[domainId].skills.add(skillId);
    }
  }

  // === DOMAIN SUMMARY ===
  console.log('=== DOMAIN DISTRIBUTION ===\n');
  console.log('Domain | Name                              | Questions | Skills | Avg Q/Skill');
  console.log('-'.repeat(80));

  const domainRows = [];
  for (let i = 1; i <= 10; i++) {
    const d = byDomain[i];
    const domain = DOMAINS[i];
    const qCount = d.questions.length;
    const sCount = d.skills.size;
    const avg = sCount > 0 ? (qCount / sCount).toFixed(1) : '0.0';
    
    console.log(`   ${i}   | ${domain.name.padEnd(33)} | ${String(qCount).padStart(9)} | ${String(sCount).padStart(6)} | ${avg.padStart(10)}`);
    
    domainRows.push({
      domainId: i,
      name: domain.name,
      shortName: domain.shortName,
      questionCount: qCount,
      skillCount: sCount,
      avgPerSkill: parseFloat(avg),
      percentage: ((qCount / questions.length) * 100).toFixed(1)
    });
  }

  console.log('-'.repeat(80));
  console.log(`Total  |                                   | ${String(questions.length).padStart(9)} | ${String(Object.keys(bySkill).length).padStart(6)} |`);

  // === SOURCE BREAKDOWN ===
  console.log('\n=== SOURCE BREAKDOWN ===\n');
  console.log(`ETS Questions:       ${bySource.ETS.length} (${((bySource.ETS.length / questions.length) * 100).toFixed(1)}%)`);
  console.log(`Generated Questions: ${bySource.Generated.length} (${((bySource.Generated.length / questions.length) * 100).toFixed(1)}%)`);

  // === SKILL DETAIL ===
  console.log('\n=== SKILLS BY QUESTION COUNT ===\n');
  
  const skillList = Object.entries(bySkill)
    .map(([skillId, data]) => ({
      skillId,
      count: data.questions.length,
      domain: data.domain
    }))
    .sort((a, b) => b.count - a.count);

  // Top skills
  console.log('Top 15 Skills (most questions):');
  for (const s of skillList.slice(0, 15)) {
    const domainName = s.domain ? DOMAINS[s.domain].shortName : 'Unknown';
    console.log(`  ${s.skillId.padEnd(35)} ${String(s.count).padStart(3)} questions  [${domainName}]`);
  }

  // Skills with only 1 question
  const singleQuestionSkills = skillList.filter(s => s.count === 1);
  console.log(`\nSkills with only 1 question: ${singleQuestionSkills.length}`);
  
  // Skills with 0 questions (gap analysis would need skill map)
  
  // === COVERAGE GAPS ===
  console.log('\n=== COVERAGE ANALYSIS ===\n');
  
  const underservedDomains = domainRows.filter(d => d.questionCount < 20);
  if (underservedDomains.length > 0) {
    console.log('Domains with < 20 questions (may need more content):');
    for (const d of underservedDomains) {
      console.log(`  Domain ${d.domainId}: ${d.name} (${d.questionCount} questions)`);
    }
  } else {
    console.log('All domains have 20+ questions ✓');
  }

  const underservedSkills = skillList.filter(s => s.count < 2);
  console.log(`\nSkills with < 2 questions: ${underservedSkills.length}`);
  if (underservedSkills.length > 0 && underservedSkills.length <= 20) {
    for (const s of underservedSkills) {
      console.log(`  ${s.skillId} (${s.count})`);
    }
  }

  // === GENERATE OUTPUT FILES ===
  console.log('\n=== GENERATING REPORTS ===\n');

  // Domain summary CSV
  const domainCsv = ['domain_id,name,short_name,question_count,skill_count,avg_per_skill,percentage'];
  for (const d of domainRows) {
    domainCsv.push(`${d.domainId},"${d.name}",${d.shortName},${d.questionCount},${d.skillCount},${d.avgPerSkill},${d.percentage}`);
  }
  const domainFile = path.join(OUTPUT_DIR, 'domain-distribution.csv');
  fs.writeFileSync(domainFile, domainCsv.join('\n'));
  console.log(`✅ ${domainFile}`);

  // Skill detail CSV
  const skillCsv = ['skill_id,domain_id,domain_name,question_count'];
  for (const s of skillList) {
    const domainName = s.domain ? DOMAINS[s.domain].name : 'Unknown';
    skillCsv.push(`${s.skillId},${s.domain || ''},"${domainName}",${s.count}`);
  }
  const skillFile = path.join(OUTPUT_DIR, 'skill-distribution.csv');
  fs.writeFileSync(skillFile, skillCsv.join('\n'));
  console.log(`✅ ${skillFile}`);

  // Full JSON report
  const fullReport = {
    generated: new Date().toISOString(),
    summary: {
      totalQuestions: questions.length,
      totalSkills: Object.keys(bySkill).length,
      etsQuestions: bySource.ETS.length,
      generatedQuestions: bySource.Generated.length
    },
    domains: domainRows,
    skills: skillList,
    gaps: {
      underservedDomains: underservedDomains.map(d => d.domainId),
      singleQuestionSkills: singleQuestionSkills.map(s => s.skillId)
    }
  };
  const jsonFile = path.join(OUTPUT_DIR, 'distribution-report.json');
  fs.writeFileSync(jsonFile, JSON.stringify(fullReport, null, 2));
  console.log(`✅ ${jsonFile}`);

  // Markdown summary
  let md = `# Question Distribution Report\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n`;
  md += `- **Total Questions:** ${questions.length}\n`;
  md += `- **Total Skills:** ${Object.keys(bySkill).length}\n`;
  md += `- **ETS Questions:** ${bySource.ETS.length} (${((bySource.ETS.length / questions.length) * 100).toFixed(1)}%)\n`;
  md += `- **Generated Questions:** ${bySource.Generated.length} (${((bySource.Generated.length / questions.length) * 100).toFixed(1)}%)\n\n`;
  
  md += `## Domain Distribution\n\n`;
  md += `| Domain | Name | Questions | Skills | % of Bank |\n`;
  md += `|--------|------|-----------|--------|----------|\n`;
  for (const d of domainRows) {
    md += `| ${d.domainId} | ${d.name} | ${d.questionCount} | ${d.skillCount} | ${d.percentage}% |\n`;
  }
  
  md += `\n## Top Skills by Question Count\n\n`;
  md += `| Skill | Domain | Questions |\n`;
  md += `|-------|--------|----------|\n`;
  for (const s of skillList.slice(0, 20)) {
    const domainName = s.domain ? DOMAINS[s.domain].shortName : 'Unknown';
    md += `| ${s.skillId} | ${domainName} | ${s.count} |\n`;
  }

  if (singleQuestionSkills.length > 0) {
    md += `\n## Skills Needing More Questions (only 1 question)\n\n`;
    for (const s of singleQuestionSkills) {
      md += `- ${s.skillId}\n`;
    }
  }

  const mdFile = path.join(OUTPUT_DIR, 'DISTRIBUTION_REPORT.md');
  fs.writeFileSync(mdFile, md);
  console.log(`✅ ${mdFile}`);

  console.log('\n✅ Distribution analysis complete!\n');
}

analyzeDistribution();
