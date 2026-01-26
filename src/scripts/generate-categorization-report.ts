import { SKILL_MAP, Domain, SkillCluster, Skill } from '../brain/skill-map';
import questionSkillMap from '../data/question-skill-map.json';

// Create a map of questionId -> skillId
const questionToSkillMap = new Map<string, string>();
for (const entry of questionSkillMap.mappedQuestions) {
  questionToSkillMap.set(entry.questionId, entry.skillId);
}

// Count questions by skill
const skillCounts = new Map<string, number>();
for (const entry of questionSkillMap.mappedQuestions) {
  const currentCount = skillCounts.get(entry.skillId) || 0;
  skillCounts.set(entry.skillId, currentCount + 1);
}

// Helper to get all question IDs for a skill
function getQuestionIdsForSkill(skillId: string): string[] {
  const questionIds: string[] = [];
  for (const entry of questionSkillMap.mappedQuestions) {
    if (entry.skillId === skillId) {
      questionIds.push(entry.questionId);
    }
  }
  return questionIds.sort();
}

function generateReport(): string {
  let report = '# Question Categorization Report\n\n';
  report += `Generated: ${new Date().toLocaleString()}\n\n`;
  report += `Total Questions Mapped: ${questionSkillMap.totalQuestions}\n\n`;
  report += '---\n\n';

  // Count totals
  let totalQuestions = 0;
  const domainCounts = new Map<number, number>();
  const clusterCounts = new Map<string, number>();

  // Initialize counts
  for (const [domainIdStr, domain] of Object.entries(SKILL_MAP)) {
    const domainId = parseInt(domainIdStr);
    domainCounts.set(domainId, 0);
    
    for (const cluster of domain.clusters) {
      clusterCounts.set(cluster.clusterId, 0);
      
      for (const skill of cluster.skills) {
        const count = skillCounts.get(skill.skillId) || 0;
        totalQuestions += count;
        domainCounts.set(domainId, (domainCounts.get(domainId) || 0) + count);
        clusterCounts.set(cluster.clusterId, (clusterCounts.get(cluster.clusterId) || 0) + count);
      }
    }
  }

  // Generate report by domain
  for (const [domainIdStr, domain] of Object.entries(SKILL_MAP)) {
    const domainId = parseInt(domainIdStr);
    const domainQuestionCount = domainCounts.get(domainId) || 0;
    
    report += `## Domain ${domainId}: ${domain.name} (${domain.shortName})\n\n`;
    report += `**Total Questions:** ${domainQuestionCount}\n\n`;
    
    // Report by cluster
    for (const cluster of domain.clusters) {
      const clusterQuestionCount = clusterCounts.get(cluster.clusterId) || 0;
      
      report += `### ${cluster.clusterId}: ${cluster.name}\n\n`;
      report += `**Description:** ${cluster.description}\n\n`;
      report += `**Total Questions:** ${clusterQuestionCount}\n\n`;
      
      // Report by skill
      report += '#### Skills:\n\n';
      
      for (const skill of cluster.skills) {
        const skillQuestionCount = skillCounts.get(skill.skillId) || 0;
        const questionIds = getQuestionIdsForSkill(skill.skillId);
        
        report += `- **${skill.skillId}**: ${skill.name}\n`;
        report += `  - Description: ${skill.description}\n`;
        report += `  - Questions: ${skillQuestionCount}\n`;
        
        if (questionIds.length > 0) {
          report += `  - Question IDs: ${questionIds.join(', ')}\n`;
        }
        
        report += `  - DOK Range: ${skill.dokRange[0]}-${skill.dokRange[1]}\n`;
        report += '\n';
      }
      
      report += '\n';
    }
    
    report += '---\n\n';
  }

  // Summary statistics
  report += '## Summary Statistics\n\n';
  report += `- **Total Questions Mapped:** ${totalQuestions}\n`;
  report += `- **Total Domains:** ${Object.keys(SKILL_MAP).length}\n`;
  
  const totalClusters = Object.values(SKILL_MAP).reduce((sum, domain) => sum + domain.clusters.length, 0);
  report += `- **Total Clusters:** ${totalClusters}\n`;
  
  const totalSkills = Object.values(SKILL_MAP).reduce(
    (sum, domain) => sum + domain.clusters.reduce((clusterSum, cluster) => clusterSum + cluster.skills.length, 0),
    0
  );
  report += `- **Total Skills:** ${totalSkills}\n`;
  
  const skillsWithQuestions = Array.from(skillCounts.values()).filter(count => count > 0).length;
  report += `- **Skills with Questions:** ${skillsWithQuestions}\n`;
  report += `- **Skills without Questions:** ${totalSkills - skillsWithQuestions}\n\n`;

  // Domain summary table
  report += '## Domain Summary\n\n';
  report += '| Domain | Name | Questions | Clusters | Skills |\n';
  report += '|--------|------|-----------|----------|--------|\n';
  
  for (const [domainIdStr, domain] of Object.entries(SKILL_MAP)) {
    const domainId = parseInt(domainIdStr);
    const domainQuestionCount = domainCounts.get(domainId) || 0;
    const clusterCount = domain.clusters.length;
    const skillCount = domain.clusters.reduce((sum, cluster) => sum + cluster.skills.length, 0);
    
    report += `| ${domainId} | ${domain.shortName} | ${domainQuestionCount} | ${clusterCount} | ${skillCount} |\n`;
  }
  
  report += '\n';

  // Top skills by question count
  report += '## Top Skills by Question Count\n\n';
  const topSkills = Array.from(skillCounts.entries())
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  
  report += '| Rank | Skill ID | Skill Name | Questions |\n';
  report += '|------|----------|------------|----------|\n';
  
  topSkills.forEach(([skillId, count], index) => {
    // Find skill name
    let skillName = skillId;
    for (const domain of Object.values(SKILL_MAP)) {
      for (const cluster of domain.clusters) {
        const skill = cluster.skills.find(s => s.skillId === skillId);
        if (skill) {
          skillName = skill.name;
          break;
        }
      }
    }
    
    report += `| ${index + 1} | ${skillId} | ${skillName} | ${count} |\n`;
  });
  
  report += '\n';

  // Skills without questions
  report += '## Skills Without Questions\n\n';
  const skillsWithoutQuestions: Array<{skillId: string, skillName: string, domain: number, cluster: string}> = [];
  
  for (const [domainIdStr, domain] of Object.entries(SKILL_MAP)) {
    const domainId = parseInt(domainIdStr);
    for (const cluster of domain.clusters) {
      for (const skill of cluster.skills) {
        const count = skillCounts.get(skill.skillId) || 0;
        if (count === 0) {
          skillsWithoutQuestions.push({
            skillId: skill.skillId,
            skillName: skill.name,
            domain: domainId,
            cluster: cluster.clusterId
          });
        }
      }
    }
  }
  
  if (skillsWithoutQuestions.length > 0) {
    report += `**Total:** ${skillsWithoutQuestions.length} skills\n\n`;
    report += '| Domain | Cluster | Skill ID | Skill Name |\n';
    report += '|--------|---------|----------|------------|\n';
    
    for (const skill of skillsWithoutQuestions) {
      report += `| ${skill.domain} | ${skill.cluster} | ${skill.skillId} | ${skill.skillName} |\n`;
    }
  } else {
    report += 'All skills have at least one question mapped.\n';
  }

  return report;
}

if (import.meta.main) {
  const report = generateReport();
  console.log(report);
}

export { generateReport };
