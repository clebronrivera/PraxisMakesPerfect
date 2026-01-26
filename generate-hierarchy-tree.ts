import { SKILL_MAP } from './src/brain/skill-map';
import { writeFileSync } from 'fs';

function generateTree(): string {
  let output = '# Praxis School Psychology - Full Hierarchy Tree\n\n';
  output += 'This document shows the complete hierarchy: **Domains → Clusters → Skills → Questions**\n\n';
  output += '---\n\n';

  const domainIds = Object.keys(SKILL_MAP).map(Number).sort((a, b) => a - b);
  
  let totalClusters = 0;
  let totalSkills = 0;
  let totalQuestions = 0;

  for (const domainId of domainIds) {
    const domain = SKILL_MAP[domainId];
    totalClusters += domain.clusters.length;
    
    const domainQuestionCount = domain.clusters.reduce((sum, cluster) => {
      return sum + cluster.skills.reduce((s, skill) => {
        totalSkills++;
        const qCount = skill.questionIds.length;
        totalQuestions += qCount;
        return s + qCount;
      }, 0);
    }, 0);

    // Domain header
    output += `## Domain ${domainId}: ${domain.name} (${domain.shortName})\n\n`;
    output += `**Total Questions:** ${domainQuestionCount}\n\n`;

    // Clusters
    for (const cluster of domain.clusters) {
      const clusterQuestionCount = cluster.skills.reduce((sum, skill) => sum + skill.questionIds.length, 0);
      
      output += `### ${cluster.clusterId}: ${cluster.name}\n\n`;
      output += `*${cluster.description}*\n\n`;
      output += `**Total Questions:** ${clusterQuestionCount}\n\n`;

      // Skills
      output += '#### Skills:\n\n';
      for (const skill of cluster.skills) {
        const qCount = skill.questionIds.length;
        const qList = qCount > 0 
          ? skill.questionIds.join(', ') 
          : '*No questions mapped*';
        
        output += `- **${skill.skillId}**: ${skill.name}\n`;
        output += `  - Description: ${skill.description}\n`;
        output += `  - Questions: ${qCount}\n`;
        if (qCount > 0) {
          output += `  - Question IDs: ${qList}\n`;
        }
        output += `  - DOK Range: ${skill.dokRange[0]}-${skill.dokRange[1]}\n`;
        output += '\n';
      }
      output += '\n';
    }
    output += '---\n\n';
  }

  // Summary
  output += '## Summary Statistics\n\n';
  output += `- **Total Domains:** ${domainIds.length}\n`;
  output += `- **Total Clusters:** ${totalClusters}\n`;
  output += `- **Total Skills:** ${totalSkills}\n`;
  output += `- **Total Questions Mapped:** ${totalQuestions}\n\n`;

  // Domain summary table
  output += '## Domain Summary\n\n';
  output += '| Domain | Name | Questions | Clusters | Skills |\n';
  output += '|--------|------|-----------|----------|--------|\n';
  
  for (const domainId of domainIds) {
    const domain = SKILL_MAP[domainId];
    const domainQuestionCount = domain.clusters.reduce((sum, cluster) => {
      return sum + cluster.skills.reduce((s, skill) => s + skill.questionIds.length, 0);
    }, 0);
    const domainSkillCount = domain.clusters.reduce((sum, cluster) => sum + cluster.skills.length, 0);
    
    output += `| ${domainId} | ${domain.shortName} | ${domainQuestionCount} | ${domain.clusters.length} | ${domainSkillCount} |\n`;
  }

  return output;
}

// Generate and save the tree
const tree = generateTree();
writeFileSync('HIERARCHY_TREE.md', tree, 'utf-8');
console.log('✅ Hierarchy tree generated successfully!');
console.log('📄 Saved to: HIERARCHY_TREE.md');
