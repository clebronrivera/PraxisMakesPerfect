import { SKILL_MAP } from './src/brain/skill-map';
import { writeFileSync } from 'fs';

function generateVisualTree(): string {
  let output = '# Praxis School Psychology - Visual Hierarchy Tree\n\n';
  output += 'Complete visual representation of the hierarchy structure\n\n';
  output += '```\n';

  const domainIds = Object.keys(SKILL_MAP).map(Number).sort((a, b) => a - b);

  for (const domainId of domainIds) {
    const domain = SKILL_MAP[domainId];
    
    // Domain
    output += `Domain ${domainId}: ${domain.name} (${domain.shortName})\n`;
    
    for (const cluster of domain.clusters) {
      const clusterQuestionCount = cluster.skills.reduce((sum, skill) => sum + skill.questionIds.length, 0);
      
      // Cluster
      output += `├── ${cluster.clusterId}: ${cluster.name} [${clusterQuestionCount} questions]\n`;
      
      // Skills
      for (let i = 0; i < cluster.skills.length; i++) {
        const skill = cluster.skills[i];
        const isLastSkill = i === cluster.skills.length - 1;
        const isLastCluster = cluster === domain.clusters[domain.clusters.length - 1];
        const prefix = isLastCluster ? '│   ' : '│   ';
        const connector = isLastSkill ? '└──' : '├──';
        
        const qCount = skill.questionIds.length;
        const qInfo = qCount > 0 ? ` [${qCount} questions]` : ' [no questions]';
        
        output += `${prefix}${connector} ${skill.skillId}: ${skill.name}${qInfo}\n`;
        
        // Question IDs (if any)
        if (skill.questionIds.length > 0 && skill.questionIds.length <= 5) {
          const qPrefix = isLastCluster ? '│       ' : '│       ';
          const qConnector = isLastSkill ? '    ' : '│   ';
          for (let j = 0; j < skill.questionIds.length; j++) {
            const isLastQ = j === skill.questionIds.length - 1;
            const qConn = isLastQ ? '    ' : '│   ';
            output += `${qPrefix}${qConn}  └─ ${skill.questionIds[j]}\n`;
          }
        } else if (skill.questionIds.length > 5) {
          const qPrefix = isLastCluster ? '│       ' : '│       ';
          const qConnector = isLastSkill ? '    ' : '│   ';
          output += `${qPrefix}${qConnector}  └─ ${skill.questionIds.slice(0, 3).join(', ')}... (+${skill.questionIds.length - 3} more)\n`;
        }
      }
    }
    
    // Spacing between domains
    if (domainId < domainIds[domainIds.length - 1]) {
      output += '\n';
    }
  }

  output += '```\n\n';
  
  // Add summary
  let totalClusters = 0;
  let totalSkills = 0;
  let totalQuestions = 0;

  for (const domainId of domainIds) {
    const domain = SKILL_MAP[domainId];
    totalClusters += domain.clusters.length;
    
    domain.clusters.forEach(cluster => {
      cluster.skills.forEach(skill => {
        totalSkills++;
        totalQuestions += skill.questionIds.length;
      });
    });
  }

  output += '## Summary\n\n';
  output += `- **Total Domains:** ${domainIds.length}\n`;
  output += `- **Total Clusters:** ${totalClusters}\n`;
  output += `- **Total Skills:** ${totalSkills}\n`;
  output += `- **Total Questions Mapped:** ${totalQuestions}\n`;

  return output;
}

// Generate and save the visual tree
const tree = generateVisualTree();
writeFileSync('VISUAL_HIERARCHY_TREE.md', tree, 'utf-8');
console.log('✅ Visual hierarchy tree generated successfully!');
console.log('📄 Saved to: VISUAL_HIERARCHY_TREE.md');
