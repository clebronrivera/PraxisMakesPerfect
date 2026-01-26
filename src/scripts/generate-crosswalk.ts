import { SKILL_MAP } from '../brain/skill-map';
import etsContentTopics from '../data/ets-content-topics.json';
import { mapTopicsToSkills } from './analyze-coverage-gaps';

function generateCrosswalk(): string {
  const topicMapping = mapTopicsToSkills();
  const { topicToSkills, skillToTopics } = topicMapping;

  let crosswalk = '# ETS Content Topics to Skills Crosswalk\n\n';
  crosswalk += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  crosswalk += 'This document maps ETS content topics to skills in the skill map, showing the relationship between official test content and our question categorization system.\n\n';
  crosswalk += '---\n\n';

  // Generate by domain
  for (const etsDomain of etsContentTopics.domains) {
    const domainId = etsDomain.id;
    const domain = SKILL_MAP[domainId as keyof typeof SKILL_MAP];
    
    if (!domain) continue;

    crosswalk += `## Domain ${domainId}: ${domain.name} (${domain.shortName})\n\n`;
    crosswalk += `**Praxis Section:** ${etsDomain.praxisSection}\n\n`;

    for (const section of etsDomain.sections) {
      crosswalk += `### ${section.code}: ${section.name}\n\n`;

      for (const topic of section.topics) {
        const skills = Array.from(topicToSkills.get(topic.code) || []);
        
        crosswalk += `#### ${topic.code}: ${topic.text}\n\n`;
        crosswalk += `**Keywords:** ${topic.keywords.join(', ')}\n\n`;
        
        if (skills.length > 0) {
          crosswalk += `**Mapped Skills:**\n\n`;
          
          for (const skillId of skills) {
            // Find skill details
            let skillDetails: { name: string; description: string; cluster: string } | null = null;
            
            for (const cluster of domain.clusters) {
              const skill = cluster.skills.find(s => s.skillId === skillId);
              if (skill) {
                skillDetails = {
                  name: skill.name,
                  description: skill.description,
                  cluster: cluster.name
                };
                break;
              }
            }
            
            if (skillDetails) {
              crosswalk += `- **${skillId}** (${skillDetails.cluster}): ${skillDetails.name}\n`;
              crosswalk += `  - ${skillDetails.description}\n`;
            } else {
              crosswalk += `- **${skillId}**: *Skill not found in domain*\n`;
            }
          }
        } else {
          crosswalk += `**Mapped Skills:** *None - This topic is not currently mapped to any skills*\n\n`;
          crosswalk += `**Recommendation:** Consider creating a skill or expanding an existing skill to cover this topic.\n`;
        }
        
        crosswalk += '\n';
      }
    }

    crosswalk += '---\n\n';
  }

  // Reverse mapping: Skills to Topics
  crosswalk += '## Skills to Topics Mapping (Reverse)\n\n';
  crosswalk += 'This section shows which ETS topics each skill maps to.\n\n';

  for (const [domainIdStr, domain] of Object.entries(SKILL_MAP)) {
    const domainId = parseInt(domainIdStr);
    const etsDomain = etsContentTopics.domains.find(d => d.id === domainId);
    
    if (!etsDomain) continue;

    crosswalk += `### Domain ${domainId}: ${domain.name}\n\n`;

    for (const cluster of domain.clusters) {
      crosswalk += `#### ${cluster.clusterId}: ${cluster.name}\n\n`;

      for (const skill of cluster.skills) {
        const topics = Array.from(skillToTopics.get(skill.skillId) || []);
        
        crosswalk += `**${skill.skillId}**: ${skill.name}\n\n`;
        
        if (topics.length > 0) {
          crosswalk += `Maps to ETS Topics:\n`;
          
          for (const topicCode of topics) {
            // Find topic details
            let topicText = topicCode;
            for (const section of etsDomain.sections) {
              const topic = section.topics.find(t => t.code === topicCode);
              if (topic) {
                topicText = `${topicCode}: ${topic.text}`;
                break;
              }
            }
            
            crosswalk += `- ${topicText}\n`;
          }
        } else {
          crosswalk += `**Maps to ETS Topics:** *None - This skill does not map to any ETS content topic*\n\n`;
          crosswalk += `**Recommendation:** Review if this skill should map to a topic, or if the skill is outside ETS scope.\n`;
        }
        
        crosswalk += '\n';
      }
    }

    crosswalk += '---\n\n';
  }

  // Summary statistics
  crosswalk += '## Crosswalk Statistics\n\n';
  
  const totalTopics = etsContentTopics.domains.reduce((sum, d) => 
    sum + d.sections.reduce((s, sec) => s + sec.topics.length, 0), 0
  );
  const topicsWithSkills = Array.from(topicToSkills.values()).filter(s => s.size > 0).length;
  const skillsWithTopics = Array.from(skillToTopics.values()).filter(s => s.size > 0).length;
  const totalSkills = Object.values(SKILL_MAP).reduce((sum, d) => 
    sum + d.clusters.reduce((c, cl) => c + cl.skills.length, 0), 0
  );

  crosswalk += `- **Total ETS Topics:** ${totalTopics}\n`;
  crosswalk += `- **Topics Mapped to Skills:** ${topicsWithSkills} (${Math.round(topicsWithSkills/totalTopics*100)}%)\n`;
  crosswalk += `- **Total Skills:** ${totalSkills}\n`;
  crosswalk += `- **Skills Mapped to Topics:** ${skillsWithTopics} (${Math.round(skillsWithTopics/totalSkills*100)}%)\n\n`;

  return crosswalk;
}

if (import.meta.main) {
  const crosswalk = generateCrosswalk();
  console.log(crosswalk);
}

export { generateCrosswalk };
