import { SKILL_MAP, Skill } from '../brain/skill-map';
import { getAllBankQuestions, BankQuestion } from './diagnostic-utils';
import questionSkillMap from '../data/question-skill-map.json';

// Create a map of questionId -> skillId
const questionToSkillMap = new Map<string, string>();
for (const entry of questionSkillMap.mappedQuestions) {
  questionToSkillMap.set(entry.questionId, entry.skillId);
}

// Helper to get domain for a skill
function getDomainForSkill(skillId: string): number | null {
  for (const [domainIdStr, domain] of Object.entries(SKILL_MAP)) {
    for (const cluster of domain.clusters) {
      if (cluster.skills.some(s => s.skillId === skillId)) {
        return parseInt(domainIdStr);
      }
    }
  }
  return null;
}

// Helper to get skill name
function getSkillName(skillId: string): string {
  for (const domain of Object.values(SKILL_MAP)) {
    for (const cluster of domain.clusters) {
      const skill = cluster.skills.find(s => s.skillId === skillId);
      if (skill) return skill.name;
    }
  }
  return skillId;
}

export function showQuestionCounts() {
  const bankQuestions = getAllBankQuestions();
  
  // Count by domain
  const domainCounts = new Map<number, number>();
  const domainNames = new Map<number, string>();
  
  // Count by skill
  const skillCounts = new Map<string, number>();
  
  // Initialize domain counts
  for (const [domainIdStr, domain] of Object.entries(SKILL_MAP)) {
    const domainId = parseInt(domainIdStr);
    domainCounts.set(domainId, 0);
    domainNames.set(domainId, domain.name);
  }
  
  // Initialize skill counts for ALL skills to 0
  for (const domain of Object.values(SKILL_MAP)) {
    for (const cluster of domain.clusters) {
      for (const skill of cluster.skills) {
        skillCounts.set(skill.skillId, 0);
      }
    }
  }
  
  // Count questions
  for (const question of bankQuestions) {
    const skillId = questionToSkillMap.get(question.id);
    if (skillId) {
      // Count by skill
      skillCounts.set(skillId, (skillCounts.get(skillId) ?? 0) + 1);
      
      // Count by domain
      const domainId = getDomainForSkill(skillId);
      if (domainId !== null) {
        domainCounts.set(domainId, (domainCounts.get(domainId) ?? 0) + 1);
      }
    }
  }
  
  // Display results
  console.log('QUESTION COUNTS BY DOMAIN');
  console.log('=========================');
  console.log('');
  
  const sortedDomains = Array.from(domainCounts.entries())
    .sort((a, b) => a[0] - b[0]);
  
  let totalQuestions = 0;
  for (const [domainId, count] of sortedDomains) {
    const domainName = domainNames.get(domainId) || `Domain ${domainId}`;
    console.log(`Domain ${domainId}: ${count.toString().padStart(3)} questions - ${domainName}`);
    totalQuestions += count;
  }
  
  console.log('');
  console.log(`Total: ${totalQuestions} questions`);
  console.log('');
  console.log('QUESTION COUNTS BY SKILL');
  console.log('========================');
  console.log('');
  
  // Group skills by domain for display
  const skillsByDomain = new Map<number, Array<[string, number]>>();
  
  for (const [skillId, count] of skillCounts.entries()) {
    const domainId = getDomainForSkill(skillId);
    if (domainId !== null) {
      if (!skillsByDomain.has(domainId)) {
        skillsByDomain.set(domainId, []);
      }
      skillsByDomain.get(domainId)!.push([skillId, count]);
    }
  }
  
  // Display skills grouped by domain
  for (const [domainId, domain] of Object.entries(SKILL_MAP)) {
    const domainNum = parseInt(domainId);
    const skills = skillsByDomain.get(domainNum) || [];
    
    if (true) { // Show all domains
      console.log(`\nDomain ${domainNum}: ${domain.name}`);
      console.log('-'.repeat(60));
      
      const domainSkills = domain.clusters.flatMap(c => c.skills);
      const skillData = domainSkills.map(s => [s.skillId, skillCounts.get(s.skillId) ?? 0] as [string, number]);

      // Sort by count descending, then by skillId
      skillData.sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      });
      
      for (const [skillId, count] of skillData) {
        const skillName = getSkillName(skillId);
        console.log(`  ${skillId.padEnd(25)} ${count.toString().padStart(3)} questions - ${skillName}`);
      }
    }
  }
  
  // Summary statistics
  console.log('');
  console.log('SUMMARY STATISTICS');
  console.log('==================');
  console.log(`Total questions: ${totalQuestions}`);
  console.log(`Questions with skill mapping: ${skillCounts.size > 0 ? Array.from(skillCounts.values()).reduce((a, b) => a + b, 0) : 0}`);
  console.log(`Skills with questions: ${skillCounts.size}`);
  console.log(`Domains with questions: ${Array.from(domainCounts.values()).filter(c => c > 0).length}`);
  
  // Find skills with most questions
  const topSkills = Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log('');
  console.log('TOP 10 SKILLS BY QUESTION COUNT:');
  for (const [skillId, count] of topSkills) {
    const skillName = getSkillName(skillId);
    console.log(`  ${count.toString().padStart(3)} - ${skillId}: ${skillName}`);
  }
  
  return {
    domainCounts: Object.fromEntries(domainCounts),
    skillCounts: Object.fromEntries(skillCounts),
    totalQuestions
  };
}

if (import.meta.main) {
  showQuestionCounts();
}
